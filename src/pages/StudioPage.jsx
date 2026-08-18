import { useEffect, useRef, useState } from "react";

import SlidePanel from "../components/common/SlidePanel";

import ClientForm from "../components/clients/ClientForm";
import ClientList from "../components/clients/ClientList";

import DashboardPage from "../components/dashboard/DashboardPage";

import SearchResultsOverlay from "../components/search/SearchResultsOverlay";

import JobsWorkspace from "../components/jobs/JobsWorkspace";
import { useChrysalis } from "../context/ChrysalisProvider";

export default function StudioPage({
  clients,
  jobs,
  setClients,
  createJob,
  updateJob,
  deleteJob,
  searchQuery = "",
  searchResults = [],
  onClearSearch,
  onOpenCalendar,
}) {
  const [showClientPanel, setShowClientPanel] = useState(false);

  const { openClient, openJob } = useChrysalis();

  const [showJobsWorkspace, setShowJobsWorkspace] = useState(false);

  const clientListRef = useRef(null);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  }, []);

  function handleSaveClient(client) {
    setClients([...clients, client]);
    setShowClientPanel(false);
  }

  function handleClientClick(client) {
    openClient(client);
  }

  function handleJobClick(client, jobId) {
    openJob(client, jobId);
  }

  function handleDashboardJobClick(job) {
    if (!job) return;

    const client = clients.find(
      (candidate) => candidate.id === job.clientId
    );

    if (!client) {
      console.warn(
        "Unable to open dashboard job: client not found",
        job
      );
      return;
    }

    openJob(client, job.id);
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

  return (
    <>
      <DashboardPage
        clients={clients}
        jobs={jobs}
        onNewClient={() => setShowClientPanel(true)}
        onClientsClick={handleClientsClick}
        onJobsClick={handleJobsClick}
        onSelectJob={handleDashboardJobClick}
        onOpenCalendar={onOpenCalendar}
      />

      {searchQuery.trim() !== "" && (
        <SearchResultsOverlay
          query={searchQuery}
          results={searchResults}
          onSelectClient={handleClientClick}
          onSelectJob={handleJobClick}
          onClose={onClearSearch}
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
        open={showJobsWorkspace}
        onClose={() => setShowJobsWorkspace(false)}
      >
        <JobsWorkspace
          jobs={jobs}
          clients={clients}
          createJob={createJob}
          updateJob={updateJob}
          deleteJob={deleteJob}
          onClose={() => setShowJobsWorkspace(false)}
        />
      </SlidePanel>
    </>
  );
}
