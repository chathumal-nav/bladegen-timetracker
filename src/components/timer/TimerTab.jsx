import { useState } from "react";
import { Play, Square, Plus, Trash2, Check, X, AlertCircle } from "lucide-react";
import { ymd, clockHM } from "../../utils/date";
import { minutesToHM, hmToMinutes, formatClock } from "../../utils/time";
import { uid } from "../../utils/entries";
import { loadStore } from "../../utils/storage";
import { PROJECTS } from "../../constants/projects";
import { Greeting } from "../common/Greeting";
import { EmptyState } from "../common/EmptyState";

const MAX_TIMER_MS = 16 * 60 * 60 * 1000; // 16 hours max threshold for running timer

function pruneStaleTimers(timersMap) {
  const nowMs = Date.now();
  const clean = {};
  for (const [emp, t] of Object.entries(timersMap || {})) {
    if (!t || !t.startTime) continue;
    const startMs = new Date(t.startTime).getTime();
    if (isNaN(startMs)) continue;
    if (nowMs - startMs >= MAX_TIMER_MS) continue;
    clean[emp] = t;
  }
  return clean;
}

export function TimerTab({ me, employees, entries, setEntries, runningTimers, setRunningTimers, now, projectSuggestions, isAdmin }) {
  const [project, setProject] = useState("");
  const [description, setDescription] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [manualDate, setManualDate] = useState(ymd(new Date()));
  const [manualProject, setManualProject] = useState("");
  const [manualDesc, setManualDesc] = useState("");
  const [manualStart, setManualStart] = useState("");
  const [manualEnd, setManualEnd] = useState("");const [manualHours, setManualHours] = useState("");
  const [manualMinutes, setManualMinutes] = useState("");
  const [error, setError] = useState("");
  const [justification, setJustification] = useState("");
  const [manualJust, setManualJust] = useState("");
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  if (employees.length === 0) {
    return (
      <EmptyState title="Add your team first" body="There's no one on the roster yet. Go to Admin to add teammates, then come back here to start tracking time." />
    );
  }
  if (!me) {
    return <EmptyState title="Select your name" body="Pick who you are from the dropdown above to start tracking time." />;
  }

  const cleanRunning = pruneStaleTimers(runningTimers);
  const myTimer = cleanRunning[me] || null;
  const elapsedSec = myTimer ? (now - new Date(myTimer.startTime).getTime()) / 1000 : 0;

  async function startTimer() {
    if (!project.trim()) { setError("Enter a project before starting the timer."); return; }
    if (!description.trim()) { setError("Enter a description before starting the timer."); return; }
    setError("");
    const latest = await loadStore("timers-running", true, {});
    const clean = pruneStaleTimers(latest);
    clean[me] = { project: project.trim(), description: description.trim(), startTime: new Date().toISOString() };
    await setRunningTimers(clean);
  }
  async function stopTimer() {
    const t = myTimer;
    if (!t) return;
    const startMs = new Date(t.startTime).getTime();
    const minutes = Math.max(1, Math.round((Date.now() - startMs) / 60000));
    if (minutes > 30 && !justification.trim()) { setError("This session is over 30 minutes. Add a justification before saving."); return; }
    setError("");
    const endIso = new Date().toISOString();
    const entry = { id: uid(), employee: me, project: t.project, description: t.description, justification: justification.trim(), date: ymd(new Date(t.startTime)), workStart: clockHM(t.startTime), workEnd: clockHM(endIso), minutes, createdAt: endIso };
    const latest = await loadStore("timers-running", true, {});
    const clean = pruneStaleTimers(latest);
    delete clean[me];
    await setEntries([entry, ...entries]);
    await setRunningTimers(clean);
    setProject(""); setDescription(""); setJustification("");
  }
  async function discardTimer() {
    const latest = await loadStore("timers-running", true, {});
    const clean = pruneStaleTimers(latest);
    delete clean[me];
    await setRunningTimers(clean);
    setConfirmDiscard(false); setJustification(""); setError("");
  }

  async function clearOtherTimer(emp) {
    const latest = await loadStore("timers-running", true, {});
    const clean = pruneStaleTimers(latest);
    delete clean[emp];
    await setRunningTimers(clean);
  }

  async function addManual() {
    const mins = manualStart && manualEnd ? hmToMinutes(manualEnd) - hmToMinutes(manualStart) : 0;
    if (!manualProject.trim()) { setError("Enter a project for the manual entry."); return; }
    if (!manualDesc.trim()) { setError("Enter a description for the manual entry."); return; }
    if (!manualStart || !manualEnd) { setError("Enter the work start and end times."); return; }
    if (mins <= 0) { setError("End time must be after start time."); return; }
    if (mins > 30 && !manualJust.trim()) { setError("Entries over 30 minutes need a justification."); return; }
    setError("");
    const entry = { id: uid(), employee: me, project: manualProject.trim(), description: manualDesc.trim(), justification: manualJust.trim(), date: manualDate, workStart: manualStart, workEnd: manualEnd, minutes: mins, createdAt: new Date().toISOString() };
    await setEntries([entry, ...entries]);
    setManualProject(""); setManualDesc(""); setManualJust(""); setManualStart(""); setManualEnd(""); setManualOpen(false);
  }

  const others = Object.entries(cleanRunning).filter(([emp]) => emp !== me);
  const manualMins = manualStart && manualEnd ? hmToMinutes(manualEnd) - hmToMinutes(manualStart) : 0;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 18 }}>
      <Greeting name={me} now={now} />
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
            <div style={{ marginTop: 16, maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>
              <label style={{ fontSize: 11, color: "var(--ink-soft)" }}>Justification (required if the session is over 30 minutes)</label>
              <input className="field" placeholder="Why did this take this long?" value={justification} onChange={(e) => setJustification(e.target.value)} style={{ marginTop: 4 }} />
            </div>
            {error && <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center", color: "var(--brick)", fontSize: 12.5, marginTop: 8 }}><AlertCircle size={14} />{error}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "center" }}>
              <button className="btn btn-primary" onClick={stopTimer}><Square size={14} />Stop and save</button>
              <button className="btn" onClick={() => setConfirmDiscard(true)}><X size={14} />Discard</button>
            </div>
          </div>
        ) : (
          <div>
            <div className="timer-label" style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Ready to track</div>
            <div className="mono timer-digits" style={{ fontWeight: 600, lineHeight: 1, color: "var(--ink-faint)" }}>00:00:00</div>
            <div className="timer-fields">
              <div>
                <label style={{ fontSize: 11, color: "var(--ink-soft)" }}>Project</label>
                <select className="field" value={project} onChange={(e) => setProject(e.target.value)} style={{ marginTop: 4 }}>
                  <option value="">Select a project…</option>
                  {PROJECTS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "var(--ink-soft)" }}>Description (required)</label>
                <input className="field" placeholder="What are you working on?" value={description} onChange={(e) => setDescription(e.target.value)} style={{ marginTop: 4 }} />
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
            <div><label style={{ fontSize: 11, color: "var(--ink-soft)" }}>Project</label><select className="field" value={manualProject} onChange={(e) => setManualProject(e.target.value)} style={{ marginTop: 4 }}>
              <option value="">Select a project…</option>
              {PROJECTS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select></div>
            <div><label style={{ fontSize: 11, color: "var(--ink-soft)" }}>Work start time</label><input type="time" className="field" value={manualStart} onChange={(e) => setManualStart(e.target.value)} style={{ marginTop: 4 }} /></div>
            <div><label style={{ fontSize: 11, color: "var(--ink-soft)" }}>Work end time</label><input type="time" className="field" value={manualEnd} onChange={(e) => setManualEnd(e.target.value)} style={{ marginTop: 4 }} /></div>
            {manualMins > 0 && <div style={{ gridColumn: "1 / -1", fontSize: 12.5, color: "var(--ink-soft)" }}>Duration: <strong>{minutesToHM(manualMins)}</strong></div>}
            <div style={{ gridColumn: "1 / -1" }}><label style={{ fontSize: 11, color: "var(--ink-soft)" }}>Description (required)</label><input className="field" value={manualDesc} onChange={(e) => setManualDesc(e.target.value)} style={{ marginTop: 4 }} /></div>
            <div style={{ gridColumn: "1 / -1" }}><label style={{ fontSize: 11, color: "var(--ink-soft)" }}>Justification (required if over 30 minutes)</label><input className="field" value={manualJust} onChange={(e) => setManualJust(e.target.value)} style={{ marginTop: 4 }} /></div>
            {error && <div style={{ gridColumn: "1 / -1", display: "flex", gap: 6, alignItems: "center", color: "var(--brick)", fontSize: 12.5 }}><AlertCircle size={14} />{error}</div>}
            <div style={{ gridColumn: "1 / -1" }}><button className="btn btn-primary" onClick={addManual}><Check size={14} />Add entry</button></div>
          </div>
        )}
      </div>

      {others.length > 0 && (
        <div className="card" style={{ padding: 40, paddingLeft: 50, paddingRight: 60 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Currently tracking</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {others.map(([emp, t]) => {
              const sec = (now - new Date(t.startTime).getTime()) / 1000;
              return (
                <div key={emp} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                  <span><strong style={{ fontWeight: 500 }}>{emp}</strong> <span style={{ color: "var(--ink-soft)" }}>· {t.project}</span></span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="mono" style={{ color: "var(--amber)" }}>{formatClock(sec)}</span>
                    {isAdmin && (
                      <button
                        type="button"
                        className="btn btn-danger"
                        style={{ padding: "2px 8px", fontSize: 11 }}
                        title="Clear stuck timer (Admin only)"
                        onClick={() => clearOtherTimer(emp)}
                      >
                        <X size={12} /> Clear
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      
      {confirmDiscard && myTimer && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(18,22,62,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div className="card" style={{ maxWidth: 400, width: "100%", padding: 24, textAlign: "center" }}>
            <AlertCircle size={24} style={{ color: "var(--brick)" }} />
            <h3 style={{ fontSize: 16, margin: "10px 0 6px" }}>Discard this recording?</h3>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 4px" }}>
              The time you've tracked on <strong>{myTimer.project}</strong> will not be saved.
            </p>
            <p className="mono" style={{ fontSize: 22, fontWeight: 600, margin: "6px 0 16px" }}>{formatClock(elapsedSec)}</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn btn-primary" onClick={() => setConfirmDiscard(false)}>Keep recording</button>
              <button className="btn btn-danger" onClick={discardTimer}><Trash2 size={14} />Yes, discard</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
