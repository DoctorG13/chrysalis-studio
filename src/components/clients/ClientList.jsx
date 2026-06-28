import ClientCard from "./ClientCard";

export default function ClientList({ clients }) {
  if (clients.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: 30 }}>
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