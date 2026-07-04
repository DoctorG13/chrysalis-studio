import Card from "../common/Card";
import EmptyState from "../common/EmptyState";

import { getRecentActivity } from "../../utils/dashboard";

export default function RecentActivity({
  clients = [],
}) {
  const activity =
    getRecentActivity(clients);

  return (
    <Card title="Recent Activity">
      {activity.length === 0 ? (
        <EmptyState
          icon="📝"
          title="No Recent Activity"
          message="As you work throughout the day, your recent activity will appear here."
        />
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {activity.map((item) => (
            <ActivityRow
              key={item.id}
              item={item}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function ActivityRow({
  item,
}) {
  return (
    <div
      style={{
        padding: 16,
        border: "1px solid #E5E7EB",
        borderRadius: 10,
        background: "#FFF",
      }}
    >
      <div
        style={{
          fontWeight: 600,
        }}
      >
        {item.title}
      </div>

      {item.description && (
        <div
          style={{
            marginTop: 6,
            color: "#666",
            lineHeight: 1.5,
          }}
        >
          {item.description}
        </div>
      )}

      <div
        style={{
          marginTop: 8,
          fontSize: 12,
          color: "#999",
        }}
      >
        {new Date(item.date).toLocaleString(
          "en-AU"
        )}
      </div>
    </div>
  );
}