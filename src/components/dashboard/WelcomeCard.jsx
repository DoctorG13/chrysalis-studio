import Card from "../common/Card";

import {
  getDashboardInsights,
} from "../../utils/dashboard";

export default function WelcomeCard({
  clients = [],
}) {
  const now = new Date();
  const hour = now.getHours();

  const greeting =
    hour < 12
      ? "Good Morning"
      : hour < 18
      ? "Good Afternoon"
      : "Good Evening";

  const formattedDate =
    now.toLocaleDateString("en-AU", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const insights =
    getDashboardInsights(clients);

  const intro =
    insights.overdueJobs.length > 0
      ? `You have ${insights.overdueJobs.length} overdue ${
          insights.overdueJobs.length === 1
            ? "job"
            : "jobs"
        } requiring immediate attention.`
      : insights.appointments.length > 0
      ? `You have ${insights.appointments.length} appointment${
          insights.appointments.length === 1
            ? ""
            : "s"
        } scheduled today.`
      : "Your studio is looking organised today.";

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
          fontSize: 16,
        }}
      >
        {intro}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
  "repeat(auto-fit,minmax(160px,1fr))",
gap: 12,
          marginTop: 24,
        }}
      >
        <SummaryCard
          icon="📅"
          value={insights.appointments.length}
          label="Appointments Today"
        />

        <SummaryCard
          icon="💼"
          value={insights.activeJobs.length}
          label="Active Jobs"
        />

        <SummaryCard
          icon="🧵"
          value={insights.dueThisWeek.length}
          label="Due This Week"
        />

        <SummaryCard
          icon="💰"
          value={`$${insights.outstanding.toFixed(2)}`}
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
          {insights.focus.map((item, index) => (
            <li key={index}>
              {typeof item === "string"
                ? item
                : item.message}
            </li>
          ))}
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
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "4px 2px",
      }}
    >
      <div
        style={{
          fontSize: 16,
          lineHeight: 1,
          marginBottom: 4,
        }}
      >
        {icon}
      </div>

      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: "#2F3A3F",
          lineHeight: 1,
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: 3,
          fontSize: 10,
          fontWeight: 500,
          color: "#777",
          textTransform: "uppercase",
          letterSpacing: 0.4,
        }}
      >
        {label}
      </div>
    </div>
  );
}