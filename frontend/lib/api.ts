import type { Health, HistoryItem, ModelsMetrics, ModelKey, PredictResponse, Stats } from "./types";

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, { cache: "no-store", ...init });
  } catch {
    throw new ApiError("Impossible de joindre l'API. Le backend FastAPI est-il démarré ?", 0);
  }
  if (!res.ok) {
    let msg = `Erreur ${res.status}`;
    try {
      const body = await res.json();
      const d = body?.detail;
      msg = typeof d === "string" ? d : Array.isArray(d) ? d.map((x) => x.msg).join(" ; ") : msg;
    } catch { /* corps non JSON (ex. proxy en erreur) */ }
    if (res.status === 500 && msg === "Erreur 500") msg = "Le backend est injoignable ou a planté.";
    throw new ApiError(msg, res.status);
  }
  return res.json() as Promise<T>;
}

const json = (body: unknown): RequestInit => ({
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
});

export const api = {
  health: () => req<Health>("/health"),
  predict: (text: string, model: ModelKey | "both", save: boolean, storeFullText: boolean) =>
    req<PredictResponse>("/predict", json({ text, model, save, store_full_text: storeFullText })),
  stats: () => req<Stats>("/stats"),
  metrics: () => req<ModelsMetrics>("/metrics"),
  history: (limit = 50, offset = 0) => req<{ total: number; items: HistoryItem[] }>(`/history?limit=${limit}&offset=${offset}`),
  historyItem: (id: number) => req<HistoryItem>(`/history/${id}`),
  deleteItem: (id: number) => req<{ deleted: number }>(`/history/${id}`, { method: "DELETE" }),
  clearHistory: () => req<{ deleted: number }>("/history", { method: "DELETE" }),
};
