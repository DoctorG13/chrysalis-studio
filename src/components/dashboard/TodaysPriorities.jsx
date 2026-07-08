import Card from "../common/Card";
import EmptyState from "../common/EmptyState";

import { getDashboardInsights } from "../../utils/dashboard";

export default function TodaysPriorities({
  clients = [],
}) {
  const { focus } = getDashboardInsights(clients);

  return (
    <Card title="Today's Priorities">
      {focus.length === 0 ? (
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
          {focus.map((item, index) => (
            <PriorityRow
              key={index}
              level={item.level}
              message={item.message}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function PriorityRow({
  level,
  message,
}) {
  const styles = {
    critical: {
      border: "#DC2626",
      background: "#FEF2F2",
    },
    warning: {
      border: "#EA580C",
      background: "#FFF7ED",
    },
    info: {
      border: "#2563EB",
      background: "#EFF6FF",
    },
    success: {
      border: "#16A34A",
      background: "#F0FDF4",
    },
  };

  const style =
    styles[level] || styles.info;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: 16,
        borderLeft: `6px solid ${style.border}`,
        background: style.background,
        borderRadius: 10,
        fontWeight: 600,
      }}
    >
      {message}
    </div>
  );
}