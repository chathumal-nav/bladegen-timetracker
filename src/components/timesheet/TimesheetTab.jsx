import { useState } from "react";
import { Plus, ChevronLeft, ChevronRight, Check, AlertCircle } from "lucide-react";
import { ymd, startOfWeek, addDays, fmtDay, fmtDayShort } from "../../utils/date";
import { minutesToHM, minutesToHours, hmToMinutes } from "../../utils/time";
import { uid, byLatest, fmtLogged, fmtStart } from "../../utils/entries";
import { WEEKDAYS } from "../../constants/config";
import { PROJECTS } from "../../constants/projects";
import { EmptyState } from "../common/EmptyState";
import { JustCell } from "../common/JustCell";

export function TimesheetTab({ me, employees, entries, setEntries, projectSuggestions }) {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [addOpen, setAddOpen] = useState(false);
  const [addDay, setAddDay] = useState(0);
  const [addProject, setAddProject] = useState("");
  const [addStart, setAddStart] = useState("");
  const [addEnd, setAddEnd] = useState("");
  const [error, setError] = useState("");
  const [addJust, setAddJust] = useState("");
  const [addDesc, setAddDesc] = useState("");

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
  const addMins = addStart && addEnd ? hmToMinutes(addEnd) - hmToMinutes(addStart) : 0;
  const myEntries = [...weekEntries].sort(byLatest);

  async function quickAdd() {
    const mins = addStart && addEnd ? hmToMinutes(addEnd) - hmToMinutes(addStart) : 0;
    if (!addProject.trim()) { setError("Enter a project."); return; }
    if (!addDesc.trim()) { setError("Enter a description."); return; }
    if (!addStart || !addEnd) { setError("Enter the work start and end times."); return; }
    if (mins <= 0) { setError("End time must be after start time."); return; }
    if (mins > 30 && !addJust.trim()) { setError("Entries over 30 minutes need a justification."); return; }
    setError("");
    const entry = { id: uid(), employee: me, project: addProject.trim(), description: addDesc.trim(), justification: addJust.trim(), date: dayKeys[addDay], workStart: addStart, workEnd: addEnd, minutes: mins, createdAt: new Date().toISOString() };
    await setEntries([entry, ...entries]);
    setAddProject(""); setAddDesc(""); setAddJust(""); setAddStart(""); setAddEnd(""); setAddOpen(false);
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
            <select className="field" value={addProject} onChange={(e) => setAddProject(e.target.value)} style={{ marginTop: 4 }}>
              <option value="">Select a project…</option>
              {PROJECTS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div><label style={{ fontSize: 11, color: "var(--ink-soft)" }}>Work start time</label>
            <input type="time" className="field" value={addStart} onChange={(e) => setAddStart(e.target.value)} style={{ marginTop: 4 }} />
          </div>
          <div><label style={{ fontSize: 11, color: "var(--ink-soft)" }}>Work end time</label>
            <input type="time" className="field" value={addEnd} onChange={(e) => setAddEnd(e.target.value)} style={{ marginTop: 4 }} />
          </div>
          {addMins > 0 && <div style={{ gridColumn: "1 / -1", fontSize: 12.5, color: "var(--ink-soft)" }}>Duration: <strong>{minutesToHM(addMins)}</strong></div>}
          <div><label style={{ fontSize: 11, color: "var(--ink-soft)" }}>Description (required)</label>
            <input className="field" value={addDesc} onChange={(e) => setAddDesc(e.target.value)} style={{ marginTop: 4 }} />
          </div>
          <div><label style={{ fontSize: 11, color: "var(--ink-soft)" }}>Justification (if over 30 min)</label>
            <input className="field" value={addJust} onChange={(e) => setAddJust(e.target.value)} style={{ marginTop: 4 }} />
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

      {myEntries.length > 0 && (
        <div className="card" style={{ padding: 18, marginTop: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>My entries this week ({myEntries.length})</div>
          <div className="scrollx">
            <table>
              <thead><tr><th>Logged at</th><th>Work started</th><th>Project</th><th>Description</th><th style={{ textAlign: "right" }}>Duration</th><th>Justification</th></tr></thead>
              <tbody>
                {myEntries.map((e) => (
                  <tr key={e.id}>
                    <td className="mono" style={{ whiteSpace: "nowrap" }}>{fmtLogged(e.createdAt)}</td>
                    <td className="mono" style={{ whiteSpace: "nowrap" }}>{fmtStart(e)}</td>
                    <td>{e.project}</td>
                    <td style={{ color: "var(--ink-soft)" }}>{e.description || "–"}</td>
                    <td className="mono" style={{ textAlign: "right", whiteSpace: "nowrap" }}>{minutesToHM(e.minutes)}</td>
                    <JustCell e={e} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
