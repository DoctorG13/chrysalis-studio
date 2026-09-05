import { useEffect, useState } from "react";

import { getPayments } from "../../services/paymentApi";
import { useChrysalis } from "../../context/ChrysalisProvider";

export default function ClientWorkspaceHeader({
  client,
  jobs = [],
  appointments = [],
}) {
  const { closeWorkspace } = useChrysalis();
  const [outstanding, setOutstanding] = useState(0);

  if (!client) return null;

  // Use the authoritative jobs collection.
  // Do not use client.jobs because that relationship can become stale.
  const clientJobs = jobs.filter(
    (job) =>
      String(job.clientId) === String(client.id)
  );

  const activeJobs = clientJobs.filter(
    (job) =>
      !["Completed", "Cancelled", "Archived"].includes(
        String(job.status || "").trim()
      )
  ).length;

  useEffect(() => {
    let active = true;

    async function loadOutstanding() {
      if (clientJobs.length === 0) {
        setOutstanding(0);
        return;
      }

      try {
        const paymentGroups = await Promise.all(
          clientJobs.map(async (job) => {
            const payments = await getPayments(job.id);
            const totalPaid = payments.reduce(
              (total, payment) =>
                total + (Number(payment.amount) || 0),
              0
            );

            const quotedPrice = Number(job.price) || 0;

            return Math.max(0, quotedPrice - totalPaid);
          })
        );

        if (active) {
          setOutstanding(
            paymentGroups.reduce(
              (total, balance) => total + balance,
              0
            )
          );
        }
      } catch (error) {
        console.error(
          "Unable to load client outstanding balance.",
          error
        );

        if (active) {
          setOutstanding(0);
        }
      }
    }

    loadOutstanding();

    return () => {
      active = false;
    };
  }, [clientJobs]);

  const upcomingAppointments = [...appointments]
    .filter((appointment) => {
      if (!appointment?.date) return false;

      const date = new Date(appointment.date);

      return !Number.isNaN(date.getTime());
    })
    .sort(
      (a, b) =>
        new Date(a.date).getTime() -
        new Date(b.date).getTime()
    );

  const nextAppointment =
    upcomingAppointments[0]?.date || null;

  const formattedNextAppointment = nextAppointment
    ? formatAppointmentDate(nextAppointment)
    : "None scheduled";

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #ddd",
        borderRadius: 10,
        padding: 20,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 12,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>
            👤 {client.firstName} {client.lastName}
          </h2>

          <div
            style={{
              color: "#666",
              marginTop: 8,
              lineHeight: 1.6,
            }}
          >
            📞 {client.phone || "No Phone"}
            <br />
            ✉️ {client.email || "No Email"}
          </div>
        </div>

        <button
          type="button"
          onClick={closeWorkspace}
          style={{
            border: "1px solid #d9dde2",
            background: "#ffffff",
            color: "#2F3A3F",
            borderRadius: 8,
            padding: "8px 14px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          ✕ Close Client
        </button>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 0,
          padding: "12px 14px",
          background: "#f7f7f7",
          borderRadius: 8,
          border: "1px solid #ececec",
        }}
      >
        <SnapshotItem
          icon="💼"
          label={`${activeJobs} Active Job${
            activeJobs === 1 ? "" : "s"
          }`}
        />

        <SnapshotDivider />

        <SnapshotItem
          icon="📅"
          label={`Next: ${formattedNextAppointment}`}
        />

        <SnapshotDivider />

        <SnapshotItem
          icon="💰"
          label={`${formatCurrency(
            outstanding
          )} outstanding`}
          emphasis={outstanding > 0}
        />
      </div>
    </div>
  );
}

function SnapshotItem({
  icon,
  label,
  emphasis = false,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "2px 10px",
        color: emphasis ? "#8A4B5C" : "#555",
        fontSize: 14,
        fontWeight: emphasis ? 600 : 500,
        whiteSpace: "nowrap",
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function SnapshotDivider() {
  return (
    <div
      aria-hidden="true"
      style={{
        width: 1,
        height: 20,
        background: "#dcdcdc",
        margin: "0 4px",
      }}
    />
  );
}

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatAppointmentDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "None scheduled";
  }

  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
