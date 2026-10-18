"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { pct } from "@/lib/format";
import type { ModelKey, ModelPrediction, PredictResponse } from "@/lib/types";
import { Alert, PageHead } from "@/components/ui";

const ARABIC = /[\u0600-\u06FF]/;

export default function Analyzer() {
  const [text, setText] = useState("");
  const [model, setModel] = useState<ModelKey | "both">("xlmr");
  const [save, setSave] = useState(true);
  const [full, setFull] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [res, setRes] = useState<PredictResponse | null>(null);

  const trimmed = text.trim();
  const warn = !trimmed ? null
    : !ARABIC.test(trimmed) ? "Aucun caractère arabe détecté : le modèle a été entraîné sur des articles arabes."
    : trimmed.length < 30 ? "Texte très court : la prédiction sera peu fiable." : null;

  async function analyze() {
    setErr(null); setRes(null);
    if (!trimmed) { setErr("Veuillez saisir le texte d'un article avant de lancer l'analyse."); return; }
    setLoading(true);
    try { setRes(await api.predict(trimmed, model, save, save && full)); }
    catch (e) { setErr(e instanceof Error ? e.message : "Erreur inconnue"); }
    finally { setLoading(false); }
  }

  return (
    <>
      <PageHead title="Fake News Analyzer" sub="Collez un article en arabe pour obtenir la prédiction du modèle." />
      <div className="card">
        <fieldset className="model-picker">
          <legend>Modèle à utiliser</legend>
          {([
            ["xlmr", "XLM-RoBERTa"],
            ["arabert", "AraBERT"],
            ["both", "Comparer les deux"],
          ] as const).map(([value, label]) => (
            <label className="chk" key={value}>
              <input type="radio" name="model" value={value} checked={model === value} onChange={() => setModel(value)} />
              {label}
            </label>
          ))}
        </fieldset>
        <textarea dir="rtl" lang="ar" value={text} onChange={(e) => setText(e.target.value)} placeholder="الصق نص المقال هنا…" />
        <div className="row">
          <button className="btn" onClick={analyze} disabled={loading}>{loading ? "Analyse en cours…" : "Analyser l'article"}</button>
          <button className="btn ghost" onClick={() => { setText(""); setRes(null); setErr(null); }}>Effacer</button>
          <span className="count">{trimmed.length} caractère{trimmed.length > 1 ? "s" : ""}</span>
        </div>
        <div className="row" style={{ fontSize: 14 }}>
          <label className="chk"><input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} /> Enregistrer dans l'historique</label>
          <label className="chk" style={{ opacity: save ? 1 : 0.5 }}>
            <input type="checkbox" checked={full} disabled={!save} onChange={(e) => setFull(e.target.checked)} /> Conserver le texte complet (sinon extrait de 120 caractères)
          </label>
        </div>
        {err && <Alert kind="err">{err}</Alert>}
        {warn && <Alert kind="info">{warn}</Alert>}

        {res?.predictions.map((prediction: ModelPrediction) => (
          <div className="result" key={prediction.model}>
            <h3>{prediction.model_name}</h3>
            <div className="verdict">
              <span className={`badge ${prediction.label}`}>{prediction.label.toUpperCase()}</span>
              <div><div className="muted">Confiance</div><div className="big">{pct(prediction.confidence)}</div></div>
            </div>
            <div style={{ marginTop: 16 }}>
              <div className="split"><span>Real</span><span>{pct(prediction.probabilities.real)}</span></div>
              <div className="bar"><i style={{ width: `${prediction.probabilities.real * 100}%`, background: "var(--real)" }} /></div>
              <div className="split"><span>Fake</span><span>{pct(prediction.probabilities.fake)}</span></div>
              <div className="bar"><i style={{ width: `${prediction.probabilities.fake * 100}%`, background: "var(--fake)" }} /></div>
            </div>
            <div className="meta">
              <span>Temps d'inférence : <b>{Math.round(prediction.inference_ms)} ms</b></span>
              <span>Longueur : <b>{res.n_chars} caractères · {prediction.n_tokens} tokens</b></span>
              <span>Seuil Fake : <b>{pct(prediction.decision_threshold)}</b></span>
            </div>
            {prediction.truncated && <Alert kind="info">L'article dépasse {prediction.max_len} tokens : seul le début a été analysé par le modèle.</Alert>}
            <p className="note">Cette prédiction est un indicateur statistique, pas une vérification factuelle.</p>
          </div>
        ))}
      </div>
    </>
  );
}
