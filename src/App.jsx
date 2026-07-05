import { useState } from "react";

import AppShell from "./components/layout/AppShell";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import StudioPage from "./pages/StudioPage";

import { useChrysalis } from "./context/ChrysalisProvider";

export default function App() {
    const [currentPage, setCurrentPage] = useState("studio");

    const {
        clients,
        setClients,
    } = useChrysalis();

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
                />
            }
        >
            <StudioPage
                clients={clients}
                setClients={setClients}
            />
        </AppShell>
    );
}