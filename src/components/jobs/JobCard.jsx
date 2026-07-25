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

export default function JobCard({
  job,
  selected = false,
  onOpen,
}) {
  if (!job) return null;

  const outstanding = Math.max(
    0,
    Number(
      job.balance ??
        job.outstanding ??
        (Number(job.price || 0) - Number(job.deposit || 0))
    )
  );

  return (
    <div
      onClick={() => onOpen?.(job)}
      style={{
        cursor: "pointer",
      }}
    >
      <Card
        style={{
          border: selected
            ? "2px solid #8B1E3F"
            : "1px solid #DDD",
          boxShadow: selected
            ? "0 10px 30px rgba(139,30,63,.22)"
            : "0 2px 8px rgba(0,0,0,.06)",
          transition: "all .18s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 18,
          }}
        >
          <div style={{ flex: 1 }}>
            {/* Primary Identifier */}
            <div
              style={{
                display: "inline-block",
                padding: "6px 12px",
                borderRadius: 8,
                background: "#8B1E3F",
                color: "#fff",
                fontWeight: 800,
                fontSize: 20,
                letterSpacing: 1,
                marginBottom: 12,
              }}
            >
              {job.reference || "CHR-NEW"}
            </div>

            {/* Client */}
            <div
              style={{
                fontWeight: 700,
                fontSize: 17,
                color: "#2F3A3F",
              }}
            >
              👤 {job.clientName || "Unknown Client"}
            </div>

            {job.clientPhone && (
              <div
                style={{
                  marginTop: 4,
                  color: "#777",
                  fontSize: 13,
                }}
              >
                📞 {job.clientPhone}
              </div>
            )}

            {/* Job Name */}
            <h3
              style={{
                margin: "16px 0 10px",
                color: "#2F3A3F",
              }}
            >
              {job.name || "Untitled Job"}
            </h3>

            {/* Status */}
            <div
              style={{
                display: "inline-block",
                padding: "5px 10px",
                borderRadius: 20,
                background:
                  JOB_STATUS_COLOURS[job.status] ?? "#9CA3AF",
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 14,
              }}
            >
              {job.status || "Unknown"}

            </div>

            <p style={{ margin: "4px 0", color: "#666" }}>
              📅 Due: {job.dueDate || "-"}
            </p>

            <div
              style={{
                margin: "8px 0",
                padding: "10px 12px",
                borderRadius: 8,
                background:
                  outstanding > 0 ? "#FEF2F2" : "#ECFDF5",
                color:
                  outstanding > 0 ? "#991B1B" : "#166534",
                fontWeight: 700,
                display: "inline-block",
              }}
            >
              💰 Outstanding: ${outstanding.toFixed(2)}
            </div>

            <p style={{ margin: "4px 0", color: "#666" }}>
              📈 Progress: {job.progress ?? 0}%
            </p>

            <p style={{ margin: "4px 0", color: "#666" }}>
              ➜ Next: {job.nextAction || "-"}
            </p>

            <div style={{ marginTop: 12 }}>
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
              fontSize: 28,
              color: selected ? "#8B1E3F" : "#BBB",
              alignSelf: "center",
              fontWeight: 700,
            }}
          >
            ›
          </div>
        </div>
      </Card>
    </div>
  );
}