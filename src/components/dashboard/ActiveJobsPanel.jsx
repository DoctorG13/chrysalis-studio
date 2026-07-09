import Card from "../common/Card";
import EmptyState from "../common/EmptyState";

export default function ActiveJobsPanel({
  jobs = [],
  onSelectJob,
}) {
  const activeJobs = [...jobs]
    .filter(
      (job) =>
        !["Completed", "Collected", "Cancelled"].includes(job.status)
    )
    .sort((a, b) => {
      const score = (job) => {
        if (job.overdue) return 0;
        if (job.dueToday) return 1;
        if (job.needsAttention) return 2;
        return 3;
      };

      if (score(a) !== score(b)) {
        return score(a) - score(b);
      }

      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;

      return new Date(a.dueDate) - new Date(b.dueDate);
    });

  return (
    <Card title="Active Jobs">
      {activeJobs.length === 0 ? (
        <EmptyState
          icon="🧵"
          title="No Active Jobs"
          message="Everything has been completed."
        />
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {activeJobs.map((job) => (
            <JobRow
              key={job.id ?? job.reference ?? job.name}
              job={job}
              onClick={() => onSelectJob?.(job)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function JobRow({ job, onClick }) {
  const colour = job.overdue
    ? "#DC2626"
    : job.dueToday
      ? "#EA580C"
      : job.needsAttention
        ? "#CA8A04"
        : "#16A34A";

  return (
    <div
      onClick={onClick}
      style={{
        cursor: "pointer",
        borderLeft: `6px solid ${colour}`,
        borderRadius: 10,
        background: "#fff",
        padding: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <strong>{job.name}</strong>

        <strong>{job.progress ?? 0}%</strong>
      </div>

      <div
        style={{
          marginTop: 6,
          color: "#666",
        }}
      >
        {job.status}
      </div>

      <div
        style={{
          marginTop: 6,
          color: "#666",
        }}
      >
        Next: {job.nextAction}
      </div>

      <div
        style={{
          height: 8,
          background: "#E5E7EB",
          borderRadius: 999,
          overflow: "hidden",
          marginTop: 12,
        }}
      >
        <div
          style={{
            width: `${job.progress ?? 0}%`,
            height: "100%",
            background: colour,
          }}
        />
      </div>

      {job.dueDate && (
        <div
          style={{
            marginTop: 10,
            fontSize: 12,
            color: "#777",
          }}
        >
          Due: {job.dueDate}
        </div>
      )}
    </div>
  );
}