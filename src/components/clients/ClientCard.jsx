import { useEffect, useState } from "react";

import Card from "../common/Card";
import { getPayments } from "../../services/paymentApi";

function getClientJobs(client) {
  return Array.isArray(client?.jobs) ? client.jobs.filter(Boolean) : [];
}

function getActiveJobs(jobs) {
  return jobs.filter(
    (job) =>
      !["Completed", "Cancelled", "Archived"].includes(
        String(job.status || "").trim()
      )
  );
}

function getStoredOutstanding(jobs) {
  return jobs.reduce((total, job) => {
    const balance = Number(
      job?.balance ??
        job?.outstanding ??
        (Number(job?.price || 0) - Number(job?.deposit || 0))
    );

    return total + Math.max(0, Number.isFinite(balance) ? balance : 0);
  }, 0);
}

function getNextAppointment(client) {
  const appointments = Array.isArray(client?.appointments)
    ? client.appointments.filter(Boolean)
    : [];

  const upcoming = appointments
    .map((appointment) => {
      const date = new Date(
        `${appointment.date || ""}${
          appointment.time ? `T${appointment.time}` : ""
        }`
      );

      return {
        appointment,
        timestamp: date.getTime(),
      };
    })
    .filter((item) => !Number.isNaN(item.timestamp))
    .sort((a, b) => a.timestamp - b.timestamp);

  return upcoming[0]?.appointment || null;
}

function formatAppointmentDate(appointment) {
  if (!appointment?.date) return "None scheduled";

  const date = new Date(
    `${appointment.date}${appointment.time ? `T${appointment.time}` : ""}`
  );

  if (Number.isNaN(date.getTime())) {
    return appointment.date;
  }

  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function getPrimaryJobName(job) {
  return (
    job?.title ||
    job?.name ||
    job?.garmentType ||
    job?.reference ||
    "Job"
  );
}

export default function ClientCard({
  client,
  onClick,
}) {
  const jobs = getClientJobs(client);
  const activeJobs = getActiveJobs(jobs);
  const [outstanding, setOutstanding] = useState(() => {
    if (!jobs.length) return 0;
    return null;
  });
  const nextAppointment = getNextAppointment(client);

  useEffect(() => {
    let active = true;

    async function loadOutstanding() {
      if (!jobs.length) {
        setOutstanding(0);
        return;
      }

      try {
        const paymentsByJob = await Promise.all(
          jobs.map(async (job) => {
            if (!job?.id) return [];
            return getPayments(job.id);
          })
        );

        const totalPaid = paymentsByJob.reduce(
          (total, payments) =>
            total +
            payments.reduce(
              (jobTotal, payment) =>
                jobTotal + (Number(payment?.amount) || 0),
              0
            ),
          0
        );

        const totalQuoted = jobs.reduce(
          (total, job) =>
            total + (Number(job?.price) || 0),
          0
        );

        if (active) {
          setOutstanding(
            Math.max(0, totalQuoted - totalPaid)
          );
        }
      } catch (error) {
        console.error(
          "Unable to load client payments for ClientCard.",
          error
        );

        if (active) {
          setOutstanding(getStoredOutstanding(jobs));
        }
      }
    }

    loadOutstanding();

    return () => {
      active = false;
    };
  }, [client?.id, jobs.length]);

  const displayedOutstanding = outstanding ?? 0;
  const primaryJob = activeJobs[0] || jobs[0] || null;
  const additionalActiveJobs = Math.max(0, activeJobs.length - 1);

  return (
    <div
      onClick={() => onClick(client)}
      style={{
        cursor: "pointer",
      }}
    >
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 18,
          }}
        >
          <div
            style={{
              minWidth: 0,
              flex: 1,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "8px 16px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  color: "#2F3A3F",
                }}
              >
                👤 {client.firstName} {client.lastName}
              </h3>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 10,
                  color: "#555",
                  fontSize: 13,
                  lineHeight: 1.4,
                }}
              >
                <span>
                  💼{" "}
                  <strong>
                    {activeJobs.length}
                  </strong>{" "}
                  active{" "}
                  {activeJobs.length === 1 ? "job" : "jobs"}
                </span>

                {primaryJob && (
                  <span style={{ color: "#777" }}>
                    · {getPrimaryJobName(primaryJob)}
                    {additionalActiveJobs > 0
                      ? ` +${additionalActiveJobs}`
                      : ""}
                  </span>
                )}

                <span>
                  · 📅{" "}
                  {nextAppointment
                    ? `Next: ${formatAppointmentDate(nextAppointment)}`
                    : "No appointment"}
                </span>

                {displayedOutstanding > 0 && (
                  <span
                    style={{
                      color: "#8B1E3F",
                      fontWeight: 700,
                    }}
                  >
                    · 💰 ${displayedOutstanding.toFixed(2)} outstanding
                  </span>
                )}
              </div>
            </div>

            <p
              style={{
                margin: "10px 0 4px",
                color: "#666",
              }}
            >
              📞 {client.phone || "No phone number"}
            </p>

            <p
              style={{
                margin: 0,
                color: "#666",
              }}
            >
              ✉️ {client.email || "No email address"}
            </p>
          </div>

          <div
            style={{
              fontSize: 24,
              color: "#BBB",
              flexShrink: 0,
            }}
          >
            ›
          </div>
        </div>
      </Card>
    </div>
  );
}
