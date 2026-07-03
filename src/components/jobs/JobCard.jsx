import Card from "../common/Card";

export default function JobCard({
  job,
  onClick,
}) {
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
          <div>
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

            <p
              style={{
                margin: "10px 0 4px",
                color: "#666",
              }}
            >
              Status: {job.status}
            </p>

            <p
              style={{
                margin: 0,
                color: "#666",
              }}
            >
              Due: {job.dueDate || "-"}
            </p>
          </div>

          <div
            style={{
              fontSize: 24,
              color: "#BBB",
            }}
          >
            ›
          </div>
        </div>
      </Card>
    </div>
  );
}