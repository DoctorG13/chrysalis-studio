import Card from "../common/Card";
import EmptyState from "../common/EmptyState";

import { getRecentActivity } from "../../utils/dashboard";

export default function RecentActivity({
  clients = [],
  jobs = [],
}) {
  const activity = [
    ...getRecentActivity(clients),

    ...jobs
      .filter(
        (job) =>
          job.overdue ||
          job.dueToday ||
          job.status === "Completed" ||
          job.status === "Collected" ||
          job.status === "Ready"
      )
      .map((job) => ({
  id: `job-${job.id ?? job.reference ?? job.name}`,

  reference: job.reference,

  client:
    job.clientName ??
    job.client ??
    "",

  title: getTitle(job),

  description: getDescription(job),

  date:
    job.updatedAt ??
    job.completedAt ??
    job.collectedAt ??
    job.dueDate ??
    new Date().toISOString(),
})),
  ].sort(
    (a, b) =>
      new Date(b.date) - new Date(a.date)
  );

  return (
    <Card title="Recent Activity">
      {activity.length === 0 ? (
        <EmptyState
          icon="📝"
          title="No Recent Activity"
          message="As you work throughout the day, activity will appear here."
        />
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {activity.map((item) => (
            <ActivityRow
              key={item.id}
              item={item}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function ActivityRow({ item }) {
  return (
    <div
      style={{
        padding: 16,
        border: "1px solid #E5E7EB",
        borderRadius: 10,
        background: "#FFF",
      }}
    >
      <div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: 4,
  }}
>
  {item.reference && (
    <div
      style={{
        fontSize: 12,
        fontWeight: 700,
        color: "#8B1E3F",
        letterSpacing: 1,
      }}
    >
      {item.reference}
    </div>
  )}

  <div
    style={{
      fontWeight: 600,
    }}
  >
    {item.title}
  </div>

  {item.client && (
    <div
      style={{
        fontSize: 13,
        color: "#777",
      }}
    >
      {item.client}
    </div>
  )}
</div>

      {item.description && (
        <div
          style={{
            marginTop: 6,
            color: "#666",
            lineHeight: 1.5,
          }}
        >
          {item.description}
        </div>
      )}

      <div
  style={{
    marginTop: 8,
    fontSize: 12,
    color: "#999",
  }}
>
  {formatActivityDate(item.date)}
</div>

    </div>
  );
}

function getTitle(job) {
  if (job.overdue) {
    return `🔴 ${job.name} is overdue`;
  }

  if (job.dueToday) {
    return `🟠 ${job.name} is due today`;
  }

  if (job.status === "Ready") {
    return `🟢 ${job.name} is ready for collection`;
  }

  if (job.status === "Collected") {
    return `📦 ${job.name} was collected`;
  }

  if (job.status === "Completed") {
    return `✅ ${job.name} completed`;
  }

  return job.name;
}

function getDescription(job) {
  if (job.overdue) {
    return `Next action: ${job.nextAction}`;
  }

  if (job.dueToday) {
    return `Due today • ${job.progress}% complete`;
  }

  if (job.status === "Ready") {
    return "Waiting for customer collection.";
  }

  if (job.status === "Collected") {
    return "Customer has collected their garment.";
  }

  if (job.status === "Completed") {
    return "Workflow successfully completed.";
  }

  return "";
}

function formatActivityDate(value) {
  if (!value) return "Unknown date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleString("en-AU");
}