export function LeftTick({ x, y, payload }) {
  return (
    <text x={0} y={y} dy={4} textAnchor="start" fontSize={11} fill="#12163E">
      {payload.value}
    </text>
  );
}
