import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList, ResponsiveContainer } from "recharts";
import { ymd, startOfWeek, startOfMonth, endOfMonth, addDays, fmtDayShort } from "../../utils/date";
import { minutesToHM, minutesToHours } from "../../utils/time";
import { buildTimeChart } from "../../utils/chart";
import { employeeColor } from "../../constants/chart";
import { MetricCard } from "../common/MetricCard";
import { EmptyState } from "../common/EmptyState";
import { StackTooltip } from "./StackTooltip";
import { SegmentLabel } from "./SegmentLabel";

export function ReportsTab({ employees, entries, isAdmin, me }) {
  const [rangeMode, setRangeMode] = useState("today");
  const [customStart, setCustomStart] = useState(ymd(startOfWeek(new Date())));
  const [customEnd, setCustomEnd] = useState(ymd(new Date()));
  const [filterEmployee, setFilterEmployee] = useState("all");
  const [filterProject, setFilterProject] = useState("");
  const [timeView, setTimeView] = useState("hour");

  const { start, end } = useMemo(() => {
    const today = new Date();
    if (rangeMode === "today") return { start: ymd(today), end: ymd(today) };
    if (rangeMode === "yesterday") { const y = addDays(today, -1); return { start: ymd(y), end: ymd(y) }; }
    if (rangeMode === "week") return { start: ymd(startOfWeek(today)), end: ymd(addDays(startOfWeek(today), 6)) };
    if (rangeMode === "lastWeek") { const s = addDays(startOfWeek(today), -7); return { start: ymd(s), end: ymd(addDays(s, 6)) }; }
    if (rangeMode === "month") return { start: ymd(startOfMonth(today)), end: ymd(endOfMonth(today)) };
    if (rangeMode === "all") return { start: "0000-01-01", end: "9999-12-31" };
    return { start: customStart, end: customEnd };
  }, [rangeMode, customStart, customEnd]);

  const filtered = entries.filter((e) =>
    (isAdmin ? (filterEmployee === "all" || e.employee === filterEmployee) : true) &&
    (!filterProject.trim() || e.project.toLowerCase().includes(filterProject.trim().toLowerCase())) &&
    e.date >= start && e.date <= end
  );

  const totalMinutes = filtered.reduce((s, e) => s + e.minutes, 0);
  const byEmployee = {};
  const byProject = {};
  filtered.forEach((e) => {
    byEmployee[e.employee] = (byEmployee[e.employee] || 0) + e.minutes;
    byProject[e.project] = (byProject[e.project] || 0) + e.minutes;
  });
  const employeeData = Object.entries(byEmployee).sort((a, b) => b[1] - a[1]).map(([name, mins]) => ({ name, hours: Number(minutesToHours(mins)) }));
  const projectData = Object.entries(byProject).sort((a, b) => b[1] - a[1]).map(([name, mins]) => ({ name, hours: Number(minutesToHours(mins)) }));
  const chartEmployees = [
  ...employees.filter((n) => byEmployee[n]),
  ...Object.keys(byEmployee).filter((n) => !employees.includes(n)),
  ];
  const timeData = buildTimeChart(filtered, chartEmployees, timeView);

  return (
    <div>
      <div className="card" style={{ padding: 14, marginBottom: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
        <div>
          <label style={{ fontSize: 11, color: "var(--ink-soft)" }}>Date range</label>
          <select className="field" value={rangeMode} onChange={(e) => setRangeMode(e.target.value)} style={{ marginTop: 4 }}>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This week</option>
            <option value="lastWeek">Last week</option>
            <option value="month">This month</option>
            <option value="all">All time</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        {rangeMode === "custom" && (
          <>
            <div><label style={{ fontSize: 11, color: "var(--ink-soft)" }}>From</label><input type="date" className="field" value={customStart} onChange={(e) => setCustomStart(e.target.value)} style={{ marginTop: 4 }} /></div>
            <div><label style={{ fontSize: 11, color: "var(--ink-soft)" }}>To</label><input type="date" className="field" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} style={{ marginTop: 4 }} /></div>
          </>
        )}
        <div>
          <label style={{ fontSize: 11, color: "var(--ink-soft)" }}>Employee</label>
          {isAdmin ? (
            <select className="field" value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)} style={{ marginTop: 4 }}>
              <option value="all">All employees</option>
              {employees.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          ) : (
            <div className="field" style={{ marginTop: 4, background: "var(--paper)", color: "var(--ink-soft)" }}>{me || "You"} only</div>
          )}
        </div>
        <div>
          <label style={{ fontSize: 11, color: "var(--ink-soft)" }}>Project contains</label>
          <input className="field" placeholder="Filter by project" value={filterProject} onChange={(e) => setFilterProject(e.target.value)} style={{ marginTop: 4 }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 18 }}>
        <MetricCard label="Total hours" value={minutesToHours(totalMinutes)} />
        <MetricCard label="Entries" value={filtered.length} />
        <MetricCard label="Employees active" value={Object.keys(byEmployee).length} />
        <MetricCard label="Projects" value={Object.keys(byProject).length} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No entries in this range" body="Try a wider date range or different filters." />
      ) : (
        <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Hours by employee</div>
            <ResponsiveContainer width="100%" height={Math.max(160, employeeData.length * 34)}>
              <BarChart data={employeeData} layout="vertical" margin={{ left: -20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E5F0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#5B5F82" }} />
                <YAxis type="category" dataKey="name" width={90} interval={0} tick={{ fontSize: 11, fill: "#12163E" }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid #E2E5F0" }} />
                <Bar dataKey="hours" fill="#3547E0" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                  <LabelList dataKey="hours" position="right" formatter={(v) => `${v}h`} isAnimationActive={false} style={{ fontSize: 11, fill: "#12163E", fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Hours by project</div>
            <ResponsiveContainer width="100%" height={Math.max(160, projectData.length * 34)}>
              <BarChart data={projectData} layout="vertical" margin={{ left: -55, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E5F0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#5B5F82" }} />
                <YAxis type="category" dataKey="name" width={150} interval={0} tick={{ fontSize: 11, fill: "#12163E" }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid #E2E5F0" }} />
                <Bar dataKey="hours" fill="#C9821F" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                  <LabelList dataKey="hours" position="right" formatter={(v) => `${v}h`} isAnimationActive={false} style={{ fontSize: 11, fill: "#12163E", fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card" style={{ padding: 16, marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Employee work logs {timeView === "hour" ? "by hour of the day" : "by day"}
              </div>
              <select className="field" value={timeView} onChange={(e) => setTimeView(e.target.value)} style={{ width: 170 }}>
                <option value="hour">By hour of the day</option>
                <option value="day">By day</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={420}>
              <BarChart data={timeData} margin={{ left: 0, right: 20, top: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E5F0" vertical={false} />
                <XAxis dataKey="display" interval={0} height={70} tick={{ fontSize: 11, fill: "#12163E" }}
                  label={{ value: timeView === "hour" ? "Hour of the day" : "Date", position: "insideBottom", offset: 0, style: { fontSize: 11, fill: "#5B5F82" } }} />
                <YAxis domain={[0, (max) => Math.ceil(max / 2)]} tick={{ fontSize: 11, fill: "#5B5F82" }}
                  label={{ value: "Hours", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "#5B5F82" } }} />
                <Tooltip content={<StackTooltip />} cursor={{ fill: "#EAEDFC" }} />
                <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
                {chartEmployees.map((name, i) => (
                <Bar key={name} dataKey={`s${i}`} name={name} stackId="hrs" fill={employeeColor(i)} stroke="#fff" strokeWidth={1} isAnimationActive={false}>
                  <LabelList dataKey={`s${i}`} content={<SegmentLabel />} />
                </Bar>
              ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
