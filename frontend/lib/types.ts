export type Label = "real" | "fake";
export type ModelKey = "xlmr" | "arabert";

export interface PredictResponse {
  predictions: ModelPrediction[];
  n_chars: number;
}

export interface ModelPrediction {
  id: number | null;
  model: ModelKey;
  model_name: string;
  label: Label;
  confidence: number;
  probabilities: { real: number; fake: number };
  inference_ms: number;
  n_tokens: number;
  truncated: boolean;
  max_len: number;
  decision_threshold: number;
}

export interface HistoryItem {
  id: number;
  created_at: string;
  label: Label;
  confidence: number;
  p_real: number;
  p_fake: number;
  inference_ms: number;
  n_chars: number;
  excerpt: string;
  model_name: string;
  has_full_text: boolean;
  full_text?: string | null;
}

export interface Stats {
  total: number;
  fake: number;
  real: number;
  avg_inference_ms: number | null;
  recent: Pick<HistoryItem, "id" | "created_at" | "label" | "confidence" | "excerpt" | "model_name">[];
}

export interface ClassScores { precision: number; recall: number; f1: number; support: number }

export interface Metrics {
  model_name?: string;
  max_len?: number;
  decision_threshold?: number;
  split?: string;
  test?: {
    n_samples: number;
    accuracy: number; precision: number; recall: number; f1: number; roc_auc?: number;
    decision_threshold?: number;
    threshold_optimization?: { threshold?: number; precision?: number; recall?: number; f1?: number };
    confusion_matrix: { tn: number; fp: number; fn: number; tp: number };
    per_class?: Record<Label, ClassScores>;
  };
  validation?: {
    n_samples: number;
    epochs: { epoch: number; loss: number; accuracy: number; precision: number; recall: number; f1: number }[];
  } | null;
}

export interface ModelsMetrics {
  models: Record<ModelKey, Metrics | null>;
}

export interface Health {
  status: string;
  model_loaded: boolean;
  device: string;
  max_len: number;
  error: string | null;
  models: Record<ModelKey, {
    name: string;
    model_dir: string;
    model_loaded: boolean;
    max_len: number;
    error: string | null;
  }>;
}
