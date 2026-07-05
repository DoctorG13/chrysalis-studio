import { createContext, useContext, useMemo } from "react";

import useLocalStorage from "../hooks/useLocalStorage";

const ChrysalisContext = createContext(null);

export function ChrysalisProvider({ children }) {
    const [clients, setClients] = useLocalStorage(
        "chrysalis-clients",
        []
    );

    const value = useMemo(
        () => ({
            clients,
            setClients,
        }),
        [clients]
    );

    return (
        <ChrysalisContext.Provider value={value}>
            {children}
        </ChrysalisContext.Provider>
    );
}

export function useChrysalis() {
    const context = useContext(ChrysalisContext);

    if (!context) {
        throw new Error(
            "useChrysalis must be used inside a ChrysalisProvider."
        );
    }

    return context;
}