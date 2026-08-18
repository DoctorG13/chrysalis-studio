import { useMemo, useState } from "react";

import Card from "../common/Card";
import EmptyState from "../common/EmptyState";

import { getRecentActivity } from "../../utils/dashboard";

export default function RecentActivity({ clients = [], jobs = [] }) {
  const [showAll, setShowAll] = useState(false);

  const rawActivity = useMemo(
    () => [
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
    ],
    [clients, jobs]
  );

  const groupedActivity = useMemo(
    () =>
      groupActivity(rawActivity).sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      ),
    [rawActivity]
  );

  const sortedRawActivity = useMemo(
    () =>
      [...rawActivity].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      ),
    [rawActivity]
  );

  const compactActivity = groupedActivity.slice(0, 5);
  const visibleActivity = showAll ? sortedRawActivity : compactActivity;
  const hasMore = rawActivity.length > compactActivity.length || groupedActivity.length > 5;

  return (
    <Card title="Recent Activity">
      {rawActivity.length === 0 ? (
        <EmptyState
          icon="📝"
          title="No Recent Activity"
          message="As you work throughout the day, activity will appear here."
        />
      ) : (
        <>
          <div style={activityListStyle}>
            {showAll
              ? visibleActivity.map((item, index) => (
                  <ActivityRow
                    key={`${item.id ?? "activity"}-${index}`}
                    item={item}
                  />
                ))
              : visibleActivity.map((item) => (
                  <ActivityRow key={item.id} item={item} />
                ))}
          </div>

          {hasMore && (
            <button
              type="button"
              onClick={() => setShowAll((current) => !current)}
              style={viewAllButtonStyle}
            >
              {showAll
                ? "Show less"
                : `View all activity (${rawActivity.length})`}
              <span aria-hidden="true">{showAll ? " ↑" : " →"}</span>
            </button>
          )}
        </>
      )}
    </Card>
  );
}

function groupActivity(items) {
  const groups = new Map();

  items.forEach((item) => {
    const key = [
      item.reference || "",
      item.client || "",
      item.title || "",
      item.description || "",
    ].join("|");

    const existing = groups.get(key);

    if (!existing) {
      groups.set(key, {
        ...item,
        id: `activity-${key}`,
        count: 1,
      });
      return;
    }

    existing.count += 1;

    if (new Date(item.date) > new Date(existing.date)) {
      existing.date = item.date;
    }
  });

  return Array.from(groups.values());
}

function ActivityRow({ item }) {
  return (
    <div style={activityRowStyle}>
      <div style={activityContentStyle}>
        <div style={activityTitleLineStyle}>
          {item.reference && (
            <span style={referenceStyle}>{item.reference}</span>
          )}
          <span style={titleStyle}>{item.title}</span>
          {item.count > 1 && (
            <span style={countStyle}>{item.count} updates</span>
          )}
        </div>

        <div style={activityMetaStyle}>
          {item.client && <span>{item.client}</span>}
          {item.description && <span> · {item.description}</span>}
        </div>
      </div>

      <span style={dateStyle}>{formatActivityDate(item.date)}</span>
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

const activityListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const activityRowStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: 12,
  padding: "9px 12px",
  border: "1px solid #E5E7EB",
  borderRadius: 8,
  background: "#FFF",
};

const activityContentStyle = {
  minWidth: 0,
};

const activityTitleLineStyle = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 7,
};

const referenceStyle = {
  fontSize: 11,
  fontWeight: 700,
  color: "#8B1E3F",
  letterSpacing: 0.6,
  whiteSpace: "nowrap",
};

const titleStyle = {
  fontWeight: 600,
};

const countStyle = {
  padding: "2px 6px",
  borderRadius: 999,
  background: "#F3F4F6",
  color: "#66727A",
  fontSize: 10,
  fontWeight: 700,
};

const activityMetaStyle = {
  marginTop: 2,
  color: "#777",
  fontSize: 12,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const dateStyle = {
  fontSize: 11,
  color: "#999",
  whiteSpace: "nowrap",
};

const viewAllButtonStyle = {
  display: "block",
  width: "100%",
  marginTop: 12,
  padding: "9px 12px",
  border: "1px solid #E5E7EB",
  borderRadius: 8,
  background: "#FFF",
  color: "#8B1E3F",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};
