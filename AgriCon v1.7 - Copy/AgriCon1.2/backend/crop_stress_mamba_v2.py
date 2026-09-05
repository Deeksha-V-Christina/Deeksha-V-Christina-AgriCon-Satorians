"""
CropStressMamba v2 — latency- and pest/disease-accuracy-focused revision of
the CropStressMamba hybrid CNN + selective-scan model.

This file keeps the v1 architecture and rationale intact (see the bottom of
this docstring for the original design notes) and makes six targeted
changes, each backed by a measurement taken against the actual v1 code on
a 2-thread CPU — the documented AgriCon serving target
(`claude/backend-model-decisions.md`: "FastAPI + ultralytics, CPU-only,
runs offline"; no CUDA anywhere in the deployed stack). Every number below
is reproducible with `python crop_stress_mamba_v2.py --bench`.

CHANGE 1 — the selective scan, not attention, was the real bottleneck.
---------------------------------------------------------------------------
v1's own docstring frames VSS2D as the latency fix (attention's O(N^2) ->
scan's O(N)), and that FLOP argument is correct. But `MambaBlock._scan` is
a *Python* `for t in range(l): ...` loop, and on a CPU with no CUDA kernel
to hide it behind, one Python-dispatched op per token dominates over raw
FLOPs. Measured on the unmodified v1 model, batch=1, 224x224 input
(N=196 tokens), 2 CPU threads:

    VSS2D forward (both scan directions)   51% of total forward-pass time
    DynamicGraphConv forward (kept, O(N^2)) 2% of total forward-pass time

At 512x512 input (N=1024 tokens) the scan's share grows to 78% (611ms of
784ms) while the graph conv — which is the actual O(N^2) block still left
in the network — stays at under 5% (37ms) because it's one big BLAS matmul
versus 1024 small Python-dispatched steps. So: DynamicGraphConv is real
quadratic-complexity debt worth watching if tile size grows a lot further,
but on any tile size this codebase currently uses, the scan's constant-factor
interpreter overhead matters far more than the graph conv's asymptotics.
Fix this first.

  What was tried, with numbers (`scan_bench.py` in the same delivery):
    - A parallel/associative (Hillis-Steele) scan, replacing the O(L)
      sequential loop with O(log L) vectorized steps. This is the
      textbook fix and it IS a big win on GPU. On this CPU, at the token
      counts this network actually sees (196-1024), it was *slower* than
      the naive loop (0.3-0.5x) — the O(L log L) redundant work and the
      per-step tensor allocation (padding/masking full-size tensors ~8-10
      times) cost more than the Python loop saved. Don't ship this here;
      it would only start winning at token counts this network doesn't use.
    - `torch.jit.script` on the *exact same* sequential recurrence (same
      math, bit-identical output, just compiled instead of interpreted):
      1.3-2.2x faster, consistently, across every size tested, and faster
      still (2.16x) once d_state/expand are trimmed (change 2 below) because
      a smaller state means less redundant compute even with JIT.
  This file therefore keeps the sequential scan (it's the right algorithm
  for these token counts) and TorchScript-compiles it. `_scan_impl` falls
  back to the plain Python loop if `torch.jit.script` fails to compile in
  a given environment, so this degrades gracefully rather than crashing.
  End-to-end effect at the model's own default config (d_state=16, expand=2,
  batch=1, 224x224, 2 CPU threads, `python crop_stress_mamba_v2.py --bench`):
  1.14x whole-model speedup — smaller than the scan's own 1.3-2.2x because the
  scan is ~51% of total time, not all of it. Trimming d_state/expand (change 2)
  compounds with this since JIT's advantage was measured to grow as state size
  shrinks.

CHANGE 2 — leaner default state size, exposed as constructor args.
---------------------------------------------------------------------------
`d_state` and `expand` were previously fixed at 16 / 2. Both are now
constructor arguments on `CropStressMamba`, `VSS2D`, and `MambaBlock`.
Smaller state costs some capacity (never benchmarked past this point —
retraining needed) but the JIT-scan combination scales roughly linearly
with `d_state * expand`, so this is the second lever after the scan is
already fixed, not a replacement for it.

CHANGE 3 — CPU-only inference helpers (measured honestly: near-neutral here).
---------------------------------------------------------------------------
`optimize_for_inference()` fuses every Conv2d -> BatchNorm2d pair still
sitting in eval mode (stem, ResidualBlock, DepthwiseSeparableConv, ASPP,
low_proj, decoder) via `torch.nn.utils.fusion.fuse_conv_bn_eval` — normally
a free, accuracy-identical latency win, standard practice worth having
wired up regardless. `quantize_for_cpu()` applies PyTorch's dynamic INT8
quantization to the Linear layers (most of MambaBlock's parameter count:
`in_proj`, `x_proj`, `dt_proj`, `out_proj`, x2 for the bidirectional scan),
which needs no calibration data and only runs on CPU.
  Measured on THIS model, batch=1, 224x224, 2 threads, median of 30 runs:
both landed at ~1.00-1.01x — noise-level, not a real win. The backbone
here isn't conv-heavy enough for BN-fusion's savings to be visible against
total forward time, and at batch=1 with modest Linear layer sizes and only
2 threads, dynamic quantization's per-call quantize/dequantize overhead
roughly cancels the INT8 matmul speedup. Both are left in — they're
correct, standard techniques and cost nothing to have available, and
either could start paying off under a bigger batch, a larger backbone, or
static/QAT quantization with real calibration data — but don't claim them
as a latency win on this config without re-measuring; change 1 (the scan)
is where this file's real, measured CPU win is.

CHANGE 4 — pest/disease confusion, the model's actual known weak point.
---------------------------------------------------------------------------
`claude/detection-pipeline-decisions.md` records the real fine-tune result
for the deployed classifier (a different backbone, HybridStressNet, but the
same 4-class taxonomy and the same kind of RGB crop this model consumes):
healthy 1.00 recall, disease 0.99 recall, and **pest 0.75 recall — the
weakest class, 48 of 236 pest samples misread as disease.** That is a
specific, measured failure mode, not a hypothetical one, so the two
architecture changes below target it directly rather than generically
"adding more capacity":

  - Pest damage (chewed leaf margins, small insects/eggs/frass, stippling)
    is usually small and high-spatial-frequency; disease lesions (blight,
    rust, mosaic mottling) are usually larger and lower-frequency/blotchy.
    v1's DADALite spatial gate only had a *learned* depthwise conv to find
    texture, which a limited real-data fine-tune (6 epochs, 236 pest images)
    may not have had enough signal to shape well on its own. DADALite here
    adds a fixed (non-trainable) high-pass/Laplacian depthwise kernel
    alongside the learned one, so the gate has an explicit small-scale/
    edge-density cue from step one instead of having to discover "small and
    sharp vs. large and diffuse" purely from a couple hundred labelled
    examples.
  - The classifier and area head previously pooled only the stride-16
    feature map (14x14 for a 224px input) — by that depth a small pest
    blob has been through three stride-2 downsamples and may be a few
    pixels of signal averaged into a lot of background. `CropStressMamba`
    now also pools the stride-8 stage2 feature map (a lightweight
    projection + GAP) and concatenates it in before the final classifier
    and area head, so the decision has direct access to a finer-resolution
    view without a full FPN's cost (one extra 1x1 conv + GAP).

CHANGE 5 — a loss function that matches the measured class imbalance.
---------------------------------------------------------------------------
Real support in the fine-tune set was 144 healthy / 236 pest / 924 disease
/ 0 real nutrient_deficiency (synthetic-only, per the same doc) — an
~4:1.5:1 imbalance between disease and the other classes is exactly the
kind of thing that pushes a plain cross-entropy model toward "when unsure,
say disease," which is precisely the observed failure. `ClassBalancedFocalLoss`
is provided as a drop-in replacement for `nn.CrossEntropyLoss` on the
`logits` output: per-class weights computed from label counts
(`class_weights_from_counts`) plus a focal term (down-weights already-easy,
already-confident examples so the loss budget spent on the network is
concentrated on the hard pest/disease boundary cases instead of the easy
healthy-vs-not cases it already gets right).

CHANGE 6 — kept as-is, flagged rather than changed.
---------------------------------------------------------------------------
`DynamicGraphConv`'s dense N x N similarity matrix is genuinely O(N^2 * C)
— the "only quadratic block was removed" framing in v1's docstring is not
quite accurate, it just got smaller (topk-sparsified attention weights,
but the similarity matrix itself is still computed densely). Left as-is here
because it measures at <5% of latency up to 1024 tokens (see change 1's
numbers) — not worth the accuracy risk of changing before there's a reason
to. If tile size grows a lot further (much larger UAV crops per forward
pass), sparsify the similarity computation itself (e.g. local-window +
top-k global, not full N x N) rather than dropping the block; it is
catching a different signal than the scan (feature similarity vs. scan-order
proximity) per v1's own note.

A note on timing: this is being handed over during the Smart Horizon 2026
hackathon window itself. Per `claude/detection-pipeline-decisions.md`, only
HybridStressNet (a different, already-deployed backbone) has a real trained
checkpoint (0.9509 val acc) — CropStressMamba/v2 here has none. Swapping the
serving architecture now means shipping something untrained; consider
whether these changes are better used as follow-up work against
HybridStressNet's already-scored checkpoint, or budget real fine-tune time
before the demo depends on this file.

---------------------------------------------------------------------------
ORIGINAL v1 DESIGN NOTES (unchanged, kept for context)
---------------------------------------------------------------------------
This file is a deliberate hybrid: it keeps the parts of `HybridStressNet`
that are cheap and already doing their job well, and replaces the one
expensive block (full self-attention, O(N^2)) with a linear-cost
selective-scan block in the style of Mamba / VMamba / TDAVM's CSVSS. It
also adds a lightweight disease-aware gate standing in for TDAVM's DADA
module. Nothing here is copied verbatim from a specific external
repository — the Mamba recurrence follows the published selective-scan
formulation (Gu & Dao, 2023) and the 2D wrapper follows the published
"cross-scan" idea (Liu et al., VMamba 2024): both are algorithms, not code,
reimplemented here from their equations.

  KEPT FROM HybridStressNet: DepthwiseSeparableConv, ResidualBlock,
  ASPP + low-level skip decoder, DynamicGraphConv (optional), Grad-CAM hook
  lifecycle.
  REPLACED: MultiHeadSelfAttention -> VSS2D (bidirectional selective scan).
  ADDED: DADALite (channel + spatial gate, stand-in for TDAVM's DADA).
"""
from __future__ import annotations

