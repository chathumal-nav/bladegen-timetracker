import React, { useState, useEffect, useRef, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Play, Square, Plus, Trash2, Clock, LayoutGrid, BarChart2, Settings, ChevronLeft, ChevronRight, Pencil, Check, X, AlertCircle, Lock, LogOut, Download } from "lucide-react";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const LOGO_SRC = "data:image/png;base64,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";

function pad(n) { return String(n).padStart(2, "0"); }
function ymd(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfMonth(date) { return new Date(date.getFullYear(), date.getMonth(), 1); }
function endOfMonth(date) { return new Date(date.getFullYear(), date.getMonth() + 1, 0); }
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function fmtDay(d) { return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }); }
function fmtDayShort(d) { return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }); }
function minutesToHM(mins) {
  const m = Math.round(mins);
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h === 0) return `${rem}m`;
  if (rem === 0) return `${h}h`;
  return `${h}h ${rem}m`;
}
function minutesToHours(mins) { return (mins / 60).toFixed(2); }
function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

const LK_TIME = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Colombo",
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit",
  hour12: false,
});
function toColombo(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return String(iso);
  const p = Object.fromEntries(LK_TIME.formatToParts(d).map((x) => [x.type, x.value]));
  const hh = p.hour === "24" ? "00" : p.hour;
  return `${p.year}-${p.month}-${p.day} ${hh}:${p.minute}:${p.second}`;
}

function byLoggedTime(a, b) {
  return new Date(a.createdAt) - new Date(b.createdAt);
}

