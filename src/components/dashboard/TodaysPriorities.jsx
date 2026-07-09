import Card from "../common/Card";
import EmptyState from "../common/EmptyState";

export default function TodaysPriorities({
  jobs = [],
}) {
  const priorities = [...jobs]
    .filter(
      (job) =>
        job.overdue ||
        job.dueToday ||
        job.needsAttention
    )
    .sort((a, b) => {
      const score = (job) => {
        if (job.overdue) return 1;
        if (job.dueToday) return 2;
        if (job.needsAttention) return 3;
        return 99;
      };

      return score(a) - score(b);
    });

  return (
    <Card title="Today's Priorities">
      {priorities.length === 0 ? (
        <EmptyState
          icon="🎉"
          title="You're all caught up!"
          message="There are no urgent priorities today."
        />
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {priorities.map((job) => (
            <PriorityRow
              key={job.id ?? job.reference ?? job.name}
              job={job}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function PriorityRow({ job }) {
  let level = "info";
  let icon = "ℹ️";

  if (job.overdue) {
    level = "critical";
    icon = "🔴";
  } else if (job.dueToday) {
    level = "warning";
    icon = "🟠";
  } else if (job.needsAttention) {
    level = "success";
    icon = "🟡";
  }

  const styles = {
    critical: {
      border: "#DC2626",
      background: "#FEF2F2",
    },
    warning: {
      border: "#EA580C",
      background: "#FFF7ED",
    },
    info: {
      border: "#2563EB",
      background: "#EFF6FF",
    },
    success: {
      border: "#16A34A",
      background: "#F0FDF4",
    },
  };

  const style = styles[level];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: 16,
        borderLeft: `6px solid ${style.border}`,
        background: style.background,
        borderRadius: 10,
      }}
    >
      <strong>
        {icon} {job.name}
      </strong>

      <div>
        <strong>Status:</strong> {job.status}
      </div>

      <div>
        <strong>Next:</strong> {job.nextAction}
      </div>

      {job.dueDate && (
        <div>
          <strong>Due:</strong> {job.dueDate}
        </div>
      )}
    </div>
  );
}