import Card from "../common/Card";
import EmptyState from "../common/EmptyState";

export default function JobsDueThisWeek({ jobs = [], onSelectJob }) {
  const dueJobs = [...jobs].filter((job) => job.dueDate).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 7);

  return (
    <Card title="Jobs Due This Week" actions={dueJobs.length ? <button type="button" style={viewAllStyle}>View all</button> : null}>
      {dueJobs.length === 0 ? <EmptyState icon="🧵" title="Nothing Due" message="No garments are due this week." /> : (
        <div style={listStyle}>
          {dueJobs.map((job) => <JobRow key={job.id ?? job.reference ?? `${job.name}-${job.dueDate}`} job={job} onSelectJob={onSelectJob} />)}
        </div>
      )}
    </Card>
  );
}

function JobRow({ job, onSelectJob }) {
  const colour = job.overdue ? "#B42318" : job.dueToday ? "#B54708" : "#9A2348";
  return (
    <div style={rowStyle}>
      <div style={jobInfoStyle}>
        <strong>{job.reference || job.name || job.title || "Job"}</strong>
        <span>{job.clientName || job.client || ""}</span>
      </div>
      <span style={dateStyle}>{formatDate(job.dueDate)}</span>
      <span style={{ ...statusStyle, color: colour }}>{job.overdue ? "Overdue" : formatStatus(job)}</span>
    </div>
  );
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "—";
  return date.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

function formatStatus(job) {
  if (job.dueToday) return "Due today";
  return job.status || "Scheduled";
}

const listStyle = { display: "flex", flexDirection: "column" };
const rowStyle = { display: "grid", gridTemplateColumns: "minmax(0,1fr) 74px 82px", alignItems: "center", gap: 12, minHeight: 51, padding: "0 4px", borderBottom: "1px solid #ECEEEF" };
const jobInfoStyle = { display: "flex", flexDirection: "column", gap: 3, minWidth: 0 };
const dateStyle = { color: "#8B1E3F", fontSize: 12, fontWeight: 700, textAlign: "right" };
const statusStyle = { fontSize: 11, fontWeight: 700, textAlign: "right" };
const viewAllStyle = { border: 0, background: "transparent", color: "#9A2348", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0 };
