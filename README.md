# PsoriCare AI

PsoriCare AI is a full-stack psoriasis care platform combining a trained computer-vision
model with a web app for skin assessment, severity tracking, and patient self-management.
It's built as an undergraduate dissertation project, pairing a ResNet-18 image classifier
with a React/Express clinical-style dashboard.

> **Disclaimer:** This project is a research/academic tool, not a certified medical device.
> Nothing it outputs is a diagnosis. Always consult a qualified dermatologist for actual
> skin conditions.

---

## What it does

- **Skin Analysis** — upload a photo of a skin lesion and get a psoriasis / non-psoriasis
  classification from a trained ResNet-18 model, optionally enriched with a descriptive
  write-up via Gemini.
- **PASI Calculator** — manual Psoriasis Area and Severity Index scoring tool.
- **Symptom Tracker** — log and visualize symptoms over time.
- **AI Consult** — chat-based guidance assistant.
- **Auth & Profiles** — JWT-based login, per-user history of analyses and logs.

---

## Architecture

This project is two systems working together:

```
┌─────────────────────┐        ┌──────────────────────┐        ┌───────────────────────┐
│   React + Vite SPA   │  HTTP  │  Express (server.ts)  │  HTTP  │  FastAPI model service │
│   (src/)             │◄──────►│  Node backend + auth   │◄──────►│  (psoriasis_ml/service)│
└─────────────────────┘        └──────────────────────┘        └───────────────────────┘
                                          │
                                          ▼
                                 Gemini API (optional,
                                 descriptive enrichment
                                 or fallback classifier)
```

- **Frontend** (`src/`): React 19 + Vite + Tailwind, single-page app with tab-based
  navigation (Dashboard, Skin Analysis, PASI Calculator, Symptom Tracker, AI Consult, Profile).
- **Backend** (`server.ts`): Express server handling auth, a flat-file JSON store
  (`db.json`), and the `/api/analysis/create` endpoint that orchestrates classification.
- **Model service** (`psoriasis_ml/service/`): a small FastAPI wrapper around the trained
  PyTorch checkpoint, serving real-time inference over HTTP.
- **ML pipeline** (`psoriasis_ml/ml_src/`): dataset preparation, training, and evaluation
  code used to produce the checkpoint the model service loads.

The `/api/analysis/create` endpoint calls the trained model first — that's the actual
classifier. If `GEMINI_API_KEY` is set, Gemini is used only to generate a descriptive
write-up and recommendations consistent with the model's result (never to override the
classification). If the model service is unreachable, the app can fall back to a
Gemini-only assessment when a key is configured.

---

## Project structure

```
psoricare-ai/
├── server.ts                      # Express backend, API routes, auth
├── src/                           # React frontend
│   ├── App.tsx
│   └── components/
│       ├── AuthView.tsx
│       ├── DashboardView.tsx
│       ├── SkinAnalysisView.tsx   # Upload + view analysis results
│       ├── PasiCalculatorView.tsx
│       ├── SymptomTrackerView.tsx
│       ├── AiConsultView.tsx
│       ├── ProfileView.tsx
│       ├── Sidebar.tsx
│       └── Navbar.tsx
├── db.json                        # Flat-file datastore (dev/demo only)
├── .env.example                   # Required environment variables
└── psoriasis_ml/                  # ML pipeline + inference service
    ├── best_psoriasis_model.pth   # Trained checkpoint
    ├── ml_src/
    │   ├── model.py               # ResNet-18 classifier definition
    │   ├── dataset.py             # Dataset loading + transforms
    │   ├── train.py               # Training entry point (CLI)
    │   ├── evaluate.py            # Evaluation utilities
    │   ├── predict.py             # Standalone prediction script
    │   ├── rebuild_split.py       # Leak-free stratified train/val split
    │   └── augmentation.py
    ├── service/
    │   ├── inference_server.py    # FastAPI wrapper for the trained model
    │   └── requirements.txt
    ├── dataset/                   # train/ + val/ image folders (not in git)
    ├── notebooks/                 # Exploration/training notebooks
    └── docs/                      # Dissertation notes, proposal, references
```

---

## Setup

