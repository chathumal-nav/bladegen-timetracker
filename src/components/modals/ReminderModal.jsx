import { Clock, Check, Square } from "lucide-react";
import { formatClock } from "../../utils/time";

export function ReminderModal({ myRunning, now, onStillWorking, onStop }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(18,22,62,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div className="card" style={{ maxWidth: 380, width: "100%", padding: 24, textAlign: "center" }}>
        <Clock size={24} style={{ color: "var(--brand)" }} />
        <h3 style={{ fontSize: 16, margin: "10px 0 4px" }}>Are you still working?</h3>
        <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 4px" }}>{myRunning.project}</p>
        <p className="mono" style={{ fontSize: 22, fontWeight: 600, margin: "0 0 16px" }}>{formatClock((now - new Date(myRunning.startTime).getTime()) / 1000)}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={onStillWorking}><Check size={14} />Yes, still working</button>
          <button className="btn" onClick={onStop}><Square size={14} />No, stop timer</button>
        </div>
      </div>
    </div>
  );
}
