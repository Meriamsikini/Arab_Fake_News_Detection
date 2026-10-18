from typing import Literal, Optional
from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    text: str = Field(..., description="Texte de l'article (arabe)")
    model: Literal["xlmr", "arabert", "both"] = Field("xlmr", description="Modèle à utiliser")
    save: bool = Field(True, description="Enregistrer l'analyse dans l'historique")
    store_full_text: bool = Field(False, description="Conserver le texte complet (sinon extrait seulement)")


class Probabilities(BaseModel):
    real: float
    fake: float


class ModelPrediction(BaseModel):
    id: Optional[int] = None
    model: Literal["xlmr", "arabert"]
    model_name: str
    label: str
    confidence: float
    probabilities: Probabilities
    inference_ms: float
    n_tokens: int
    truncated: bool
    max_len: int
    decision_threshold: float


class PredictResponse(BaseModel):
    predictions: list[ModelPrediction]
    n_chars: int
