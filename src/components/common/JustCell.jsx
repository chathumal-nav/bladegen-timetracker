export function JustCell({ e }) {
  if (e.justification) return <td style={{ color: "var(--ink-soft)" }}>{e.justification}</td>;
  if (e.minutes > 30) return <td style={{ color: "var(--brick)" }}>Not provided</td>;
  return <td style={{ color: "var(--ink-faint)" }}>–</td>;
}
