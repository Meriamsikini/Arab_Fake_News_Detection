import type { ReactNode } from "react";

export function Kpi({ label, value, sub, icon, className = "", tone }: {
  label: string;
  value: ReactNode;
  sub?: string;
  icon?: ReactNode;
  className?: string;
  tone?: "violet" | "cyan" | "teal" | "amber";
}) {
  return (
    <div className={`card kpi ${className}${tone ? ` tone-${tone}` : ""}`}>
      {icon ? <div className="kpi-heading"><div className="l">{label}</div><span className="kpi-icon" aria-hidden="true">{icon}</span></div> : <div className="l">{label}</div>}
      <div className="v">{value}</div>
      {sub && <div className="s">{sub}</div>}
    </div>
  );
}

export function MetricIcon({ name }: { name: "accuracy" | "precision" | "recall" | "f1" | "predictions" | "fake" | "real" | "time" | "threshold" | "samples" }) {
  const paths: Record<typeof name, ReactNode> = {
    accuracy: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><path d="m12 12 5-5" /></>,
    precision: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    recall: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4 4M8.5 10.8h4.6" /></>,
    f1: <><path d="M4 19h16M7 15v-4m5 4V6m5 9V9" /><path d="m5 8 4-3 4 2 6-4" /></>,
    predictions: <><path d="M4 5h16M4 12h16M4 19h16" /><circle cx="7" cy="5" r="1" /><circle cx="7" cy="12" r="1" /><circle cx="7" cy="19" r="1" /></>,
    fake: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 9 6 6m0-6-6 6" /></>,
    real: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
    time: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    threshold: <><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="9" cy="6" r="2" fill="currentColor" stroke="none" /><circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" /><circle cx="11" cy="18" r="2" fill="currentColor" stroke="none" /></>,
    samples: <><path d="M4 19V5m0 14h16" /><path d="m7 15 3-4 3 2 5-7" /><circle cx="7" cy="15" r=".7" fill="currentColor" /><circle cx="10" cy="11" r=".7" fill="currentColor" /><circle cx="13" cy="13" r=".7" fill="currentColor" /></>,
  };
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export function Alert({ kind, children }: { kind: "err" | "info"; children: ReactNode }) {
  return <div className={`alert ${kind}`} role={kind === "err" ? "alert" : "status"}>{children}</div>;
}

export function Tag({ kind, children }: { kind: "val" | "test" | "real" | "fake"; children: ReactNode }) {
  return <span className={`tag ${kind}`}>{children}</span>;
}

export function PageHead({ title, sub }: { title: string; sub: string }) {
  return (<><h1>{title}</h1><p className="sub">{sub}</p></>);
}
