export function MetricCard({ label, value }) {
  return (
    <div className="card" style={{ padding: "12px 14px" }}>
      <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>{label}</div>
      <div className="mono" style={{ fontSize: 22, fontWeight: 600, marginTop: 4 }}>{value}</div>
    </div>
  );
}
