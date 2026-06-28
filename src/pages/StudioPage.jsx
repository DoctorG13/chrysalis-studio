import { useState } from "react";

import SlidePanel from "../components/common/SlidePanel";

import ClientForm from "../components/clients/ClientForm";
import ClientList from "../components/clients/ClientList";

import WelcomeCard from "../components/dashboard/WelcomeCard";
import StatsGrid from "../components/dashboard/StatsGrid";
import QuickActions from "../components/dashboard/QuickActions";

export default function StudioPage({
  clients,
  setClients,
}) {
  const [showClientPanel, setShowClientPanel] = useState(false);

  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientDetails, setShowClientDetails] = useState(false);

  function handleSaveClient(client) {
    setClients([...clients, client]);
    setShowClientPanel(false);
  }

  function handleClientClick(client) {
    setSelectedClient(client);
    setShowClientDetails(true);
  }

  return (
    <>
      <h1
        style={{
          marginTop: 0,
          marginBottom: 8,
          color: "#2F3A3F",
          fontSize: 38,
        }}
      >
        Today's Studio
      </h1>

      <p
        style={{
          color: "#777",
          fontSize: 18,
          marginBottom: 35,
        }}
      >
        Welcome back. Everything is ready for your day.
      </p>

      <StatsGrid clients={clients} />

      <WelcomeCard clients={clients} />

      <QuickActions
        onNewClient={() => setShowClientPanel(true)}
      />

      <ClientList
        clients={clients}
        onClientClick={handleClientClick}
      />

      <SlidePanel
        open={showClientPanel}
        onClose={() => setShowClientPanel(false)}
      >
        <ClientForm
          onSave={handleSaveClient}
          onCancel={() => setShowClientPanel(false)}
        />
      </SlidePanel>

      <SlidePanel
        open={showClientDetails}
        onClose={() => setShowClientDetails(false)}
      >
        {selectedClient && (
          <>
            <h2>
              {selectedClient.firstName} {selectedClient.lastName}
            </h2>

            <p>📞 {selectedClient.phone}</p>

            <p>✉️ {selectedClient.email}</p>
          </>
        )}
      </SlidePanel>
    </>
  );
}