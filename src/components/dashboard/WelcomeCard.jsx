import Card from "../common/Card";

import {
  getDashboardInsights,
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

  const formattedDate =
    today.toLocaleDateString("en-AU", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const insights =
    getDashboardInsights(clients);

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
        Welcome back to Chrysalis Studio.
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
          icon="📅"
          value={
            insights.appointments.length
          }
          label="Appointments Today"
        />

        <SummaryCard
          icon="💼"
          value={
            insights.activeJobs.length
          }
          label="Active Jobs"
        />

        <SummaryCard
          icon="🧵"
          value={
            insights.dueThisWeek.length
          }
          label="Due This Week"
        />

        <SummaryCard
          icon="💰"
          value={`$${insights.outstanding.toFixed(
            2
          )}`}
          label="Outstanding"
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
        <strong>🎯 Today's Focus</strong>

        <ul
          style={{
            marginTop: 12,
            marginBottom: 0,
            paddingLeft: 20,
            lineHeight: 1.8,
            color: "#555",
          }}
        >
          {insights.focus.map(
            (item, index) => (
              <li key={index}>{item}</li>
            )
          )}
        </ul>
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
      <div style={{ fontSize: 28 }}>
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