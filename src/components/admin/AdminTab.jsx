import { useState, useEffect } from "react";
import { Plus, Trash2, Check, Lock, LogOut, Download, AlertCircle } from "lucide-react";
import { ymd, startOfWeek, startOfMonth, toColombo } from "../../utils/date";
import { minutesToHM, minutesToHours } from "../../utils/time";
import { byLoggedTime, byLatest, fmtLogged, fmtStart } from "../../utils/entries";
import { downloadCSV } from "../../utils/csv";
import { downloadXlsx } from "../../utils/excel";
import { downloadReportPdf } from "../../utils/pdf";
import { JustCell } from "../common/JustCell";

export function AdminTab({ employees, setEmployees, entries, setEntries, runningTimers, setRunningTimers, me, setMeName, adminPin, setAdminPin, onSignOut }) {
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
  const [pdfBusy, setPdfBusy] = useState(false);

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

    async function exportPdf() {
    if (exportFrom > exportTo) { setExportMsg("The 'From' date must be before the 'To' date."); return; }
    const rows = entries.filter((e) => e.date >= exportFrom && e.date <= exportTo);
    if (rows.length === 0) { setExportMsg("No entries in that date range."); return; }
    setExportMsg("");
    setPdfBusy(true);
    const name = exportFrom === exportTo ? `report-${exportFrom}.pdf` : `report-${exportFrom}_to_${exportTo}.pdf`;
    try {
      await downloadReportPdf(name, exportFrom, exportTo, rows);
    } catch (err) {
      console.error(err);
      setExportMsg("PDF export failed. Check the browser console for details.");
    }
    setPdfBusy(false);
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

  const sortedEntries = [...entries].sort(byLatest);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="card" style={{ padding: 18, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink-soft)" }}><Lock size={14} />Admin mode is unlocked on this device</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => setPinOpen((v) => !v)}>Change Password</button>
          <button className="btn" onClick={onSignOut}><LogOut size={14} />Sign out of admin</button>
        </div>
      </div>
      {pinOpen && (
        <div className="card" style={{ padding: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
          <div><label style={{ fontSize: 11, color: "var(--ink-soft)" }}>New Password </label><input type="password" inputMode="text" className="field" value={newPin} onChange={(e) => setNewPin(e.target.value)} style={{ marginTop: 4, maxWidth: 140 }} /></div>
          <div><label style={{ fontSize: 11, color: "var(--ink-soft)" }}>Confirm </label><input type="password" inputMode="text" className="field" value={newPinConfirm} onChange={(e) => setNewPinConfirm(e.target.value)} style={{ marginTop: 4, maxWidth: 140 }} /></div>
          <button className="btn btn-primary" onClick={changePin}><Check size={14} />Save Password</button>
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
          <input className="field" placeholder="New Employee Name" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ maxWidth: 260 }} onKeyDown={(e) => e.key === "Enter" && addEmployee()} />
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
          <button className="btn btn-primary" onClick={exportPdf} disabled={pdfBusy}><Download size={14} />{pdfBusy ? "Preparing PDF…" : "Export PDF"}</button>
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
            <thead><tr><th>Logged at</th><th>Work started</th><th>Employee</th><th>Project</th><th>Description</th><th style={{ textAlign: "right" }}>Duration</th><th>Justification</th><th></th></tr></thead>
            <tbody>
              {sortedEntries.map((e) => (
                <tr key={e.id}>
                  <td className="mono" style={{ whiteSpace: "nowrap" }}>{fmtLogged(e.createdAt)}</td>
                  <td className="mono" style={{ whiteSpace: "nowrap" }}>{fmtStart(e)}</td>
                  <td>{e.employee}</td>
                  <td>{e.project}</td>
                  <td style={{ color: "var(--ink-soft)" }}>{e.description || "–"}</td>
                  <td className="mono" style={{ textAlign: "right", whiteSpace: "nowrap" }}>{minutesToHM(e.minutes)}</td>
                  <JustCell e={e} />
                  <td style={{ textAlign: "right" }}><button className="btn btn-danger" onClick={() => deleteEntry(e.id)} aria-label="Delete entry"><Trash2 size={13} /></button></td>
                </tr>
              ))}
              {sortedEntries.length === 0 && <tr><td colSpan={8} style={{ color: "var(--ink-soft)" }}>No entries recorded yet.</td></tr>}
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
