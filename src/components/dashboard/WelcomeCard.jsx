import Card from "../common/Card";

import {
  getActiveJobs,
  getAppointmentsToday,
  getJobsDueThisWeek,
  getOutstandingPayments,
} from "../../utils/dashboard";

export default function WelcomeCard({
  clients = [],
}) {
  const today = new Date();

  const greeting =
    today.getHours() < 12
      ? "Good Morning"
      : today.getHours() < 18
      ? "Good Afternoon"
      : "Good Evening";

  const activeJobs =
    getActiveJobs(clients);

  const todaysAppointments =
    getAppointmentsToday(clients);

  const jobsDue =
    getJobsDueThisWeek(clients);

  const outstanding =
    getOutstandingPayments(clients);

  const formattedDate =
    today.toLocaleDateString("en-AU", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <Card
      title={`☀️ ${greeting}, Donna`}
      subtitle={formattedDate}
    >
      <p
        style={{
          marginTop: 0,
          lineHeight: 1.7,
          color: "#555",
        }}
      >
        Here's what's happening in your
        studio today.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: 18,
          marginTop: 24,
        }}
      >
        <SummaryCard
          value={todaysAppointments.length}
          label="Appointments Today"
          icon="📅"
        />

        <SummaryCard
          value={activeJobs.length}
          label="Active Jobs"
          icon="💼"
        />

        <SummaryCard
          value={jobsDue.length}
          label="Due This Week"
          icon="🧵"
        />

        <SummaryCard
          value={`$${outstanding.toFixed(2)}`}
          label="Outstanding"
          icon="💰"
        />
      </div>

      <div
        style={{
          marginTop: 28,
          padding: 20,
          background: "#F8F9FA",
          borderRadius: 10,
          border: "1px solid #E5E7EB",
        }}
      >
        <strong>
          Today's Goal
        </strong>

        <p
          style={{
            marginBottom: 0,
            marginTop: 10,
            lineHeight: 1.7,
            color: "#666",
          }}
        >
          Stay focused on today's
          appointments, complete garments
          due this week, and keep payments
          up to date.
        </p>
      </div>
    </Card>
  );
}

function SummaryCard({
  icon,
  value,
  label,
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 10,
        padding: 20,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 28,
        }}
      >
        {icon}
      </div>

      <div
        style={{
          marginTop: 10,
          fontSize: 28,
          fontWeight: 700,
          color: "#2F3A3F",
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: 8,
          color: "#666",
          fontSize: 14,
        }}
      >
        {label}
      </div>
    </div>
  );
}