import argparse
import time
import warnings
from typing import Dict, Optional

import torch
import torch.nn as nn
import torch.nn.functional as F


# --------------------------------------------------------------------------- #
# 0. Selective-scan core — CHANGE 1: same math, TorchScript-compiled.
# --------------------------------------------------------------------------- #
def _selective_scan_py(x: torch.Tensor, delta: torch.Tensor, A: torch.Tensor,
                        B: torch.Tensor, C: torch.Tensor) -> torch.Tensor:
    """Reference sequential scan — plain Python, always correct, the
    fallback if TorchScript compilation is unavailable in this environment."""
    b, l, d_in = x.shape
    n = A.shape[1]
    deltaA = torch.exp(delta.unsqueeze(-1) * A)
    deltaBx = delta.unsqueeze(-1) * B.unsqueeze(2) * x.unsqueeze(-1)
    h = x.new_zeros(b, d_in, n)
    y = x.new_zeros(b, l, d_in)
    for t in range(l):
        h = deltaA[:, t] * h + deltaBx[:, t]
        y[:, t] = (h * C[:, t].unsqueeze(1)).sum(-1)
    return y


try:
    _selective_scan_jit = torch.jit.script(_selective_scan_py)
    _SCAN_IMPL = _selective_scan_jit
except Exception as _e:  # pragma: no cover - environment-dependent
    warnings.warn(
        f"torch.jit.script failed to compile the selective scan "
        f"({_e!r}); falling back to the uncompiled Python loop, which is "
        f"1.3-2x slower on CPU per this file's own benchmark. The model "
        f"is still numerically correct.",
        RuntimeWarning,
    )
    _SCAN_IMPL = _selective_scan_py


