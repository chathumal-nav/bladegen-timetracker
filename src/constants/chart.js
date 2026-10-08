export const CHART_COLORS = ["#3547E0", "#C9821F", "#2E9E6B", "#C23B3B", "#7A4FD1", "#16A3B8", "#D1569A", "#6B7280", "#9AAE2A", "#E0742F"];
export const paletteColor = (i) => (i < CHART_COLORS.length ? CHART_COLORS[i] : `hsl(${Math.round((i * 137.5) % 360)} 60% 45%)`);

export const EMP_COLORS = ["#E6194B", "#3CB44B", "#4363D8", "#F58231", "#911EB4", "#46F0F0", "#F032E6", "#BCF60C", "#008080", "#9A6324", "#000075", "#FFC800"];
export function employeeColor(i) {
  return i < EMP_COLORS.length ? EMP_COLORS[i] : `hsl(${Math.round((i * 137.5) % 360)} 65% 45%)`;
}
