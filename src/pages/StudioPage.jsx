import { useState, useRef } from "react";

import SlidePanel from "../components/common/SlidePanel";

import ClientForm from "../components/clients/ClientForm";
import ClientList from "../components/clients/ClientList";
import ClientWorkspace from "../components/clients/ClientWorkspace";

import DashboardPage from "../components/dashboard/DashboardPage";

import SearchResultsOverlay from "../components/search/SearchResultsOverlay";

import JobsWorkspace from "../components/jobs/JobsWorkspace";

export default function StudioPage({
  clients,
  jobs,
  setClients,
  searchQuery = "",
  searchResults = [],
}) {
  const [showClientPanel, setShowClientPanel] =
    useState(false);

  const [selectedClient, setSelectedClient] =
    useState(null);

  const [selectedJobId, setSelectedJobId] =
    useState(null);

  const [showWorkspace, setShowWorkspace] =
    useState(false);

  const [showJobsWorkspace, setShowJobsWorkspace] =
  useState(false);

  const clientListRef = useRef(null);

  function handleSaveClient(client) {
    setClients([...clients, client]);
    setShowClientPanel(false);
  }

  function handleClientClick(client) {
    setSelectedJobId(null);
    setSelectedClient(client);
    setShowWorkspace(true);
  }

  function handleJobClick(client, jobId) {
    setSelectedClient(client);
    setSelectedJobId(jobId);
    setShowWorkspace(true);
  }

  function closeWorkspace() {
    setSelectedClient(null);
    setSelectedJobId(null);
    setShowWorkspace(false);
  }

  function handleClientsClick() {
    clientListRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function handleJobsClick() {
  setShowJobsWorkspace(true);
}

  function handleAppointmentsClick() {
    console.log("Appointments clicked");
  }

  function handlePaymentsClick() {
    console.log("Payments clicked");
  }

  return (
    <>
      <DashboardPage
        clients={clients}
        jobs={jobs}
        onNewClient={() => setShowClientPanel(true)}
        onClientsClick={handleClientsClick}
        onJobsClick={handleJobsClick}
        onAppointmentsClick={handleAppointmentsClick}
        onPaymentsClick={handlePaymentsClick}
      />

      {searchQuery.trim() !== "" && (
        <SearchResultsOverlay
          query={searchQuery}
          results={searchResults}
          onSelectClient={handleClientClick}
          onSelectJob={handleJobClick}
        />
      )}

      <div ref={clientListRef}>
        <ClientList
          clients={clients}
          onClientClick={handleClientClick}
        />
      </div>

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
        open={showWorkspace}
        onClose={closeWorkspace}
      >
        <ClientWorkspace
          client={selectedClient}
          clients={clients}
          setClients={setClients}
          initialJobId={selectedJobId}
          onClose={closeWorkspace}
        />
      </SlidePanel>

      <SlidePanel
  open={showJobsWorkspace}
  onClose={() => setShowJobsWorkspace(false)}
>
  <JobsWorkspace
    jobs={jobs}
    clients={clients}
    setClients={setClients}
    onClose={() => setShowJobsWorkspace(false)}
  />
</SlidePanel>

    </>
  );
}