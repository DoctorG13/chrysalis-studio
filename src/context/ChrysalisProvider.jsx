import { createContext, useContext, useMemo } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import { enrichJob } from "../constants/jobWorkflow";

const ChrysalisContext = createContext(null);

export function ChrysalisProvider({ children }) {
  const [clients, setClients] = useLocalStorage(
    "chrysalis-clients",
    []
  );

  const [rawJobs, setRawJobs] = useLocalStorage(
    "chrysalis-jobs",
    []
  );

  const jobs = useMemo(
    () => rawJobs.map(enrichJob),
    [rawJobs]
  );

  const value = useMemo(
    () => ({
      clients,
      jobs,

      setClients,
      setJobs: setRawJobs,
    }),
    [clients, jobs, setClients, setRawJobs]
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