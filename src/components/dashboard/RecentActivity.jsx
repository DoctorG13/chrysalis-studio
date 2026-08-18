import Card from "../common/Card";
import EmptyState from "../common/EmptyState";

import { getRecentActivity } from "../../utils/dashboard";

export default function RecentActivity({ clients = [], jobs = [] }) {
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
        client: job.clientName ?? job.client ?? "",
        title: getTitle(job),
        description: getDescription(job),
        date:
          job.updatedAt ??
          job.completedAt ??
          job.collectedAt ??
          job.dueDate ??
          new Date().toISOString(),
      })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  return (
    <Card title="Recent Activity">
      {activity.length === 0 ? (
        <EmptyState
          icon="📝"
          title="No Recent Activity"
          message="As you work throughout the day, activity will appear here."
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {activity.map((item) => (
            <ActivityRow key={item.id} item={item} />
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
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        alignItems: "center",
        gap: 12,
        padding: "9px 12px",
        border: "1px solid #E5E7EB",
        borderRadius: 8,
        background: "#FFF",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          {item.reference && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#8B1E3F",
                letterSpacing: 0.6,
                whiteSpace: "nowrap",
              }}
            >
              {item.reference}
            </span>
          )}
          <span style={{ fontWeight: 600 }}>{item.title}</span>
        </div>
        {item.client && (
          <span style={{ fontSize: 12, color: "#777" }}>{item.client}</span>
        )}
        {item.description && (
          <span style={{ fontSize: 12, color: "#666", marginLeft: 8 }}>
            · {item.description}
          </span>
        )}
      </div>

      <div style={{ fontSize: 11, color: "#999", whiteSpace: "nowrap" }}>
        {formatActivityDate(item.date)}
      </div>
    </div>
  );
}

function getTitle(job) {
  if (job.overdue) return `🔴 ${job.name} is overdue`;
  if (job.dueToday) return `🟠 ${job.name} is due today`;
  if (job.status === "Ready") return `🟢 ${job.name} is ready for collection`;
  if (job.status === "Collected") return `📦 ${job.name} was collected`;
  if (job.status === "Completed") return `✅ ${job.name} completed`;
  return job.name;
}

function getDescription(job) {
  if (job.overdue) return `Next: ${job.nextAction || "-"}`;
  if (job.dueToday) return `Due today · ${job.progress ?? 0}% complete`;
  if (job.status === "Ready") return "Waiting for collection";
  if (job.status === "Collected") return "Customer collected garment";
  if (job.status === "Completed") return "Workflow completed";
  return "";
}

function formatActivityDate(value) {
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString("en-AU");
}
