"""
PsoriCare AI - Model Inference Service
----------------------------------------
Wraps the trained ResNet-18 checkpoint (best_psoriasis_model.pth) in a small
FastAPI service so the Node/Express backend (server.ts) can call the real
dissertation model instead of relying solely on a third-party LLM.

Run:
    cd psoriasis_ml/service
    pip install -r requirements.txt
    uvicorn inference_server:app --host 0.0.0.0 --port 8001

Endpoints:
    GET  /health   -> liveness + model-loaded check
    POST /predict  -> multipart image upload -> classification result
"""

import base64
import io
import os
import sys
from typing import Optional

import torch
import torch.nn.functional as F
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel
from torchvision import transforms

# Make ml_src importable regardless of cwd
SERVICE_DIR = os.path.dirname(os.path.abspath(__file__))
ML_SRC_DIR = os.path.abspath(os.path.join(SERVICE_DIR, "..", "ml_src"))
sys.path.append(ML_SRC_DIR)

from model import PsoriasisClassifier  # noqa: E402

MODEL_PATH = os.environ.get(
    "PSORIASIS_MODEL_PATH",
    os.path.abspath(os.path.join(SERVICE_DIR, "..", "best_psoriasis_model.pth")),
)
CLASSES = ["non_psoriasis", "psoriasis"]
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

TRANSFORM = transforms.Compose(
    [
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ]
)

app = FastAPI(title="PsoriCare AI - Inference Service")

# Allow the Express dev server (and Vite dev server) to call this directly if needed.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this to your actual frontend origin in production
    allow_methods=["*"],
    allow_headers=["*"],
)

_model: Optional[PsoriasisClassifier] = None


def get_model() -> PsoriasisClassifier:
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise RuntimeError(f"Model checkpoint not found at {MODEL_PATH}")
        model = PsoriasisClassifier(num_classes=len(CLASSES), pretrained=False)
        model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
        model.to(DEVICE)
        model.eval()
        _model = model
    return _model


class PredictionResponse(BaseModel):
    diagnosis: str
    confidence: float
    psoriasis_probability: float
    non_psoriasis_probability: float


class Base64PredictRequest(BaseModel):
    imageBase64: str


def run_inference(image: Image.Image) -> PredictionResponse:
    model = get_model()
    tensor = TRANSFORM(image.convert("RGB")).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        outputs = model(tensor)
        probabilities = F.softmax(outputs, dim=1)[0]

    confidence, predicted_idx = torch.max(probabilities, 0)
    diagnosis = CLASSES[predicted_idx.item()]

    return PredictionResponse(
        diagnosis=diagnosis,
        confidence=round(confidence.item() * 100, 2),
        psoriasis_probability=round(probabilities[CLASSES.index("psoriasis")].item() * 100, 2),
        non_psoriasis_probability=round(
            probabilities[CLASSES.index("non_psoriasis")].item() * 100, 2
        ),
    )


@app.on_event("startup")
def preload_model():
    """Load the model once at startup so the first real request isn't slow."""
    try:
        get_model()
        print(f"Model preloaded successfully from {MODEL_PATH} on {DEVICE}")
    except Exception as e:  # noqa: BLE001
        print(f"WARNING: could not preload model at startup: {e}")
        print("The service will retry loading on the first /predict request.")


@app.get("/health")
def health():
    try:
        get_model()
        model_loaded = True
    except Exception as e:  # noqa: BLE001
        model_loaded = False
        return {"status": "degraded", "model_loaded": model_loaded, "error": str(e)}
    return {"status": "ok", "model_loaded": model_loaded, "device": str(DEVICE)}


@app.post("/predict", response_model=PredictionResponse)
async def predict(file: UploadFile = File(...)):
    """Accepts a multipart image upload (what most clients will use)."""
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or unreadable image file.")

    try:
        return run_inference(image)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


@app.post("/predict-base64", response_model=PredictionResponse)
async def predict_base64(payload: Base64PredictRequest):
    """
    Accepts a base64 data URL or raw base64 string - convenient for server.ts,
    which already receives images as base64 from the React frontend.
    """
    raw = payload.imageBase64
    if raw.startswith("data:"):
        raw = raw.split(",", 1)[1]

    try:
        image_bytes = base64.b64decode(raw)
        image = Image.open(io.BytesIO(image_bytes))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or unreadable base64 image.")

    try:
        return run_inference(image)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))