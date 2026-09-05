# AgriCon diagnosis backend

Serves **CropStressMamba v2** to the AgriCon1.2 frontend. One job: take a crop
photo, return a real diagnosis.

## Run it

```bat
backend\run_backend.bat          :: starts http://127.0.0.1:8000
npm run dev                      :: in another terminal, from AgriCon1.2\
```

Start the backend first. Vite proxies `/api` to port 8000, so the frontend
talks to it same-origin with no CORS setup. Open the app, hit **AI Crop
Diagnostic Lab**, and pick a sample or upload a photo.

If Python complains about a missing module:

```bat
..\..\project\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

`run_backend.bat` automatically prefers the main project's `.venv` because it
already has torch installed.

## Endpoints

| Method | Path            | What it does                                        |
|--------|-----------------|-----------------------------------------------------|
| GET    | `/api/health`   | Is the server up and did the checkpoint load?        |
| GET    | `/api/model`    | Checkpoint metadata + validation numbers             |
| POST   | `/api/diagnose` | multipart `image` upload → diagnosis payload         |

```bash
curl -F "image=@photo.jpg" http://127.0.0.1:8000/api/diagnose
```

`/api/diagnose` returns both an overall verdict and a spatial breakdown:

| field | what it is |
|---|---|
| `predictedClass`, `confidence`, `severity` | the overall call for the image |
| `stressedAreaPercent` | share of the image showing stress (`null` for a single tile) |
| `tileGrid[]` | every analysed tile: `predictedClass`, `confidence`, and `left`/`top`/`width`/`height` as **fractions of the image** (0..1) |
| `areaByClass` | tiles and percent per class, for the zone breakdown |
| `recommendations`, `caveats` | scouting steps, and the limits of this result |

`tileGrid` is what turns one answer into a map — the orthomosaic view draws each
tile's verdict over the patch it came from, so you can see *which corner* of the
field is in trouble. Positions are fractions rather than pixels so the overlay
stays aligned at any display size.

## What the model actually is

| | |
|---|---|
| Checkpoint | `weights/crop_stress_mamba_v2_soybean_real.pt` (3.27M params, CPU) |
| Trained on | MH-SoyaHealthVision soybean UAV crops |
| Classes | healthy, pest, disease, nutrient_deficiency |
| Validation accuracy | **0.9363** on 1304 held-out crops (group-aware split) |
| Per-class recall | healthy 0.979 · disease 0.968 · **pest 0.788** |
| nutrient_deficiency | **no real training data** — synthetic only, zero validation support |

The API surfaces these limits in every response's `caveats`, and the UI shows
them rather than hiding them behind a confident-looking percentage. A tool that
tells a farmer to spray needs to be honest about when it's guessing.

## Two decisions worth knowing about

**Photos are tiled, not squashed.** Training crops are ~200px tiles cut from
1280px drone frames, so the model has only seen canopy at that pixel scale.
Squashing a 4000px phone photo down to one 160px tile destroys the fine texture
the pest class depends on — measured: even a mild 200→160 squash drops pest
recall from 0.788 to 0.771. So a photo is downscaled toward drone-frame scale
(never upscaled), cut into 160px tiles, and every tile is classified. This also
makes "affected area" a real measurement instead of a single-tile guess.

**A single tile reports no area, and never Critical.** "Affected area" is the
share of tiles showing stress, so it only exists when there is more than one
tile. It deliberately does *not* fall back to the segmentation head on a single
crop: that head was supervised on healthy images only (all-zero masks), so its
output on a stressed tile is an unsupervised artefact — it was reporting
"affected area 0.0%" on a confidently-detected pest tile. Severity is likewise
capped at Moderate for one tile, because Critical is a claim about how far a
problem spreads and one tile cannot support it.

**When a photo counts as "stressed".** Averaging every tile would bury an early
outbreak — a few bad tiles in a mostly healthy field is exactly what AgriCon
exists to catch. So a photo is flagged if *either* more than 25% of tiles are
stressed, *or* at least 2 tiles are stressed with ≥90% confidence. Both
thresholds were calibrated on 326 real drone frames reassembled from the
held-out split: **0/36 false alarms on healthy frames, 0/290 missed stressed
frames**, and not one healthy frame contained even a single confidently-stressed
tile. Constants live at the top of `model_runtime.py`.

## Honest limits

- Soybean only. Other crops, or ground-level close-ups, are outside the training
  distribution — the model still answers, but the numbers above don't describe
  that answer. The API says so in `caveats`.
- Pest is the weak class (0.788): roughly 1 in 5 real pest tiles are still
  missed or read as disease.
- `nutrient_deficiency` predictions are unvalidated. Treat as "go test the
  soil", never as a diagnosis.
- Recommendations are scouting and verification steps only — deliberately no
  chemical names or dose rates. That call needs a local agronomist who can see
  the field and knows local resistance and residue rules.

## Files

```
backend/
  app.py                    FastAPI app (endpoints, upload validation)
  model_runtime.py          model loading, tiling, aggregation, interpretation
  crop_stress_mamba_v2.py   the architecture (self-contained, torch only)
  weights/                  the trained checkpoint
  requirements.txt
  run_backend.bat / .sh
```
