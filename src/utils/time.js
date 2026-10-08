import { pad } from "./date";

export function minutesToHM(mins) {
  const m = Math.round(mins);
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h === 0) return `${rem}m`;
  if (rem === 0) return `${h}h`;
  return `${h}h ${rem}m`;
}

export function minutesToHours(mins) { return (mins / 60).toFixed(2); }

export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

export function hmToMinutes(hm) { const [h, m] = String(hm).split(":").map(Number); return h * 60 + m; }
