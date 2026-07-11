import Card from "../common/Card";
import { JOB_STATUS_COLOURS } from "../../constants/jobWorkflow";

function Badge({ label, background, color = "#fff" }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        background,
        color,
        marginRight: 6,
        marginTop: 6,
      }}
    >
      {label}
    </span>
  );
}

export default function JobCard({ job, onOpen }) {
  const outstanding = Number(job.balance ?? job.outstanding ?? 0);

  return (
    <div
      onClick={() => onOpen?.(job)}
      style={{ cursor: "pointer" }}
    >
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 20,
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: "bold",
                color: "#999",
                marginBottom: 8,
              }}
            >
              {job.reference || "CHR-NEW"}
            </div>

            <h3
              style={{
                margin: 0,
                color: "#2F3A3F",
              }}
            >
              {job.name}
            </h3>

            <div
              style={{
                display: "inline-block",
                marginTop: 10,
                marginBottom: 12,
                padding: "4px 10px",
                borderRadius: 20,
                background:
                  JOB_STATUS_COLOURS[job.status] ?? "#9CA3AF",
                color: "#fff",
                fontSize: 12,
                fontWeight: "bold",
              }}
            >
              {job.status || "Unknown"}
            </div>

            <p style={{ margin: "4px 0", color: "#666" }}>
              📅 Due: {job.dueDate || "-"}
            </p>

            <p style={{ margin: "4px 0", color: "#666" }}>
              💰 Outstanding: ${outstanding.toFixed(2)}
            </p>

            <p style={{ margin: "4px 0", color: "#666" }}>
              📈 Progress: {job.progress ?? 0}%
            </p>

            <p style={{ margin: "4px 0", color: "#666" }}>
              ➜ Next: {job.nextAction || "-"}
            </p>

            <div style={{ marginTop: 10 }}>
              {job.dueToday && (
                <Badge
                  label="Due Today"
                  background="#2563EB"
                />
              )}

              {job.overdue && (
                <Badge
                  label="Overdue"
                  background="#DC2626"
                />
              )}

              {job.needsAttention && (
                <Badge
                  label="Needs Attention"
                  background="#F59E0B"
                />
              )}
            </div>
          </div>

          <div
            style={{
              fontSize: 24,
              color: "#BBB",
              alignSelf: "center",
            }}
          >
            ›
          </div>
        </div>
      </Card>
    </div>
  );
}