import { useMemo, useState } from "react";

import AppShell from "./components/layout/AppShell";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import StudioPage from "./pages/StudioPage";
import CalendarPage from "./pages/CalendarPage";
import SettingsPage from "./pages/SettingsPage";
import ClientWorkspace from "./components/clients/ClientWorkspace";
import SlidePanel from "./components/common/SlidePanel";
import { useChrysalis } from "./context/ChrysalisProvider";
import { searchStudio } from "./utils/search";

export default function App() {
  const [currentPage, setCurrentPage] = useState("studio");
  const [searchQuery, setSearchQuery] = useState("");

  const { clients, jobs, setClients, showWorkspace, selectedClient, selectedJobId, closeWorkspace } = useChrysalis();

  const searchResults = useMemo(() => searchStudio(searchQuery, clients, jobs), [searchQuery, clients, jobs]);

  function renderPage() {
    switch (currentPage) {
      case "calendar":
        return <CalendarPage clients={clients} jobs={jobs} />;
      case "settings":
        return <SettingsPage />;
      case "studio":
      default:
        return <StudioPage clients={clients} jobs={jobs} setClients={setClients} searchQuery={searchQuery} searchResults={searchResults} onClearSearch={() => setSearchQuery("")} />;
    }
  }

  const headerTitle = currentPage === "calendar" ? "Calendar" : currentPage === "settings" ? "Settings" : "Chrysalis Studio";

  return (
    <AppShell
      sidebar={<Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />}
      header={<Header title={headerTitle} user="Donna" searchQuery={searchQuery} searchResults={searchResults} onSearch={setSearchQuery} />}
    >
      {renderPage()}
      <SlidePanel open={showWorkspace} onClose={closeWorkspace}>
        <ClientWorkspace client={selectedClient} clients={clients} setClients={setClients} initialJobId={selectedJobId} onClose={closeWorkspace} />
      </SlidePanel>
    </AppShell>
  );
}
