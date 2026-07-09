import { useState, useRef } from "react";

import SlidePanel from "../components/common/SlidePanel";

import ClientForm from "../components/clients/ClientForm";
import ClientList from "../components/clients/ClientList";
import ClientWorkspace from "../components/clients/ClientWorkspace";

import DashboardPage from "../components/dashboard/DashboardPage";

export default function StudioPage({
  clients,
  jobs = [],
  setClients,
  searchQuery = "",
  searchResults = [],
}) {
  const [showClientPanel, setShowClientPanel] =
    useState(false);

  const [selectedClient, setSelectedClient] =
    useState(null);

  const [showWorkspace, setShowWorkspace] =
    useState(false);

  const clientListRef = useRef(null);

  function handleSaveClient(client) {
    setClients([...clients, client]);
    setShowClientPanel(false);
  }

  function handleClientClick(client) {
    setSelectedClient(client);
    setShowWorkspace(true);
  }

  function closeWorkspace() {
    setSelectedClient(null);
    setShowWorkspace(false);
  }

  function handleClientsClick() {
    clientListRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function handleJobsClick() {
    console.log("Jobs clicked");
  }

  function handleAppointmentsClick() {
    console.log("Appointments clicked");
  }

  function handlePaymentsClick() {
    console.log("Payments clicked");
  }

  return (
    <>
      {searchQuery.trim() !== "" && (
  <div
    style={{
      marginBottom: 24,
      padding: 20,
      background: "#FFFFFF",
      border: "1px solid #E5E7EB",
      borderRadius: 12,
    }}
  >
    <h3
  style={{
    marginTop: 0,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }}
>
  <span>Search Results</span>

  <span
    style={{
      fontSize: 14,
      color: "#666",
      fontWeight: 500,
    }}
  >
    {searchResults.length} match
    {searchResults.length === 1 ? "" : "es"}
  </span>
</h3>

    {searchResults.length === 0 ? (
      <p>No matches found.</p>
    ) : (
      searchResults.map((result) => (
        <div
          key={`${result.type}-${result.id}`}
          onClick={() => {
            if (result.type === "client") {
              handleClientClick(result.data);
            }
          }}
          style={{
            padding: "12px 0",
            borderBottom: "1px solid #EEE",
            cursor: "pointer",
          }}
        >
          <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }}
>
  <div>
    <strong>{result.title}</strong>

    <div
      style={{
        color: "#666",
        fontSize: 14,
        marginTop: 2,
      }}
    >
      {result.subtitle}
    </div>
  </div>

  <span
    style={{
      padding: "4px 10px",
      borderRadius: 999,
      background:
        result.type === "client"
          ? "#EEF6FF"
          : "#F5F3FF",
      color:
        result.type === "client"
          ? "#2563EB"
          : "#7C3AED",
      fontSize: 12,
      fontWeight: 600,
    }}
  >
    {result.type === "client"
      ? "CLIENT"
      : "JOB"}
  </span>
</div>
        </div>
      ))
    )}
  </div>
)}

      <div ref={clientListRef}>
        <ClientList
          clients={clients}
          onClientClick={handleClientClick}
        />
      </div>

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

      <SlidePanel
        open={showWorkspace}
        onClose={closeWorkspace}
      >
        <ClientWorkspace
          client={selectedClient}
          clients={clients}
          setClients={setClients}
          onClose={closeWorkspace}
        />
      </SlidePanel>
    </>
  );
}