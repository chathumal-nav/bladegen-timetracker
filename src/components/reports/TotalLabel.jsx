import { minutesToHM } from "../../utils/time";

// Total shown above each stack
export function TotalLabel({ x, y, width, value }) {
  if (!value) return null;
  return (
    <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={11.5} fontWeight={700} fill="#12163E"
      style={{ pointerEvents: "none" }}>
      {minutesToHM(value * 60)}
    </text>
  );
}
