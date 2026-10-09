export const PROJECT_COLORS = {
  "Real Estate Tool": "#515fdde7",
  "DeepDish": "#8055d4",
  "Social Listening": "#c0d838",
  "Revello": "#D1569A",
  "Denza": "#8E1B8E",
  "Stanley": "#1F2937",
  "Barista": "#884e17",
  "Upali's": "#77eb46",
  "W15": "#248d5e",
  "Roots": "#01978b",
  "Tilapiya": "#C23B3B",
  "StemLink": "#16A3B8",
  "Food Studio": "#6B7280",
  "Waves": "#f17528",
  "Celeste": "#e7a64b",
  "Salt House": "#F2C94C",
  "Police": "#a5960b",
};

export function projectColor(name) {
  if (PROJECT_COLORS[name]) return PROJECT_COLORS[name];
  let h = 0;
  for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(${h} 55% 45%)`;
}

export const PROJECTS = ["Real Estate Tool", "DeepDish", "Social Listening", "Revello", "Denza", "Stanley", "Barista", "Upali's", "W15", "Roots", "Tilapiya", "StemLink", "Food Studio", "Waves", "Celeste", "Salt House", "Police"];
