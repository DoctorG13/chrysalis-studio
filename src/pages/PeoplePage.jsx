import { useState } from "react";

import ClientForm from "../components/clients/ClientForm";
import ClientList from "../components/clients/ClientList";
import SlidePanel from "../components/common/SlidePanel";
import { useChrysalis } from "../context/ChrysalisProvider";

export default function PeoplePage({
  clients = [],
  setClients,
}) {
  const [showClientPanel, setShowClientPanel] =
    useState(false);

  const { openClient } = useChrysalis();

  function handleSaveClient(client) {
    setClients([
      ...clients,
      client,
    ]);

    setShowClientPanel(false);
  }

  function handleClientClick(client) {
    openClient(client);
  }

  return (
    <div
      style={{
        paddingBottom: 40,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 20,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              color: "#8B1E3F",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 1,
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            People
          </div>

          <h1
            style={{
              margin: 0,
              color: "#2F3A3F",
              fontSize: 28,
            }}
          >
            Clients
          </h1>

          <p
            style={{
              margin: "8px 0 0",
              color: "#687178",
              fontSize: 14,
            }}
          >
            Manage your clients and their
            garments, appointments and jobs.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setShowClientPanel(true)
          }
          style={{
            border: "none",
            borderRadius: 10,
            padding: "12px 18px",
            background: "#8B1E3F",
            color: "#FFFFFF",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow:
              "0 3px 10px rgba(31,41,51,.12)",
          }}
        >
          + New Client
        </button>
      </div>

      <ClientList
        clients={clients}
        onClientClick={handleClientClick}
      />

      <SlidePanel
        open={showClientPanel}
        onClose={() =>
          setShowClientPanel(false)
        }
      >
        <ClientForm
          onSave={handleSaveClient}
          onCancel={() =>
            setShowClientPanel(false)
          }
        />
      </SlidePanel>
    </div>
  );
}