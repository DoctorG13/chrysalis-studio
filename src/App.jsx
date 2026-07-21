import { useMemo, useState } from "react";

import AppShell from "./components/layout/AppShell";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import StudioPage from "./pages/StudioPage";

import { useChrysalis } from "./context/ChrysalisProvider";
import { searchStudio } from "./utils/search";

export default function App() {
  const [currentPage, setCurrentPage] =
    useState("studio");

  const [searchQuery, setSearchQuery] =
    useState("");

  const {
    clients,
    jobs,
    setClients,
  } = useChrysalis();

  const searchResults = useMemo(() => {
    return searchStudio(
      searchQuery,
      clients,
      jobs
    );
  }, [
    searchQuery,
    clients,
    jobs,
  ]);

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
          title="Chrysalis Studio"
          user="Donna"
          searchQuery={searchQuery}
          searchResults={searchResults}
          onSearch={setSearchQuery}
        />
      }
    >
      <StudioPage
        clients={clients}
        jobs={jobs}
        setClients={setClients}
        searchQuery={searchQuery}
        searchResults={searchResults}
      />
    </AppShell>
  );
}