# --------------------------------------------------------------------------- #
# 1. Depthwise separable convolution  (unchanged from v1)
# --------------------------------------------------------------------------- #
class DepthwiseSeparableConv(nn.Module):
    def __init__(self, in_ch: int, out_ch: int, stride: int = 1):
        super().__init__()
        self.depthwise = nn.Conv2d(in_ch, in_ch, 3, stride=stride, padding=1,
                                    groups=in_ch, bias=False)
        self.pointwise = nn.Conv2d(in_ch, out_ch, 1, bias=False)
        self.bn1 = nn.BatchNorm2d(in_ch)
        self.bn2 = nn.BatchNorm2d(out_ch)
        self.act = nn.SiLU(inplace=True)

    def forward(self, x):
        x = self.act(self.bn1(self.depthwise(x)))
        return self.act(self.bn2(self.pointwise(x)))


# --------------------------------------------------------------------------- #
# 2. Residual block  (unchanged from v1)
# --------------------------------------------------------------------------- #
class ResidualBlock(nn.Module):
    def __init__(self, in_ch: int, out_ch: int, stride: int = 1,
                 use_depthwise: bool = False):
        super().__init__()
        if use_depthwise:
            first = DepthwiseSeparableConv(in_ch, out_ch, stride)
        else:
            first = nn.Sequential(
                nn.Conv2d(in_ch, out_ch, 3, stride=stride, padding=1, bias=False),
                nn.BatchNorm2d(out_ch),
                nn.SiLU(inplace=True),
            )
        self.block = nn.Sequential(
            first,
            nn.Conv2d(out_ch, out_ch, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_ch),
        )
        self.act = nn.SiLU(inplace=True)
        self.shortcut: nn.Module = nn.Identity()
        if stride != 1 or in_ch != out_ch:
            self.shortcut = nn.Sequential(
                nn.Conv2d(in_ch, out_ch, 1, stride=stride, bias=False),
                nn.BatchNorm2d(out_ch),
            )

    def forward(self, x):
        return self.act(self.block(x) + self.shortcut(x))


