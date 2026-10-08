import { toColombo } from "./date";

export function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

export function byLoggedTime(a, b) {
  return new Date(a.createdAt) - new Date(b.createdAt);
}

export function getWorkStartTime(e) {
  if (e.workStart) {
    const t = new Date(`${e.date}T${e.workStart}:00`).getTime();
    if (!isNaN(t)) return t;
  }
  if (e.createdAt) {
    return new Date(e.createdAt).getTime() - (e.minutes || 0) * 60000;
  }
  return 0;
}

export function byWorkStartTime(a, b) {
  const diff = getWorkStartTime(a) - getWorkStartTime(b);
  return diff !== 0 ? diff : byLoggedTime(a, b);
}

export function byLatest(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); }

export function fmtLogged(iso) { return toColombo(iso).slice(0, 16); }

export function fmtStart(e) {
  if (e.workStart) return `${e.date} ${e.workStart}`;
  // older entries: estimate the start as logged time minus duration (same day only)
  if (toColombo(e.createdAt).slice(0, 10) === e.date) {
    const est = toColombo(new Date(new Date(e.createdAt).getTime() - e.minutes * 60000).toISOString());
    if (est.slice(0, 10) === e.date) return `${e.date} ~${est.slice(11, 16)}`;
  }
  return e.date;
}

export function workRange(e) { return e.workStart && e.workEnd ? `${e.workStart} – ${e.workEnd}` : "–"; }

export function sameEntry(a, b) {
  return a.employee === b.employee && a.project === b.project && a.description === b.description &&
    (a.justification || "") === (b.justification || "") &&
    (a.workStart || "") === (b.workStart || "") && (a.workEnd || "") === (b.workEnd || "") &&
    a.date === b.date && a.minutes === b.minutes;
}
