import Card from "../common/Card";


  function getStatusColour(status) {
  switch (status) {
    case "Quote":
      return "#94A3B8";

    case "Booked":
      return "#3B82F6";

    case "Pattern":
      return "#8B5CF6";

    case "Cutting":
      return "#F97316";

    case "Construction":
      return "#F59E0B";

    case "First Fitting":
      return "#EC4899";

    case "Alterations":
      return "#EAB308";

    case "Ready":
      return "#10B981";

    case "Collected":
      return "#059669";

    case "Completed":
      return "#6366F1";

    case "Cancelled":
      return "#6B7280";

    default:
      return "#9CA3AF";
  }
}

export default function JobCard({
  job,
  onClick,
}) {
  const outstanding =
    Number(job.balance ?? job.outstanding ?? 0);

  return (
    <div
      onClick={() => onClick?.(job)}
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
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 12,
                color: "#999",
                fontWeight: "bold",
                marginBottom: 8,
              }}
            >
              {job.reference || "CHR-NEW"}
            </div>

            <h3
              style={{
                margin: 0,
                color: "#2F3A3F",
              }}
            >
              {job.name}
            </h3>

            <div
              style={{
                display: "inline-block",
                marginTop: 10,
                marginBottom: 12,
                padding: "4px 10px",
                borderRadius: 20,
                background: getStatusColour(job.status),
                color: "#fff",
                fontSize: 12,
                fontWeight: "bold",
              }}
            >
              {job.status || "Unknown"}
            </div>

            <p
              style={{
                margin: "4px 0",
                color: "#666",
              }}
            >
              📅 Due: {job.dueDate || "-"}
            </p>

            <p
              style={{
                margin: "4px 0",
                color: "#666",
              }}
            >
              💰 Outstanding: ${outstanding.toFixed(2)}
            </p>
          </div>

          <div
            style={{
              fontSize: 24,
              color: "#BBB",
              alignSelf: "center",
            }}
          >
            ›
          </div>
        </div>
      </Card>
    </div>
  );
}