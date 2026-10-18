"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { num, pct } from "@/lib/format";
import type { Metrics, ModelsMetrics, ModelKey } from "@/lib/types";
import { Alert, Kpi, MetricIcon, PageHead, Tag } from "@/components/ui";

const MODEL_KEYS: ModelKey[] = ["xlmr", "arabert"];
const MODEL_LABELS: Record<ModelKey, string> = { xlmr: "XLM-RoBERTa", arabert: "AraBERT" };
const optionalPct = (value?: number) => value == null ? "—" : pct(value, 2);
const optionalNum = (value?: number) => value == null ? "—" : num(value, 2);

function ModelEvaluation({ metrics }: { metrics: Metrics }) {
  const t = metrics.test;
  const v = metrics.validation;
  const cm = t?.confusion_matrix;
  return (
    <section className="card evaluation-model">
      <h2>{metrics.model_name ?? "Modèle"} <Tag kind="test">Test · n = {t?.n_samples ?? "—"}</Tag></h2>
      {t ? (
        <>
          <div className="grid g4">
            <Kpi tone="violet" icon={<MetricIcon name="accuracy" />} label="Accuracy" value={pct(t.accuracy, 2)} />
            <Kpi tone="cyan" icon={<MetricIcon name="precision" />} label="Précision (Fake)" value={pct(t.precision, 2)} />
            <Kpi tone="teal" icon={<MetricIcon name="recall" />} label="Rappel (Fake)" value={pct(t.recall, 2)} />
            <Kpi tone="amber" icon={<MetricIcon name="f1" />} label="F1-score" value={pct(t.f1, 2)} sub={t.roc_auc != null ? `ROC-AUC ${pct(t.roc_auc, 2)}` : undefined} />
          </div>
          <p className="note">Ces métriques et la matrice de confusion reflètent le seuil d'évaluation 0,50 ; le seuil déployé peut différer.</p>
          {t.threshold_optimization && (
            <div className="card threshold-card">
              <h3>Seuil de décision évalué</h3>
              <div className="grid g4">
                <Kpi tone="violet" icon={<MetricIcon name="threshold" />} label="Seuil déployé" value={pct(metrics.decision_threshold ?? t.decision_threshold ?? 0.5, 0)} />
                <Kpi tone="cyan" icon={<MetricIcon name="threshold" />} label="Meilleur seuil" value={optionalNum(t.threshold_optimization.threshold)} />
                <Kpi tone="teal" icon={<MetricIcon name="precision" />} label="Précision au meilleur seuil" value={optionalPct(t.threshold_optimization.precision)} />
                <Kpi tone="amber" icon={<MetricIcon name="recall" />} label="Rappel / F1 au meilleur seuil" value={`${optionalPct(t.threshold_optimization.recall)} / ${optionalPct(t.threshold_optimization.f1)}`} />
              </div>
              <p className="note">Pour AraBERT, le seuil optimal a été sélectionné sur le jeu de test ; ses scores à ce seuil ne sont donc pas une estimation indépendante et peuvent être optimistes.</p>
            </div>
          )}
          <div className="grid g2 evaluation-details">
            {cm && (
              <div className="card">
                <h3>Matrice de confusion (test · seuil 0,50)</h3>
                <div className="cm">
                  <div className="h" /><div className="h">Prédit Real</div><div className="h">Prédit Fake</div>
                  <div className="h">Réel Real</div><div className="good">{cm.tn}<small>vrais négatifs</small></div><div className="bad">{cm.fp}<small>faux positifs</small></div>
                  <div className="h">Réel Fake</div><div className="bad">{cm.fn}<small>faux négatifs</small></div><div className="good">{cm.tp}<small>vrais positifs</small></div>
                </div>
              </div>
            )}
            {t.per_class && (
              <div className="card">
                <h3>Résultats par classe (test)</h3>
                <div className="wrap"><table>
                  <thead><tr><th>Classe</th><th>Précision</th><th>Rappel</th><th>F1</th><th>Support</th></tr></thead>
                  <tbody>{(["real", "fake"] as const).map((key) => (
                    <tr key={key}><td>{key === "real" ? "Real (0)" : "Fake (1)"}</td><td>{num(t.per_class![key].precision)}</td><td>{num(t.per_class![key].recall)}</td><td>{num(t.per_class![key].f1)}</td><td>{t.per_class![key].support}</td></tr>
                  ))}</tbody>
                </table></div>
              </div>
            )}
          </div>
        </>
      ) : <div className="empty">Métriques de test non fournies.</div>}

      {v?.epochs.length ? (
        <div className="card evaluation-details">
          <h3>Jeu de validation <Tag kind="val">Validation · n = {v.n_samples}</Tag></h3>
          <div className="wrap"><table>
            <thead><tr><th>Époque</th><th>Loss</th><th>Accuracy</th><th>Précision</th><th>Rappel</th><th>F1</th></tr></thead>
            <tbody>{v.epochs.map((epoch) => (
              <tr key={epoch.epoch}><td>{epoch.epoch}</td><td>{num(epoch.loss, 3)}</td><td>{num(epoch.accuracy, 3)}</td><td>{num(epoch.precision, 3)}</td><td>{num(epoch.recall, 3)}</td><td>{num(epoch.f1, 3)}</td></tr>
            ))}</tbody>
          </table></div>
          <p className="note">La validation sert à choisir le checkpoint ; elle ne doit pas être comparée aux résultats de test.</p>
        </div>
      ) : <p className="note">Aucune métrique de validation n'est fournie dans les métadonnées de ce modèle.</p>}
    </section>
  );
}

export default function Evaluation() {
  const [data, setData] = useState<ModelsMetrics | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { api.metrics().then(setData).catch((e) => setErr(e.message)); }, []);

  return (
    <>
      <PageHead title="Évaluation des modèles" sub="Comparaison des métriques de test et détails par modèle, à partir des métadonnées d'entraînement." />
      {err && <Alert kind="err">{err} Vérifiez les fichiers <code>metadata.json</code> des deux modèles.</Alert>}
      {!data && !err && <div className="empty">Chargement…</div>}
      {data && (
        <>
          <div className="card">
            <h3>Comparaison sur les jeux de test</h3>
            <div className="wrap"><table>
              <thead><tr><th>Modèle</th><th>Échantillons</th><th>Accuracy</th><th>Précision (Fake)</th><th>Rappel (Fake)</th><th>F1</th><th>ROC-AUC</th></tr></thead>
              <tbody>{MODEL_KEYS.map((key) => {
                const model = data.models[key];
                const test = model?.test;
                return <tr key={key}><td>{model?.model_name ?? MODEL_LABELS[key]}</td><td>{test?.n_samples ?? "—"}</td><td>{test ? pct(test.accuracy, 2) : "—"}</td><td>{test ? pct(test.precision, 2) : "—"}</td><td>{test ? pct(test.recall, 2) : "—"}</td><td>{test ? pct(test.f1, 2) : "—"}</td><td>{test?.roc_auc != null ? pct(test.roc_auc, 2) : "—"}</td></tr>;
              })}</tbody>
            </table></div>
            <p className="note">Les performances sont issues des métriques fournies par chaque entraînement ; les tailles et protocoles de test peuvent différer.</p>
          </div>
          <div className="evaluation-models">
            {MODEL_KEYS.map((key) => data.models[key]
              ? <ModelEvaluation key={key} metrics={data.models[key]} />
              : <div className="card" key={key}><h2>{MODEL_LABELS[key]}</h2><Alert kind="info">Métriques indisponibles pour ce modèle.</Alert></div>)}
          </div>
        </>
      )}
    </>
  );
}
