import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

import useLocalStorage from "../hooks/useLocalStorage";
import { enrichJob } from "../constants/jobWorkflow";

const ChrysalisContext = createContext(null);

export function ChrysalisProvider({ children }) {
  const [clients, setClients] = useLocalStorage(
    "chrysalis-clients",
    []
  );

  const [showWorkspace, setShowWorkspace] =
  useState(false);

const [selectedClient, setSelectedClient] =
  useState(null);

const [selectedJobId, setSelectedJobId] =
  useState(null);

function openClient(client) {
  setSelectedClient(client);
  setSelectedJobId(null);
  setShowWorkspace(true);
}

function openJob(client, jobId) {
  setSelectedClient(client);
  setSelectedJobId(jobId);
  setShowWorkspace(true);
}

function closeWorkspace() {
  setSelectedClient(null);
  setSelectedJobId(null);
  setShowWorkspace(false);
}

  const jobs = useMemo(() => {
  return clients.flatMap((client) =>
    (client.jobs ?? []).map((job) =>
  enrichJob({
    ...job,
    clientId: client.id,
    clientName: [
      client.firstName,
      client.lastName,
    ]
      .filter(Boolean)
      .join(" "),
  }))
  );
}, [clients]);

  const value = useMemo(
  () => ({
    clients,
    jobs,
    setClients,

    showWorkspace,
    selectedClient,
    selectedJobId,

    openClient,
    openJob,
    closeWorkspace,
  }),
  [
    clients,
    jobs,
    setClients,

    showWorkspace,
    selectedClient,
    selectedJobId,
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