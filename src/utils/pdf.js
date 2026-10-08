import { toColombo } from "./date";
import { minutesToHM, minutesToHours } from "./time";
import { byLoggedTime } from "./entries";
import { drawChart, buildTimeChart } from "./chart";
import { projectColor } from "../constants/projects";
import { LOGO_SRC } from "../constants/logo";

export async function downloadReportPdf(filename, from, to, rows) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const PW = 210, PH = 297, M = 14, CW = PW - 2 * M;
  const BRAND = [53, 71, 224];
  let y = M;

  const ensure = (h) => { if (y + h > PH - 16) { doc.addPage(); y = M; } };
  const heading = (text) => {
    ensure(16);
    doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(18, 22, 62);
    doc.text(text, M, y + 5); y += 9;
  };
  const addChart = (chart) => {
    const h = (CW * chart.height) / chart.width;
    ensure(h + 4);
    doc.addImage(chart.url, "PNG", M, y, CW, h, undefined, "FAST");
    y += h + 6;
  };
  const table = (head, body, opts = {}) => {
    autoTable(doc, {
      startY: y, head: [head], body, margin: { left: M, right: M },
      styles: { fontSize: 8.5, cellPadding: 2 }, headStyles: { fillColor: BRAND }, ...opts,
    });
    y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : y) + 8;
  };

  // ---- Header ----
  try {
    const p = doc.getImageProperties(LOGO_SRC);
    const lh = 11;
    doc.addImage(LOGO_SRC, "PNG", M, y, (lh * p.width) / p.height, lh, undefined, "FAST");
    y += lh + 6;
  } catch (e) { /* logo is optional */ }
  doc.setFont("helvetica", "bold"); doc.setFontSize(17); doc.setTextColor(18, 22, 62);
  doc.text("Time Tracking Report", M, y + 5); y += 9;
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(91, 95, 130);
  doc.text(`Period: ${from === to ? from : `${from} to ${to}`}`, M, y + 4); y += 5;
  doc.text(`Generated: ${toColombo(new Date().toISOString())} (Sri Lanka time)`, M, y + 4); y += 10;

  // ---- Numbers ----
  const byEmp = {}, byProj = {}, countEmp = {}, countProj = {};
  rows.forEach((r) => {
    byEmp[r.employee] = (byEmp[r.employee] || 0) + r.minutes;
    byProj[r.project] = (byProj[r.project] || 0) + r.minutes;
    countEmp[r.employee] = (countEmp[r.employee] || 0) + 1;
    countProj[r.project] = (countProj[r.project] || 0) + 1;
  });
  const empList = Object.entries(byEmp).sort((a, b) => b[1] - a[1]);
  const projList = Object.entries(byProj).sort((a, b) => b[1] - a[1]);
  const totalMin = rows.reduce((s, r) => s + r.minutes, 0);

  table(
    ["Total hours", "Entries", "Employees", "Projects"],
    [[minutesToHours(totalMin), String(rows.length), String(empList.length), String(projList.length)]],
    { styles: { fontSize: 13, cellPadding: 3, halign: "center", fontStyle: "bold" }, headStyles: { fillColor: BRAND, fontSize: 9, halign: "center" } }
  );

  // ---- Charts ----
  heading("Hours by employee and client");
  const empNames = empList.map((e) => e[0]);
  const empProjSeries = projList.map(([p]) => ({
    name: p,
    color: projectColor(p),
    values: empNames.map((emp) => Number((rows.filter((r) => r.employee === emp && r.project === p).reduce((s, r) => s + r.minutes, 0) / 60).toFixed(2))),
  }));
  addChart(drawChart({ title: "Hours by employee and client", stacked: true, categories: empNames, series: empProjSeries }));

  // ---- Work details per employee ----
  heading("Work details by employee");
  empList.forEach(([emp, mins]) => {
    const list = rows
      .filter((r) => r.employee === emp)
      .sort(byLoggedTime);
    ensure(30);
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(18, 22, 62);
    doc.text(`${emp}  -  ${minutesToHM(mins)}`, M, y + 4); y += 6;
       table(
      ["Client", "Task done", { content: "Duration", styles: { halign: "center" } }, "Logged at", "Justification (over 30 min)"],
      list.map((e) => [
        e.project,
        e.description || "-",
        minutesToHM(e.minutes),
        toColombo(e.createdAt).slice(0, 16),
        e.minutes > 30 ? (e.justification || "Not provided") : "-",
      ]),
      {
        styles: { fontSize: 8, cellPadding: 1.8, overflow: "linebreak" },
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: 42 },
          2: { cellWidth: 18, halign: "center" },
          3: { cellWidth: 30 },
        },
        didParseCell: (d) => {
          if (d.section === "body" && d.column.index === 4 && d.cell.raw === "Not provided") d.cell.styles.textColor = [194, 59, 59];
        },
      }
    );
  });

  heading("Hours by project");
  addChart(drawChart({ title: "Hours by project", color: "#C9821F", categories: projList.map((p) => p[0]), series: [{ name: "Hours", values: projList.map((p) => Number(minutesToHours(p[1]))) }] }));

  const names = empList.map((e) => e[0]);
  const timeData = buildTimeChart(rows, names, "hour");
  if (timeData.length) {
    heading("Employee work logs by hour of the day");
    addChart(drawChart({
      title: "Hours by hour of the day", stacked: true,
      categories: timeData.map((r) => r.display),
      series: names.map((n, i) => ({ name: n, values: timeData.map((r) => r[`s${i}`] || 0) })),
    }));
  }

  // ---- Summary tables ----
  const center = (t) => ({ content: t, styles: { halign: "center" } });

  heading("Employee summary");
  table(["Employee", center("Time"), center("Entries")],
    empList.map(([n, m]) => [n, minutesToHM(m), String(countEmp[n])]),
    { columnStyles: { 1: { halign: "center" }, 2: { halign: "center" } } });

  heading("Project summary");
  table(["Project", center("Time"), center("Entries")],
    projList.map(([n, m]) => [n, minutesToHM(m), String(countProj[n])]),
    { columnStyles: { 1: { halign: "center" }, 2: { halign: "center" } } });

  // ---- Page numbers ----
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(148, 152, 184);
    doc.text(`Page ${i} of ${pages}`, PW - M, PH - 8, { align: "right" });
    doc.text("BladeGen Time Tracker", M, PH - 8);
  }

  doc.save(filename);
}
