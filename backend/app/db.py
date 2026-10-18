"""Historique des analyses (SQLite). Par défaut, seul un extrait du texte est stocké."""
import sqlite3
import threading
from datetime import datetime, timezone
from typing import Any, Optional

from .config import DB_PATH

_lock = threading.Lock()
DB_PATH.parent.mkdir(parents=True, exist_ok=True)
_conn = sqlite3.connect(DB_PATH, check_same_thread=False)
_conn.row_factory = sqlite3.Row
_conn.execute(
    """CREATE TABLE IF NOT EXISTS predictions(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL,
        label TEXT NOT NULL,
        confidence REAL NOT NULL,
        p_real REAL NOT NULL,
        p_fake REAL NOT NULL,
        inference_ms REAL NOT NULL,
        n_chars INTEGER NOT NULL,
        excerpt TEXT NOT NULL,
        full_text TEXT,
        model_name TEXT NOT NULL DEFAULT 'XLM-RoBERTa'
    )"""
)
if "model_name" not in {row["name"] for row in _conn.execute("PRAGMA table_info(predictions)")}:
    _conn.execute("ALTER TABLE predictions ADD COLUMN model_name TEXT NOT NULL DEFAULT 'XLM-RoBERTa'")
_conn.commit()


def _row(r: sqlite3.Row, with_text: bool) -> dict[str, Any]:
    d = dict(r)
    d["has_full_text"] = d["full_text"] is not None
    if not with_text:
        d.pop("full_text", None)
    return d


def add(pred: dict[str, Any], n_chars: int, excerpt: str, full_text: Optional[str]) -> int:
    with _lock:
        cur = _conn.execute(
            "INSERT INTO predictions(created_at,label,confidence,p_real,p_fake,inference_ms,n_chars,excerpt,full_text,model_name)"
            " VALUES(?,?,?,?,?,?,?,?,?,?)",
            (datetime.now(timezone.utc).isoformat(), pred["label"], pred["confidence"],
             pred["probabilities"]["real"], pred["probabilities"]["fake"], pred["inference_ms"],
             n_chars, excerpt, full_text, pred["model_name"]),
        )
        _conn.commit()
        return int(cur.lastrowid)


def list_items(limit: int, offset: int) -> tuple[int, list[dict[str, Any]]]:
    with _lock:
        total = _conn.execute("SELECT COUNT(*) FROM predictions").fetchone()[0]
        rows = _conn.execute(
            "SELECT * FROM predictions ORDER BY id DESC LIMIT ? OFFSET ?", (limit, offset)
        ).fetchall()
    return total, [_row(r, False) for r in rows]


def get(pid: int) -> Optional[dict[str, Any]]:
    with _lock:
        r = _conn.execute("SELECT * FROM predictions WHERE id=?", (pid,)).fetchone()
    return _row(r, True) if r else None


def delete(pid: int) -> bool:
    with _lock:
        cur = _conn.execute("DELETE FROM predictions WHERE id=?", (pid,))
        _conn.commit()
        return cur.rowcount > 0


def clear() -> int:
    with _lock:
        cur = _conn.execute("DELETE FROM predictions")
        _conn.commit()
        return cur.rowcount


def stats() -> dict[str, Any]:
    with _lock:
        total = _conn.execute("SELECT COUNT(*) FROM predictions").fetchone()[0]
        fake = _conn.execute("SELECT COUNT(*) FROM predictions WHERE label='fake'").fetchone()[0]
        avg = _conn.execute("SELECT AVG(inference_ms) FROM predictions").fetchone()[0]
        recent = _conn.execute(
            "SELECT id,created_at,label,confidence,excerpt,model_name FROM predictions ORDER BY id DESC LIMIT 5"
        ).fetchall()
    return {
        "total": total, "fake": fake, "real": total - fake,
        "avg_inference_ms": avg, "recent": [dict(r) for r in recent],
    }
