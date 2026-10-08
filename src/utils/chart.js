import { minutesToHM } from "./time";
import { pad, fmtDayShort, LK_OFFSET_MS } from "./date";
import { paletteColor } from "../constants/chart";

export function drawChart({ title, categories, series, stacked = false, color }) {
  const colorOf = (si) => color || series[si]?.color || paletteColor(si);
  const scale = 2;
  const perCat = stacked ? 80 : Math.max(64, series.length * 30 + 20);
  const W = Math.min(1600, Math.max(760, categories.length * perCat + 120));
  const probe = document.createElement("canvas").getContext("2d");
  probe.font = "12px Arial";

  // legend layout (wraps onto several lines if needed)
  let lx = 0, ly = 0;
  const legend = series.map((s) => {
    const w = probe.measureText(s.name).width + 34;
    if (lx + w > W - 60) { lx = 0; ly += 20; }
    const item = { x: lx, y: ly };
    lx += w;
    return item;
  });
  const legendH = ly + 24;

  const top = 56, left = 56, right = 20, plotH = 280, bottom = 90 + legendH;
  const H = top + plotH + bottom;
  const plotW = W - left - right;

  const c = document.createElement("canvas");
  c.width = W * scale; c.height = H * scale;
  const ctx = c.getContext("2d");
  ctx.scale(scale, scale);
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#12163E"; ctx.font = "bold 15px Arial"; ctx.textAlign = "left";
  ctx.fillText(title, left, 28);

  // y scale
  const stackTotals = categories.map((_, i) => series.reduce((s, se) => s + (se.values[i] || 0), 0));
  const maxV = Math.max(...(stacked ? stackTotals : series.flatMap((se) => se.values)), 0.01);
  const raw = maxV / 5, mag = 10 ** Math.floor(Math.log10(raw)), norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const yMax = Math.ceil(maxV / step) * step;
  const yPos = (v) => top + plotH - (v / yMax) * plotH;

  ctx.font = "11px Arial"; ctx.textAlign = "right"; ctx.strokeStyle = "#E2E5F0"; ctx.lineWidth = 1;
  for (let v = 0; v <= yMax + 1e-9; v += step) {
    ctx.beginPath(); ctx.moveTo(left, yPos(v)); ctx.lineTo(left + plotW, yPos(v)); ctx.stroke();
    ctx.fillStyle = "#5B5F82"; ctx.fillText(String(Number(v.toFixed(2))), left - 8, yPos(v) + 4);
  }

  // value labels (hours and minutes)
  const fmt = (h) => minutesToHM(h * 60);
  const drawLabel = (text, cx, cy, inside) => {
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (inside) {
      ctx.lineWidth = 3; ctx.strokeStyle = "rgba(0,0,0,0.4)"; ctx.strokeText(text, cx, cy);
      ctx.fillStyle = "#fff";
    } else {
      ctx.fillStyle = "#12163E";
    }
    ctx.fillText(text, cx, cy);
    ctx.textBaseline = "alphabetic";
    ctx.lineWidth = 1;
  };

  // bars
  const groupW = plotW / categories.length;
  categories.forEach((cat, i) => {
    const gx = left + i * groupW;
    if (stacked) {
      const bw = groupW * 0.6;
      const bx = gx + (groupW - bw) / 2;
      let acc = 0;
      series.forEach((se, si) => {
        const v = se.values[i] || 0;
        if (v <= 0) return;
        ctx.fillStyle = colorOf(si);
        ctx.fillRect(bx, yPos(acc + v), bw, yPos(acc) - yPos(acc + v));
        const segH = yPos(acc) - yPos(acc + v);
        const text = fmt(v);
        ctx.font = "bold 10px Arial";
        if (segH >= 14 && ctx.measureText(text).width + 6 <= bw) {
          drawLabel(text, bx + bw / 2, yPos(acc + v) + segH / 2, true);
        }
        acc += v;
      });
      if (acc > 0) drawLabel(fmt(acc), bx + bw / 2, yPos(acc) - 9, false);
    } else {
      const bw = (groupW * 0.8) / series.length;
      series.forEach((se, si) => {
        const v = se.values[i] || 0;
        if (v <= 0) return;
        ctx.fillStyle = colorOf(si);
        const bx = gx + groupW * 0.1 + si * bw;
        ctx.fillRect(bx, yPos(v), bw - 1, yPos(0) - yPos(v));
        const text = fmt(v);
        ctx.font = "bold 10px Arial";
        if (ctx.measureText(text).width <= bw + 8) drawLabel(text, bx + (bw - 1) / 2, yPos(v) - 9, false);
      });
    }
    // x label
    const label = cat.length > 14 ? cat.slice(0, 13) + "…" : cat;
    ctx.save();
    ctx.translate(gx + groupW / 2, top + plotH + 14);
    ctx.fillStyle = "#12163E"; ctx.font = "11px Arial";
    if (groupW < 80) { ctx.rotate(-Math.PI / 4); ctx.textAlign = "right"; } else { ctx.textAlign = "center"; }
    ctx.fillText(label, 0, 0);
    ctx.restore();
  });

  // legend
  const legendTop = top + plotH + 80;
  ctx.font = "12px Arial"; ctx.textAlign = "left";
  series.forEach((se, si) => {
    const p = legend[si];
    ctx.fillStyle = colorOf(si);
    ctx.fillRect(left + p.x, legendTop + p.y, 12, 12);
    ctx.fillStyle = "#12163E";
    ctx.fillText(se.name, left + p.x + 18, legendTop + p.y + 11);
  });

  return { url: c.toDataURL("image/png"), width: W, height: H };
}

// mode "hour": total hours per hour of the day. mode "day": total hours per date.
export function buildTimeChart(entries, names, mode) {
  const rows = {};
  const add = (label, emp, mins) => {
    const idx = names.indexOf(emp);
    if (idx < 0) return;
    if (!rows[label]) rows[label] = { label };
    rows[label][`s${idx}`] = (rows[label][`s${idx}`] || 0) + mins / 60;
  };

  entries.forEach((e) => {
    if (mode === "day") { add(e.date, e.employee, e.minutes); return; }
    // The work is placed in the period ending when the entry was logged (Sri Lanka time)
    const end = new Date(e.createdAt).getTime();
    if (isNaN(end)) return;
    let t = end - e.minutes * 60000;
    while (t < end) {
      const local = t + LK_OFFSET_MS;
      const nextHour = Math.floor(local / 3600000) * 3600000 + 3600000 - LK_OFFSET_MS;
      const seg = Math.min(end, nextHour) - t;
      add(`${pad(new Date(local).getUTCHours())}:00`, e.employee, seg / 60000);
      t += seg;
    }
  });

  let labels = Object.keys(rows).sort();
  if (mode === "hour" && labels.length) {
    const first = parseInt(labels[0], 10), last = parseInt(labels[labels.length - 1], 10);
    labels = Array.from({ length: last - first + 1 }, (_, i) => `${pad(first + i)}:00`);
  }
  return labels.map((l) => {
    const row = { ...(rows[l] || { label: l }) };
    Object.keys(row).forEach((k) => { if (k !== "label") row[k] = Number(row[k].toFixed(2)); });
    row.display = mode === "day" ? fmtDayShort(new Date(l + "T00:00:00")) : l;
    row.total = Number(
      Object.keys(row).filter((k) => /^s\d+$/.test(k)).reduce((s, k) => s + row[k], 0).toFixed(2)
    );
    return row;
  });
}
