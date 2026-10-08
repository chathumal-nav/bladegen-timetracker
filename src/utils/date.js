export function pad(n) { return String(n).padStart(2, "0"); }

export function ymd(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

export function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfMonth(date) { return new Date(date.getFullYear(), date.getMonth(), 1); }

export function endOfMonth(date) { return new Date(date.getFullYear(), date.getMonth() + 1, 0); }

export function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }

export function fmtDay(d) { return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }); }

export function fmtDayShort(d) { return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }); }

export const LK_TIME = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Colombo",
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit",
  hour12: false,
});

export function toColombo(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return String(iso);
  const p = Object.fromEntries(LK_TIME.formatToParts(d).map((x) => [x.type, x.value]));
  const hh = p.hour === "24" ? "00" : p.hour;
  return `${p.year}-${p.month}-${p.day} ${hh}:${p.minute}:${p.second}`;
}

export function clockHM(iso) { return toColombo(iso).slice(11, 16); }

export const LK_OFFSET_MS = 5.5 * 3600000;
