import { useMemo, useState } from "react";
import EmptyState from "../common/EmptyState";
import { getRecentActivity } from "../../utils/dashboard";

export default function RecentActivity({ clients = [], jobs = [] }) {
  const [showAll, setShowAll] = useState(false);

  const rawActivity = useMemo(() => [
    ...getRecentActivity(clients),
    ...jobs
      .filter((job) => job.overdue || job.dueToday || ["Completed", "Collected", "Ready"].includes(job.status))
      .map((job) => ({
        id: `job-${job.id ?? job.reference ?? job.name}`,
        reference: job.reference,
        client: job.clientName ?? job.client ?? "",
        title: getTitle(job),
        description: getDescription(job),
        date: job.updatedAt ?? job.completedAt ?? job.collectedAt ?? job.dueDate ?? new Date().toISOString(),
      })),
  ], [clients, jobs]);

  const groupedActivity = useMemo(
    () => groupActivity(rawActivity).sort((a, b) => new Date(b.date) - new Date(a.date)),
    [rawActivity]
  );
  const sortedRawActivity = useMemo(
    () => [...rawActivity].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [rawActivity]
  );
  const compactActivity = groupedActivity.slice(0, 4);
  const visibleActivity = showAll ? sortedRawActivity : compactActivity;
  const hasMore = rawActivity.length > compactActivity.length || groupedActivity.length > 4;

  return (
    <section style={sectionStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>Recent Activity</h2>
        {hasMore && (
          <button type="button" onClick={() => setShowAll((value) => !value)} style={viewAllStyle}>
            {showAll ? "Show less ↑" : "View all"}
          </button>
        )}
      </div>

      {rawActivity.length === 0 ? (
        <div style={emptyStyle}>
          <EmptyState icon="📝" title="No Recent Activity" message="Activity will appear here as you work." />
        </div>
      ) : (
        <div style={listStyle}>
          {visibleActivity.map((item, index) => <ActivityRow key={`${item.id ?? "activity"}-${index}`} item={item} isLast={index === visibleActivity.length - 1} />)}
        </div>
      )}
    </section>
  );
}

function groupActivity(items) {
  const groups = new Map();
  items.forEach((item) => {
    const key = [item.reference || "", item.client || "", item.title || "", item.description || ""].join("|");
    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, { ...item, id: `activity-${key}`, count: 1 });
      return;
    }
    existing.count += 1;
    if (new Date(item.date) > new Date(existing.date)) existing.date = item.date;
  });
  return Array.from(groups.values());
}

function ActivityRow({ item, isLast }) {
  return (
    <div style={{ ...rowStyle, borderBottom: isLast ? "0" : "1px solid #D9DEE2" }}>
      <div style={iconStyle}>{getActivityIcon(item)}</div>
      <div style={contentStyle}>
        <div style={titleLineStyle}>
          {item.reference && <span style={referenceStyle}>{item.reference}</span>}
          <strong>{cleanTitle(item.title)}</strong>
          {item.count > 1 && <span style={countStyle}>{item.count} updates</span>}
        </div>
        <div style={metaStyle}>{item.client}{item.description ? ` · ${item.description}` : ""}</div>
      </div>
      <span style={dateStyle}>{formatActivityDate(item.date)}</span>
    </div>
  );
}

function cleanTitle(title = "") {
  return title.replace(/^[^ ]+\s/, "");
}

function getActivityIcon(item) {
  if (item.title.includes("overdue")) return "🔴";
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
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return `Today, ${date.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })}`;
  return date.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

const sectionStyle = { background: "#FFFFFF", border: "1px solid #D9DEE2", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 4px rgba(31,41,51,.025)" };
const headerStyle = { minHeight: 44, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "0 15px", borderBottom: "1px solid #D9DEE2" };
const titleStyle = { margin: 0, color: "#20262B", fontSize: 17, lineHeight: 1.2 };
const viewAllStyle = { border: 0, background: "transparent", color: "#9A2348", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0 };
const listStyle = { padding: "0 10px" };
const rowStyle = { display: "grid", gridTemplateColumns: "28px minmax(0, 1fr) auto", alignItems: "center", gap: 9, minHeight: 56, padding: "0 4px" };
const iconStyle = { width: 27, textAlign: "center", fontSize: 16 };
const contentStyle = { minWidth: 0 };
const titleLineStyle = { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 };
const referenceStyle = { color: "#9A2348", fontSize: 10, fontWeight: 800, letterSpacing: .35 };
const countStyle = { padding: "2px 6px", borderRadius: 999, background: "#F3F4F6", color: "#687178", fontSize: 10, fontWeight: 700 };
const metaStyle = { marginTop: 2, color: "#707980", fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const dateStyle = { color: "#8A9298", fontSize: 10, whiteSpace: "nowrap" };
const emptyStyle = { padding: 16 };
