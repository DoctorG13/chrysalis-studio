import { useEffect, useState } from "react";

import TextInput from "../common/TextInput";
import Button from "../common/Button";

import WorkspaceSection from "../workspace/WorkspaceSection";
import MeasurementsSection from "../workspace/MeasurementsSection";
import ClientJobsPanel from "./ClientJobsPanel";

export default function ClientWorkspace({
  client,
  clients,
  setClients,
  onClose,
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [measurements, setMeasurements] = useState({
    bust: "",
    waist: "",
    hips: "",
    shoulderWidth: "",
    backWidth: "",
    sleeveLength: "",
    upperArm: "",
    wrist: "",
    neck: "",
    height: "",
    inseam: "",
    outseam: "",
    acrossBust: "",
    acrossBack: "",
    hemLength: "",
  });

  const [openSections, setOpenSections] = useState({
    client: true,
    measurements: false,
    jobs: false,
    appointments: false,
    payments: false,
    notes: false,
    photos: false,
    documents: false,
  });

  useEffect(() => {
    if (!client) return;

    setFirstName(client.firstName || "");
    setLastName(client.lastName || "");
    setPhone(client.phone || "");
    setEmail(client.email || "");
    setNotes(client.notes || "");

    setMeasurements({
      bust: client.measurements?.bust || "",
      waist: client.measurements?.waist || "",
      hips: client.measurements?.hips || "",
      shoulderWidth: client.measurements?.shoulderWidth || "",
      backWidth: client.measurements?.backWidth || "",
      sleeveLength: client.measurements?.sleeveLength || "",
      upperArm: client.measurements?.upperArm || "",
      wrist: client.measurements?.wrist || "",
      neck: client.measurements?.neck || "",
      height: client.measurements?.height || "",
      inseam: client.measurements?.inseam || "",
      outseam: client.measurements?.outseam || "",
      acrossBust: client.measurements?.acrossBust || "",
      acrossBack: client.measurements?.acrossBack || "",
      hemLength: client.measurements?.hemLength || "",
    });
  }, [client]);

  if (!client) return null;

  function toggleSection(section) {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }

  function expandAll() {
    setOpenSections((prev) =>
      Object.fromEntries(
        Object.keys(prev).map((key) => [key, true])
      )
    );
  }

  function collapseAll() {
    setOpenSections((prev) =>
      Object.fromEntries(
        Object.keys(prev).map((key) => [key, false])
      )
    );
  }

  function handleSave() {
    const updatedClient = {
      ...client,
      firstName,
      lastName,
      phone,
      email,
      notes,
      measurements,
    };

    const updatedClients = clients.map((c) =>
      c.id === client.id ? updatedClient : c
    );

    setClients(updatedClients);

    onClose();
  }

  function handleDelete() {
    if (
      !window.confirm(
        `Delete ${client.firstName} ${client.lastName}?`
      )
    ) {
      return;
    }

    setClients(
      clients.filter((c) => c.id !== client.id)
    );

    onClose();
  }

  return (
    <>
      <h2 style={{ marginTop: 0 }}>
        Client Workspace
      </h2>

      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 20,
        }}
      >
        <Button onClick={expandAll}>
          Expand All
        </Button>

        <Button onClick={collapseAll}>
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
    client={client}
    clients={clients}
    setClients={setClients}
/>
      </WorkspaceSection>

      <hr />

      <div
        style={{
          display: "flex",
          gap: 10,
        }}
      >
        <Button onClick={handleSave}>
          💾 Save
        </Button>

        <Button onClick={handleDelete}>
          🗑 Delete
        </Button>

        <Button onClick={onClose}>
          Close
        </Button>
      </div>
    </>
  );
}