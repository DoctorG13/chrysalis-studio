import { useMemo, useState } from "react";

import Card from "../common/Card";
import ClientCard from "./ClientCard";

export default function ClientList({
  clients = [],
  onClientClick,
}) {
  const [search, setSearch] = useState("");

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return clients;
    }

    return clients.filter((client) => {
      const searchable = [
        client.name,
        client.firstName,
        client.lastName,
        client.phone,
        client.email,
        client.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(term);
    });
  }, [clients, search]);

  return (
    <Card title={`Clients (${filteredClients.length})`}>
      <input
        type="text"
        placeholder="🔍 Search clients..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: "12px",
          marginBottom: 20,
          borderRadius: 10,
          border: "1px solid #DDD",
          fontSize: 15,
          boxSizing: "border-box",
        }}
      />

      {filteredClients.length === 0 ? (
        <p
          style={{
            color: "#777",
            margin: 0,
          }}
        >
          No matching clients found.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 16,
          }}
        >
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onClick={onClientClick}
            />
          ))}
        </div>
      )}
    </Card>
  );
}