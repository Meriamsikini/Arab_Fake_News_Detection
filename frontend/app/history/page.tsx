"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { dt, pct } from "@/lib/format";
import type { HistoryItem } from "@/lib/types";
import { Alert, PageHead, Tag } from "@/components/ui";

const PAGE = 25;

export default function History() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [detail, setDetail] = useState<HistoryItem | null>(null);

  const load = useCallback(async (off: number) => {
    try { const r = await api.history(PAGE, off); setItems(r.items); setTotal(r.total); setErr(null); }
    catch (e) { setErr(e instanceof Error ? e.message : "Erreur"); }
  }, []);
  useEffect(() => { load(offset); }, [offset, load]);

  const remove = async (id: number) => { await api.deleteItem(id).catch((e) => setErr(e.message)); load(offset); };
  const clear = async () => {
    if (!total || !confirm("Supprimer tout l'historique ? Cette action est irréversible.")) return;
    await api.clearHistory().catch((e) => setErr(e.message)); setOffset(0); load(0);
  };
  const open = async (id: number) => { try { setDetail(await api.historyItem(id)); } catch (e) { setErr(e instanceof Error ? e.message : "Erreur"); } };

  return (
    <>
      <PageHead title="Analysis History" sub="Par défaut, seul un extrait de 120 caractères est conservé en base ; le texte complet n'est stocké que sur demande." />
      {err && <Alert kind="err">{err}</Alert>}
      <div className="card">
        <div className="row" style={{ margin: "0 0 14px" }}>
          <span className="muted">{total} analyse{total > 1 ? "s" : ""}</span>
          <button className="btn danger sm" style={{ marginLeft: "auto" }} onClick={clear}>Tout supprimer</button>
        </div>
        {items.length ? (
          <div className="wrap"><table>
            <thead><tr><th>Date</th><th>Modèle</th><th>Extrait</th><th>Prédiction</th><th>Confiance</th><th>Inférence</th><th /></tr></thead>
            <tbody>{items.map((x) => (
              <tr key={x.id}>
                <td>{dt(x.created_at)}</td>
                <td>{x.model_name}</td>
                <td className="ex">{x.excerpt}</td>
                <td><Tag kind={x.label}>{x.label}</Tag></td>
                <td>{pct(x.confidence)}</td>
                <td>{Math.round(x.inference_ms)} ms</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button className="btn ghost sm" onClick={() => open(x.id)}>Détails</button>{" "}
                  <button className="btn danger sm" onClick={() => remove(x.id)}>Suppr.</button>
                </td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : <div className="empty">Aucune analyse enregistrée.</div>}
        {total > PAGE && (
          <div className="row">
            <button className="btn ghost sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>← Précédent</button>
            <button className="btn ghost sm" disabled={offset + PAGE >= total} onClick={() => setOffset(offset + PAGE)}>Suivant →</button>
          </div>
        )}
      </div>

      {detail && (
        <div className="overlay" onClick={() => setDetail(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 12px" }}>Détails de l'analyse #{detail.id}</h2>
            <p className="muted">{detail.model_name}</p>
            <span className={`badge ${detail.label}`} style={{ fontSize: 15 }}>{detail.label.toUpperCase()}</span>
            <div className="meta" style={{ marginTop: 12 }}>
              <span>Confiance <b>{pct(detail.confidence)}</b></span><span>Real <b>{pct(detail.p_real)}</b></span>
              <span>Fake <b>{pct(detail.p_fake)}</b></span><span>Inférence <b>{Math.round(detail.inference_ms)} ms</b></span>
              <span>Longueur <b>{detail.n_chars}</b></span>
            </div>
            <p className="note">{detail.full_text ? "Texte complet :" : "Seul l'extrait a été conservé :"}</p>
            <div className="arabic" dir="rtl">{detail.full_text ?? detail.excerpt}{detail.full_text ? "" : "…"}</div>
            <div className="row"><button className="btn ghost sm" onClick={() => setDetail(null)}>Fermer</button></div>
          </div>
        </div>
      )}
    </>
  );
}