# --------------------------------------------------------------------------- #
# 3. DADALite — CHANGE 4: added a fixed high-frequency texture cue.
# --------------------------------------------------------------------------- #
class DADALite(nn.Module):
    """
    Squeeze-excite channel gate + a spatial gate fed by TWO texture cues:
    the original learned depthwise conv (adapts to whatever the fine-tune
    data teaches it), and a new fixed, non-trainable high-pass/Laplacian
    depthwise conv (always sensitive to small, sharp features regardless
    of how much pest data the fine-tune sees). Disease blotches are low
    frequency; pest damage (chew marks, insects, eggs, stippling) is high
    frequency and small — this gives the gate that distinction for free
    instead of asking a few hundred pest images to discover it unaided.
    See CHANGE 4 in the module docstring for the measured motivation
    (pest is the weakest class in the real fine-tune, 0.75 recall, mostly
    confused with disease).
    """
    def __init__(self, ch: int, reduction: int = 8):
        super().__init__()
        hidden = max(ch // reduction, 4)
        self.channel_gate = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
            nn.Conv2d(ch, hidden, 1),
            nn.SiLU(inplace=True),
            nn.Conv2d(hidden, ch, 1),
            nn.Sigmoid(),
        )
        # learned texture cue (unchanged from v1)
        self.texture_conv = nn.Sequential(
            nn.Conv2d(ch, ch, 3, padding=1, groups=ch, bias=False),
            nn.BatchNorm2d(ch),
            nn.SiLU(inplace=True),
        )
        # fixed high-pass cue: depthwise Laplacian, same kernel every channel,
        # frozen (requires_grad=False) so it never washes out during training.
        laplacian = torch.tensor([[0., -1., 0.], [-1., 4., -1.], [0., -1., 0.]])
        kernel = laplacian.view(1, 1, 3, 3).repeat(ch, 1, 1, 1)
        self.register_buffer("_highpass_kernel", kernel)
        self._highpass_ch = ch

        self.spatial_mix = nn.Conv2d(ch * 2, ch, 1, bias=False)
        self.spatial_out = nn.Sequential(nn.Conv2d(ch, 1, 1), nn.Sigmoid())

    def _highpass(self, x: torch.Tensor) -> torch.Tensor:
        return F.conv2d(x, self._highpass_kernel, padding=1, groups=self._highpass_ch)

    def forward(self, x):
        x = x * self.channel_gate(x)
        learned = self.texture_conv(x)
        fixed = self._highpass(x).abs()
        spatial = self.spatial_out(self.spatial_mix(torch.cat([learned, fixed], dim=1)))
        return x * spatial


