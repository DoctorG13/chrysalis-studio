import Card from "../common/Card";

import {
  getDashboardInsights,
} from "../../utils/dashboard";

export default function WelcomeCard({ clients = [] }) {
  const now = new Date();
  const hour = now.getHours();

  const greeting =
    hour < 12
      ? "Good Morning"
      : hour < 18
      ? "Good Afternoon"
      : "Good Evening";

  const formattedDate = now.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const insights = getDashboardInsights(clients);

  const intro =
    insights.overdueJobs.length > 0
      ? `You have ${insights.overdueJobs.length} overdue ${
          insights.overdueJobs.length === 1 ? "job" : "jobs"
        } requiring immediate attention.`
      : insights.appointments.length > 0
      ? `You have ${insights.appointments.length} appointment${
          insights.appointments.length === 1 ? "" : "s"
        } scheduled today.`
      : "Your studio is looking organised today.";

  const focusItems = (insights.focus || []).slice(0, 3);

  return (
    <Card
      title={`☀️ ${greeting}, Donna`}
      subtitle={formattedDate}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "#555",
            fontSize: 15,
            lineHeight: 1.5,
          }}
        >
          {intro}
        </p>

        {focusItems.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            {focusItems.map((item, index) => (
              <span
                key={index}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "7px 11px",
                  borderRadius: 999,
                  background: "#F8F9FA",
                  border: "1px solid #E5E7EB",
                  color: "#555",
                  fontSize: 12,
                }}
              >
                {typeof item === "string" ? item : item.message}
              </span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
