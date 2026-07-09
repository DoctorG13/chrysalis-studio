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

        title: getTitle(job),

        description: getDescription(job),

        date: job.updatedAt ??
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
          fontWeight: 600,
        }}
      >
        {item.title}
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
        {new Date(item.date).toLocaleString("en-AU")}
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