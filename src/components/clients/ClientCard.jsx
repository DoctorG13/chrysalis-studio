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
        transition: "transform .15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <Card>
        <h3
          style={{
            marginTop: 0,
            marginBottom: 12,
            color: "#2F3A3F",
          }}
        >
          👤 {client.firstName} {client.lastName}
        </h3>

        <div
          style={{
            color: "#666",
            lineHeight: 1.8,
          }}
        >
          <div>📞 {client.phone || "No phone number"}</div>

          <div>✉️ {client.email || "No email address"}</div>
        </div>
      </Card>
    </div>
  );
}