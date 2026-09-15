import { useMemo } from "react";

import { parseJobDate } from "../../constants/jobWorkflow";

function clientName(client) {
  if (!client) return "No client";

  return (
    client.name ||
    [client.firstName, client.lastName]
      .filter(Boolean)
      .join(" ") ||
    "No client"
  );
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function startOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

function getScheduleBucket(job, today) {
  const dueDate = parseJobDate(job?.dueDate);

  if (!dueDate) return "unscheduled";

  const due = startOfDay(dueDate);
  const todayStart = startOfDay(today);
  const daysAway = Math.round(
    (due.getTime() - todayStart.getTime()) / 86400000
  );

  if (daysAway < 0) return "overdue";
  if (daysAway === 0) return "today";
  if (daysAway <= 7) return "next7";
  return "later";
}

function bucketTitle(bucket) {
  switch (bucket) {
    case "overdue":
      return "Overdue";
    case "today":
      return "Due Today";
    case "next7":
      return "Next 7 Days";
    case "later":
      return "Later";
    default:
      return "No Due Date";
  }
}

function bucketTone(bucket) {
  switch (bucket) {
    case "overdue":
      return {
        background: "#FEF2F2",
        border: "#FCA5A5",
        colour: "#B91C1C",
      };
    case "today":
      return {
        background: "#FFF7ED",
        border: "#FDBA74",
        colour: "#C2410C",
      };
    case "next7":
      return {
        background: "#EFF6FF",
        border: "#93C5FD",
        colour: "#1D4ED8",
      };
    default:
      return {
        background: "#F8FAFC",
        border: "#CBD5E1",
        colour: "#475569",
      };
  }
}

export default function GarmentSchedulePanel({
  clients = [],
  jobs = [],
  onOpenJob,
}) {
  const clientLookup = useMemo(
    () =>
      new Map(
        clients.map((client) => [String(client.id), client])
      ),
    [clients]
  );

  const schedule = useMemo(() => {
    const today = startOfDay();
    const buckets = {
      overdue: [],
      today: [],
      next7: [],
      later: [],
      unscheduled: [],
    };

    jobs.forEach((job) => {
      if (["Collected", "Cancelled"].includes(job.status)) return;

      const dueDate = parseJobDate(job?.dueDate);
      const bucket = getScheduleBucket(job, today);
      const client = clientLookup.get(String(job.clientId));

      buckets[bucket].push({
        ...job,
        client,
        dueDate,
      });
    });

    Object.values(buckets).forEach((items) => {
      items.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate - b.dueDate;
      });
    });

    return buckets;
  }, [jobs, clientLookup]);

  const scheduledCount =
    schedule.overdue.length +
    schedule.today.length +
    schedule.next7.length +
    schedule.later.length;

  const sections = [
    ["overdue", schedule.overdue],
    ["today", schedule.today],
    ["next7", schedule.next7],
    ["later", schedule.later],
  ];

  return (
    <section
      aria-label="Garment production schedule"
      style={{
        background: "#FFFFFF",
        border: "1px solid #D9DEE2",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(31,41,51,.04)",
      }}
    >
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #E5E7EB",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              color: "#8B1E3F",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            Production Schedule
          </div>
          <h2
            style={{
              margin: "4px 0 0",
              color: "#2F3A3F",
              fontSize: 20,
            }}
          >
            Garment deadlines
          </h2>
          <p
            style={{
              margin: "5px 0 0",
              color: "#687178",
              fontSize: 12,
            }}
          >
            {scheduledCount} active garments scheduled by due date.
          </p>
        </div>

        {schedule.unscheduled.length > 0 && (
          <div
            style={{
              padding: "7px 10px",
              borderRadius: 999,
              background: "#F3F4F6",
              color: "#59636A",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {schedule.unscheduled.length} without due date
          </div>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 12,
          padding: 14,
        }}
      >
        {sections.map(([bucket, items]) => {
          const tone = bucketTone(bucket);

          return (
            <div
              key={bucket}
              style={{
                minWidth: 0,
                border: `1px solid ${tone.border}`,
                borderRadius: 10,
                background: tone.background,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: "10px 11px",
                  borderBottom: `1px solid ${tone.border}`,
                }}
              >
                <strong
                  style={{
                    color: tone.colour,
                    fontSize: 12,
                  }}
                >
                  {bucketTitle(bucket)}
                </strong>
                <span
                  style={{
                    minWidth: 22,
                    height: 22,
                    padding: "0 6px",
                    borderRadius: 999,
                    background: "#FFFFFF",
                    color: tone.colour,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 800,
                    boxSizing: "border-box",
                  }}
                >
                  {items.length}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 7,
                  padding: 8,
                  minHeight: 90,
                }}
              >
                {items.length === 0 ? (
                  <div
                    style={{
                      padding: "22px 8px",
                      textAlign: "center",
                      color: "#98A1A7",
                      fontSize: 10,
                    }}
                  >
                    Nothing due
                  </div>
                ) : (
                  items.map((job) => (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => onOpenJob?.(job)}
                      style={{
                        width: "100%",
                        padding: "9px 10px",
                        border: "1px solid #D9DEE2",
                        borderRadius: 8,
                        background: "#FFFFFF",
                        textAlign: "left",
                        cursor: onOpenJob ? "pointer" : "default",
                        fontFamily: "inherit",
                        color: "#2F3A3F",
                        boxSizing: "border-box",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 8,
                          alignItems: "flex-start",
                        }}
                      >
                        <strong
                          style={{
                            minWidth: 0,
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            fontSize: 11,
                          }}
                        >
                          {job.name || job.title || "Untitled garment"}
                        </strong>
                        <span
                          style={{
                            flexShrink: 0,
                            color: "#8B1E3F",
                            fontSize: 9,
                            fontWeight: 800,
                          }}
                        >
                          {job.reference || "NEW"}
                        </span>
                      </div>

                      <div
                        style={{
                          marginTop: 4,
                          color: "#687178",
                          fontSize: 10,
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {clientName(job.client)}
                      </div>

                      <div
                        style={{
                          marginTop: 5,
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 8,
                          color: tone.colour,
                          fontSize: 9,
                          fontWeight: 700,
                        }}
                      >
                        <span>{job.status || "Unstaged"}</span>
                        <span>
                          {job.dueDate
                            ? formatDate(job.dueDate)
                            : "No date"}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
