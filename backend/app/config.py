"""Configuration centralisée (surchargeable par variables d'environnement)."""
import os
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]          # racine du projet
BACKEND_DIR = ROOT_DIR / "backend"

# Dossiers des modèles : chacun contient config.json, les poids et son tokenizer.
MODEL_DIR = Path(os.getenv("MODEL_DIR", ROOT_DIR / "models" / "xlmr_fake_news_model")).resolve()
ARABERT_MODEL_DIR = Path(os.getenv("ARABERT_MODEL_DIR", ROOT_DIR / "models" / "arabert_fake_news_model")).resolve()

# Le dossier du modèle ne contient pas de tokenizer : on utilise celui de xlm-roberta-base
# (le tokenizer n'est pas modifié par le fine-tuning). Téléchargé une fois depuis HuggingFace.
TOKENIZER_NAME = os.getenv("TOKENIZER_NAME", "xlm-roberta-base")

MAX_LEN = int(os.getenv("MAX_LEN", "256"))              # identique au notebook d'entraînement
MAX_TEXT_CHARS = int(os.getenv("MAX_TEXT_CHARS", "50000"))
EXCERPT_CHARS = 120                                      # extrait conservé par défaut (confidentialité)

DB_PATH = Path(os.getenv("DB_PATH", BACKEND_DIR / "data" / "history.db")).resolve()
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()]

# Source des métadonnées du modèle et clé contenant les métriques d'évaluation.
METRICS_KEY = "evaluation_metrics"
