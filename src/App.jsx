import React, { useState, useEffect, useRef, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Play, Square, Plus, Trash2, Clock, LayoutGrid, BarChart2, Settings, ChevronLeft, ChevronRight, Pencil, Check, X, AlertCircle, Lock, LogOut, Download } from "lucide-react";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
  rows.forEach((e) => s1.addRow({ date: e.date, employee: e.employee, project: e.project, description: e.description || "", minutes: e.minutes, hours: toHours(e.minutes), createdAt: e.createdAt }));
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
.ldg .rec-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--amber); animation: ldg-pulse 1.6s ease-in-out infinite; }
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

export default function App() {
  const [employees, setEmployees, employeesReady] = useShared("team-employees", []);
  const [entries, setEntries, entriesReady] = useShared("entries-all", []);
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
    <div className="ldg" style={{ padding: "1.25rem", maxWidth: 980, margin: "0 auto" }}>
      <style>{CSS}</style>

      <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
        <div>
          <img src={LOGO_SRC} alt="BladeGen" style={{ height: 34, display: "block" }} />
          <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "var(--ink-soft)" }}>Team time tracking</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <label style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-faint)" }}>You are</label>
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
        type="password" inputMode="numeric" className="field" placeholder="PIN" value={input}
        onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !isSetup && submit()}
        style={{ textAlign: "center", letterSpacing: "0.2em" }}
      />
      {isSetup && (
        <input
          type="password" inputMode="numeric" className="field" placeholder="Confirm PIN" value={confirmInput}
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
      <div className="stamp-card" style={{ padding: 24 }}>
        {myTimer ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span className="rec-dot" />
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--amber)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Recording</span>
            </div>
            <div className="mono" style={{ fontSize: 44, fontWeight: 600, lineHeight: 1 }}>{formatClock(elapsedSec)}</div>
            <div style={{ marginTop: 10, fontSize: 14, fontWeight: 500 }}>{myTimer.project}</div>
            {myTimer.description && <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 2 }}>{myTimer.description}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <button className="btn btn-primary" onClick={stopTimer}><Square size={14} />Stop and save</button>
              <button className="btn" onClick={discardTimer}><X size={14} />Discard</button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Ready to track</div>
            <div className="mono" style={{ fontSize: 44, fontWeight: 600, lineHeight: 1, color: "var(--ink-faint)" }}>00:00:00</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
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
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={startTimer}><Play size={14} />Start timer</button>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 18 }}>
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
        <div className="card" style={{ padding: 16 }}>
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
              <BarChart data={employeeData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E5F0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#5B5F82" }} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: "#12163E" }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid #E2E5F0" }} />
                <Bar dataKey="hours" fill="#3547E0" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Hours by project</div>
            <ResponsiveContainer width="100%" height={Math.max(160, projectData.length * 34)}>
              <BarChart data={projectData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E5F0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#5B5F82" }} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: "#12163E" }} />
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
      .sort((a, b) => a.date.localeCompare(b.date) || a.employee.localeCompare(b.employee));
    if (rows.length === 0) { setExportMsg("No entries in that date range."); return; }
    setExportMsg("");
    const header = ["Date", "Employee", "Project", "Description", "Minutes", "Hours", "Logged at"];
    const data = rows.map((e) => [e.date, e.employee, e.project, e.description || "", e.minutes, minutesToHours(e.minutes), e.createdAt]);
    const name = exportFrom === exportTo ? `time-entries-${exportFrom}.csv` : `time-entries-${exportFrom}_to_${exportTo}.csv`;
    downloadCSV(name, [header, ...data]);
  }

    async function exportExcel() {
    if (exportFrom > exportTo) { setExportMsg("The 'From' date must be before the 'To' date."); return; }
    const rows = entries
      .filter((e) => e.date >= exportFrom && e.date <= exportTo)
      .sort((a, b) => a.date.localeCompare(b.date) || a.employee.localeCompare(b.employee));
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
          <div><label style={{ fontSize: 11, color: "var(--ink-soft)" }}>New PIN</label><input type="password" inputMode="numeric" className="field" value={newPin} onChange={(e) => setNewPin(e.target.value)} style={{ marginTop: 4, maxWidth: 140 }} /></div>
          <div><label style={{ fontSize: 11, color: "var(--ink-soft)" }}>Confirm</label><input type="password" inputMode="numeric" className="field" value={newPinConfirm} onChange={(e) => setNewPinConfirm(e.target.value)} style={{ marginTop: 4, maxWidth: 140 }} /></div>
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
