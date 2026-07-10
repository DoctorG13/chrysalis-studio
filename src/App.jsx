import { useMemo, useState } from "react";

import AppShell from "./components/layout/AppShell";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import StudioPage from "./pages/StudioPage";

import { useChrysalis } from "./context/ChrysalisProvider";
import { searchStudio } from "./utils/search";

export default function App() {
    const [currentPage, setCurrentPage] = useState("studio");
    const [searchQuery, setSearchQuery] = useState("");

    const {
        clients,
        jobs,
        setClients,
    } = useChrysalis();

    const searchResults = useMemo(() => {
    const results = searchStudio(searchQuery, clients, jobs);

    console.log("Query:", searchQuery);
    console.log("Clients:", clients);
    console.log("Jobs:", jobs);
    console.log("Results:", results);

    return results;
}, [searchQuery, clients, jobs]);

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