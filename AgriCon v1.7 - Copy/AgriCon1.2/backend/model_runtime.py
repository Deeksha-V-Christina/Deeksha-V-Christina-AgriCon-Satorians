"""
CropStressMamba v2 inference runtime for the AgriCon diagnosis API.

Loads the trained checkpoint once at startup and turns a single uploaded
photo into the diagnosis payload the frontend renders.

Design notes that matter:

* Inference runs at 160px tiles, not the 224px used by
  `run_demo_mamba_v2.py`. 160 is the crop size the checkpoint was trained
  AND validated at (the published val_acc 0.9363 / pest recall 0.7881 are
  160px numbers), so serving at 160 is the only size those figures describe.
* A big photo is TILED, not squashed. The training crops are ~200px tiles
  cut from 1280px-normalised drone frames, so the model has only ever seen
  canopy at that pixel scale. Resizing a 4000px phone photo down to 160
  would destroy the fine texture the pest class depends on -- measured
  directly: even the mild 200->160 squash costs pest recall (0.7881 ->
  0.7712 on the held-out set), and a 4000px squash is far more aggressive.
  So an incoming photo is rescaled to the training frame scale, cut into
  160px tiles, and every tile is classified; the tile votes are then
  aggregated. This also makes `stressedAreaPercent` mean something real
  (share of the photo showing stress) instead of a single-tile guess.
* `confidence` is the real softmax probability, not a decorative number.
  A low-confidence prediction is reported as low-confidence.
* The checkpoint was trained on soybean UAV crops (MH-SoyaHealthVision).
  A photo of any other crop, or a ground-level phone photo, is outside the
  training distribution. The API says so in `caveats` rather than quietly
  returning a confident-looking answer.
* `nutrient_deficiency` had ZERO real training examples (synthetic
  admixture only, support=0 on the real val set). Predictions of that
  class are explicitly flagged as unvalidated.
* Recommendations are scouting/monitoring guidance only. This deliberately
  does not prescribe specific agrochemicals or dose rates -- that is a
  decision for a local agronomist or extension officer who can see the
  field, and getting it wrong has real cost and real safety implications.
"""
from __future__ import annotations

import os
import time
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import torch
from PIL import Image

from crop_stress_mamba_v2 import CropStressMamba

CLASS_NAMES: Tuple[str, ...] = ("healthy", "pest", "disease", "nutrient_deficiency")

# Trained at 160px; see module docstring.
IMG_SIZE = 160

# Drone frames were normalised to 1280px before being cut into crops, so this
# is the scale the model's texture cues were learned at. Photos are rescaled
# so their long edge matches this before tiling.
FRAME_LONG_EDGE = 1280

# An image at or below this size is treated as a single pre-cut tile (the
# dataset's own crops are 200x200), so dataset-sized input follows exactly the
# validated eval path and reproduces the published numbers.
SINGLE_TILE_MAX = 256

# Latency guard: a 1280x960 photo is 8x6 = 48 tiles. On the 2-CPU-thread
# serving target that is a few seconds, so cap the grid and sample it evenly
# rather than letting a large photo stall the request.
MAX_TILES = 36
BATCH = 8

# Aggregation thresholds, calibrated on 326 real reassembled drone frames from
# the held-out split (0/36 false alarms on healthy, 0/290 missed stressed).
# See the "two ways to call a photo stressed" comment in _aggregate.
STRESS_SHARE = 0.25   # share of tiles flagged (exclusive) -> bulk stress
CLUSTER_MIN = 2       # this many confident stressed tiles -> early outbreak
CLUSTER_CONF = 0.90   # what counts as confident for the cluster clause

DEFAULT_WEIGHTS = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "weights",
    "crop_stress_mamba_v2_soybean_real.pt",
)

# Per-class validation recall from ml/model_card_mamba_real.json (epoch 2,
# 1304 held-out crops, group-aware split). Surfaced to the client so the UI
# can be honest about which classes this model is actually good at.
VALIDATED_RECALL = {
    "healthy": 0.9792,
    "pest": 0.7881,
    "disease": 0.9675,
    "nutrient_deficiency": None,  # no real validation data
}

