export const pct = (x: number, d = 1) => (x * 100).toFixed(d).replace(".", ",") + " %";
export const num = (x: number, d = 2) => x.toFixed(d).replace(".", ",");
export const dt = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
