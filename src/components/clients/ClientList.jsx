import { useState } from "react";

import Card from "../common/Card";
import ClientCard from "./ClientCard";

export default function ClientList({
  clients,
  onClientClick,
}) {
  const [search, setSearch] = useState("");

  const filteredClients = clients.filter((client) => {
    const searchText =
      `${client.firstName} ${client.lastName} ${client.phone} ${client.email}`.toLowerCase();

    return searchText.includes(search.toLowerCase());
  });

  return (
    <div
      style={{
        marginTop: 30,
      }}
    >
      <Card title="Clients">
        <input
          type="text"
          placeholder="🔍 Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid #DDD",
            marginBottom: 20,
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
            No matching clients.
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
    </div>
  );
}