import { useEffect, useMemo, useState } from "react";

import TextInput from "../common/TextInput";
import Button from "../common/Button";

import WorkspaceSection from "../workspace/WorkspaceSection";
import ClientJobsPanel from "./ClientJobsPanel";
import ClientWorkspaceHeader from "./ClientWorkspaceHeader";
import MeasurementsSection from "../clients/MeasurementsSection";
import AppointmentsSection from "../appointments/AppointmentsSection";

export default function ClientWorkspace({
  client,
  clients,
  setClients,
  createJob,
  updateJob,
  deleteJob,
  appointments = [],
  createAppointment,
  updateAppointment,
  deleteAppointment,
  initialJobId,
  onClose,
}) {
  const currentClient = useMemo(
    () => clients.find((c) => c.id === client?.id) ?? client,
    [clients, client]
  );

  const clientAppointments = useMemo(
    () =>
      appointments.filter(
        (appointment) => appointment.clientId === currentClient?.id
      ),
    [appointments, currentClient?.id]
  );

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [measurements, setMeasurements] = useState({});

  const [openSections, setOpenSections] = useState({
    client: false,
    measurements: false,
    jobs: false,
    appointments: false,
    payments: false,
    notes: false,
    photos: false,
    documents: false,
  });

  useEffect(() => {
    if (!currentClient) return;

    setFirstName(currentClient.firstName || "");
    setLastName(currentClient.lastName || "");
    setPhone(currentClient.phone || "");
    setEmail(currentClient.email || "");
    setNotes(currentClient.notes || "");
    setMeasurements(currentClient.measurements || {});
  }, [currentClient]);

  useEffect(() => {
    if (!initialJobId) return;

    setOpenSections((prev) => ({
      ...prev,
      jobs: true,
    }));
  }, [initialJobId]);

  if (!currentClient) return null;

  function toggleSection(section) {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }

  function handleSave() {
    const updatedClient = {
      ...currentClient,
      firstName,
      lastName,
      phone,
      email,
      notes,
      measurements,
    };

    setClients(
      clients.map((c) =>
        c.id === updatedClient.id ? updatedClient : c
      )
    );
    onClose();
  }

  function handleDelete() {
    if (
      !window.confirm(
        `Delete ${currentClient.firstName} ${currentClient.lastName}?`
      )
    ) {
      return;
    }

    setClients(
      clients.filter((c) => c.id !== currentClient.id)
    );
    onClose();
  }

  return (
    <>
      <ClientWorkspaceHeader client={currentClient} />

      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 20,
        }}
      >
        <Button
          onClick={() =>
            setOpenSections(
              Object.fromEntries(
                Object.keys(openSections).map((key) => [
                  key,
                  true,
                ])
              )
            )
          }
        >
          Expand All
        </Button>
        <Button
          onClick={() =>
            setOpenSections(
              Object.fromEntries(
                Object.keys(openSections).map((key) => [
                  key,
                  false,
                ])
              )
            )
          }
        >
          Collapse All
        </Button>
      </div>

      <WorkspaceSection
        title="Client Details"
        icon="👤"
        isOpen={openSections.client}
        onToggle={() => toggleSection("client")}
      >
        <TextInput label="First Name" value={firstName} onChange={setFirstName} />
        <TextInput label="Last Name" value={lastName} onChange={setLastName} />
        <TextInput label="Phone" value={phone} onChange={setPhone} />
        <TextInput label="Email" value={email} onChange={setEmail} />
        <TextInput label="Notes" value={notes} onChange={setNotes} />
      </WorkspaceSection>

      <WorkspaceSection
        title="Measurements"
        icon="📏"
        isOpen={openSections.measurements}
        onToggle={() => toggleSection("measurements")}
      >
        <MeasurementsSection
          measurements={measurements}
          setMeasurements={setMeasurements}
        />
      </WorkspaceSection>

      <WorkspaceSection
        title="Jobs"
        icon="💼"
        isOpen={openSections.jobs}
        onToggle={() => toggleSection("jobs")}
      >
        <ClientJobsPanel
          client={currentClient}
          clients={clients}
          createJob={createJob}
          updateJob={updateJob}
          deleteJob={deleteJob}
          initialJobId={initialJobId}
        />
      </WorkspaceSection>

      <WorkspaceSection
        title="Appointments"
        icon="📅"
        isOpen={openSections.appointments}
        onToggle={() => toggleSection("appointments")}
      >
        <AppointmentsSection
          clientId={currentClient.id}
          appointments={clientAppointments}
          createAppointment={createAppointment}
          updateAppointment={updateAppointment}
          deleteAppointment={deleteAppointment}
        />
      </WorkspaceSection>

      <hr />

      <div style={{ display: "flex", gap: 10 }}>
        <Button onClick={handleSave}>💾 Save</Button>
        <Button onClick={handleDelete}>🗑 Delete</Button>
        <Button onClick={onClose}>Close</Button>
      </div>
    </>
  );
}
