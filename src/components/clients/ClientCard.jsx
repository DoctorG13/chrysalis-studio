import Card from "../common/Card";

export default function ClientCard({
  client,
  onClick,
}) {
  return (
    <div
      onClick={() => onClick(client)}
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
            <h3
              style={{
                margin: 0,
                color: "#2F3A3F",
              }}
            >
              👤 {client.firstName} {client.lastName}
            </h3>

            <p
              style={{
                margin: "10px 0 4px",
                color: "#666",
              }}
            >
              📞 {client.phone || "No phone number"}
            </p>

            <p
              style={{
                margin: 0,
                color: "#666",
              }}
            >
              ✉️ {client.email || "No email address"}
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