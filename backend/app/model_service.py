"""Chargement et inférence des modèles XLM-RoBERTa et AraBERT."""
import json
import logging
import time
from pathlib import Path
from typing import Any, Optional

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from .config import ARABERT_MODEL_DIR, MAX_LEN, METRICS_KEY, MODEL_DIR, TOKENIZER_NAME

log = logging.getLogger("Fake_News_Detector.model")

MODEL_CONFIG = {
    "xlmr": {
        "name": "XLM-RoBERTa",
        "directory": MODEL_DIR,
        "max_len": MAX_LEN,
        "threshold": 0.5,
        "tokenizer_name": TOKENIZER_NAME,
    },
    "arabert": {
        "name": "AraBERT",
        "directory": ARABERT_MODEL_DIR,
        "max_len": 256,
        "threshold": 0.45,
        "tokenizer_name": None,
    },
}


class ModelRunner:
    def __init__(self, key: str, config: dict[str, Any]) -> None:
        self.key = key
        self.name = config["name"]
        self.model_dir: Path = config["directory"]
        self.max_len: int = config["max_len"]
        self.threshold: float = config["threshold"]
        self.tokenizer_name: Optional[str] = config["tokenizer_name"]
        self.preprocessor_model: Optional[str] = config.get("preprocessor_model")
        self.preprocessor = None
        self.model = None
        self.tokenizer = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.id2label: dict[int, str] = {0: "real", 1: "fake"}
        self.error: Optional[str] = None

    @property
    def ready(self) -> bool:
        return self.model is not None and self.tokenizer is not None

    def load(self) -> None:
        try:
            for name in ("config.json", "model.safetensors"):
                if not (self.model_dir / name).exists():
                    raise FileNotFoundError(f"Fichier introuvable : {self.model_dir / name}")

            inference_config = self.model_dir / "inference_config.json"
            if inference_config.is_file():
                settings = ModelService._read_json(inference_config)
                threshold = settings.get("decision_threshold", self.threshold)
                max_len = settings.get("max_len", self.max_len)
                if not isinstance(threshold, (int, float)) or not 0 <= threshold <= 1:
                    raise ValueError(f"Seuil de décision invalide dans {inference_config}")
                if not isinstance(max_len, int) or max_len < 1:
                    raise ValueError(f"Longueur maximale invalide dans {inference_config}")
                self.threshold = float(threshold)
                self.max_len = max_len
                self.preprocessor_model = settings.get("arabert_preprocessor_model", self.preprocessor_model)

            if self.preprocessor_model:
                from arabert import ArabertPreprocessor

                self.preprocessor = ArabertPreprocessor(model_name=self.preprocessor_model)

            has_local_tok = any(
                (self.model_dir / name).exists()
                for name in ("tokenizer.json", "sentencepiece.bpe.model", "vocab.txt")
            )
            tokenizer_source = str(self.model_dir) if has_local_tok else self.tokenizer_name
            if tokenizer_source is None:
                raise FileNotFoundError(f"Tokenizer introuvable dans {self.model_dir}")
            self.tokenizer = AutoTokenizer.from_pretrained(tokenizer_source)

            self.model = AutoModelForSequenceClassification.from_pretrained(str(self.model_dir))
            self.model.to(self.device).eval()

            cfg_map = getattr(self.model.config, "id2label", None) or {}
            mapped = {int(k): str(v).lower() for k, v in cfg_map.items()}
            if set(mapped.values()) >= {"real", "fake"}:
                self.id2label = mapped
            self.error = None
            log.info("%s chargé depuis %s sur %s (labels=%s)", self.name, self.model_dir, self.device, self.id2label)
        except Exception as exc:  # le serveur démarre quand même, /api/health expliquera l'erreur
            self.model = self.tokenizer = None
            self.error = f"{type(exc).__name__}: {exc}"
            log.exception("Échec du chargement de %s", self.name)

    def predict(self, text: str) -> dict[str, Any]:
        if not self.ready:
            raise RuntimeError(self.error or f"{self.name} non chargé")
        t0 = time.perf_counter()
        prepared_text = self.preprocessor.preprocess(text) if self.preprocessor else text
        n_tokens = len(self.tokenizer(prepared_text, truncation=False, add_special_tokens=True, verbose=False)["input_ids"])
        enc = self.tokenizer(prepared_text, max_length=self.max_len, truncation=True, return_tensors="pt").to(self.device)
        with torch.inference_mode():
            logits = self.model(**enc).logits
            probs = torch.softmax(logits, dim=-1).squeeze(0).cpu().tolist()
        ms = (time.perf_counter() - t0) * 1000
        by_label = {self.id2label[i]: float(p) for i, p in enumerate(probs)}
        label = "fake" if by_label["fake"] >= self.threshold else "real"
        return {
            "model": self.key,
            "model_name": self.name,
            "label": label,
            "confidence": by_label[label],
            "probabilities": {"real": by_label["real"], "fake": by_label["fake"]},
            "inference_ms": ms,
            "n_tokens": n_tokens,
            "truncated": n_tokens > self.max_len,
            "max_len": self.max_len,
            "decision_threshold": self.threshold,
        }


