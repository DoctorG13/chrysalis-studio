import { useEffect, useMemo, useState } from "react";

import TextInput from "../common/TextInput";
import Button from "../common/Button";

import WorkspaceSection from "../workspace/WorkspaceSection";
import ClientJobsPanel from "./ClientJobsPanel";
import ClientWorkspaceHeader from "./ClientWorkspaceHeader";
import MeasurementsSection from "../clients/MeasurementsSection";
import AssetSection from "./AssetSection";
import AppointmentsSection from "../appointments/AppointmentsSection";
import TimelineSection from "../timeline/TimelineSection";

export default function ClientWorkspace({
  client,
  clients,
  jobs = [],
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
    () =>
      clients.find(
        (candidate) =>
          String(candidate.id) === String(client?.id)
      ) ?? null,
    [clients, client?.id]
  );

  const clientAppointments = useMemo(
    () =>
      appointments.filter(
        (appointment) =>
          String(appointment.clientId) ===
          String(currentClient?.id)
      ),
    [appointments, currentClient?.id]
  );

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [measurements, setMeasurements] = useState({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteRequested, setDeleteRequested] = useState(false);

  const [openSections, setOpenSections] = useState({
    client: false,
    measurements: false,
    jobs: false,
    appointments: false,
    payments: false,
    notes: false,
    photos: false,
    documents: false,
    timeline: false,
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
      ...Object.fromEntries(
        Object.keys(prev).map((key) => [key, false])
      ),
      jobs: true,
    }));
  }, [initialJobId]);

  useEffect(() => {
    if (!deleteRequested) return;

    const stillExists = clients.some(
      (candidate) =>
        String(candidate.id) === String(client?.id)
    );

    if (!stillExists) {
      setDeleteRequested(false);
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setDeleteError("");
      onClose();
    }
  }, [clients, client?.id, deleteRequested, onClose]);

  if (!currentClient) return null;

  function toggleSection(section) {
    const isCurrentlyOpen = openSections[section];

    setOpenSections(
      Object.fromEntries(
        Object.keys(openSections).map((key) => [
          key,
          key === section ? !isCurrentlyOpen : false,
        ])
      )
    );
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
      clients.map((candidate) =>
        String(candidate.id) === String(updatedClient.id)
          ? updatedClient
          : candidate
      )
    );

    onClose();
  }

  function handleDelete() {
    setDeleteError("");
    setDeleteConfirmOpen(true);
  }

  async function confirmDelete() {
    if (isDeleting) return;

    setIsDeleting(true);
    setDeleteError("");
    setDeleteRequested(true);

    try {
      await setClients(
        clients.filter(
          (candidate) =>
            String(candidate.id) !== String(currentClient.id)
        )
      );

      // The provider updates its client state after SQLite confirms the
      // deletion. The effect above closes the workspace when the client
      // actually disappears from the shared state.
      window.setTimeout(() => {
        setDeleteRequested((requested) => {
          if (requested) {
            setIsDeleting(false);
            setDeleteError(
              "The client could not be deleted. Please try again."
            );
          }
          return requested;
        });
      }, 1500);
    } catch (error) {
      setDeleteRequested(false);
      setIsDeleting(false);
      setDeleteError(
        error instanceof Error
          ? error.message
          : "The client could not be deleted. Please try again."
      );
    }
  }

  function cancelDelete() {
    if (isDeleting) return;
    setDeleteConfirmOpen(false);
    setDeleteError("");
  }

  const allSectionKeys = Object.keys(openSections);

  return (
    <div style={{ paddingBottom: 82 }}>
      <ClientWorkspaceHeader
  client={currentClient}
  jobs={jobs}
  appointments={clientAppointments}
/>

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
                allSectionKeys.map((key) => [key, true])
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
                allSectionKeys.map((key) => [key, false])
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
        <TextInput
          label="First Name"
          value={firstName}
          onChange={setFirstName}
        />
        <TextInput
          label="Last Name"
          value={lastName}
          onChange={setLastName}
        />
        <TextInput
          label="Phone"
          value={phone}
          onChange={setPhone}
        />
        <TextInput
          label="Email"
          value={email}
          onChange={setEmail}
        />
        <TextInput
          label="Notes"
          value={notes}
          onChange={setNotes}
        />
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
          jobs={jobs}
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

      <WorkspaceSection
        title="Photos & Documents"
        icon="📎"
        isOpen={openSections.photos}
        onToggle={() => toggleSection("photos")}
      >
        <AssetSection clientId={currentClient.id} />
      </WorkspaceSection>

      <WorkspaceSection
        title="Timeline"
        icon="🕒"
        isOpen={openSections.timeline}
        onToggle={() => toggleSection("timeline")}
      >
        <TimelineSection clientId={currentClient.id} />
      </WorkspaceSection>

      {deleteConfirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-client-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            background: "rgba(15, 23, 42, 0.48)",
            backdropFilter: "blur(3px)",
          }}
        >
          <div
            style={{
              width: "min(460px, 100%)",
              borderRadius: 18,
              background: "#fff",
              border: "1px solid #E6E8EC",
              boxShadow: "0 24px 60px rgba(0,0,0,0.20)",
              padding: 26,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  display: "grid",
                  placeItems: "center",
                  background: "#FCE8EE",
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                🗑
              </div>

              <div>
                <h2
                  id="delete-client-title"
                  style={{
                    margin: 0,
                    fontSize: 22,
                    lineHeight: 1.2,
                    color: "#17213C",
                  }}
                >
                  Delete Client?
                </h2>
                <p
                  style={{
                    margin: "8px 0 0",
                    color: "#526079",
                    lineHeight: 1.5,
                  }}
                >
                  Are you sure you want to delete{" "}
                  <strong>
                    {currentClient.firstName} {currentClient.lastName}
                  </strong>
                  ?
                </p>
              </div>
            </div>

            <p
              style={{
                margin: "0 0 18px",
                padding: "12px 14px",
                borderRadius: 10,
                background: "#F8F9FB",
                color: "#5D687D",
                fontSize: 14,
                lineHeight: 1.45,
              }}
            >
              A temporary safety backup will be created before the client
              and their related records are removed. The backup is retained
              for 30 days.
            </p>

            {deleteError && (
              <div
                role="alert"
                style={{
                  marginBottom: 18,
                  padding: "11px 13px",
                  borderRadius: 10,
                  background: "#FDECEC",
                  color: "#9A1738",
                  fontSize: 14,
                  lineHeight: 1.4,
                }}
              >
                {deleteError}
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
              }}
            >
              <Button
                onClick={cancelDelete}
                disabled={isDeleting}
              >
                ✕ Cancel
              </Button>

              <Button
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting…" : "🗑 Delete Client"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          position: "sticky",
          bottom: 0,
          zIndex: 20,
          display: "flex",
          gap: 10,
          alignItems: "center",
          padding: "12px 0",
          marginTop: 20,
          borderTop: "1px solid #E6E8EC",
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(8px)",
          boxShadow: "0 -6px 18px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ flex: 1 }}>
          <Button onClick={handleSave}>💾 Save</Button>
        </div>

        <div style={{ flex: 1 }}>
          <Button onClick={onClose}>✕ Close</Button>
        </div>

        <div style={{ flex: 1 }}>
          <Button onClick={handleDelete}>🗑 Delete</Button>
        </div>
      </div>
    </div>
  );
}
