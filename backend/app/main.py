"""API REST Fake news detector — détection de fake news arabes (XLM-RoBERTa et AraBERT)."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from . import db
from .config import CORS_ORIGINS, EXCERPT_CHARS, MAX_LEN, MAX_TEXT_CHARS
from .model_service import service
from .schemas import PredictRequest, PredictResponse

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(_: FastAPI):
    service.load()
    yield


app = FastAPI(title="Fake_news_detector API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_methods=["*"], allow_headers=["*"])


@app.get("/")
def root():
    return {
        "name": "Fake_news_detector API",
        "docs": "/docs",
        "health": "/api/health",
        "frontend": "http://localhost:3000",
    }


@app.get("/api/health")
def health():
    return {
        "status": "ok" if service.ready else "model_unavailable",
        "model_loaded": service.ready,
        "device": str(service.device),
        "max_len": MAX_LEN,
        "models": {
            key: {
                "name": model.name,
                "model_dir": str(model.model_dir),
                "model_loaded": model.ready,
                "max_len": model.max_len,
                "error": model.error,
            }
            for key, model in service.models.items()
        },
        "error": None if service.ready else "Aucun modèle n'a pu être chargé.",
    }


@app.post("/api/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    text = req.text.strip()
    if not text:
        raise HTTPException(422, "Le texte est vide.")
    if len(text) > MAX_TEXT_CHARS:
        raise HTTPException(413, f"Texte trop long (max {MAX_TEXT_CHARS} caractères).")
    selected = list(service.models) if req.model == "both" else [req.model]
    unavailable = [service.get(key) for key in selected if not service.get(key).ready]
    if unavailable:
        details = "; ".join(f"{model.name}: {model.error or 'indisponible'}" for model in unavailable)
        raise HTTPException(503, f"Modèle(s) indisponible(s) : {details}")
    try:
        predictions = [service.predict(key, text) for key in selected]
    except Exception as exc:
        logging.exception("Erreur d'inférence")
        raise HTTPException(500, f"Erreur d'inférence : {exc}")

    if req.save:
        for pred in predictions:
            pred["id"] = db.add(pred, len(text), text[:EXCERPT_CHARS], text if req.store_full_text else None)
    return {"predictions": predictions, "n_chars": len(text)}


@app.get("/api/stats")
def stats():
    return db.stats()


@app.get("/api/metrics")
def metrics():
    """Métriques d'évaluation des deux modèles."""
    try:
        data = service.read_metrics()
    except Exception as exc:
        raise HTTPException(500, f"Fichier de métadonnées du modèle illisible : {exc}")
    if not any(data.values()):
        raise HTTPException(404, "Aucune métrique d'évaluation n'est disponible dans les métadonnées des modèles.")
    return {"models": data}


@app.get("/api/history")
def history(limit: int = Query(50, ge=1, le=200), offset: int = Query(0, ge=0)):
    total, items = db.list_items(limit, offset)
    return {"total": total, "items": items}


@app.get("/api/history/{pid}")
def history_item(pid: int):
    item = db.get(pid)
    if not item:
        raise HTTPException(404, "Analyse introuvable.")
    return item


@app.delete("/api/history/{pid}")
def history_delete(pid: int):
    if not db.delete(pid):
        raise HTTPException(404, "Analyse introuvable.")
    return {"deleted": pid}


@app.delete("/api/history")
def history_clear():
    return {"deleted": db.clear()}
