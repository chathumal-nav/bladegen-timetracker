import { useState } from "react";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { LOGO_SRC } from "../../constants/logo";

export function VerifyGate({ employees, defaultName, onVerified }) {
  const [name, setName] = useState(employees.includes(defaultName) ? defaultName : "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    if (!name) { setError("Select your name."); return; }
    if (!password) { setError("Enter the team password."); return; }
    setBusy(true); setError("");
    try {
      const ok = await window.auth.verify(password);
      if (ok) { onVerified(name); return; }
      setError("Incorrect password. Try again.");
      setPassword("");
    } catch (e) {
      setError("Couldn't verify right now. Check your connection and try again.");
    }
    setBusy(false);
  }

  const label = { display: "block", fontSize: 11, color: "var(--ink-soft)", marginBottom: 4 };

  return (
    <div className="ldg">
      <div className="ldg-wrap" style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="card" style={{ width: "100%", maxWidth: 380, padding: 32, textAlign: "center" }}>
          <img src={LOGO_SRC} alt="BladeGen" className="app-logo" style={{ margin: "0 auto 20px" }} />
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--brand-tint)", color: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <ShieldCheck size={22} />
          </div>
          <h2 style={{ fontSize: 20, margin: "0 0 6px" }}>Verify yourself</h2>
          <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 22px" }}>
            Select your name and enter the team password to continue.
          </p>

          <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={label}>Employee name</label>
              <select className="field" value={name} onChange={(e) => { setName(e.target.value); setError(""); }}>
                <option value="">Select your name…</option>
                {employees.map((emp) => <option key={emp} value={emp}>{emp}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Team password</label>
              <input
                type="password" className="field" placeholder="Enter password" autoComplete="current-password"
                value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </div>
          </div>

          {error && (
            <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center", color: "var(--brick)", fontSize: 12.5, marginTop: 14 }}>
              <AlertCircle size={14} />{error}
            </div>
          )}

          <button className="btn btn-primary" style={{ marginTop: 18, width: "100%", justifyContent: "center" }} onClick={submit} disabled={busy}>
            {busy ? "Verifying…" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}