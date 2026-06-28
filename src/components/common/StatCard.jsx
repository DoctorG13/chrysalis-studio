import Card from "./Card";

export default function StatCard({
  title,
  value,
  subtitle,
  icon = "🦋",
}) {
  return (
    <Card>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 15,
        }}
      >
        <div
          style={{
            fontSize: 16,
            color: "#666",
            fontWeight: 600,
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: 28,
          }}
        >
          {icon}
        </div>
      </div>

      <div
        style={{
          fontSize: 36,
          fontWeight: "700",
          color: "#2F3A3F",
        }}
      >
        {value}
      </div>

      {subtitle && (
        <div
          style={{
            marginTop: 8,
            color: "#999",
            fontSize: 13,
          }}
        >
          {subtitle}
        </div>
      )}
    </Card>
  );
}