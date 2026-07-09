import Card from "../common/Card";
import EmptyState from "../common/EmptyState";

export default function JobsDueThisWeek({
  jobs = [],
}) {
  const dueJobs = [...jobs]
    .filter((job) => job.dueDate)
    .sort(
      (a, b) =>
        new Date(a.dueDate) - new Date(b.dueDate)
    )
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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {dueJobs.map((job) => (
            <JobRow
              key={
                job.id ??
                job.reference ??
                `${job.name}-${job.dueDate}`
              }
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
    ? "🔴 Overdue"
    : job.dueToday
      ? "🟠 Due Today"
      : "🟢 Scheduled";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderRadius: 10,
        background: "#FFFFFF",
        border: `2px solid ${borderColour}`,
      }}
    >
      <div
        style={{
          flex: 1,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            marginBottom: 6,
          }}
        >
          {job.name}
        </div>

        <div
          style={{
            fontSize: 13,
            color: "#666",
            marginBottom: 4,
          }}
        >
          {job.status}
        </div>

        <div
          style={{
            fontSize: 13,
            color: "#666",
            marginBottom: 8,
          }}
        >
          Next: {job.nextAction || "-"}
        </div>

        <div
          style={{
            width: "100%",
            maxWidth: 220,
            height: 8,
            background: "#E5E7EB",
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${job.progress ?? 0}%`,
              height: "100%",
              background: borderColour,
            }}
          />
        </div>

        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            color: "#666",
          }}
        >
          {job.progress ?? 0}% Complete
        </div>
      </div>

      <div
        style={{
          textAlign: "right",
          marginLeft: 20,
        }}
      >
        <div
          style={{
            fontWeight: 700,
          }}
        >
          {job.dueDate}
        </div>

        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            fontWeight: 600,
            color: borderColour,
          }}
        >
          {badge}
        </div>
      </div>
    </div>
  );
}