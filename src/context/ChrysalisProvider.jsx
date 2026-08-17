import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { enrichJob } from "../constants/jobWorkflow";
import {
  createClientRecord,
  deleteClientRecord,
  getClients,
  updateClientRecord,
} from "../services/clientApi";

const ChrysalisContext = createContext(null);

function clientSnapshot(client) {
  return JSON.stringify(client);
}

export function ChrysalisProvider({ children }) {
  const [clients, setClientsState] = useState([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [clientDataError, setClientDataError] = useState("");

  const [showWorkspace, setShowWorkspace] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadClients() {
      setIsLoadingClients(true);
      setClientDataError("");

      try {
        const storedClients = await getClients();

        if (!active) return;

        setClientsState(storedClients);
      } catch (error) {
        console.error("Unable to load clients from SQLite.", error);

        if (!active) return;

        setClientDataError(
          error instanceof Error
            ? error.message
            : "Unable to load client data."
        );
        setClientsState([]);
      } finally {
        if (active) {
          setIsLoadingClients(false);
        }
      }
    }

    loadClients();

    return () => {
      active = false;
    };
  }, []);

  const persistClients = useCallback(
    async (nextClients) => {
      const previousById = new Map(
        clients.map((client) => [client.id, client])
      );
      const nextById = new Map(
        nextClients.map((client) => [client.id, client])
      );

      const created = [];
      const updated = [];
      const deleted = [];

      for (const client of nextClients) {
        const previous = previousById.get(client.id);

        if (!previous) {
          created.push(client);
          continue;
        }

        if (
          clientSnapshot(previous) !==
          clientSnapshot(client)
        ) {
          updated.push(client);
        }
      }

      for (const client of clients) {
        if (!nextById.has(client.id)) {
          deleted.push(client);
        }
      }

      try {
        for (const client of created) {
          await createClientRecord(client);
        }

        for (const client of updated) {
          await updateClientRecord(client);
        }

        for (const client of deleted) {
          await deleteClientRecord(client.id);
        }

        setClientsState(nextClients);
        setClientDataError("");
      } catch (error) {
        console.error("Unable to save client changes to SQLite.", error);

        setClientDataError(
          error instanceof Error
            ? error.message
            : "Unable to save client changes."
        );

        throw error;
      }
    },
    [clients]
  );

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
        })
      )
    );
  }, [clients]);

  const value = useMemo(
    () => ({
      clients,
      jobs,
      setClients: persistClients,

      isLoadingClients,
      clientDataError,

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
      persistClients,
      isLoadingClients,
      clientDataError,
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
