"""Vérifie la présence des métriques d'évaluation dans metadata.json.

Les métriques y sont conservées séparément de config.json, utilisé par Transformers
pour l'architecture et le chargement des poids.
Usage : python scripts/add_metrics_to_config.py [chemin/vers/metadata.json]
"""
import json
import sys
from pathlib import Path

base_dir = Path(__file__).resolve().parents[1]
model_dir = base_dir / "models" / "xlmr_fake_news_model"
metadata_path = Path(sys.argv[1]) if len(sys.argv) > 1 else model_dir / "metadata.json"

try:
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
except (OSError, json.JSONDecodeError) as exc:
    raise SystemExit(f"Impossible de lire {metadata_path}: {exc}") from exc

metrics = metadata.get("evaluation_metrics")
if not isinstance(metrics, dict) or not isinstance(metrics.get("test"), dict) or not isinstance(metrics.get("validation"), dict):
    raise SystemExit(f"Métriques de test/validation manquantes ou invalides dans {metadata_path}")

print(f"OK — métriques de test et de validation trouvées dans {metadata_path}")
