import { createContext, useContext, useMemo } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import { enrichJob } from "../constants/jobWorkflow";

const ChrysalisContext = createContext(null);

export function ChrysalisProvider({ children }) {
  const [clients, setClients] = useLocalStorage(
    "chrysalis-clients",
    []
  );

  const [rawJobs, setJobs] = useLocalStorage(
    "chrysalis-jobs",
    []
  );

  const jobs = useMemo(
    () => rawJobs.map((job) => enrichJob(job)),
    [rawJobs]
  );

  const value = useMemo(
    () => ({
      clients,
      setClients,

      jobs,
      setJobs,
    }),
    [
      clients,
      jobs,
      setClients,
      setJobs,
    ]
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