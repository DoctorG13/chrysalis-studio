import Card from "../common/Card";

export default function TodaysWorkPanel({
  jobs = [],
  onSelectJob,
}) {
  const items = jobs
    .filter(
      (job) =>
        job.overdue ||
        job.dueToday ||
        job.needsAttention ||
        job.status === "Ready"
    )
    .slice(0, 8);

  return (
    <Card title="🦋 Today's Work">
      {items.length === 0 ? (
        <p style={{ margin: 0, color: "#666" }}>
          Nothing urgent today. Great work!
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 12,
          }}
        >
          {items.map((job) => (
            <div
              key={job.id}
              onClick={() => onSelectJob?.(job)}
              style={{
                padding: 14,
                borderRadius: 10,
                border: "1px solid #E5E7EB",
                cursor: "pointer",
                background: "#FFF",
              }}
            >
              <strong>{job.name}</strong>

              <div
                style={{
                  marginTop: 4,
                  color: "#666",
                  fontSize: 14,
                }}
              >
                {job.nextAction}
              </div>

              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {job.overdue && "🔴 Overdue"}
                {!job.overdue &&
                  job.dueToday &&
                  "🟠 Due Today"}
                {!job.overdue &&
                  !job.dueToday &&
                  job.needsAttention &&
                  "🟡 Needs Attention"}
                {job.status === "Ready" &&
                  !job.overdue &&
                  !job.dueToday &&
                  "🟢 Ready for Collection"}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}