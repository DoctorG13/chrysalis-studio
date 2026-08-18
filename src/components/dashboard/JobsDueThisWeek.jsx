import Card from "../common/Card";
import EmptyState from "../common/EmptyState";

export default function JobsDueThisWeek({ jobs = [] }) {
  const dueJobs = [...jobs]
    .filter((job) => job.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 7);

  return (
    <Card title="Jobs Due This Week">
      {dueJobs.length === 0 ? (
        <EmptyState
          icon="🧵"
          title="Nothing Due"
          message="No garments are due this week."
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {dueJobs.map((job) => (
            <JobRow
              key={job.id ?? job.reference ?? `${job.name}-${job.dueDate}`}
              job={job}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function JobRow({ job }) {
  const borderColour = job.overdue
    ? "#DC2626"
    : job.dueToday
      ? "#EA580C"
      : "#16A34A";

  const badge = job.overdue
    ? "Overdue"
    : job.dueToday
      ? "Due Today"
      : "Scheduled";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        alignItems: "center",
        gap: 16,
        padding: "10px 12px",
        borderRadius: 8,
        background: "#FFFFFF",
        borderLeft: `3px solid ${borderColour}`,
        borderTop: "1px solid #E5E7EB",
        borderRight: "1px solid #E5E7EB",
        borderBottom: "1px solid #E5E7EB",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 700, marginBottom: 2 }}>{job.name}</div>
        <div style={{ fontSize: 12, color: "#777" }}>
          {job.status} · Next: {job.nextAction || "-"}
          {job.progress !== undefined ? ` · ${job.progress}%` : ""}
        </div>
      </div>

      <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
        <div style={{ fontWeight: 700, fontSize: 13 }}>{job.dueDate}</div>
        <div
          style={{
            marginTop: 2,
            fontSize: 11,
            fontWeight: 700,
            color: borderColour,
          }}
        >
          {badge}
        </div>
      </div>
    </div>
  );
}
