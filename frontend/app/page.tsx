"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { dt, pct } from "@/lib/format";
import type { ModelsMetrics, Stats } from "@/lib/types";
import { Alert, Kpi, MetricIcon, PageHead, Tag } from "@/components/ui";

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [metrics, setMetrics] = useState<ModelsMetrics | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [metricsMsg, setMetricsMsg] = useState<string | null>(null);

  useEffect(() => {
    api.stats().then(setStats).catch((e) => setErr(e.message));
    api.metrics().then(setMetrics).catch((e) => setMetricsMsg(e.message));
  }, []);

  return (
    <>
      <PageHead title="Dashboard" sub="Vue d'ensemble issue de l'historique réel et des métriques du modèle." />
      {err && <Alert kind="err">{err}</Alert>}
      {stats && (
        <>
          <div className="grid g4">
            <Kpi tone="violet" icon={<MetricIcon name="predictions" />} label="Prédictions enregistrées" value={stats.total} sub="une par modèle sélectionné" />
            <Kpi tone="amber" icon={<MetricIcon name="fake" />} label="Classées Fake" value={stats.fake} sub={stats.total ? pct(stats.fake / stats.total) : "—"} />
            <Kpi tone="teal" icon={<MetricIcon name="real" />} label="Classées Real" value={stats.real} sub={stats.total ? pct(stats.real / stats.total) : "—"} />
            <Kpi tone="cyan" icon={<MetricIcon name="time" />} label="Inférence moyenne" value={stats.avg_inference_ms != null ? `${Math.round(stats.avg_inference_ms)} ms` : "—"} sub="par article" />
          </div>
          <div className="grid g2" style={{ marginTop: 16 }}>
            <div className="card">
              <h3>Répartition des prédictions</h3>
              {stats.total ? (
                <>
                  <div className="donut" style={{ background: `conic-gradient(var(--fake) 0 ${(stats.fake / stats.total) * 100}%, var(--real) 0)` }} />
                  <div className="legend">
                    <span><i className="dot fake" />Fake {stats.fake}</span>
                    <span><i className="dot ok" />Real {stats.real}</span>
                  </div>
                </>
              ) : <div className="empty">Aucune analyse pour le moment.</div>}
            </div>
            <div className="card">
              <h3>Dernières prédictions</h3>
              {stats.recent.length ? stats.recent.map((r) => (
                <div className="line" key={r.id}>
                  <Tag kind={r.label}>{r.label}</Tag>
                  <span className="muted">{r.model_name}</span>
                  <span className="ex" style={{ flex: 1, maxWidth: "none" }}>{r.excerpt}</span>
                  <span className="muted">{pct(r.confidence, 0)} · {dt(r.created_at)}</span>
                </div>
              )) : <div className="empty">Les dernières prédictions apparaîtront ici.</div>}
            </div>
          </div>
        </>
      )}
      {metrics ? (
        <div className="grid g2" style={{ marginTop: 16 }}>
          {(["xlmr", "arabert"] as const).map((key) => {
            const model = metrics.models[key];
            const t = model?.test;
            return (
              <div className="card" key={key}>
                <h3>{model?.model_name ?? (key === "xlmr" ? "XLM-RoBERTa" : "AraBERT")} <Tag kind="test">Test{t ? ` · n = ${t.n_samples}` : ""}</Tag></h3>
                {t ? (
                  <div className="grid g2 metric-kpis">
                    <Kpi className="metric-tile" tone="violet" icon={<MetricIcon name="accuracy" />} label="Accuracy" value={pct(t.accuracy)} />
                    <Kpi className="metric-tile" tone="cyan" icon={<MetricIcon name="precision" />} label="Précision (Fake)" value={pct(t.precision)} />
                    <Kpi className="metric-tile" tone="teal" icon={<MetricIcon name="recall" />} label="Rappel (Fake)" value={pct(t.recall)} />
                    <Kpi className="metric-tile" tone="amber" icon={<MetricIcon name="f1" />} label="F1-score" value={pct(t.f1)} sub={t.roc_auc != null ? `ROC-AUC ${pct(t.roc_auc)}` : undefined} />
                  </div>
                ) : <div className="empty">Métriques indisponibles.</div>}
              </div>
            );
          })}
        </div>
      ) : <div className="card" style={{ marginTop: 16 }}><Alert kind={metricsMsg ? "err" : "info"}>{metricsMsg ?? "Chargement des métriques…"}</Alert></div>}
    </>
  );
}
