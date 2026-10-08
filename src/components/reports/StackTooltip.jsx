import { minutesToHM } from "../../utils/time";

export function StackTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const items = payload.filter((p) => p.value > 0 && p.dataKey !== "total").sort((a, b) => b.value - a.value);
  if (!items.length) return null;
  const total = items.reduce((s, p) => s + p.value, 0);
  return (
    <div style={{ background: "#fff", border: "1px solid #E2E5F0", borderRadius: 6, padding: "8px 10px", fontSize: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label} · {minutesToHM(total * 60)}</div>
      {items.map((p) => (
        <div key={p.dataKey} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 9, height: 9, background: p.fill, borderRadius: 2, display: "inline-block" }} />
          <span>{p.name}: {minutesToHM(p.value * 60)}</span>
        </div>
      ))}
    </div>
  );
}