### Prerequisites
- Node.js 18+ (uses the built-in `fetch` API)
- Python 3.9+ with `pip`
- ~2GB free disk space for PyTorch (CPU build is fine; no GPU required)

### 1. Clone and install frontend/backend dependencies
```bash
git clone https://github.com/sujaymandal09/psoricare-ai.git
cd psoricare-ai
npm install
```

### 2. Set up environment variables
Copy `.env.example` to `.env` and fill in the values:
```bash
cp .env.example .env
```

| Variable | Required | Purpose |
|---|---|---|
| `JWT_SECRET` | Yes | Signs auth tokens. Generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `MODEL_SERVICE_URL` | No (defaults to `http://localhost:8001`) | Where the FastAPI model service is running |
| `GEMINI_API_KEY` | No | Enables descriptive-text enrichment on top of the model's classification, and Gemini-only fallback if the model service is down |
| `ENABLE_GEMINI_ENRICHMENT` | No (defaults to `true`) | Set to `false` to skip the Gemini enrichment step and return faster, model-only results |

### 3. Install the model service dependencies
```bash
cd psoriasis_ml/service
pip install -r requirements.txt --break-system-packages
```

### 4. Run everything (two terminals)

**Terminal 1 — model inference service:**
```bash
cd psoriasis_ml/service
uvicorn inference_server:app --port 8001
```
Check it's healthy at [http://localhost:8001/health](http://localhost:8001/health) — should
report `"model_loaded": true`.

**Terminal 2 — web app:**
```bash
npm run dev
```
Open the URL it prints (typically `http://localhost:5173`).

---

## Training / retraining the model

The included checkpoint (`psoriasis_ml/best_psoriasis_model.pth`) is a ResNet-18 binary
classifier (`psoriasis` / `non_psoriasis`), fine-tuned via transfer learning.

To retrain on your own dataset:

```bash
cd psoriasis_ml/ml_src

# 1. Rebuild a leak-free, stratified train/val split (recommended before every retrain)
python3 rebuild_split.py --source ../dataset --output ../dataset_clean --val-ratio 0.2

# 2. Train
python3 train.py --data-dir ../dataset_clean --epochs 15
```

`train.py` flags:
| Flag | Default | Description |
|---|---|---|
| `--data-dir` | `../dataset_clean` | Dataset root, must contain `train/` and `val/` per-class subfolders |
| `--epochs` | `15` | Training epochs |
| `--batch-size` | `16` | Batch size |
| `--lr` | `0.001` | Learning rate |
| `--output` | `../best_psoriasis_model.pth` | Where to save the checkpoint |

The checkpoint is saved to the path the model service already expects, so restarting
`uvicorn` after training picks up the new model automatically.

**Dataset expectations:** both classes should be sourced from a comparable photographic
domain (e.g. both plain clinical photos, not one dermoscopic and one clinical) — mismatched
sourcing lets the model learn superficial photo-style shortcuts instead of actual skin
features. `rebuild_split.py` also deduplicates by image content to prevent train/val leakage.

---

## API overview (`server.ts`)

| Route | Description |
|---|---|
| `POST /api/auth/register` | Create an account |
| `POST /api/auth/login` | Log in, returns a JWT |
| `GET /api/auth/me` | Current user info |
| `POST /api/analysis/create` | Upload an image, get a classification (model + optional Gemini enrichment) |
| `GET /api/analysis/history` | Past analyses for the logged-in user |
| `POST /api/pasi` | Save a PASI score entry |
| `POST /api/symptoms` | Log a symptom entry |
| `POST /api/chat` | AI consult chat |

---

## Known limitations

- `db.json` is a flat-file store intended for development/demo use, not production scale.
- The model currently outputs a binary label + confidence only — it does not predict
  erythema/induration/desquamation sub-scores or psoriasis subtype; those fields are
  `null`/`"n/a"` in the API response when the model service is the source.
- Gemini enrichment (when enabled) adds real latency (an extra vision API round-trip);
  set `ENABLE_GEMINI_ENRICHMENT=false` for faster, model-only responses.

---

## Dissertation context

See `psoriasis_ml/docs/` for the project proposal, dissertation notes, and references.