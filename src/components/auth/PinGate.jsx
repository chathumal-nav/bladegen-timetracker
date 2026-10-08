import { useState } from "react";
import { Lock, AlertCircle } from "lucide-react";

export function PinGate({ adminPin, setAdminPin, onUnlock }) {
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
        {isSetup ? "This unlocks everyone's hours and team settings. Keep it between admins." : "Enter admin password to view everyone's hours and manage the roster."}
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
