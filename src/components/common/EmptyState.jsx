export function EmptyState({ title, body }) {
  return (
    <div className="card" style={{ padding: 32, textAlign: "center" }}>
      <h3 style={{ fontSize: 15, margin: "0 0 6px" }}>{title}</h3>
      <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>{body}</p>
    </div>
  );
}