function csvCell(v) {
  let s = String(v ?? "");
  // stop spreadsheet apps from treating text as a formula
  if (typeof v === "string" && /^[=+\-@]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function downloadCSV(filename, rows) {
  const csv = "\uFEFF" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const CHART_COLORS = ["#3547E0", "#C9821F", "#2E9E6B", "#C23B3B", "#7A4FD1", "#16A3B8", "#D1569A", "#6B7280", "#9AAE2A", "#E0742F"];

function drawChart({ title, categories, series, stacked = false }) {
  const scale = 2;
  const W = Math.min(1600, Math.max(760, categories.length * (stacked ? 70 : series.length * 26 + 20) + 120));
  const probe = document.createElement("canvas").getContext("2d");
  probe.font = "12px Arial";

  // legend layout (wraps onto several lines if needed)
  let lx = 0, ly = 0;
  const legend = series.map((s) => {
    const w = probe.measureText(s.name).width + 34;
    if (lx + w > W - 60) { lx = 0; ly += 20; }
    const item = { x: lx, y: ly };
    lx += w;
    return item;
  });
  const legendH = ly + 24;

  const top = 50, left = 56, right = 20, plotH = 280, bottom = 90 + legendH;
  const H = top + plotH + bottom;
  const plotW = W - left - right;

  const c = document.createElement("canvas");
  c.width = W * scale; c.height = H * scale;
  const ctx = c.getContext("2d");
  ctx.scale(scale, scale);
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#12163E"; ctx.font = "bold 15px Arial"; ctx.textAlign = "left";
  ctx.fillText(title, left, 28);

  // y scale
  const totals = stacked
    ? categories.map((_, i) => series.reduce((s, se) => s + (se.values[i] || 0), 0))
    : series.flatMap((se) => se.values);
  const maxV = Math.max(...totals, 0.01);
  const raw = maxV / 5, mag = 10 ** Math.floor(Math.log10(raw)), norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const yMax = Math.ceil(maxV / step) * step;
  const yPos = (v) => top + plotH - (v / yMax) * plotH;

  ctx.font = "11px Arial"; ctx.textAlign = "right"; ctx.strokeStyle = "#E2E5F0"; ctx.lineWidth = 1;
  for (let v = 0; v <= yMax + 1e-9; v += step) {
    ctx.beginPath(); ctx.moveTo(left, yPos(v)); ctx.lineTo(left + plotW, yPos(v)); ctx.stroke();
    ctx.fillStyle = "#5B5F82"; ctx.fillText(String(Number(v.toFixed(2))), left - 8, yPos(v) + 4);
  }

  // bars
  const groupW = plotW / categories.length;
  categories.forEach((cat, i) => {
    const gx = left + i * groupW;
    if (stacked) {
      const bw = groupW * 0.6;
      let acc = 0;
      series.forEach((se, si) => {
        const v = se.values[i] || 0;
        if (v <= 0) return;
        ctx.fillStyle = CHART_COLORS[si % CHART_COLORS.length];
        ctx.fillRect(gx + (groupW - bw) / 2, yPos(acc + v), bw, yPos(acc) - yPos(acc + v));
        acc += v;
      });
    } else {
      const bw = (groupW * 0.8) / series.length;
      series.forEach((se, si) => {
        const v = se.values[i] || 0;
        if (v <= 0) return;
        ctx.fillStyle = CHART_COLORS[si % CHART_COLORS.length];
        ctx.fillRect(gx + groupW * 0.1 + si * bw, yPos(v), bw - 1, yPos(0) - yPos(v));
      });
    }
    // x label
    const label = cat.length > 14 ? cat.slice(0, 13) + "…" : cat;
    ctx.save();
    ctx.translate(gx + groupW / 2, top + plotH + 14);
    ctx.fillStyle = "#12163E"; ctx.font = "11px Arial";
    if (groupW < 80) { ctx.rotate(-Math.PI / 4); ctx.textAlign = "right"; } else { ctx.textAlign = "center"; }
    ctx.fillText(label, 0, 0);
    ctx.restore();
  });

  // legend
  const legendTop = top + plotH + 80;
  ctx.font = "12px Arial"; ctx.textAlign = "left";
  series.forEach((se, si) => {
    const p = legend[si];
    ctx.fillStyle = CHART_COLORS[si % CHART_COLORS.length];
    ctx.fillRect(left + p.x, legendTop + p.y, 12, 12);
    ctx.fillStyle = "#12163E";
    ctx.fillText(se.name, left + p.x + 18, legendTop + p.y + 11);
  });

  return { url: c.toDataURL("image/png"), width: W, height: H };
}

async function downloadXlsx(filename, rows) {
  const mod = await import("exceljs");
  const ExcelJS = mod.default || mod;
  const wb = new ExcelJS.Workbook();
  const toHours = (m) => Number((m / 60).toFixed(2));
  const styleHeader = (row) => {
    row.font = { bold: true, color: { argb: "FFFFFFFF" } };
    row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3547E0" } };
  };

  const employees = [...new Set(rows.map((r) => r.employee))].sort((a, b) => a.localeCompare(b));
  const projects = [...new Set(rows.map((r) => r.project))].sort((a, b) => a.localeCompare(b));
  const dates = [...new Set(rows.map((r) => r.date))].sort();

  // Sheet 1: raw entries
  const s1 = wb.addWorksheet("Entries");
  s1.columns = [
    { header: "Date", key: "date", width: 12 },
    { header: "Employee", key: "employee", width: 16 },
    { header: "Project", key: "project", width: 22 },
    { header: "Description", key: "description", width: 32 },
    { header: "Minutes", key: "minutes", width: 10 },
    { header: "Hours", key: "hours", width: 10, style: { numFmt: "0.00" } },
    { header: "Logged at", key: "createdAt", width: 26 },
  ];
  rows.forEach((e) => s1.addRow({ date: e.date, employee: e.employee, project: e.project, description: e.description || "", minutes: e.minutes, hours: toHours(e.minutes), createdAt: toColombo(e.createdAt) }));
  styleHeader(s1.getRow(1));

  // Sheet 2: hours per employee per project
  const s2 = wb.addWorksheet("Hours by Project");
  s2.columns = [{ width: 18 }, ...projects.map(() => ({ width: 16, style: { numFmt: "0.00" } })), { width: 12, style: { numFmt: "0.00" } }];
  styleHeader(s2.addRow(["Employee", ...projects, "Total"]));
  const projSeries = projects.map((p) => ({ name: p, values: [] }));
  employees.forEach((emp) => {
    const vals = projects.map((p) => toHours(rows.filter((r) => r.employee === emp && r.project === p).reduce((s, r) => s + r.minutes, 0)));
    vals.forEach((v, i) => projSeries[i].values.push(v));
    s2.addRow([emp, ...vals, Number(vals.reduce((a, b) => a + b, 0).toFixed(2))]);
  });
  const c2 = drawChart({ title: "Hours by employee and project", categories: employees, series: projSeries, stacked: true });
  s2.addImage(wb.addImage({ base64: c2.url, extension: "png" }), { tl: { col: 0, row: employees.length + 3 }, ext: { width: c2.width, height: c2.height } });

  // Sheet 3: daily totals per employee
  const s3 = wb.addWorksheet("Daily Totals");
  s3.columns = [{ width: 14 }, ...employees.map(() => ({ width: 14, style: { numFmt: "0.00" } })), { width: 12, style: { numFmt: "0.00" } }];
  styleHeader(s3.addRow(["Date", ...employees, "Total"]));
  const empSeries = employees.map((e) => ({ name: e, values: [] }));
  dates.forEach((d) => {
    const vals = employees.map((emp) => toHours(rows.filter((r) => r.date === d && r.employee === emp).reduce((s, r) => s + r.minutes, 0)));
    vals.forEach((v, i) => empSeries[i].values.push(v));
    s3.addRow([d, ...vals, Number(vals.reduce((a, b) => a + b, 0).toFixed(2))]);
  });
  const c3 = drawChart({ title: "Daily hours per employee", categories: dates, series: empSeries, stacked: false });
  s3.addImage(wb.addImage({ base64: c3.url, extension: "png" }), { tl: { col: 0, row: dates.length + 3 }, ext: { width: c3.width, height: c3.height } });

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

const DEFAULT_EMPLOYEES = ["Kusan", "Udula", "Chathumal", "Vishva", "Ranindu", "Hansama", "Devin", "Nethum", "Nithmi", "Sadeesh", "Vohara", "Thulani"];

async function loadStore(key, shared, fallback) {
  try {
    const res = await window.storage.get(key, shared);
    const parsed = res ? JSON.parse(res.value) : fallback;
    console.log(`[load] ${key} (shared=${shared})`, Array.isArray(parsed) ? `${parsed.length} items` : "", parsed);
    return parsed;
  } catch (e) {
    console.warn(`[load] ${key} failed or not found, using fallback`, e);
    return fallback;
  }
}
async function saveStore(key, shared, value) {
  try {
    await window.storage.set(key, JSON.stringify(value), shared);
  } catch (e) {
    console.error("storage save failed", key, e);
  }
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');

.ldg {
  --paper: #F4F6FB;
  --card: #FFFFFF;
  --ink: #12163E;
  --ink-soft: #5B5F82;
  --ink-faint: #9498B8;
  --line: #E2E5F0;
  --brand: #3547E0;
  --brand-deep: #1E2899;
  --brand-tint: #EAEDFC;
  --amber: #C9821F;
  --amber-tint: #FBEEDC;
  --brick: #C23B3B;
  --brick-tint: #FBEAEA;
  color-scheme: light;
  font-family: 'Inter', sans-serif;
  color: var(--ink);
  background-color: var(--paper);
  min-height: 100%;
}
.ldg * { box-sizing: border-box; }
.ldg h1, .ldg h2, .ldg h3, .ldg .disp { font-family: 'Space Grotesk', sans-serif; letter-spacing: -0.01em; }
.ldg .mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
.ldg button { font-family: inherit; cursor: pointer; }
.ldg input, .ldg select, .ldg textarea { font-family: inherit; }
.ldg .card { background: var(--card); border: 1px solid var(--line); border-radius: 10px; }
.ldg .btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px; border-radius: 8px; border: 1px solid var(--line);
  background: var(--card); color: var(--ink); font-size: 13px; font-weight: 500;
  transition: background 0.12s, border-color 0.12s;
}

.ldg { width: 100%; min-height: 100vh; min-height: 100dvh; }
.ldg-wrap {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: clamp(12px, 3vw, 32px);
}
.ldg .app-logo { 
height: clamp(44px, 6vw, 72px); width: auto; display: block; 
}
.ldg .timer-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
  margin-top: 16px;
}
.ldg .timer-digits { font-size: clamp(32px, 9vw, 52px); }
@media (max-width: 720px) {
  .ldg .btn { padding: 9px 12px; }
  .ldg .field { font-size: 16px; } /* stops iPhone zoom-on-focus */
}

.ldg .btn:hover { border-color: var(--ink-faint); }
.ldg .btn:focus-visible { outline: 2px solid var(--brand); outline-offset: 1px; }
.ldg .btn-primary { background: var(--brand); color: #F3F7F5; border-color: var(--brand); }
.ldg .btn-primary:hover { background: var(--brand-deep); border-color: var(--brand-deep); }
.ldg .btn-danger { background: var(--card); color: var(--brick); border-color: var(--brick-tint); }
.ldg .btn-danger:hover { background: var(--brick-tint); }
.ldg .btn:disabled { opacity: 0.45; cursor: not-allowed; }
.ldg .field {
  padding: 8px 10px; border-radius: 8px; border: 1px solid var(--line);
  background: #fff; color: var(--ink); font-size: 13px; width: 100%;
}
.ldg .field:focus-visible, .ldg .field:focus { outline: 2px solid var(--brand); outline-offset: 0px; border-color: var(--brand); }
.ldg .tab {
  display: flex; align-items: center; gap: 7px; padding: 9px 14px; border-radius: 8px;
  font-size: 13px; font-weight: 500; color: var(--ink-soft); border: 1px solid transparent;
}
.ldg .tab.active { background: var(--brand-tint); color: var(--brand-deep); border-color: var(--brand); }
.ldg .tab:hover:not(.active) { background: #ffffff80; color: var(--ink); }
.ldg .stamp-card { position: relative; border: 1px solid var(--line); border-radius: 14px; background: var(--card); overflow: hidden; }
.ldg .stamp-card > * { position: relative; z-index: 1; }
.ldg .stamp-card::before {
  content: ""; position: absolute; top: -28px; right: -28px; width: 90px; height: 90px;
  border-radius: 50%; border: 10px solid var(--brand-tint); pointer-events: none; z-index: 0;
}
.ldg .stamp-card::after {
  content: ""; position: absolute; top: 4px; right: 52px; width: 10px; height: 10px;
  border-radius: 50%; background: var(--brand-tint); pointer-events: none; z-index: 0;
}
.ldg .stamp-card .timer-digits,
.ldg .stamp-card .timer-label { text-align: center; }

.ldg .rec-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--brick); animation: ldg-pulse 1.6s ease-in-out infinite; }
@keyframes ldg-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
.ldg table { border-collapse: collapse; width: 100%; font-size: 13px; }
.ldg th { text-align: left; font-weight: 500; color: var(--ink-soft); font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; padding: 8px 10px; border-bottom: 1px solid var(--line); }
.ldg td { padding: 9px 10px; border-bottom: 1px solid var(--line); }
.ldg tr:last-child td { border-bottom: none; }
.ldg .grid-cell { border: 1px solid var(--line); border-radius: 6px; min-height: 44px; display: flex; align-items: center; justify-content: center; position: relative; background: #fff; }
.ldg .scrollx { overflow-x: auto; }
.ldg .pin-dot { width: 12px; height: 12px; border-radius: 50%; border: 1.5px solid var(--ink-faint); }
.ldg .pin-dot.filled { background: var(--brand); border-color: var(--brand); }
@media (max-width: 720px) {
  .ldg .hide-mobile { display: none; }
}
`;

function useShared(key, fallback) {
  const [value, setValue] = useState(fallback);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let mounted = true;
    loadStore(key, true, fallback).then((v) => { if (mounted) { setValue(v); setReady(true); } });
    return () => { mounted = false; };
  }, []);
  const persist = async (next) => {
    setValue(next);
    await saveStore(key, true, next);
  };
  return [value, persist, ready];
}

function sameEntry(a, b) {
  return a.employee === b.employee && a.project === b.project && a.description === b.description &&
    a.date === b.date && a.minutes === b.minutes;
}

function useEntries() {
  const [entries, setLocal] = useState([]);
  const [ready, setReady] = useState(false);
  const ref = useRef([]);

  useEffect(() => {
    let mounted = true;
    window.timeEntries.list()
      .then((list) => {
        if (!mounted) return;
        console.log(`[load] time_entries: ${list.length} rows`);
        ref.current = list; setLocal(list); setReady(true);
      })
      .catch((err) => {
        console.error("[load] time_entries failed", err);
        if (mounted) setReady(true);
      });
    return () => { mounted = false; };
  }, []);

  // Same call style as before: setEntries(nextArray). It saves only the differences.
  const persist = async (next) => {
    const prev = ref.current;
    const prevMap = new Map(prev.map((e) => [e.id, e]));
    const nextIds = new Set(next.map((e) => e.id));
    const upserts = next.filter((e) => { const p = prevMap.get(e.id); return !p || !sameEntry(p, e); });
    const removedIds = prev.filter((e) => !nextIds.has(e.id)).map((e) => e.id);

    ref.current = next; setLocal(next);
    try {
      await window.timeEntries.upsert(upserts);
      await window.timeEntries.remove(removedIds);
    } catch (err) {
      console.error("[save] time_entries failed", err);
      ref.current = prev; setLocal(prev);
      alert("Could not save to the database. Your change was not stored. Please try again.");
    }
  };

  return [entries, persist, ready];
}

export default function App() {
  const [employees, setEmployees, employeesReady] = useShared("team-employees", []);
  const [entries, setEntries, entriesReady] = useEntries();
  const [runningTimers, setRunningTimers, timersReady] = useShared("timers-running", {});
  const [adminPin, setAdminPinState] = useState("");
  const [adminPinLoaded, setAdminPinLoaded] = useState(false);
  const [me, setMe] = useState("");
  const [meReady, setMeReady] = useState(false);
  const [isAdmin, setIsAdminState] = useState(false);
  const [adminReady, setAdminReady] = useState(false);
  const [tab, setTab] = useState("timer");
  const [now, setNow] = useState(Date.now());

  async function setAdminPin(pin) {
    setAdminPinState(pin);
    await saveStore("admin-pin", true, pin);
  }

  useEffect(() => {
    loadStore("last-employee", false, "").then((v) => { setMe(v || ""); setMeReady(true); });
    loadStore("is-admin-device", false, false).then((v) => { setIsAdminState(!!v); setAdminReady(true); });
    loadStore("admin-pin", true, "").then(async (v) => {
      if (v) { setAdminPinState(v); } else { await saveStore("admin-pin", true, "kusan4321"); setAdminPinState("kusan4321"); }
      setAdminPinLoaded(true);
    });
  }, []);

  async function grantAdmin() {
    setIsAdminState(true);
    await saveStore("is-admin-device", false, true);
  }
  async function revokeAdmin() {
    setIsAdminState(false);
    await saveStore("is-admin-device", false, false);
  }

  useEffect(() => {
    if (employeesReady && employees.length === 0) {
      setEmployees(DEFAULT_EMPLOYEES);
    }
  }, [employeesReady]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (meReady && me && employees.length && !employees.includes(me)) {
      // previously selected employee no longer exists
      setMe("");
      saveStore("last-employee", false, "");
    }
  }, [employees, meReady]);

  const allReady = employeesReady && entriesReady && timersReady && meReady && adminPinLoaded && adminReady;

  function chooseMe(name) {
    setMe(name);
    saveStore("last-employee", false, name);
  }

  const projectSuggestions = useMemo(() => {
    const set = new Set();
    entries.forEach((e) => { if (e.project) set.add(e.project); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [entries]);

  if (!allReady) {
    return (
      <div className="ldg" style={{ padding: "3rem 1rem", textAlign: "center" }}>
        <style>{CSS}</style>
        <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>Loading ledger…</p>
      </div>
    );
  }

  return (
    <div className="ldg">
  <style>{CSS}</style>
  <div className="ldg-wrap">

      <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
        <div>
          <img src={LOGO_SRC} alt="BladeGen" className="app-logo" />
          <p style={{ margin: "6px 0 0", fontSize: 18, fontFamily: "var(--font-heading)", color: "var(--ink-soft)", fontWeight: "800" }}>Team time tracking</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <label style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-faint)", fontWeight: "600" }}>You are</label>
          <select className="field" style={{ width: 190 }} value={me} onChange={(e) => chooseMe(e.target.value)}>
            <option value="">Select your name…</option>
            {employees.map((emp) => <option key={emp} value={emp}>{emp}</option>)}
          </select>
        </div>
      </header>

      <nav style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        <TabBtn icon={<Clock size={15} />} label="Timer" active={tab === "timer"} onClick={() => setTab("timer")} />
        <TabBtn icon={<LayoutGrid size={15} />} label="Timesheet" active={tab === "timesheet"} onClick={() => setTab("timesheet")} />
        <TabBtn icon={<BarChart2 size={15} />} label="Reports" active={tab === "reports"} onClick={() => setTab("reports")} />
        <TabBtn icon={isAdmin ? <Settings size={15} /> : <Lock size={13} />} label="Admin" active={tab === "admin"} onClick={() => setTab("admin")} />
      </nav>

      {tab === "timer" && (
        <TimerTab
          me={me} employees={employees} entries={entries} setEntries={setEntries}
          runningTimers={runningTimers} setRunningTimers={setRunningTimers}
          now={now} projectSuggestions={projectSuggestions}
        />
      )}
      {tab === "timesheet" && (
        <TimesheetTab me={me} employees={employees} entries={entries} setEntries={setEntries} projectSuggestions={projectSuggestions} />
      )}
      {tab === "reports" && (
        <ReportsTab employees={employees} entries={isAdmin ? entries : entries.filter((e) => e.employee === me)} isAdmin={isAdmin} me={me} />
      )}
      {tab === "admin" && (
        isAdmin ? (
          <AdminTab employees={employees} setEmployees={setEmployees} entries={entries} setEntries={setEntries}
            runningTimers={runningTimers} setRunningTimers={setRunningTimers} me={me} setMeName={chooseMe}
            adminPin={adminPin} setAdminPin={setAdminPin} onSignOut={revokeAdmin} />
        ) : (
          <PinGate adminPin={adminPin} setAdminPin={setAdminPin} onUnlock={grantAdmin} />
        )
      )}
    </div>
  </div>
  );
}

function PinGate({ adminPin, setAdminPin, onUnlock }) {
  const [input, setInput] = useState("");
  const [confirmInput, setConfirmInput] = useState("");
  const [error, setError] = useState("");
  const isSetup = !adminPin;

  async function submit() {
    if (isSetup) {
      if (input.trim().length < 4) { setError("Choose a PIN of at least 4 digits."); return; }
      if (input !== confirmInput) { setError("PINs don't match."); return; }
      await setAdminPin(input.trim());
      onUnlock();
    } else {
      if (input === adminPin) {
        setError("");
        onUnlock();
      } else {
        setError("Incorrect PIN.");
        setInput("");
      }
    }
  }

  return (
    <div className="card" style={{ padding: 28, maxWidth: 340, margin: "0 auto", textAlign: "center" }}>
      <Lock size={20} style={{ color: "var(--ink-soft)" }} />
      <h3 style={{ fontSize: 15, margin: "10px 0 4px" }}>{isSetup ? "Set an admin PIN" : "Admin access"}</h3>
      <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "0 0 16px" }}>
        {isSetup ? "This unlocks everyone's hours and team settings. Keep it between admins." : "Enter the team's admin PIN to view everyone's hours and manage the roster."}
      </p>
      <input
        type="password" inputMode="text" className="field" placeholder="Password" value={input}
        onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !isSetup && submit()}
        style={{ textAlign: "center", letterSpacing: "0.2em" }}
      />
      {isSetup && (
        <input
          type="password" inputMode="text" className="field" placeholder="Confirm Password" value={confirmInput}
          onChange={(e) => setConfirmInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()}
          style={{ textAlign: "center", letterSpacing: "0.2em", marginTop: 8 }}
        />
      )}
      {error && <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center", color: "var(--brick)", fontSize: 12.5, marginTop: 8 }}><AlertCircle size={14} />{error}</div>}
      <button className="btn btn-primary" style={{ marginTop: 14, width: "100%", justifyContent: "center" }} onClick={submit}>
        {isSetup ? "Set PIN and continue" : "Unlock"}
      </button>
    </div>
  );
}

function TabBtn({ icon, label, active, onClick }) {
  return (
    <button className={`tab${active ? " active" : ""}`} onClick={onClick}>
      {icon}{label}
    </button>
  );
}

function TimerTab({ me, employees, entries, setEntries, runningTimers, setRunningTimers, now, projectSuggestions }) {
  const [project, setProject] = useState("");
  const [description, setDescription] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [manualDate, setManualDate] = useState(ymd(new Date()));
  const [manualProject, setManualProject] = useState("");
  const [manualDesc, setManualDesc] = useState("");
  const [manualHours, setManualHours] = useState("");
  const [manualMinutes, setManualMinutes] = useState("");
  const [error, setError] = useState("");

  if (employees.length === 0) {
    return (
      <EmptyState title="Add your team first" body="There's no one on the roster yet. Go to Admin to add teammates, then come back here to start tracking time." />
    );
  }
  if (!me) {
    return <EmptyState title="Select your name" body="Pick who you are from the dropdown above to start tracking time." />;
  }

  const myTimer = runningTimers[me];
  const elapsedSec = myTimer ? (now - new Date(myTimer.startTime).getTime()) / 1000 : 0;

  async function startTimer() {
    if (!project.trim()) { setError("Enter a project before starting the timer."); return; }
    setError("");
    const next = { ...runningTimers, [me]: { project: project.trim(), description: description.trim(), startTime: new Date().toISOString() } };
    await setRunningTimers(next);
  }
  async function stopTimer() {
    const t = runningTimers[me];
    if (!t) return;
    const startMs = new Date(t.startTime).getTime();
    const minutes = Math.max(1, Math.round((Date.now() - startMs) / 60000));
    const entry = { id: uid(), employee: me, project: t.project, description: t.description, date: ymd(new Date(t.startTime)), minutes, createdAt: new Date().toISOString() };
    const nextTimers = { ...runningTimers };
    delete nextTimers[me];
    await setEntries([entry, ...entries]);
    await setRunningTimers(nextTimers);
    setProject(""); setDescription("");
  }
  async function discardTimer() {
    const nextTimers = { ...runningTimers };
    delete nextTimers[me];
    await setRunningTimers(nextTimers);
  }

  async function addManual() {
    const h = parseFloat(manualHours || "0");
    const m = parseFloat(manualMinutes || "0");
    const totalMinutes = Math.round((isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m));
    if (!manualProject.trim()) { setError("Enter a project for the manual entry."); return; }
    if (totalMinutes <= 0) { setError("Enter a duration greater than zero."); return; }
    setError("");
    const entry = { id: uid(), employee: me, project: manualProject.trim(), description: manualDesc.trim(), date: manualDate, minutes: totalMinutes, createdAt: new Date().toISOString() };
    await setEntries([entry, ...entries]);
    setManualProject(""); setManualDesc(""); setManualHours(""); setManualMinutes(""); setManualOpen(false);
  }

  const others = Object.entries(runningTimers).filter(([emp]) => emp !== me);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 18 }}>
      <div className="stamp-card" style={{ padding: 50 }}>
        {myTimer ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 }}>
              <span className="rec-dot" />
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--brick)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Recording</span>
            </div>
            <div className="mono timer-digits" style={{ fontWeight: 600, lineHeight: 1 }}>{formatClock(elapsedSec)}</div>
            <div style={{ marginTop: 10, fontSize: 14, fontWeight: 500, textAlign: "center" }}>{myTimer.project}</div>
{myTimer.description && <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 2, textAlign: "center" }}>{myTimer.description}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "center" }}>
              <button className="btn btn-primary" onClick={stopTimer}><Square size={14} />Stop and save</button>
              <button className="btn" onClick={discardTimer}><X size={14} />Discard</button>
            </div>
          </div>
        ) : (
          <div>
            <div className="timer-label" style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Ready to track</div>
            <div className="mono timer-digits" style={{ fontWeight: 600, lineHeight: 1, color: "var(--ink-faint)" }}>00:00:00</div>
            <div className="timer-fields">
              <div>
                <label style={{ fontSize: 11, color: "var(--ink-soft)" }}>Project</label>
                <input className="field" list="proj-suggestions" placeholder="What project are you working on?" value={project} onChange={(e) => setProject(e.target.value)} style={{ marginTop: 4 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "var(--ink-soft)" }}>Description (optional)</label>
                <input className="field" placeholder="What are you working on" value={description} onChange={(e) => setDescription(e.target.value)} style={{ marginTop: 4 }} />
              </div>
            </div>
            <datalist id="proj-suggestions">
              {projectSuggestions.map((p) => <option key={p} value={p} />)}
            </datalist>
            {error && <div style={{ display: "flex", gap: 6, alignItems: "center", color: "var(--brick)", fontSize: 12.5, marginTop: 8 }}><AlertCircle size={14} />{error}</div>}
            <div style={{ display: "flex", justifyContent: "center" }}>
  <button className="btn btn-primary" style={{ marginTop: 40 }} onClick={startTimer}><Play size={14} />Start timer</button>
</div>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 40 }}>
        <button className="btn" onClick={() => setManualOpen((v) => !v)}><Plus size={14} />Add time manually</button>
        {manualOpen && (
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
            <div><label style={{ fontSize: 11, color: "var(--ink-soft)" }}>Date</label><input type="date" className="field" value={manualDate} onChange={(e) => setManualDate(e.target.value)} style={{ marginTop: 4 }} /></div>
            <div><label style={{ fontSize: 11, color: "var(--ink-soft)" }}>Project</label><input className="field" list="proj-suggestions" value={manualProject} onChange={(e) => setManualProject(e.target.value)} style={{ marginTop: 4 }} /></div>
            <div><label style={{ fontSize: 11, color: "var(--ink-soft)" }}>Hours</label><input type="number" min="0" className="field" value={manualHours} onChange={(e) => setManualHours(e.target.value)} style={{ marginTop: 4 }} /></div>
            <div><label style={{ fontSize: 11, color: "var(--ink-soft)" }}>Minutes</label><input type="number" min="0" max="59" className="field" value={manualMinutes} onChange={(e) => setManualMinutes(e.target.value)} style={{ marginTop: 4 }} /></div>
            <div style={{ gridColumn: "1 / -1" }}><label style={{ fontSize: 11, color: "var(--ink-soft)" }}>Description (optional)</label><input className="field" value={manualDesc} onChange={(e) => setManualDesc(e.target.value)} style={{ marginTop: 4 }} /></div>
            {error && <div style={{ gridColumn: "1 / -1", display: "flex", gap: 6, alignItems: "center", color: "var(--brick)", fontSize: 12.5 }}><AlertCircle size={14} />{error}</div>}
            <div style={{ gridColumn: "1 / -1" }}><button className="btn btn-primary" onClick={addManual}><Check size={14} />Add entry</button></div>
          </div>
        )}
      </div>

      {others.length > 0 && (
        <div className="card" style={{ padding: 40, paddingLeft:50, paddingRight: 100 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Currently tracking</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {others.map(([emp, t]) => (
              <div key={emp} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                <span><strong style={{ fontWeight: 500 }}>{emp}</strong> <span style={{ color: "var(--ink-soft)" }}>· {t.project}</span></span>
                <span className="mono" style={{ color: "var(--amber)" }}>{formatClock((now - new Date(t.startTime).getTime()) / 1000)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TimesheetTab({ me, employees, entries, setEntries, projectSuggestions }) {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [addOpen, setAddOpen] = useState(false);
  const [addDay, setAddDay] = useState(0);
  const [addProject, setAddProject] = useState("");
  const [addHours, setAddHours] = useState("");
  const [error, setError] = useState("");

  if (employees.length === 0) return <EmptyState title="Add your team first" body="Go to Admin to add teammates before viewing timesheets." />;
  if (!me) return <EmptyState title="Select your name" body="Pick who you are from the dropdown above to see your timesheet." />;

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dayKeys = days.map(ymd);

  const weekEntries = entries.filter((e) => e.employee === me && dayKeys.includes(e.date));
  const projects = Array.from(new Set(weekEntries.map((e) => e.project))).sort((a, b) => a.localeCompare(b));

  const grid = {};
  projects.forEach((p) => { grid[p] = {}; dayKeys.forEach((k) => (grid[p][k] = 0)); });
  weekEntries.forEach((e) => { grid[e.project][e.date] = (grid[e.project][e.date] || 0) + e.minutes; });

  const dayTotals = dayKeys.map((k) => weekEntries.filter((e) => e.date === k).reduce((s, e) => s + e.minutes, 0));
  const grandTotal = dayTotals.reduce((s, m) => s + m, 0);

  async function quickAdd() {
    const h = parseFloat(addHours || "0");
    const mins = Math.round((isNaN(h) ? 0 : h) * 60);
    if (!addProject.trim()) { setError("Enter a project."); return; }
    if (mins <= 0) { setError("Enter hours greater than zero."); return; }
    setError("");
    const entry = { id: uid(), employee: me, project: addProject.trim(), description: "", date: dayKeys[addDay], minutes: mins, createdAt: new Date().toISOString() };
    await setEntries([entry, ...entries]);
    setAddProject(""); setAddHours(""); setAddOpen(false);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="btn" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft size={14} /></button>
          <span style={{ fontSize: 13.5, fontWeight: 500 }}>{fmtDayShort(days[0])} – {fmtDayShort(days[6])}</span>
          <button className="btn" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight size={14} /></button>
          <button className="btn" onClick={() => setWeekStart(startOfWeek(new Date()))}>This week</button>
        </div>
        <button className="btn btn-primary" onClick={() => setAddOpen((v) => !v)}><Plus size={14} />Add hours</button>
      </div>

      {addOpen && (
        <div className="card" style={{ padding: 14, marginBottom: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10, alignItems: "end" }}>
          <div><label style={{ fontSize: 11, color: "var(--ink-soft)" }}>Day</label>
            <select className="field" value={addDay} onChange={(e) => setAddDay(Number(e.target.value))} style={{ marginTop: 4 }}>
              {days.map((d, i) => <option key={i} value={i}>{fmtDay(d)}</option>)}
            </select>
          </div>
          <div><label style={{ fontSize: 11, color: "var(--ink-soft)" }}>Project</label>
            <input className="field" list="proj-suggestions-ts" value={addProject} onChange={(e) => setAddProject(e.target.value)} style={{ marginTop: 4 }} />
            <datalist id="proj-suggestions-ts">{projectSuggestions.map((p) => <option key={p} value={p} />)}</datalist>
          </div>
          <div><label style={{ fontSize: 11, color: "var(--ink-soft)" }}>Hours</label>
            <input type="number" min="0" step="0.25" className="field" value={addHours} onChange={(e) => setAddHours(e.target.value)} style={{ marginTop: 4 }} />
          </div>
          <button className="btn btn-primary" onClick={quickAdd}><Check size={14} />Add</button>
          {error && <div style={{ gridColumn: "1 / -1", display: "flex", gap: 6, alignItems: "center", color: "var(--brick)", fontSize: 12.5 }}><AlertCircle size={14} />{error}</div>}
        </div>
      )}

      {projects.length === 0 ? (
        <EmptyState title="No hours logged this week" body="Use Add hours above, or track time from the Timer tab." />
      ) : (
        <div className="scrollx">
          <table>
            <thead>
              <tr>
                <th>Project</th>
                {days.map((d, i) => <th key={i} style={{ textAlign: "center" }}>{WEEKDAYS[i]}<div style={{ fontWeight: 400, textTransform: "none", fontSize: 10.5 }}>{fmtDayShort(d)}</div></th>)}
                <th style={{ textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const rowTotal = dayKeys.reduce((s, k) => s + grid[p][k], 0);
                return (
                  <tr key={p}>
                    <td style={{ fontWeight: 500 }}>{p}</td>
                    {dayKeys.map((k) => (
                      <td key={k} className="mono" style={{ textAlign: "center", color: grid[p][k] ? "var(--ink)" : "var(--ink-faint)" }}>
                        {grid[p][k] ? minutesToHours(grid[p][k]) : "–"}
                      </td>
                    ))}
                    <td className="mono" style={{ textAlign: "right", fontWeight: 600 }}>{minutesToHours(rowTotal)}</td>
                  </tr>
                );
              })}
              <tr>
                <td style={{ fontWeight: 600, color: "var(--ink-soft)" }}>Daily total</td>
                {dayTotals.map((m, i) => <td key={i} className="mono" style={{ textAlign: "center", fontWeight: 600, color: "var(--ink-soft)" }}>{m ? minutesToHours(m) : "–"}</td>)}
                <td className="mono" style={{ textAlign: "right", fontWeight: 700, color: "var(--brand-deep)" }}>{minutesToHours(grandTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LeftTick({ x, y, payload }) {
  return (
    <text x={0} y={y} dy={4} textAnchor="start" fontSize={11} fill="#12163E">
      {payload.value}
    </text>
  );
}

function ReportsTab({ employees, entries, isAdmin, me }) {
  const [rangeMode, setRangeMode] = useState("week");
  const [customStart, setCustomStart] = useState(ymd(startOfWeek(new Date())));
  const [customEnd, setCustomEnd] = useState(ymd(new Date()));
  const [filterEmployee, setFilterEmployee] = useState("all");
  const [filterProject, setFilterProject] = useState("");

  const { start, end } = useMemo(() => {
    const today = new Date();
    if (rangeMode === "week") return { start: ymd(startOfWeek(today)), end: ymd(addDays(startOfWeek(today), 6)) };
    if (rangeMode === "lastWeek") { const s = addDays(startOfWeek(today), -7); return { start: ymd(s), end: ymd(addDays(s, 6)) }; }
    if (rangeMode === "month") return { start: ymd(startOfMonth(today)), end: ymd(endOfMonth(today)) };
    if (rangeMode === "all") return { start: "0000-01-01", end: "9999-12-31" };
    return { start: customStart, end: customEnd };
  }, [rangeMode, customStart, customEnd]);

  const filtered = entries.filter((e) =>
    (isAdmin ? (filterEmployee === "all" || e.employee === filterEmployee) : true) &&
    (!filterProject.trim() || e.project.toLowerCase().includes(filterProject.trim().toLowerCase())) &&
    e.date >= start && e.date <= end
  );

  const totalMinutes = filtered.reduce((s, e) => s + e.minutes, 0);
  const byEmployee = {};
  const byProject = {};
  filtered.forEach((e) => {
    byEmployee[e.employee] = (byEmployee[e.employee] || 0) + e.minutes;
    byProject[e.project] = (byProject[e.project] || 0) + e.minutes;
  });
  const employeeData = Object.entries(byEmployee).sort((a, b) => b[1] - a[1]).map(([name, mins]) => ({ name, hours: Number(minutesToHours(mins)) }));
  const projectData = Object.entries(byProject).sort((a, b) => b[1] - a[1]).map(([name, mins]) => ({ name, hours: Number(minutesToHours(mins)) }));

  return (
    <div>
      <div className="card" style={{ padding: 14, marginBottom: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
        <div>
          <label style={{ fontSize: 11, color: "var(--ink-soft)" }}>Date range</label>
          <select className="field" value={rangeMode} onChange={(e) => setRangeMode(e.target.value)} style={{ marginTop: 4 }}>
            <option value="week">This week</option>
            <option value="lastWeek">Last week</option>
            <option value="month">This month</option>
            <option value="all">All time</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        {rangeMode === "custom" && (
          <>
            <div><label style={{ fontSize: 11, color: "var(--ink-soft)" }}>From</label><input type="date" className="field" value={customStart} onChange={(e) => setCustomStart(e.target.value)} style={{ marginTop: 4 }} /></div>
            <div><label style={{ fontSize: 11, color: "var(--ink-soft)" }}>To</label><input type="date" className="field" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} style={{ marginTop: 4 }} /></div>
          </>
        )}
        <div>
          <label style={{ fontSize: 11, color: "var(--ink-soft)" }}>Employee</label>
          {isAdmin ? (
            <select className="field" value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)} style={{ marginTop: 4 }}>
              <option value="all">All employees</option>
              {employees.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          ) : (
            <div className="field" style={{ marginTop: 4, background: "var(--paper)", color: "var(--ink-soft)" }}>{me || "You"} only</div>
          )}
        </div>
        <div>
          <label style={{ fontSize: 11, color: "var(--ink-soft)" }}>Project contains</label>
          <input className="field" placeholder="Filter by project" value={filterProject} onChange={(e) => setFilterProject(e.target.value)} style={{ marginTop: 4 }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 18 }}>
        <MetricCard label="Total hours" value={minutesToHours(totalMinutes)} />
        <MetricCard label="Entries" value={filtered.length} />
        <MetricCard label="Employees active" value={Object.keys(byEmployee).length} />
        <MetricCard label="Projects" value={Object.keys(byProject).length} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No entries in this range" body="Try a wider date range or different filters." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Hours by employee</div>
            <ResponsiveContainer width="100%" height={Math.max(160, employeeData.length * 34)}>
              <BarChart data={employeeData} layout="vertical" margin={{ left: -20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E5F0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#5B5F82" }} />
                <YAxis type="category" dataKey="name" width={90} interval={0} tick={{ fontSize: 11, fill: "#12163E" }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid #E2E5F0" }} />
                <Bar dataKey="hours" fill="#3547E0" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Hours by project</div>
            <ResponsiveContainer width="100%" height={Math.max(160, projectData.length * 34)}>
              <BarChart data={projectData} layout="vertical" margin={{ left: -55, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E5F0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#5B5F82" }} />
                <YAxis type="category" dataKey="name" width={150} interval={0} tick={{ fontSize: 11, fill: "#12163E" }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid #E2E5F0" }} />
                <Bar dataKey="hours" fill="#C9821F" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="card" style={{ padding: "12px 14px" }}>
      <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>{label}</div>
      <div className="mono" style={{ fontSize: 22, fontWeight: 600, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function AdminTab({ employees, setEmployees, entries, setEntries, runningTimers, setRunningTimers, me, setMeName, adminPin, setAdminPin, onSignOut }) {
  const [newName, setNewName] = useState("");
  const [drafts, setDrafts] = useState(employees);
  const [confirmClear, setConfirmClear] = useState(false);
  const [error, setError] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [newPinConfirm, setNewPinConfirm] = useState("");
  const [pinError, setPinError] = useState("");

    const [exportFrom, setExportFrom] = useState(ymd(new Date()));
  const [exportTo, setExportTo] = useState(ymd(new Date()));
  const [exportMsg, setExportMsg] = useState("");

  function exportEntries() {
    if (exportFrom > exportTo) { setExportMsg("The 'From' date must be before the 'To' date."); return; }
    const rows = entries
      .filter((e) => e.date >= exportFrom && e.date <= exportTo)
      .sort(byLoggedTime);
    if (rows.length === 0) { setExportMsg("No entries in that date range."); return; }
    setExportMsg("");
    const header = ["Date", "Employee", "Project", "Description", "Minutes", "Hours", "Logged at"];
    const data = rows.map((e) => [e.date, e.employee, e.project, e.description || "", e.minutes, minutesToHours(e.minutes), toColombo(e.createdAt)]);
    const name = exportFrom === exportTo ? `time-entries-${exportFrom}.csv` : `time-entries-${exportFrom}_to_${exportTo}.csv`;
    downloadCSV(name, [header, ...data]);
  }

    async function exportExcel() {
    if (exportFrom > exportTo) { setExportMsg("The 'From' date must be before the 'To' date."); return; }
    const rows = entries
      .filter((e) => e.date >= exportFrom && e.date <= exportTo)
      .sort(byLoggedTime);
    if (rows.length === 0) { setExportMsg("No entries in that date range."); return; }
    setExportMsg("");
    const name = exportFrom === exportTo ? `time-entries-${exportFrom}.xlsx` : `time-entries-${exportFrom}_to_${exportTo}.xlsx`;
    try {
      await downloadXlsx(name, rows);
    } catch (err) {
      console.error(err);
      setExportMsg("Excel export failed. Check the browser console for details.");
    }
  }

  async function changePin() {
    if (newPin.trim().length < 4) { setPinError("Choose a PIN of at least 4 digits."); return; }
    if (newPin !== newPinConfirm) { setPinError("PINs don't match."); return; }
    await setAdminPin(newPin.trim());
    setPinError(""); setNewPin(""); setNewPinConfirm(""); setPinOpen(false);
  }

  useEffect(() => { setDrafts(employees); }, [employees]);

  async function addEmployee() {
    const name = newName.trim();
    if (!name) { setError("Enter a name."); return; }
    if (employees.some((e) => e.toLowerCase() === name.toLowerCase())) { setError("That name is already on the roster."); return; }
    setError("");
    await setEmployees([...employees, name]);
    setNewName("");
  }

  async function renameEmployee(index, newValue) {
    const oldName = employees[index];
    const trimmed = newValue.trim();
    if (!trimmed || trimmed === oldName) return;
    const nextEmployees = employees.map((e, i) => (i === index ? trimmed : e));
    await setEmployees(nextEmployees);
    const nextEntries = entries.map((e) => (e.employee === oldName ? { ...e, employee: trimmed } : e));
    await setEntries(nextEntries);
    if (runningTimers[oldName]) {
      const nextTimers = { ...runningTimers };
      nextTimers[trimmed] = nextTimers[oldName];
      delete nextTimers[oldName];
      await setRunningTimers(nextTimers);
    }
    if (me === oldName) setMeName(trimmed);
  }

  async function removeEmployee(name) {
    await setEmployees(employees.filter((e) => e !== name));
  }

  async function deleteEntry(id) {
    await setEntries(entries.filter((e) => e.id !== id));
  }

  async function clearAllData() {
    await setEntries([]);
    await setRunningTimers({});
    setConfirmClear(false);
  }

  const now = new Date();
  const weekStart = ymd(startOfWeek(now));
  const monthStart = ymd(startOfMonth(now));
  const summary = employees.map((emp) => {
    const empEntries = entries.filter((e) => e.employee === emp);
    const thisWeek = empEntries.filter((e) => e.date >= weekStart).reduce((s, e) => s + e.minutes, 0);
    const thisMonth = empEntries.filter((e) => e.date >= monthStart).reduce((s, e) => s + e.minutes, 0);
    const allTime = empEntries.reduce((s, e) => s + e.minutes, 0);
    return { emp, thisWeek, thisMonth, allTime, count: empEntries.length };
  });

  const sortedEntries = [...entries].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="card" style={{ padding: 18, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink-soft)" }}><Lock size={14} />Admin mode is unlocked on this device</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => setPinOpen((v) => !v)}>Change PIN</button>
          <button className="btn" onClick={onSignOut}><LogOut size={14} />Sign out of admin</button>
        </div>
      </div>
      {pinOpen && (
        <div className="card" style={{ padding: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
          <div><label style={{ fontSize: 11, color: "var(--ink-soft)" }}>New PIN</label><input type="password" inputMode="text" className="field" value={newPin} onChange={(e) => setNewPin(e.target.value)} style={{ marginTop: 4, maxWidth: 140 }} /></div>
          <div><label style={{ fontSize: 11, color: "var(--ink-soft)" }}>Confirm</label><input type="password" inputMode="text" className="field" value={newPinConfirm} onChange={(e) => setNewPinConfirm(e.target.value)} style={{ marginTop: 4, maxWidth: 140 }} /></div>
          <button className="btn btn-primary" onClick={changePin}><Check size={14} />Save PIN</button>
          {pinError && <div style={{ display: "flex", gap: 6, alignItems: "center", color: "var(--brick)", fontSize: 12.5 }}><AlertCircle size={14} />{pinError}</div>}
        </div>
      )}

      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Team roster</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {employees.map((emp, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                className="field"
                value={drafts[i] ?? emp}
                onChange={(e) => setDrafts((d) => d.map((v, idx) => (idx === i ? e.target.value : v)))}
                onBlur={(e) => renameEmployee(i, e.target.value)}
                style={{ maxWidth: 260 }}
              />
              <button className="btn btn-danger" onClick={() => removeEmployee(emp)} aria-label={`Remove ${emp}`}><Trash2 size={14} /></button>
            </div>
          ))}
          {employees.length === 0 && <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>No teammates yet — add your first below.</p>}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <input className="field" placeholder="New teammate name" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ maxWidth: 260 }} onKeyDown={(e) => e.key === "Enter" && addEmployee()} />
          <button className="btn btn-primary" onClick={addEmployee}><Plus size={14} />Add</button>
        </div>
        {error && <div style={{ display: "flex", gap: 6, alignItems: "center", color: "var(--brick)", fontSize: 12.5, marginTop: 8 }}><AlertCircle size={14} />{error}</div>}
      </div>

      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Export data</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
          <div>
            <label style={{ fontSize: 11, color: "var(--ink-soft)" }}>From </label>
            <input type="date" className="field" value={exportFrom} onChange={(e) => setExportFrom(e.target.value)} style={{ marginTop: 4, width: 160 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "var(--ink-soft)" }}>To </label>
            <input type="date" className="field" value={exportTo} onChange={(e) => setExportTo(e.target.value)} style={{ marginTop: 4, width: 160 }} />
          </div>
          <button className="btn btn-primary" onClick={exportEntries}><Download size={14} />Export CSV</button>
          <button className="btn btn-primary" onClick={exportExcel}><Download size={14} />Export Excel</button>
        </div>
        <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: "10px 0 0" }}>
          Downloads every employee's entries between these dates. Set both dates to the same day for a daily export.
        </p>
        {exportMsg && <div style={{ display: "flex", gap: 6, alignItems: "center", color: "var(--brick)", fontSize: 12.5, marginTop: 8 }}><AlertCircle size={14} />{exportMsg}</div>}
      </div>

      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Hours overview</div>
        <div className="scrollx">
          <table>
            <thead><tr><th>Employee</th><th style={{ textAlign: "right" }}>This week</th><th style={{ textAlign: "right" }}>This month</th><th style={{ textAlign: "right" }}>All time</th><th style={{ textAlign: "right" }}>Entries</th></tr></thead>
            <tbody>
              {summary.map((s) => (
                <tr key={s.emp} style={s.emp === me ? { background: "var(--brand-tint)" } : undefined}>
                  <td style={{ fontWeight: 500 }}>{s.emp}{s.emp === me ? " (you)" : ""}</td>
                  <td className="mono" style={{ textAlign: "right" }}>{minutesToHM(s.thisWeek)}</td>
                  <td className="mono" style={{ textAlign: "right" }}>{minutesToHM(s.thisMonth)}</td>
                  <td className="mono" style={{ textAlign: "right" }}>{minutesToHM(s.allTime)}</td>
                  <td className="mono" style={{ textAlign: "right", color: "var(--ink-soft)" }}>{s.count}</td>
                </tr>
              ))}
              {summary.length === 0 && <tr><td colSpan={5} style={{ color: "var(--ink-soft)" }}>No teammates on the roster.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>All entries ({entries.length})</div>
        <div className="scrollx" style={{ maxHeight: 420, overflowY: "auto" }}>
          <table>
            <thead><tr><th>Date</th><th>Employee</th><th>Project</th><th>Description</th><th style={{ textAlign: "right" }}>Duration</th><th></th></tr></thead>
            <tbody>
              {sortedEntries.map((e) => (
                <tr key={e.id}>
                  <td className="mono" style={{ whiteSpace: "nowrap" }}>{e.date}</td>
                  <td>{e.employee}</td>
                  <td>{e.project}</td>
                  <td style={{ color: "var(--ink-soft)" }}>{e.description || "–"}</td>
                  <td className="mono" style={{ textAlign: "right", whiteSpace: "nowrap" }}>{minutesToHM(e.minutes)}</td>
                  <td style={{ textAlign: "right" }}><button className="btn btn-danger" onClick={() => deleteEntry(e.id)} aria-label="Delete entry"><Trash2 size={13} /></button></td>
                </tr>
              ))}
              {sortedEntries.length === 0 && <tr><td colSpan={6} style={{ color: "var(--ink-soft)" }}>No entries recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ padding: 18, borderColor: "var(--brick-tint)" }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--brick)" }}>Danger zone</div>
        <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 10 }}>Permanently clears every time entry and running timer for the whole team. The roster is kept.</p>
        {!confirmClear ? (
          <button className="btn btn-danger" onClick={() => setConfirmClear(true)}>Clear all time data</button>
        ) : (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12.5 }}>Are you sure? This can't be undone.</span>
            <button className="btn btn-danger" onClick={clearAllData}>Yes, clear everything</button>
            <button className="btn" onClick={() => setConfirmClear(false)}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ title, body }) {
  return (
    <div className="card" style={{ padding: 32, textAlign: "center" }}>
      <h3 style={{ fontSize: 15, margin: "0 0 6px" }}>{title}</h3>
      <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>{body}</p>
    </div>
  );
}