DISPLAY_NAME = {
    "healthy": "Healthy Canopy",
    "pest": "Pest Damage",
    "disease": "Foliar Disease",
    "nutrient_deficiency": "Nutrient Deficiency",
}


class DiagnosisModel:
    """Wraps the checkpoint. Built once at app startup, then reused."""

    def __init__(self, weights_path: str = DEFAULT_WEIGHTS, threads: int = 2):
        self.weights_path = weights_path
        if not os.path.exists(weights_path):
            raise FileNotFoundError(
                f"No checkpoint at {weights_path}. The API refuses to start with "
                f"random weights -- it would return confident-looking nonsense."
            )

        torch.set_num_threads(max(1, threads))
        ckpt = torch.load(weights_path, map_location="cpu", weights_only=False)

        # d_state/expand/use_graph are saved in the checkpoint by
        # train_mamba_real.py. Read them back rather than hardcoding: this
        # checkpoint uses a leaner config than the architecture default.
        self.d_state = int(ckpt.get("d_state", 16))
        self.expand = int(ckpt.get("expand", 2))
        self.use_graph = bool(ckpt.get("use_graph", True))

        self.model = CropStressMamba(
            num_classes=len(CLASS_NAMES),
            in_ch=3,
            d_state=self.d_state,
            expand=self.expand,
            use_graph=self.use_graph,
        )
        state = ckpt.get("model", ckpt) if isinstance(ckpt, dict) else ckpt
        self.model.load_state_dict(state)
        self.model.eval()

        self.n_params = sum(p.numel() for p in self.model.parameters())

    # -- preprocessing ----------------------------------------------------

    def _to_tiles(self, image: Image.Image) -> Tuple[torch.Tensor, int, str, List[Dict[str, Any]]]:
        """
        Turn an arbitrary photo into a batch of 160px tiles at the pixel scale
        the model was trained on.

        Returns (tiles, tile_count, mode, geometry). `geometry` gives each
        tile's position as a FRACTION of the original image (left/top/width/
        height in 0..1), which is what lets the orthomosaic view draw each
        tile's verdict over the right patch of the map the user uploaded.
        Fractions rather than pixels because the browser displays the image
        at whatever size it likes; the resize is uniform, so the fractions
        hold for the original and the rescaled copy alike.
        """
        img = image.convert("RGB")
        w, h = img.size

        # Dataset-sized input: treat as one already-cut tile. Centre-crop to
        # 160 exactly as RealPatchSet does at eval time (only resizing if the
        # image is smaller than a tile), so validated numbers reproduce.
        if max(w, h) <= SINGLE_TILE_MAX:
            if w >= IMG_SIZE and h >= IMG_SIZE:
                left, top = (w - IMG_SIZE) // 2, (h - IMG_SIZE) // 2
                img = img.crop((left, top, left + IMG_SIZE, top + IMG_SIZE))
            else:
                img = img.resize((IMG_SIZE, IMG_SIZE), Image.BILINEAR)
            arr = np.asarray(img, dtype=np.float32) / 255.0
            t = torch.from_numpy(arr).permute(2, 0, 1).unsqueeze(0)
            # One tile covering the whole (centre-cropped) image.
            geom = [{"row": 0, "col": 0, "left": 0.0, "top": 0.0, "width": 1.0, "height": 1.0}]
            return t, 1, "single-tile", geom

        # Rescale toward the training frame scale, then grid it.
        #
        # Only ever DOWNSCALE. An image already at or below drone-frame scale
        # is tiled at its native resolution: upscaling it would blow each
        # 160px tile up from a ~50px patch of real content and destroy the
        # very texture the model reads. Downscaling a larger photo (a 4000px
        # drone still) is right because it brings canopy back to the
        # pixels-per-leaf scale the model was trained at. Neither fixes a
        # ground-level phone close-up -- that is out of distribution at any
        # resize, which is what the caveats say.
        scale = min(1.0, FRAME_LONG_EDGE / float(max(w, h)))
        if scale < 1.0:
            new_w = max(IMG_SIZE, int(round(w * scale)))
            new_h = max(IMG_SIZE, int(round(h * scale)))
            img = img.resize((new_w, new_h), Image.BILINEAR)
        else:
            new_w, new_h = w, h
        arr = np.asarray(img, dtype=np.float32) / 255.0

        cols = max(1, new_w // IMG_SIZE)
        rows = max(1, new_h // IMG_SIZE)

        # Even sampling if the full grid exceeds the latency cap.
        if rows * cols > MAX_TILES:
            keep = max(1, int(np.sqrt(MAX_TILES * cols / max(1, rows))))
            col_idx = np.unique(np.linspace(0, cols - 1, min(cols, keep)).astype(int))
            row_idx = np.unique(np.linspace(0, rows - 1, min(rows, max(1, MAX_TILES // len(col_idx)))).astype(int))
        else:
            col_idx, row_idx = np.arange(cols), np.arange(rows)

        tiles, geom = [], []
        for r in row_idx:
            for c in col_idx:
                tiles.append(arr[r * IMG_SIZE:(r + 1) * IMG_SIZE, c * IMG_SIZE:(c + 1) * IMG_SIZE])
                # Position as a fraction of the image, so the client can place
                # this verdict over the exact patch it came from.
                geom.append({
                    "row": int(r), "col": int(c),
                    "left": float(c * IMG_SIZE / new_w),
                    "top": float(r * IMG_SIZE / new_h),
                    "width": float(IMG_SIZE / new_w),
                    "height": float(IMG_SIZE / new_h),
                })
        batch = torch.from_numpy(np.stack(tiles)).permute(0, 3, 1, 2).contiguous()
        return batch, batch.shape[0], f"tiled {len(row_idx)}x{len(col_idx)}", geom

    # -- inference --------------------------------------------------------

    @torch.no_grad()
    def diagnose(self, image: Image.Image) -> Dict[str, Any]:
        tiles, n_tiles, mode, geom = self._to_tiles(image)

        t0 = time.perf_counter()
        all_probs, all_area = [], []
        for i in range(0, tiles.shape[0], BATCH):
            out = self.model(tiles[i:i + BATCH], return_seg=True)
            all_probs.append(torch.softmax(out["logits"], dim=1))
            all_area.append(torch.sigmoid(out["seg_mask"]).mean(dim=(1, 2, 3)))
        latency_ms = (time.perf_counter() - t0) * 1000.0

        tile_probs = torch.cat(all_probs)              # (N, 4)
        tile_area = torch.cat(all_area)                # (N,)
        tile_pred = tile_probs.argmax(dim=1)           # (N,)

        pred_class, confidence, probs = self._aggregate(tile_probs, tile_pred)
        pred_idx = CLASS_NAMES.index(pred_class)

        # How much of the photo shows stress -- only reportable with multiple
        # tiles, where it is the share of tiles voting for a stress class.
        #
        # It deliberately does NOT fall back to the segmentation head on a
        # single tile. That head was supervised on healthy images only (all-
        # zero target masks, has_mask=healthy in train_mamba_real.py), so it
        # learned "output zero when this looks clean" and was never taught
        # what a lesion's extent looks like. Its value on a stressed tile is
        # an unsupervised artefact -- which is why a confidently-detected pest
        # tile was reporting "affected area 0.0%". Showing that to a farmer as
        # an area measurement is worse than showing nothing.
        stressed_frac = float((tile_pred != 0).float().mean().item()) if n_tiles > 1 else None

        severity, severity_reason = self._severity(pred_class, confidence, stressed_frac)
        caveats = self._caveats(pred_class, confidence)

        return {
            "predictedClass": pred_class,
            "displayName": DISPLAY_NAME[pred_class],
            "confidence": round(confidence * 100, 1),
            "severity": severity,
            "severityReason": severity_reason,
            "stressedAreaPercent": round(stressed_frac * 100, 1) if stressed_frac is not None else None,
            "probabilities": {
                name: round(float(p) * 100, 1) for name, p in zip(CLASS_NAMES, probs)
            },
            "tiles": {
                "count": n_tiles,
                "mode": mode,
                "stressedTiles": int((tile_pred != 0).sum().item()) if n_tiles > 1 else None,
            },
            # Per-tile verdicts with their position on the image. This is what
            # turns a single answer into a MAP: an orthomosaic's whole value is
            # knowing which corner of the field is in trouble, not just that
            # something somewhere is.
            "tileGrid": self._tile_grid(geom, tile_probs, tile_pred),
            # Share of the surveyed area per class, for the zone breakdown.
            "areaByClass": self._area_by_class(tile_pred),
            "validatedRecallForThisClass": VALIDATED_RECALL[pred_class],
            "diagnosis": self._narrative(pred_class, confidence, stressed_frac),
            "recommendations": self._recommendations(pred_class, severity),
            "caveats": caveats,
            "lowConfidence": confidence < 0.55,
            "latencyMs": round(latency_ms, 1),
        }

    # -- spatial output ---------------------------------------------------

    def _tile_grid(self, geom: List[Dict[str, Any]], tile_probs: torch.Tensor,
                   tile_pred: torch.Tensor) -> List[Dict[str, Any]]:
        """Attach each tile's verdict to its position on the uploaded image."""
        cells = []
        for i, g in enumerate(geom):
            idx = int(tile_pred[i])
            cells.append({
                **g,
                "predictedClass": CLASS_NAMES[idx],
                "confidence": round(float(tile_probs[i, idx]) * 100, 1),
            })
        return cells

    def _area_by_class(self, tile_pred: torch.Tensor) -> Dict[str, Dict[str, Any]]:
        """
        Share of surveyed area per class. "Area" here means share of analysed
        tiles, not hectares -- there is no flight GSD for this dataset, so the
        API cannot honestly convert tiles into ground area. The UI says
        "of surveyed area" for the same reason.
        """
        n = int(tile_pred.shape[0])
        out = {}
        for i, name in enumerate(CLASS_NAMES):
            count = int((tile_pred == i).sum())
            out[name] = {"tiles": count, "percent": round(count / max(1, n) * 100, 1)}
        return out

    # -- aggregation ------------------------------------------------------

    def _aggregate(self, tile_probs: torch.Tensor, tile_pred: torch.Tensor
                   ) -> Tuple[str, float, List[float]]:
        """
        Turn per-tile predictions into one verdict.

        Averaging probabilities over every tile would bury a real problem: a
        photo with 3 badly diseased tiles out of 40 healthy ones averages out
        to "healthy", which is exactly the failure a farmer cannot afford --
        an early outbreak is small by definition. So healthy is only the
        verdict when almost nothing is flagged; otherwise the dominant STRESS
        class wins, and confidence is that class's mean probability over the
        tiles that actually voted for it (not diluted by healthy tiles).
        """
        mean_probs = tile_probs.mean(dim=0)
        n = tile_probs.shape[0]

        if n == 1:
            i = int(tile_probs[0].argmax())
            return CLASS_NAMES[i], float(tile_probs[0, i]), [float(p) for p in tile_probs[0]]

        stressed = tile_pred != 0
        stressed_share = float(stressed.float().mean())
        tile_conf = tile_probs.max(dim=1).values
        confident_stressed = int((stressed & (tile_conf >= CLUSTER_CONF)).sum())

        # Two ways to call a photo stressed, both calibrated on 326 real
        # reassembled drone frames from the held-out split (see the
        # rule_check.py measurement that produced these constants):
        #
        #   1. bulk       -- more than STRESS_SHARE of tiles flagged.
        #   2. cluster    -- at least CLUSTER_MIN tiles flagged with high
        #                    confidence, however small a share that is.
        #
        # Clause 2 exists because a share threshold alone hides exactly the
        # case this product is for: a handful of bad tiles in a mostly healthy
        # field is an EARLY outbreak, and averaging it away is the expensive
        # failure. It is safe to add because not one of the 36 held-out
        # healthy frames contained even a single confidently-stressed tile,
        # and it needs two, so one noisy tile cannot raise an alarm.
        #
        # Measured on those frames: 0/36 false alarms, 0/290 missed stressed
        # frames. Those frames are 4 tiles each; for a many-tile photo the
        # cluster clause is deliberately the more sensitive of the two.
        if stressed_share <= STRESS_SHARE and confident_stressed < CLUSTER_MIN:
            return "healthy", float(mean_probs[0]), [float(p) for p in mean_probs]

        # Dominant stress class = the one holding the most tiles, ties broken
        # by summed probability mass.
        counts = {c: int((tile_pred == i).sum()) for i, c in enumerate(CLASS_NAMES) if i != 0}
        mass = {c: float(tile_probs[:, i].sum()) for i, c in enumerate(CLASS_NAMES) if i != 0}
        winner = max(counts, key=lambda c: (counts[c], mass[c]))
        w_idx = CLASS_NAMES.index(winner)

        voting = tile_pred == w_idx
        confidence = float(tile_probs[voting, w_idx].mean()) if bool(voting.any()) \
            else float(mean_probs[w_idx])

        return winner, confidence, [float(p) for p in mean_probs]

    # -- interpretation ---------------------------------------------------

    def _severity(self, cls: str, conf: float, area: Optional[float]) -> Tuple[str, str]:
        """
        Severity blends what the classifier said with how much of the photo is
        affected. A confident stress call over a large area is Critical; over a
        small patch, Moderate. Two things cap it at Moderate: low confidence,
        and having only one tile to look at -- Critical is a claim about
        EXTENT, and a single crop tile carries no information about how far a
        problem spreads.
        """
        if cls == "healthy":
            return "Low", "Classified as healthy canopy."

        if conf < 0.55:
            return (
                "Moderate",
                f"Capped at Moderate: model confidence is only {conf * 100:.0f}%, "
                f"too low to justify a Critical alert without a human look.",
            )

        if area is None:
            return (
                "Moderate",
                f"Detected at {conf * 100:.0f}% confidence. Capped at Moderate: this "
                f"is a single crop tile, so how far the problem spreads cannot be "
                f"judged from it -- scan a wider photo of the block to assess extent.",
            )

        if area >= 0.35 or (conf >= 0.85 and area >= 0.20):
            return (
                "Critical",
                f"{area * 100:.0f}% of the sampled area flagged as stressed at "
                f"{conf * 100:.0f}% confidence.",
            )

        return (
            "Moderate",
            f"{area * 100:.0f}% of the sampled area flagged as stressed at "
            f"{conf * 100:.0f}% confidence.",
        )

    def _narrative(self, cls: str, conf: float, area: Optional[float]) -> str:
        # With one tile there is no extent to report, so the wording says
        # "this tile" instead of inventing a percentage.
        scope = f"roughly {area * 100:.0f}% of the sampled area" if area is not None \
            else "this crop tile"
        if cls == "healthy":
            return (
                f"No stress signature detected. Canopy texture and colour are "
                f"consistent with healthy foliage across the sampled area "
                f"({conf * 100:.0f}% confidence)."
            )
        if cls == "pest":
            return (
                f"Pest damage signature detected across {scope} -- the model is responding to small, "
                f"high-frequency texture breaks (feeding holes, stippling, "
                f"leaf-edge notching) rather than broad discolouration."
            )
        if cls == "disease":
            return (
                f"Foliar disease signature detected across {scope} -- broad low-frequency lesions and discolouration "
                f"consistent with the rust/mosaic patterns in the training data."
            )
        return (
            f"Pattern most closely matches a nutrient-deficiency signature over "
            f"{scope}, but see the caveat below: this "
            f"class had no real training examples, so treat this as a prompt to "
            f"check tissue/soil, not as a diagnosis."
        )

    def _recommendations(self, cls: str, severity: str) -> List[str]:
        """
        Scouting and verification steps only. Deliberately no chemical names or
        dose rates -- that call needs someone who can see the field and knows
        local resistance and residue rules.
        """
        if cls == "healthy":
            return [
                "No action needed from this scan -- continue the normal scouting interval.",
                "Re-scan after the next irrigation or rainfall event to catch early change.",
                "Keep this tile as a healthy baseline for comparing later scans.",
            ]

        if cls == "pest":
            recs = [
                "Ground-truth this tile: inspect the underside of leaves for insects, "
                "eggs and frass before acting on the aerial read.",
                "Count affected plants across several spots to estimate infestation "
                "level rather than treating on one tile.",
                "Check whether damage is spreading along a field edge or a row "
                "direction -- that usually separates a migrating pest from a "
                "localised outbreak.",
            ]
            if severity == "Critical":
                recs.append(
                    "Large affected area: get a local agronomist or extension officer "
                    "to confirm the pest and advise on control before spraying."
                )
            else:
                recs.append("Re-scan in 3-5 days to see whether the area is growing.")
            return recs

        if cls == "disease":
            recs = [
                "Ground-truth this tile: check lesion shape, colour and whether it "
                "starts on lower or upper leaves -- that distinguishes most soybean "
                "foliar diseases.",
                "Note recent humidity and leaf-wetness hours; most foliar disease "
                "pressure tracks them closely.",
                "Check whether neighbouring tiles show the same pattern to tell a "
                "spreading infection from an isolated patch.",
            ]
            if severity == "Critical":
                recs.append(
                    "Large affected area: confirm the specific pathogen with an "
                    "agronomist before any treatment decision -- control differs "
                    "sharply between rust and mosaic-type diseases."
                )
            else:
                recs.append("Re-scan in 3-5 days to track whether lesions are expanding.")
            return recs

        return [
            "Treat this as a prompt to test, not a diagnosis: take a tissue or soil "
            "sample from this area and send it for analysis.",
            "Compare against a known-healthy tile from the same field and growth stage.",
            "Check irrigation uniformity in this zone -- water stress and nutrient "
            "deficiency look similar from the air.",
        ]

    def _caveats(self, cls: str, conf: float) -> List[str]:
        caveats = [
            "Trained on soybean UAV imagery (MH-SoyaHealthVision). Photos of other "
            "crops, or close-up ground-level shots, are outside the training "
            "distribution -- the model will still answer, but that answer is not "
            "supported by the validation numbers.",
        ]
        if conf < 0.55:
            caveats.append(
                f"Low confidence ({conf * 100:.0f}%). The model is not distinguishing "
                f"the classes well on this image; verify on the ground before acting."
            )
        if cls == "pest":
            caveats.append(
                "Pest is this model's weakest class (0.79 validation recall) -- "
                "roughly 1 in 5 real pest tiles are still missed or misread as disease."
            )
        if cls == "nutrient_deficiency":
            caveats.append(
                "Nutrient deficiency had NO real training examples (synthetic only, "
                "zero validation support). This prediction is unvalidated -- do not "
                "act on it without a tissue or soil test."
            )
        return caveats

    # -- metadata ---------------------------------------------------------

    def info(self) -> Dict[str, Any]:
        return {
            "model": "CropStressMamba_v2",
            "checkpoint": os.path.basename(self.weights_path),
            "parametersMillions": round(self.n_params / 1e6, 3),
            "config": {
                "d_state": self.d_state,
                "expand": self.expand,
                "use_graph": self.use_graph,
            },
            "inputSize": IMG_SIZE,
            "classes": list(CLASS_NAMES),
            "validation": {
                "accuracy": 0.9363,
                "valCrops": 1304,
                "perClassRecall": VALIDATED_RECALL,
                "note": "Epoch 2, group-aware split. nutrient_deficiency has no real "
                        "validation support (synthetic training admixture only).",
            },
            "trainedOn": "MH-SoyaHealthVision soybean UAV crops",
        }
