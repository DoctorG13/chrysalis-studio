import Card from "../common/Card";
import EmptyState from "../common/EmptyState";

import {
  getAppointmentsToday,
  getJobsDueThisWeek,
  getOutstandingPayments,
} from "../../utils/dashboard";

export default function TodaysPriorities({
  clients = [],
}) {
  const appointments =
    getAppointmentsToday(clients);

  const dueJobs =
    getJobsDueThisWeek(clients);

  const outstanding =
    getOutstandingPayments(clients);

  const priorities = [];

  if (appointments.length > 0) {
    priorities.push({
      icon: "📅",
      title: `${appointments.length} appointment${
        appointments.length === 1 ? "" : "s"
      } today`,
      colour: "#2563EB",
    });
  }

  if (dueJobs.length > 0) {
    priorities.push({
      icon: "🧵",
      title: `${dueJobs.length} job${
        dueJobs.length === 1 ? "" : "s"
      } due this week`,
      colour: "#EA580C",
    });
  }

  if (outstanding > 0) {
    priorities.push({
      icon: "💰",
      title: `$${outstanding.toFixed(
        2
      )} outstanding`,
      colour: "#16A34A",
    });
  }

  return (
    <Card title="Today's Priorities">
      {priorities.length === 0 ? (
        <EmptyState
          icon="🎉"
          title="You're all caught up!"
          message="There are no urgent priorities today."
        />
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {priorities.map(
            (priority, index) => (
              <PriorityRow
                key={index}
                {...priority}
              />
            )
          )}
        </div>
      )}
    </Card>
  );
}

function PriorityRow({
  icon,
  title,
  colour,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: 16,
        borderLeft: `5px solid ${colour}`,
        background: "#F9FAFB",
        borderRadius: 8,
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
          fontWeight: 600,
        }}
      >
        {title}
      </div>
    </div>
  );
}