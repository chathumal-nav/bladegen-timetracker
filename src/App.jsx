import React, { useState, useEffect, useRef, useMemo } from "react";
import { Clock, LayoutGrid, BarChart2, Settings, Lock, Bell } from "lucide-react";
import "./App.css";

import { useShared, useEntries, usePush } from "./hooks";
import { loadStore, saveStore, unlockAudio, playChime } from "./utils";
import { REMINDER_MS, DEFAULT_EMPLOYEES, LOGO_SRC } from "./constants";

import { TabBtn } from "./components/common/TabBtn";
import { TimerTab } from "./components/timer/TimerTab";
import { TimesheetTab } from "./components/timesheet/TimesheetTab";
import { ReportsTab } from "./components/reports/ReportsTab";
import { AdminTab } from "./components/admin/AdminTab";
import { PinGate } from "./components/auth/PinGate";
import { ReminderModal } from "./components/modals/ReminderModal";

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
  const [reminderOpen, setReminderOpen] = useState(false);
  const [lastAck, setLastAck] = useState(0);

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

  const myRunning = me ? runningTimers[me] : null;
  useEffect(() => {
    if (!myRunning) { setReminderOpen(false); setLastAck(0); return; }
    if (reminderOpen) return;
    const base = Math.max(new Date(myRunning.startTime).getTime(), lastAck);
    if (now - base >= REMINDER_MS) setReminderOpen(true);
  }, [now, myRunning, lastAck, reminderOpen]);

  function stillWorking() { setLastAck(Date.now()); setReminderOpen(false); }
  function stopFromReminder() {
    setLastAck(Date.now()); // prevents the popup from instantly reopening
    setReminderOpen(false);
    setTab("timer");
  }

  const push = usePush(me);
  const pendingReminder = useRef(new URLSearchParams(window.location.search).has("reminder"));

  // allow sound after the user's first tap/click
  useEffect(() => {
    window.addEventListener("pointerdown", unlockAudio);
    window.addEventListener("keydown", unlockAudio);
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  // notification tapped while the app was already open
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMsg = (e) => { if (e.data && e.data.type === "reminder") setReminderOpen(true); };
    navigator.serviceWorker.addEventListener("message", onMsg);
    return () => navigator.serviceWorker.removeEventListener("message", onMsg);
  }, []);

  // notification tapped while the app was closed (opened with ?reminder=1)
  useEffect(() => {
    if (pendingReminder.current && myRunning) {
      pendingReminder.current = false;
      setReminderOpen(true);
      window.history.replaceState(null, "", "/");
    }
  }, [myRunning]);

  // chime whenever the popup opens
  useEffect(() => { if (reminderOpen) playChime(); }, [reminderOpen]);

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
        <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>Loading ledger…</p>
      </div>
    );
  }

  return (
    <div className="ldg">
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

            {push.supported && push.permission !== "denied" && (
              <div className="switch-row">
                <Bell size={13} />
                <span>Reminders {push.subscribed ? "on" : "off"}</span>
                <button type="button" role="switch" aria-checked={push.subscribed} aria-label="Toggle reminders"
                  className={`switch${push.subscribed ? " on" : ""}`} onClick={push.toggle} disabled={!me || push.busy}>
                  <span className="knob" />
                </button>
              </div>
            )}
            {push.supported && push.permission === "denied" && (
              <span style={{ fontSize: 11.5, color: "var(--brick)", maxWidth: 190, textAlign: "right" }}>Notifications are blocked. Allow them in browser settings.</span>
            )}
            {push.error && (
              <span style={{ fontSize: 11.5, color: "var(--brick)", maxWidth: 220, textAlign: "right" }}>{push.error}</span>
            )}
            {push.iosNeedsInstall && (
              <span style={{ fontSize: 11.5, color: "var(--ink-soft)", maxWidth: 190, textAlign: "right" }}>For reminders on iPhone: Share → Add to Home Screen, then open from there.</span>
            )}
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

      {reminderOpen && myRunning && (
        <ReminderModal
          myRunning={myRunning}
          now={now}
          onStillWorking={stillWorking}
          onStop={stopFromReminder}
        />
      )}
    </div>
  );
}
