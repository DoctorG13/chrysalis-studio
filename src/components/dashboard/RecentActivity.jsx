import { useMemo, useState } from "react";
import Card from "../common/Card";
import EmptyState from "../common/EmptyState";
import { getRecentActivity } from "../../utils/dashboard";

export default function RecentActivity({ clients = [], jobs = [] }) {
  const [showAll, setShowAll] = useState(false);

  const rawActivity = useMemo(() => [
    ...getRecentActivity(clients),
    ...jobs.filter((job) => job.overdue || job.dueToday || ["Completed", "Collected", "Ready"].includes(job.status)).map((job) => ({
      id: `job-${job.id ?? job.reference ?? job.name}`,
      reference: job.reference,
      client: job.clientName ?? job.client ?? "",
      title: getTitle(job),
      description: getDescription(job),
      date: job.updatedAt ?? job.completedAt ?? job.collectedAt ?? job.dueDate ?? new Date().toISOString(),
    })),
  ], [clients, jobs]);

  const groupedActivity = useMemo(() => groupActivity(rawActivity).sort((a, b) => new Date(b.date) - new Date(a.date)), [rawActivity]);
  const sortedRawActivity = useMemo(() => [...rawActivity].sort((a, b) => new Date(b.date) - new Date(a.date)), [rawActivity]);
  const compactActivity = groupedActivity.slice(0, 5);
  const visibleActivity = showAll ? sortedRawActivity : compactActivity;
  const hasMore = rawActivity.length > compactActivity.length || groupedActivity.length > 5;

  return (
    <Card title="Recent Activity" actions={hasMore ? <button type="button" onClick={() => setShowAll((value) => !value)} style={viewAllStyle}>{showAll ? "Show less ↑" : "View all activity →"}</button> : null}>
      {rawActivity.length === 0 ? <EmptyState icon="📝" title="No Recent Activity" message="As you work throughout the day, activity will appear here." /> : (
        <div style={listStyle}>
          {visibleActivity.map((item, index) => <ActivityRow key={`${item.id ?? "activity"}-${index}`} item={item} />)}
        </div>
      )}
    </Card>
  );
}

function groupActivity(items) {
  const groups = new Map();
  items.forEach((item) => {
    const key = [item.reference || "", item.client || "", item.title || "", item.description || ""].join("|");
    const existing = groups.get(key);
    if (!existing) { groups.set(key, { ...item, id: `activity-${key}`, count: 1 }); return; }
    existing.count += 1;
    if (new Date(item.date) > new Date(existing.date)) existing.date = item.date;
  });
  return Array.from(groups.values());
}

function ActivityRow({ item }) {
  return (
    <div style={rowStyle}>
      <div style={iconStyle}>{getActivityIcon(item)}</div>
      <div style={contentStyle}>
        <div style={titleLineStyle}>
          {item.reference && <span style={referenceStyle}>{item.reference}</span>}
          <strong>{item.title.replace(/^[^ ]+\s/, "")}</strong>
          {item.count > 1 && <span style={countStyle}>{item.count} updates</span>}
        </div>
        <div style={metaStyle}>{item.client}{item.description ? ` · ${item.description}` : ""}</div>
      </div>
      <span style={dateStyle}>{formatActivityDate(item.date)}</span>
    </div>
  );
}

function getActivityIcon(item) {
  if (item.title.includes("overdue")) return "●";
  if (item.title.includes("Fitting")) return "👗";
  if (item.title.includes("Payment")) return "💰";
  if (item.title.includes("Appointment")) return "📅";
  return "💼";
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
  if (job.overdue) return `Next action: ${job.nextAction || "-"}`;
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
  return date.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

const listStyle = { display: "flex", flexDirection: "column" };
const rowStyle = { display: "grid", gridTemplateColumns: "30px minmax(0,1fr) auto", alignItems: "center", gap: 10, minHeight: 58, padding: "0 4px", borderBottom: "1px solid #ECEEEF" };
const iconStyle = { width: 28, textAlign: "center", fontSize: 17 };
const contentStyle = { minWidth: 0 };
const titleLineStyle = { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 7 };
const referenceStyle = { color: "#9A2348", fontSize: 10, fontWeight: 800, letterSpacing: .4 };
const countStyle = { padding: "2px 6px", borderRadius: 999, background: "#F3F4F6", color: "#687178", fontSize: 10, fontWeight: 700 };
const metaStyle = { marginTop: 3, color: "#707980", fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const dateStyle = { color: "#8A9298", fontSize: 10, whiteSpace: "nowrap" };
const viewAllStyle = { border: 0, background: "transparent", color: "#9A2348", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0 };
