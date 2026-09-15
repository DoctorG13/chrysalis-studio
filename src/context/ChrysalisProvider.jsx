import {
  createContext,
  useCallback,
  useContext,
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
import {
  createJobRecord,
  deleteJobRecord,
  getJobs,
  updateJobRecord,
} from "../services/jobApi";
import {
  createAppointmentRecord,
  deleteAppointmentRecord,
  getAppointments,
  updateAppointmentRecord,
} from "../services/appointmentApi";

const ChrysalisContext = createContext(null);

function clientSnapshot(client) {
  const {
    jobs: _jobs,
    appointments: _appointments,
    ...withoutRelations
  } = client || {};

  return JSON.stringify(withoutRelations);
}

function clientForStorage(client) {
  const {
    jobs: _jobs,
    appointments: _appointments,
    ...withoutRelations
  } = client || {};

  return withoutRelations;
}

function sameId(left, right) {
  return String(left ?? "") === String(right ?? "");
}

export function ChrysalisProvider({ children }) {
  const [storedClients, setStoredClients] = useState([]);
  const [jobsState, setJobsState] = useState([]);
  const [appointmentsState, setAppointmentsState] = useState([]);

  const [isLoadingClients, setIsLoadingClients] =
    useState(true);

  const [clientDataError, setClientDataError] =
    useState("");

  const [jobDataError, setJobDataError] =
    useState("");

  const [appointmentDataError, setAppointmentDataError] =
    useState("");

  const [showWorkspace, setShowWorkspace] =
    useState(false);

  // Store the identifier, not a snapshot of the client object.
  // This keeps the open workspace synchronized with live data.
  const [selectedClientId, setSelectedClientId] =
    useState(null);

  const [selectedJobId, setSelectedJobId] =
    useState(null);

  const clients = useMemo(() => {
    return storedClients.map((client) => ({
      ...client,

      jobs: jobsState.filter((job) =>
        sameId(job.clientId, client.id)
      ),

      appointments: appointmentsState.filter((appointment) =>
        sameId(appointment.clientId, client.id)
      ),
    }));
  }, [
    storedClients,
    jobsState,
    appointmentsState,
  ]);

  // Always expose the current version of the selected client.
  // If a job or appointment changes, the workspace sees it immediately.
  const selectedClient = useMemo(
    () =>
      clients.find((client) =>
        sameId(client.id, selectedClientId)
      ) ?? null,
    [clients, selectedClientId]
  );

  useEffect(() => {
    let active = true;

    async function loadData() {
      setIsLoadingClients(true);
      setClientDataError("");
      setJobDataError("");
      setAppointmentDataError("");

      const [
        clientsResult,
        jobsResult,
        appointmentsResult,
      ] = await Promise.allSettled([
        getClients(),
        getJobs(),
        getAppointments(),
      ]);

      if (!active) return;

      if (clientsResult.status === "fulfilled") {
        setStoredClients(
          clientsResult.value.map(clientForStorage)
        );
      } else {
        console.error(
          "Unable to load clients from SQLite.",
          clientsResult.reason
        );

        setClientDataError(
          clientsResult.reason instanceof Error
            ? clientsResult.reason.message
            : "Unable to load client data."
        );

        setStoredClients([]);
      }

      if (jobsResult.status === "fulfilled") {
        setJobsState(jobsResult.value);
      } else {
        console.error(
          "Unable to load jobs from SQLite.",
          jobsResult.reason
        );

        setJobDataError(
          jobsResult.reason instanceof Error
            ? jobsResult.reason.message
            : "Unable to load job data."
        );

        setJobsState([]);
      }

      if (appointmentsResult.status === "fulfilled") {
        setAppointmentsState(appointmentsResult.value);
      } else {
        console.error(
          "Unable to load appointments from SQLite.",
          appointmentsResult.reason
        );

        setAppointmentDataError(
          appointmentsResult.reason instanceof Error
            ? appointmentsResult.reason.message
            : "Unable to load appointment data."
        );

        setAppointmentsState([]);
      }

      setIsLoadingClients(false);
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const persistClients = useCallback(
    async (nextClients) => {
      const previousById = new Map(
        storedClients.map((client) => [client.id, client])
      );

      const nextBaseClients =
        nextClients.map(clientForStorage);

      const nextById = new Map(
        nextBaseClients.map((client) => [client.id, client])
      );

      const created = [];
      const updated = [];
      const deleted = [];

      for (const client of nextBaseClients) {
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

      for (const client of storedClients) {
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

        setStoredClients(nextBaseClients);
        setClientDataError("");
      } catch (error) {
        console.error(
          "Unable to save client changes to SQLite.",
          error
        );

        setClientDataError(
          error instanceof Error
            ? error.message
            : "Unable to save client changes."
        );

        try {
          const stored = await getClients();

          setStoredClients(
            stored.map(clientForStorage)
          );
        } catch (reloadError) {
          console.error(
            "Unable to reload clients after a save error.",
            reloadError
          );
        }
      }
    },
    [storedClients]
  );

  const createJob = useCallback(async (job) => {
    try {
      const savedJob = await createJobRecord(job);

      setJobsState((current) => [
        ...current.filter(
          (item) => item.id !== savedJob.id
        ),
        savedJob,
      ]);

      setJobDataError("");

      return savedJob;
    } catch (error) {
      console.error(
        "Unable to create job in SQLite.",
        error
      );

      setJobDataError(
        error instanceof Error
          ? error.message
          : "Unable to create job."
      );

      throw error;
    }
  }, []);

  const updateJob = useCallback(async (job) => {
    try {
      const savedJob = await updateJobRecord(job);

      setJobsState((current) =>
        current.map((item) =>
          item.id === savedJob.id
            ? savedJob
            : item
        )
      );

      setJobDataError("");

      return savedJob;
    } catch (error) {
      console.error(
        "Unable to update job in SQLite.",
        error
      );

      setJobDataError(
        error instanceof Error
          ? error.message
          : "Unable to update job."
      );

      throw error;
    }
  }, []);

  const deleteJob = useCallback(async (jobId) => {
    try {
      await deleteJobRecord(jobId);

      setJobsState((current) =>
        current.filter((job) => job.id !== jobId)
      );

      // Clear the selected job if it was the one deleted.
      setSelectedJobId((current) =>
        sameId(current, jobId) ? null : current
      );

      setJobDataError("");
    } catch (error) {
      console.error(
        "Unable to delete job from SQLite.",
        error
      );

      setJobDataError(
        error instanceof Error
          ? error.message
          : "Unable to delete job."
      );

      throw error;
    }
  }, []);

  const createAppointment = useCallback(
    async (appointment) => {
      try {
        const savedAppointment =
          await createAppointmentRecord(appointment);

        setAppointmentsState((current) => [
          ...current.filter(
            (item) => item.id !== savedAppointment.id
          ),
          savedAppointment,
        ]);

        setAppointmentDataError("");

        return savedAppointment;
      } catch (error) {
        console.error(
          "Unable to create appointment in SQLite.",
          error
        );

        setAppointmentDataError(
          error instanceof Error
            ? error.message
            : "Unable to create appointment."
        );

        throw error;
      }
    },
    []
  );

  const updateAppointment = useCallback(
    async (appointment) => {
      try {
        const savedAppointment =
          await updateAppointmentRecord(appointment);

        setAppointmentsState((current) =>
          current.map((item) =>
            item.id === savedAppointment.id
              ? savedAppointment
              : item
          )
        );

        setAppointmentDataError("");

        return savedAppointment;
      } catch (error) {
        console.error(
          "Unable to update appointment in SQLite.",
          error
        );

        setAppointmentDataError(
          error instanceof Error
            ? error.message
            : "Unable to update appointment."
        );

        throw error;
      }
    },
    []
  );

  const deleteAppointment = useCallback(
    async (appointmentId) => {
      try {
        await deleteAppointmentRecord(
          appointmentId
        );

        setAppointmentsState((current) =>
          current.filter(
            (appointment) =>
              appointment.id !== appointmentId
          )
        );

        setAppointmentDataError("");
      } catch (error) {
        console.error(
          "Unable to delete appointment from SQLite.",
          error
        );

        setAppointmentDataError(
          error instanceof Error
            ? error.message
            : "Unable to delete appointment."
        );

        throw error;
      }
    },
    []
  );

  function openClient(client) {
    setSelectedClientId(client?.id ?? null);
    setSelectedJobId(null);
    setShowWorkspace(true);
  }

  function openJob(client, jobId) {
    setSelectedClientId(client?.id ?? null);
    setSelectedJobId(jobId);
    setShowWorkspace(true);
  }

  function closeWorkspace() {
    setSelectedClientId(null);
    setSelectedJobId(null);
    setShowWorkspace(false);
  }

  const jobs = useMemo(() => {
    return jobsState.map((job) => {
      const client = storedClients.find((candidate) =>
        sameId(candidate.id, job.clientId)
      );

      return enrichJob({
        ...job,

        clientName: [
          client?.firstName,
          client?.lastName,
        ]
          .filter(Boolean)
          .join(" "),
      });
    });
  }, [jobsState, storedClients]);

  const value = useMemo(
    () => ({
      clients,
      jobs,
      appointments: appointmentsState,

      setClients: persistClients,

      createJob,
      updateJob,
      deleteJob,

      createAppointment,
      updateAppointment,
      deleteAppointment,

      isLoadingClients,
      clientDataError,
      jobDataError,
      appointmentDataError,

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
      appointmentsState,
      persistClients,
      createJob,
      updateJob,
      deleteJob,
      createAppointment,
      updateAppointment,
      deleteAppointment,
      isLoadingClients,
      clientDataError,
      jobDataError,
      appointmentDataError,
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
