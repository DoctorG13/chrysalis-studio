import Card from "../common/Card";
import ClientCard from "./ClientCard";

export default function ClientList({ clients }) {
  if (clients.length === 0) {
    return (
      <Card title="Clients">
        <p
          style={{
            margin: 0,
            color: "#777",
            lineHeight: 1.7,
          }}
        >
          No clients have been added yet.

          <br />
          <br />

          Click <strong>+ New Client</strong> to create your first client.
        </p>
      </Card>
    );
  }

  return (
    <div
      style={{
        marginTop: 30,
      }}
    >
      <h2
        style={{
          color: "#2F3A3F",
          marginBottom: 20,
        }}
      >
        Clients
      </h2>

      <div
        style={{
          display: "grid",
          gap: 20,
        }}
      >
        {clients.map((client) => (
          <ClientCard
            key={client.id}
            client={client}
          />
        ))}
      </div>
    </div>
  );
}