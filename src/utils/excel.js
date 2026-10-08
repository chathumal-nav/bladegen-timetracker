import { toColombo } from "./date";
import { drawChart } from "./chart";

export async function downloadXlsx(filename, rows) {
  const mod = await import("exceljs");
  const ExcelJS = mod.default || mod;
  const wb = new ExcelJS.Workbook();
  const toHours = (m) => Number((m / 60).toFixed(2));
  const styleHeader = (row) => {
    row.font = { bold: true, color: { argb: "FFFFFFFF" } };
    row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3547E0" } };
  };

  

  const employees = [...new Set(rows.map((r) => r.employee))].sort((a, b) => a.localeCompare(b));
  const projects = [...new Set(rows.map((r) => r.project))].sort((a, b) => a.localeCompare(b));
  const dates = [...new Set(rows.map((r) => r.date))].sort();

  // Sheet 1: raw entries
  const s1 = wb.addWorksheet("Entries");
  s1.columns = [
    { header: "Date", key: "date", width: 12 },
    { header: "Employee", key: "employee", width: 16 },
    { header: "Project", key: "project", width: 22 },
    { header: "Description", key: "description", width: 32 },
    { header: "Minutes", key: "minutes", width: 10 },
    { header: "Hours", key: "hours", width: 10, style: { numFmt: "0.00" } },
    { header: "Logged at", key: "createdAt", width: 26 },
  ];
  rows.forEach((e) => s1.addRow({ date: e.date, employee: e.employee, project: e.project, description: e.description || "", minutes: e.minutes, hours: toHours(e.minutes), createdAt: toColombo(e.createdAt) }));
  styleHeader(s1.getRow(1));

  // Sheet 2: hours per employee per project
  const s2 = wb.addWorksheet("Hours by Project");
  s2.columns = [{ width: 18 }, ...projects.map(() => ({ width: 16, style: { numFmt: "0.00" } })), { width: 12, style: { numFmt: "0.00" } }];
  styleHeader(s2.addRow(["Employee", ...projects, "Total"]));
  const projSeries = projects.map((p) => ({ name: p, values: [] }));
  employees.forEach((emp) => {
    const vals = projects.map((p) => toHours(rows.filter((r) => r.employee === emp && r.project === p).reduce((s, r) => s + r.minutes, 0)));
    vals.forEach((v, i) => projSeries[i].values.push(v));
    s2.addRow([emp, ...vals, Number(vals.reduce((a, b) => a + b, 0).toFixed(2))]);
  });
  const c2 = drawChart({ title: "Hours by employee and project", categories: employees, series: projSeries, stacked: true });
  s2.addImage(wb.addImage({ base64: c2.url.replace(/^data:image\/\w+;base64,/, ""), extension: "png" }), { tl: { col: 0, row: employees.length + 3 }, ext: { width: c2.width, height: c2.height } });

  // Sheet 3: daily totals per employee
  const s3 = wb.addWorksheet("Daily Totals");
  s3.columns = [{ width: 14 }, ...employees.map(() => ({ width: 14, style: { numFmt: "0.00" } })), { width: 12, style: { numFmt: "0.00" } }];
  styleHeader(s3.addRow(["Date", ...employees, "Total"]));
  const empSeries = employees.map((e) => ({ name: e, values: [] }));
  dates.forEach((d) => {
    const vals = employees.map((emp) => toHours(rows.filter((r) => r.date === d && r.employee === emp).reduce((s, r) => s + r.minutes, 0)));
    vals.forEach((v, i) => empSeries[i].values.push(v));
    s3.addRow([d, ...vals, Number(vals.reduce((a, b) => a + b, 0).toFixed(2))]);
  });
  const c3 = drawChart({ title: "Daily hours per employee", categories: dates, series: empSeries, stacked: false });
  s3.addImage(wb.addImage({ base64: c3.url.replace(/^data:image\/\w+;base64,/, ""), extension: "png" }), { tl: { col: 0, row: dates.length + 3 }, ext: { width: c3.width, height: c3.height } });

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
