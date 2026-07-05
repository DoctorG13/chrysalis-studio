import Card from "../common/Card";

function getStatusColour(status) {
  switch (status) {
    case "In Progress":
      return "#2ecc71";

    case "Awaiting Fitting":
      return "#f1c40f";

    case "Ready for Collection":
      return "#3498db";

    case "Completed":
      return "#9b59b6";

    case "Overdue":
      return "#e74c3c";

    default:
      return "#95a5a6";
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