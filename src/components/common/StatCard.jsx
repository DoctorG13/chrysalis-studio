import Card from "./Card";

export default function StatCard({
  title,
  value,
  subtitle,
}) {
  return (
    <Card>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div
          style={{
            fontSize: 15,
            color: "#777",
            fontWeight: 500,
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: 34,
            fontWeight: "700",
            color: "#2F3A3F",
          }}
        >
          {value}
        </div>

        {subtitle && (
          <div
            style={{
              fontSize: 13,
              color: "#999",
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </Card>
  );
}