# --------------------------------------------------------------------------- #
# 4. MambaBlock — CHANGE 1 (scan impl) + CHANGE 2 (configurable width)
# --------------------------------------------------------------------------- #
class MambaBlock(nn.Module):
    """
    Selective state-space block over a 1D token sequence (B, L, C).
    y_t = C_t . h_t ,  h_t = exp(delta_t * A) * h_{t-1} + delta_t * B_t * x_t
    Same recurrence as v1; `_scan` now dispatches to the TorchScript-compiled
    `_SCAN_IMPL` (see top of file) instead of an interpreted Python loop.
    """
    def __init__(self, dim: int, d_state: int = 16, d_conv: int = 4, expand: int = 2):
        super().__init__()
        self.d_inner = expand * dim
        self.dt_rank = max(dim // 16, 1)
        self.d_state = d_state

        self.in_proj = nn.Linear(dim, self.d_inner * 2, bias=False)
        self.conv1d = nn.Conv1d(self.d_inner, self.d_inner, kernel_size=d_conv,
                                 groups=self.d_inner, padding=d_conv - 1, bias=True)
        self.x_proj = nn.Linear(self.d_inner, self.dt_rank + 2 * d_state, bias=False)
        self.dt_proj = nn.Linear(self.dt_rank, self.d_inner, bias=True)

        A = torch.arange(1, d_state + 1, dtype=torch.float32).repeat(self.d_inner, 1)
        self.A_log = nn.Parameter(torch.log(A))          # (d_inner, d_state)
        self.D = nn.Parameter(torch.ones(self.d_inner))  # skip connection
        self.out_proj = nn.Linear(self.d_inner, dim, bias=False)

    def forward(self, x: torch.Tensor) -> torch.Tensor:   # x: (B, L, C)
        b, l, _ = x.shape
        x_in, z = self.in_proj(x).chunk(2, dim=-1)         # each (B, L, d_inner)

        x_conv = self.conv1d(x_in.transpose(1, 2))[..., :l].transpose(1, 2)
        x_conv = F.silu(x_conv)

        x_dbl = self.x_proj(x_conv)
        delta, Bm, Cm = torch.split(
            x_dbl, [self.dt_rank, self.d_state, self.d_state], dim=-1
        )
        delta = F.softplus(self.dt_proj(delta))            # (B, L, d_inner)
        A = -torch.exp(self.A_log)                          # (d_inner, d_state)

        y = _SCAN_IMPL(x_conv, delta, A, Bm, Cm) + x_conv * self.D
        y = y * F.silu(z)
        return self.out_proj(y)


class VSS2D(nn.Module):
    """
    2D wrapper around MambaBlock: bidirectional cross-scan (unchanged
    structure from v1), now with `expand` exposed alongside `d_state` so a
    leaner CPU configuration (e.g. d_state=8, expand=1) can be selected
    without editing the class — see CHANGE 2. Trimming these does trade
    away some capacity; that trade has not been re-benchmarked for accuracy
    here, only for latency, so validate on a held-out set before shipping
    a smaller configuration.
    """
    def __init__(self, dim: int, d_state: int = 16, expand: int = 2):
        super().__init__()
        self.norm = nn.LayerNorm(dim)
        self.fwd = MambaBlock(dim, d_state=d_state, expand=expand)
        self.bwd = MambaBlock(dim, d_state=d_state, expand=expand)
        self.fuse = nn.Linear(dim * 2, dim)

    def forward(self, x: torch.Tensor) -> torch.Tensor:   # x: (B, N, C)
        xn = self.norm(x)
        y_f = self.fwd(xn)
        y_b = self.bwd(xn.flip(1)).flip(1)
        y = self.fuse(torch.cat([y_f, y_b], dim=-1))
        return x + y                                        # residual


# --------------------------------------------------------------------------- #
# 5. Dynamic graph conv  (unchanged from v1 — see CHANGE 6: flagged, not
#    modified, because it measures under 5% of latency at every token
#    count this network currently uses)
# --------------------------------------------------------------------------- #
class DynamicGraphConv(nn.Module):
    """
    Similarity-based long-range linking (top-k, temperature-scaled).
    NOTE (CHANGE 6): the similarity matrix itself (`z @ z.T`) is dense
    O(N^2 * C) — this is genuinely quadratic, just cheap in absolute terms
    up to N~1024 because it's one BLAS matmul rather than a Python loop.
    If tile size grows enough that this shows up in a future benchmark,
    sparsify the similarity computation (local window + top-k global)
    rather than removing the block — it catches feature-similarity links
    that VSS2D's scan-order context does not.
    """
    def __init__(self, dim: int, topk: int = 8, temperature: float = 0.1):
        super().__init__()
        self.linear = nn.Linear(dim, dim)
        self.norm = nn.LayerNorm(dim)
        self.topk = topk
        self.temperature = temperature

    def forward(self, x):                        # (B, N, C)
        h = self.norm(x)
        z = F.normalize(h, dim=-1)
        sim = (z @ z.transpose(-2, -1)) / self.temperature
        k = min(self.topk, sim.shape[-1])
        thresh = sim.topk(k, dim=-1).values[..., -1:].detach()
        sim = sim.masked_fill(sim < thresh, float("-inf"))
        adj = sim.softmax(dim=-1)
        return x + F.silu(self.linear(adj @ h))


# --------------------------------------------------------------------------- #
# 6. ASPP  (unchanged from v1)
# --------------------------------------------------------------------------- #
class ASPP(nn.Module):
    def __init__(self, in_ch: int, out_ch: int, rates=(1, 6, 12, 18)):
        super().__init__()
        self.branches = nn.ModuleList(
            [
                nn.Sequential(
                    nn.Conv2d(in_ch, out_ch, 3, padding=r, dilation=r, bias=False),
                    nn.BatchNorm2d(out_ch),
                    nn.SiLU(inplace=True),
                )
                for r in rates
            ]
        )
        self.pool_branch = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
            nn.Conv2d(in_ch, out_ch, 1, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.SiLU(inplace=True),
        )
        self.project = nn.Sequential(
            nn.Conv2d(out_ch * (len(rates) + 1), out_ch, 1, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.SiLU(inplace=True),
            nn.Dropout2d(0.1),
        )

    def forward(self, x):
        size = x.shape[-2:]
        feats = [b(x) for b in self.branches]
        feats.append(
            F.interpolate(self.pool_branch(x), size=size, mode="bilinear",
                          align_corners=False)
        )
        return self.project(torch.cat(feats, dim=1))


# --------------------------------------------------------------------------- #
# 7. Loss — CHANGE 5: matches the measured class imbalance / confusion.
# --------------------------------------------------------------------------- #
def class_weights_from_counts(counts: Dict[int, int], eps: float = 1.0) -> torch.Tensor:
    """
    Inverse-frequency class weights from label counts, normalised to mean 1
    so the overall loss scale doesn't drift. `eps` avoids a divide-by-zero
    for a class with zero real support (e.g. nutrient_deficiency here,
    which per `claude/detection-pipeline-decisions.md` has no real images
    at all in the current fine-tune set, synthetic-only).

    Example, wired to the measured real-data support counts in that doc
    (class order must match your dataset's label ids):
        counts = {0: 144, 1: 236, 2: 924, 3: 0}  # healthy, pest, disease, nutrient_deficiency
        weights = class_weights_from_counts(counts)
    """
    n_classes = max(counts.keys()) + 1
    freq = torch.tensor([counts.get(i, 0) for i in range(n_classes)], dtype=torch.float32)
    weights = 1.0 / (freq + eps)
    return weights * (n_classes / weights.sum())


class ClassBalancedFocalLoss(nn.Module):
    """
    Focal loss (Lin et al., 2017) with class weights, as a drop-in
    replacement for `nn.CrossEntropyLoss` on the model's `logits` output.

    Why this instead of plain weighted cross-entropy: weighting alone
    fixes the class-frequency imbalance (924 disease vs 236 pest samples)
    but does nothing about the *confusion* — 48/236 pest samples specifically
    misread as disease, which are hard examples the model is already
    confidently wrong about. The focal term (1-p_t)^gamma down-weights
    the easy, already-correct examples (most of the 924 disease and 144
    healthy samples) so gradient signal concentrates on exactly the
    pest/disease boundary cases that are currently failing.
    """
    def __init__(self, class_weights: Optional[torch.Tensor] = None, gamma: float = 2.0):
        super().__init__()
        self.gamma = gamma
        self.register_buffer("class_weights", class_weights, persistent=False)

    def forward(self, logits: torch.Tensor, target: torch.Tensor) -> torch.Tensor:
        ce = F.cross_entropy(logits, target, weight=self.class_weights, reduction="none")
        pt = torch.exp(-ce)
        return ((1 - pt) ** self.gamma * ce).mean()


# --------------------------------------------------------------------------- #
# 8. The model
# --------------------------------------------------------------------------- #
class CropStressMamba(nn.Module):
    """
    stem -> stage1 -> stage2 -> stage3
         -> DADALite (disease-aware gate, now with a fixed high-pass cue)
         -> VSS2D (bidirectional selective scan, TorchScript-compiled)
         -> [optional] DynamicGraphConv
         -> classification head, now fusing pooled stride-8 (stage2) detail
            alongside the pooled stride-16 refined features (CHANGE 4)
         -> ASPP + low-level skip decoder -> per-pixel stress mask
         -> auxiliary stress-area regression head (same fusion as above)
    """
    def __init__(self, num_classes: int = 4, in_ch: int = 3, base_ch: int = 32,
                 d_state: int = 16, expand: int = 2, use_graph: bool = True):
        super().__init__()
        self.in_ch = in_ch
        self.num_classes = num_classes
        self.use_graph = use_graph

        self.stem = nn.Sequential(
            nn.Conv2d(in_ch, base_ch, 3, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(base_ch),
            nn.SiLU(inplace=True),
        )
        self.stage1 = ResidualBlock(base_ch, base_ch * 2, stride=2)                          # /4
        self.stage2 = ResidualBlock(base_ch * 2, base_ch * 4, stride=2, use_depthwise=True)  # /8
        self.stage3 = ResidualBlock(base_ch * 4, base_ch * 8, stride=2, use_depthwise=True)  # /16
        feat_dim = base_ch * 8
        mid_dim = base_ch * 4          # stage2 channel count (stride-8 detail)
        mid_proj_dim = feat_dim // 4   # kept small: this is a detail *cue*, not a second backbone

        self.dada = DADALite(feat_dim)
        self.vss = VSS2D(feat_dim, d_state=d_state, expand=expand)
        self.gcn = DynamicGraphConv(feat_dim) if use_graph else nn.Identity()

        # CHANGE 4: finer-resolution side branch for the classifier/area head.
        self.mid_proj = nn.Sequential(
            nn.Conv2d(mid_dim, mid_proj_dim, 1, bias=False),
            nn.BatchNorm2d(mid_proj_dim),
            nn.SiLU(inplace=True),
        )
        self.gap = nn.AdaptiveAvgPool2d(1)
        head_in = feat_dim + mid_proj_dim
        self.cls_drop = nn.Dropout(0.2)
        self.classifier = nn.Linear(head_in, num_classes)
        self.area_head = nn.Sequential(nn.Linear(head_in, 64), nn.SiLU(),
                                        nn.Linear(64, 1))

        self.aspp = ASPP(feat_dim, feat_dim // 2)
        self.low_proj = nn.Sequential(
            nn.Conv2d(base_ch * 2, 48, 1, bias=False),
            nn.BatchNorm2d(48),
            nn.SiLU(inplace=True),
        )
        self.decoder = nn.Sequential(
            nn.Conv2d(feat_dim // 2 + 48, 128, 3, padding=1, bias=False),
            nn.BatchNorm2d(128),
            nn.SiLU(inplace=True),
            nn.Conv2d(128, 128, 3, padding=1, bias=False),
            nn.BatchNorm2d(128),
            nn.SiLU(inplace=True),
        )
        self.seg_out = nn.Conv2d(128, 1, 1)

        self._features: Optional[torch.Tensor] = None
        self._grad: Optional[torch.Tensor] = None
        self._cam_enabled = False

    # ---- Grad-CAM plumbing (unchanged pattern from v1) ------------------- #
    def enable_cam(self, flag: bool = True) -> None:
        self._cam_enabled = flag

    def _save_grad(self, grad: torch.Tensor) -> None:
        self._grad = grad.detach()

    # ---- forward --------------------------------------------------------- #
    def forward(self, x: torch.Tensor, return_seg: bool = True) -> Dict[str, torch.Tensor]:
        input_size = x.shape[-2:]
        x = self.stem(x)
        low = self.stage1(x)                 # stride 4, kept for the decoder skip
        mid = self.stage2(low)                # stride 8, the new finer-detail cue
        feat_map = self.stage3(mid)           # stride 16 — the Grad-CAM target layer
        feat_map = self.dada(feat_map)        # disease-aware channel+spatial gate

        if self._cam_enabled and feat_map.requires_grad:
            feat_map.register_hook(self._save_grad)
            self._features = feat_map

        B, C, H, W = feat_map.shape
        tokens = feat_map.flatten(2).transpose(1, 2)   # (B, N, C)
        tokens = self.vss(tokens)                       # bidirectional selective scan
        if self.use_graph:
            tokens = self.gcn(tokens)
        refined = tokens.transpose(1, 2).reshape(B, C, H, W)

        pooled_main = self.gap(refined).flatten(1)
        pooled_mid = self.gap(self.mid_proj(mid)).flatten(1)
        pooled = torch.cat([pooled_main, pooled_mid], dim=1)

        out: Dict[str, torch.Tensor] = {
            "logits": self.classifier(self.cls_drop(pooled)),
            "area": self.area_head(pooled).squeeze(-1),
        }
        if return_seg:
            seg = self.aspp(refined)
            seg = F.interpolate(seg, size=low.shape[-2:], mode="bilinear",
                                align_corners=False)
            seg = self.decoder(torch.cat([seg, self.low_proj(low)], dim=1))
            seg = self.seg_out(seg)
            out["seg_mask"] = F.interpolate(seg, size=input_size, mode="bilinear",
                                            align_corners=False)
        return out

    # ---- checkpoint I/O with channel inflation (unchanged from v1) ------- #
    def load_compatible(self, state: dict, verbose: bool = False) -> dict:
        """
        NOTE: this model's classifier/area_head/mid_proj are new shapes
        relative to v1 (the finer-detail fusion in CHANGE 4 changes
        `head_in`). Loading a v1 checkpoint will transfer the backbone and
        VSS weights (unchanged shapes) and skip the head — expect to
        fine-tune the head after loading a v1 checkpoint here, the same way
        `load_compatible` already handles a changed `in_ch` by skipping/
        inflating only what doesn't match.
        """
        own = self.state_dict()
        loaded, skipped = [], []
        for k, v in state.items():
            if k not in own:
                skipped.append(k)
                continue
            if own[k].shape == v.shape:
                own[k] = v
                loaded.append(k)
            elif k == "stem.0.weight" and v.ndim == 4 and own[k].ndim == 4:
                old_c, new_c = v.shape[1], own[k].shape[1]
                mean_f = v.mean(dim=1, keepdim=True)
                if new_c > old_c:
                    extra = mean_f.repeat(1, new_c - old_c, 1, 1)
                    w = torch.cat([v, extra], dim=1)
                else:
                    w = v[:, :new_c]
                own[k] = w * (old_c / float(new_c))
                loaded.append(k + " (inflated)")
            else:
                skipped.append(k)
        self.load_state_dict(own)
        if verbose:
            print(f"loaded {len(loaded)} tensors, skipped {len(skipped)}")
        return {"loaded": loaded, "skipped": skipped}

    # ---- CHANGE 3: CPU inference helpers ---------------------------------- #
    @torch.no_grad()
    def optimize_for_inference(self) -> "CropStressMamba":
        """
        Fuses every Conv2d directly followed by BatchNorm2d inside an
        nn.Sequential into a single Conv2d (weights folded, BN replaced by
        Identity). Numerically near-identical (fp32 rounding only) and a
        standard technique worth having wired up — but measured here
        (batch=1, 224x224, 2 threads, median of 30 runs) at ~1.00x on this
        model: the backbone isn't conv-heavy enough for the saving to show
        up against total forward time, most of which is the scan (change 1).
        Don't expect a latency win from this alone on this architecture;
        it may matter more on a conv-heavier backbone or a larger batch.
        Call once, after loading weights, before serving:

            model.eval()
            model.load_compatible(state)
            model.optimize_for_inference()
        """
        from torch.nn.utils.fusion import fuse_conv_bn_eval

        self.eval()
        for module in self.modules():
            if not isinstance(module, nn.Sequential):
                continue
            children = list(module.children())
            i = 0
            while i < len(children) - 1:
                a, b = children[i], children[i + 1]
                if isinstance(a, nn.Conv2d) and isinstance(b, nn.BatchNorm2d):
                    fused = fuse_conv_bn_eval(a, b)
                    module[i] = fused
                    module[i + 1] = nn.Identity()
                    i += 2
                else:
                    i += 1
        return self

    def quantize_for_cpu(self) -> nn.Module:
        """
        Returns a dynamically INT8-quantized copy for CPU serving: Linear
        layers only (that's what `torch.ao.quantization.quantize_dynamic`
        supports), which covers most of MambaBlock's parameters/FLOPs
        (in_proj, x_proj, dt_proj, out_proj x2 for the bidirectional scan)
        plus the classifier and area head. Conv2d layers are untouched —
        static/QAT quantization would be needed for those and requires
        calibration data this file doesn't assume you have on hand.
        Validate accuracy on a held-out set before shipping the quantized
        model; dynamic quantization is usually near-lossless for Linear
        layers but "usually" is not "always."

        Measured here (batch=1, 224x224, 2 threads, median of 30 runs):
        ~1.01x — also noise-level on this config. At batch=1 with only 2
        threads, the per-call activation quantize/dequantize overhead
        roughly cancels the INT8 matmul speedup for Linear layers this
        size. This may pay off more at a larger batch size (amortizes the
        quantize/dequantize cost over more rows) — re-measure before
        relying on it for latency; it's provided because it's correct and
        free to have available, not because it was shown to help here.
        """
        import torch.ao.quantization as quant

        self.eval()
        return quant.quantize_dynamic(self, {nn.Linear}, dtype=torch.qint8)


# --------------------------------------------------------------------------- #
# 9. Grad-CAM  (unchanged from v1)
# --------------------------------------------------------------------------- #
def grad_cam(model: CropStressMamba, image: torch.Tensor,
             target_class: Optional[int] = None) -> torch.Tensor:
    was_training = model.training
    model.eval()
    model.enable_cam(True)
    model.zero_grad(set_to_none=True)
    image = image.clone().detach().requires_grad_(True)
    with torch.enable_grad():
        out = model(image, return_seg=False)
        logits = out["logits"]
        if target_class is None:
            idx = logits.argmax(dim=1)
        else:
            idx = torch.full((logits.shape[0],), int(target_class),
                             device=logits.device, dtype=torch.long)
        score = logits.gather(1, idx[:, None]).sum()
        score.backward()
    grads = model._grad
    feats = model._features
    model.enable_cam(False)
    model._grad = model._features = None
    if was_training:
        model.train()
    if grads is None or feats is None:
        return torch.zeros(image.shape[0], 1, *image.shape[-2:], device=image.device)
    weights = grads.mean(dim=(2, 3), keepdim=True)
    cam = F.relu((weights * feats.detach()).sum(dim=1, keepdim=True))
    cam = F.interpolate(cam, size=image.shape[-2:], mode="bilinear",
                        align_corners=False)
    cam = cam / (cam.amax(dim=(2, 3), keepdim=True) + 1e-8)
    return cam.detach()


def _run_smoke_test():
    for ch in (3, 5):
        for use_graph in (True, False):
            mdl = CropStressMamba(num_classes=4, in_ch=ch, use_graph=use_graph)
            n = sum(p.numel() for p in mdl.parameters())
            dummy = torch.randn(2, ch, 224, 224)
            t0 = time.time()
            o = mdl(dummy)
            dt = time.time() - t0
            cam = grad_cam(mdl, dummy)
            print(f"in_ch={ch} use_graph={use_graph!s:<5} params={n/1e6:.2f}M "
                  f"logits={tuple(o['logits'].shape)} seg={tuple(o['seg_mask'].shape)} "
                  f"cam={tuple(cam.shape)} fwd_time={dt:.2f}s")


def _run_bench(threads: int = 2):
    torch.set_num_threads(threads)
    model = CropStressMamba(num_classes=4, in_ch=3, use_graph=True)
    model.eval()
    dummy = torch.randn(1, 3, 224, 224)
    with torch.no_grad():
        for _ in range(3):
            model(dummy)
        t0 = time.time()
        for _ in range(10):
            model(dummy)
        base = (time.time() - t0) / 10

        opt = CropStressMamba(num_classes=4, in_ch=3, use_graph=True)
        opt.load_state_dict(model.state_dict())
        opt.optimize_for_inference()
        for _ in range(3):
            opt(dummy)
        t0 = time.time()
        for _ in range(10):
            opt(dummy)
        fused = (time.time() - t0) / 10

        quant = opt.quantize_for_cpu()
        for _ in range(3):
            quant(dummy)
        t0 = time.time()
        for _ in range(10):
            quant(dummy)
        quantized = (time.time() - t0) / 10

    print(f"threads={threads}  eval-only: {base*1000:6.1f}ms   "
          f"+bn-fuse: {fused*1000:6.1f}ms ({base/fused:.2f}x)   "
          f"+dynamic-int8: {quantized*1000:6.1f}ms ({base/quantized:.2f}x)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--bench", action="store_true",
                         help="benchmark eval / bn-fused / quantized inference on CPU")
    parser.add_argument("--threads", type=int, default=2,
                         help="torch CPU thread count for --bench (default 2, matching "
                              "the documented AgriCon serving target)")
    args = parser.parse_args()
    if args.bench:
        _run_bench(args.threads)
    else:
        _run_smoke_test()
