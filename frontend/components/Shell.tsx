"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import type { Health } from "@/lib/types";

type ThemeMode = "light" | "dark" | "system";

const ITEMS = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/analyzer", label: "Analyzer", icon: "search" },
  { href: "/history", label: "Historique", icon: "history" },
  { href: "/evaluation", label: "Évaluation", icon: "chart" },
] as const;

const ICON_PATHS: Record<string, ReactNode> = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /><path d="M8.5 11h5M11 8.5v5" /></>,
  history: <><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>,
  chart: <><path d="M3 3v18h18" /><path d="m7 14 4-4 4 3 6-7" /></>,
  shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
  chevronLeft: <path d="m14 18-6-6 6-6" />,
  chevronRight: <path d="m10 18 6-6-6-6" />,
  menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
  moon: <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />,
  monitor: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8m-4-4v4" /></>,
  close: <><path d="m18 6-12 12M6 6l12 12" /></>,
};

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{ICON_PATHS[name]}</svg>;
}

export default function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const [health, setHealth] = useState<Health | null>(null);
  const [down, setDown] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [themeReady, setThemeReady] = useState(false);
  const collapsed = !pinned && !hoverExpanded;

  useEffect(() => {
    api.health().then((response) => {
      setHealth(response);
      setDown(false);
    }).catch(() => setDown(true));
  }, [path]);

  useLayoutEffect(() => {
    let savedTheme: ThemeMode = "system";
    try {
      const storedTheme = localStorage.getItem("Fake_News_Detector-theme");
      if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") savedTheme = storedTheme;
    } catch {
      // Keep the in-memory defaults when browser storage is unavailable.
    }
    const resolvedTheme = savedTheme === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : savedTheme;
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.dataset.themeMode = savedTheme;
    setThemeMode(savedTheme);
    setThemeReady(true);
  }, []);

  useEffect(() => {
    if (!themeReady) return;
    const root = document.documentElement;
    const applyTheme = () => {
      const resolved = themeMode === "system"
        ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        : themeMode;
      root.dataset.theme = resolved;
      root.dataset.themeMode = themeMode;
    };
    applyTheme();
    try {
      localStorage.setItem("Fake_News_Detector-theme", themeMode);
    } catch {
      // Theme still works for this session if browser storage is unavailable.
    }
    const preference = window.matchMedia("(prefers-color-scheme: dark)");
    if (themeMode !== "system") return;
    preference.addEventListener("change", applyTheme);
    return () => preference.removeEventListener("change", applyTheme);
  }, [themeMode, themeReady]);

  useEffect(() => {
    setMobileOpen(false);
  }, [path]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const togglePinned = () => setPinned((value) => !value);
  const cycleTheme = () => setThemeMode((mode) => mode === "light" ? "dark" : mode === "dark" ? "system" : "light");
  const themeIcon = themeMode === "light" ? "sun" : themeMode === "dark" ? "moon" : "monitor";
  const themeLabel = themeMode === "light" ? "Thème clair" : themeMode === "dark" ? "Thème sombre" : "Thème système";
  const nextThemeLabel = themeMode === "light" ? "sombre" : themeMode === "dark" ? "système" : "clair";

  const loadedModels = health ? Object.values(health.models).filter((model) => model.model_loaded).length : 0;
  const status = down ? ["err", "API hors ligne"] : !health ? ["", "Connexion…"]
    : loadedModels ? ["ok", `${loadedModels}/2 modèles prêts · ${health.device}`] : ["err", "Modèles indisponibles"];

  return (
    <div className={`app${collapsed ? " is-collapsed" : ""}${mobileOpen ? " mobile-open" : ""}`}>
      <button className="sidebar-backdrop" aria-label="Fermer le menu" onClick={() => setMobileOpen(false)} tabIndex={mobileOpen ? 0 : -1} />
      <aside className="sidebar" aria-label="Navigation principale"
        onPointerEnter={(event) => { if (event.pointerType === "mouse") setHoverExpanded(true); }}
        onPointerLeave={(event) => { if (event.pointerType === "mouse") setHoverExpanded(false); }}>
        <div className="sidebar-brand">
          <Link href="/" className="logo" aria-label="Fake_News_Detector — Dashboard">
            <span className="brand-mark"><Icon name="shield" size={21} /></span>
            <span className="brand-name">Fake_News_Detector</span>
          </Link>
          <button className="icon-button mobile-close" onClick={() => setMobileOpen(false)} aria-label="Fermer le menu"><Icon name="close" /></button>
        </div>
        <div className="nav-caption">ESPACE DE TRAVAIL</div>
        <nav className="side-nav">
          {ITEMS.map((item) => {
            const active = path === item.href;
            return (
              <Link key={item.href} href={item.href} className={`nav-link${active ? " on" : ""}`} aria-current={active ? "page" : undefined} aria-label={collapsed ? item.label : undefined} data-label={item.label} title={collapsed ? item.label : undefined}>
                <Icon name={item.icon} />
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-status">
          <div className="status-heading"><span className={`dot ${status[0]}`} /><span className="nav-label">{status[1]}</span></div>
          {health?.error && <div className="status-error nav-label">{health.error}</div>}
          <span className="model-caption nav-label">XLM-RoBERTa · AraBERT</span>
        </div>
        <button className="collapse-button" onClick={togglePinned} aria-label={pinned ? "Libérer la barre latérale pour qu'elle se replie au survol" : "Garder la barre latérale ouverte"} aria-expanded={!collapsed} title={pinned ? "Libérer la barre latérale" : "Garder la barre latérale ouverte"}>
          <Icon name={pinned ? "chevronLeft" : "chevronRight"} size={18} />
          <span className="nav-label">{pinned ? "Libérer" : "Garder ouverte"}</span>
        </button>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Ouvrir le menu" aria-expanded={mobileOpen}><Icon name="menu" /></button>
          <div className="topbar-context">
            <span className="topbar-eyebrow">Fake_News_Detector</span>
            <span className="topbar-title">{ITEMS.find((item) => item.href === path)?.label ?? "Fake_News_Detector"}</span>
          </div>
          <div className="topbar-actions">
            <span className="topbar-status"><i className={`dot ${status[0]}`} />{status[1]}</span>
            <button className="icon-button theme-toggle" onClick={cycleTheme} aria-label={`${themeLabel} actif. Activer le thème ${nextThemeLabel}.`} title={`${themeLabel} · cliquer pour changer`}><Icon name={themeIcon} /></button>
            <span className="theme-mode-label">{themeMode === "system" ? "Système" : themeMode === "dark" ? "Sombre" : "Clair"}</span>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
