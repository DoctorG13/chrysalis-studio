import { useMemo, useState } from "react";

import AppShell from "./components/layout/AppShell";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";

import StudioPage from "./pages/StudioPage";
import CalendarPage from "./pages/CalendarPage";

import ClientWorkspace from "./components/clients/ClientWorkspace";
import SlidePanel from "./components/common/SlidePanel";

import { useChrysalis } from "./context/ChrysalisProvider";
import { searchStudio } from "./utils/search";

export default function App() {
  const [currentPage, setCurrentPage] = useState("studio");
  const [searchQuery, setSearchQuery] = useState("");

  const {
    clients,
    jobs,
    appointments,
    setClients,
    createJob,
    updateJob,
    deleteJob,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    showWorkspace,
    selectedClient,
    selectedJobId,
    closeWorkspace,
  } = useChrysalis();

  const searchResults = useMemo(() => {
    return searchStudio(searchQuery, clients, jobs);
  }, [searchQuery, clients, jobs]);

  function renderPage() {
    switch (currentPage) {
      case "calendar":
        return (
          <CalendarPage
            clients={clients}
            jobs={jobs}
          />
        );

      case "studio":
      default:
        return (
          <StudioPage
            clients={clients}
            jobs={jobs}
            setClients={setClients}
            createJob={createJob}
            updateJob={updateJob}
            deleteJob={deleteJob}
            searchQuery={searchQuery}
            searchResults={searchResults}
            onClearSearch={() => setSearchQuery("")}
          />
        );
    }
  }

  return (
    <AppShell
      sidebar={
        <Sidebar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      }
      header={
        <Header
          title={
            currentPage === "calendar"
              ? "Calendar"
              : "Chrysalis Studio"
          }
          user="Donna"
          searchQuery={searchQuery}
          searchResults={searchResults}
          onSearch={setSearchQuery}
        />
      }
    >
      {renderPage()}

      <SlidePanel
        open={showWorkspace}
        onClose={closeWorkspace}
      >
        <ClientWorkspace
          client={selectedClient}
          clients={clients}
          jobs={jobs}
          setClients={setClients}
          createJob={createJob}
          updateJob={updateJob}
          deleteJob={deleteJob}
          appointments={appointments}
          createAppointment={createAppointment}
          updateAppointment={updateAppointment}
          deleteAppointment={deleteAppointment}
          initialJobId={selectedJobId}
          onClose={closeWorkspace}
        />
      </SlidePanel>
    </AppShell>
  );
}