class ModelService:
    def __init__(self) -> None:
        self.models = {key: ModelRunner(key, config) for key, config in MODEL_CONFIG.items()}
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    @property
    def ready(self) -> bool:
        return any(model.ready for model in self.models.values())

    def load(self) -> None:
        for model in self.models.values():
            model.load()

    def get(self, key: str) -> ModelRunner:
        return self.models[key]

    def predict(self, key: str, text: str) -> dict[str, Any]:
        return self.get(key).predict(text)

    @staticmethod
    def _read_json(path: Path) -> dict[str, Any]:
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)

    def read_metrics(self) -> dict[str, Optional[dict[str, Any]]]:
        """Normalise les métriques des fichiers metadata.json des deux modèles."""
        result: dict[str, Optional[dict[str, Any]]] = {}
        for key, model in self.models.items():
            metadata_path = model.model_dir / "metadata.json"
            if not metadata_path.is_file():
                result[key] = None
                continue

            metadata = self._read_json(metadata_path)
            if key == "xlmr":
                metrics = metadata.get(METRICS_KEY)
                if metrics is not None:
                    metrics["model_name"] = model.name
                    metrics["decision_threshold"] = model.threshold
                result[key] = metrics
                continue

            raw = metadata.get("test_metrics", {})
            cm = metadata.get("confusion_matrix", {})
            support = cm.get("true_negatives", 0) + cm.get("false_positives", 0) + cm.get("false_negatives", 0) + cm.get("true_positives", 0)
            threshold = metadata.get("threshold_optimization", {})
            result[key] = {
                "model_name": model.name,
                "max_len": model.max_len,
                "decision_threshold": model.threshold,
                "split": metadata.get("split", "Non spécifié"),
                "test": {
                    "n_samples": support,
                    "accuracy": raw.get("accuracy"),
                    "precision": raw.get("precision"),
                    "recall": raw.get("recall"),
                    "f1": raw.get("f1_at_0.50"),
                    "roc_auc": raw.get("auc"),
                    "confusion_matrix": {
                        "tn": cm.get("true_negatives", 0),
                        "fp": cm.get("false_positives", 0),
                        "fn": cm.get("false_negatives", 0),
                        "tp": cm.get("true_positives", 0),
                    },
                    "decision_threshold": 0.5,
                    "threshold_optimization": {
                        "threshold": threshold.get("best_threshold"),
                        "precision": threshold.get("precision_at_best_threshold"),
                        "recall": threshold.get("recall_at_best_threshold"),
                        "f1": threshold.get("f1_at_best_threshold"),
                    },
                },
                "validation": None,
            }
        return result


service = ModelService()
