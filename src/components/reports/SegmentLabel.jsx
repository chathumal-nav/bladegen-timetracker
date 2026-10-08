import { minutesToHM } from "../../utils/time";

// Label inside a segment (hidden when the segment is too short to hold text)
export function SegmentLabel({ x, y, width, height, value }) {
  if (!value || height < 16 || width < 30) return null;
  return (
    <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="central"
      fontSize={11} fontWeight={700} fill="#fff" stroke="rgba(0,0,0,0.35)" strokeWidth={2.5} paintOrder="stroke"
      style={{ pointerEvents: "none" }}>
      {minutesToHM(value * 60)}
    </text>
  );
}
