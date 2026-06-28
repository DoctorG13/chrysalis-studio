import Card from "../common/Card";

export default function ClientCard({ client }) {
  return (
    <Card>
      <h3
        style={{
          marginTop: 0,
          marginBottom: 10,
          color: "#2F3A3F",
        }}
      >
        {client.firstName} {client.lastName}
      </h3>

      <p
        style={{
          margin: "6px 0",
          color: "#666",
        }}
      >
        📞 {client.phone || "No phone number"}
      </p>

      <p
        style={{
          margin: "6px 0",
          color: "#666",
        }}
      >
        ✉️ {client.email || "No email address"}
      </p>
    </Card>
  );
}