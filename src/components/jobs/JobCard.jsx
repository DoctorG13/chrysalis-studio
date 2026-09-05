import { useEffect, useState } from "react";

import Card from "../common/Card";
import { JOB_STATUS_COLOURS } from "../../constants/jobWorkflow";
import { getPayments } from "../../services/paymentApi";

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

function getFallbackOutstanding(job) {
  return Math.max(
    0,
    Number(
      job?.balance ??
        job?.outstanding ??
        (Number(job?.price || 0) - Number(job?.deposit || 0))
    )
  );
}

export default function JobCard({
  job,
  selected = false,
  onOpen,
}) {
  const [outstanding, setOutstanding] = useState(() => {
    if (job?.balance != null || job?.outstanding != null) {
      return getFallbackOutstanding(job);
    }

    if (Array.isArray(job?.payments)) {
      const totalPaid = job.payments.reduce(
        (total, payment) =>
          total + (Number(payment?.amount) || 0),
        0
      );

      return Math.max(0, Number(job?.price || 0) - totalPaid);
    }

    return null;
  });

  useEffect(() => {
    let active = true;

    async function loadOutstanding() {
      if (!job?.id) {
        setOutstanding(getFallbackOutstanding(job));
        return;
      }

      try {
        const payments = await getPayments(job.id);
        const totalPaid = payments.reduce(
          (total, payment) =>
            total + (Number(payment?.amount) || 0),
          0
        );

        if (active) {
          setOutstanding(
            Math.max(0, Number(job.price || 0) - totalPaid)
          );
        }
      } catch (error) {
        console.error(
          "Unable to load job payments for JobCard.",
          error
        );

        if (active) {
          setOutstanding(getFallbackOutstanding(job));
        }
      }
    }

    loadOutstanding();

    return () => {
      active = false;
    };
  }, [job?.id, job?.price]);

  if (!job) return null;

  const displayedOutstanding = outstanding ?? 0;

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

            <h3
              style={{
                margin: "16px 0 10px",
                color: "#2F3A3F",
              }}
            >
              {job.name || "Untitled Job"}
            </h3>

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
                  displayedOutstanding > 0 ? "#FEF2F2" : "#ECFDF5",
                color:
                  displayedOutstanding > 0 ? "#991B1B" : "#166534",
                fontWeight: 700,
                display: "inline-block",
              }}
            >
              💰 Outstanding: ${displayedOutstanding.toFixed(2)}
            </div>

            <div style={{ margin: "12px 0" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  color: "#666",
                  marginBottom: 4,
                }}
              >
                <span>Workflow</span>
                <span>{job.progress ?? 0}%</span>
              </div>

              <div
                style={{
                  height: 10,
                  background: "#E5E7EB",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${job.progress ?? 0}%`,
                    height: "100%",
                    background:
                      JOB_STATUS_COLOURS[job.status] ?? "#9CA3AF",
                    transition: "width .3s ease",
                  }}
                />
              </div>
            </div>

            <p
              style={{
                margin: "10px 0 4px",
                color: "#555",
                fontWeight: 600,
              }}
            >
              ➜ Next: {job.nextAction || "Completed"}
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
