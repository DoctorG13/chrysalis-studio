import { useEffect, useState } from "react";

import TextInput from "../common/TextInput";
import Button from "../common/Button";

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

  useEffect(() => {
    if (!client) return;

    setFirstName(client.firstName || "");
    setLastName(client.lastName || "");
    setPhone(client.phone || "");
    setEmail(client.email || "");
    setNotes(client.notes || "");
  }, [client]);

  if (!client) return null;

  function handleSave() {
    const updatedClient = {
      ...client,
      firstName,
      lastName,
      phone,
      email,
      notes,
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

    const updatedClients = clients.filter(
      (c) => c.id !== client.id
    );

    setClients(updatedClients);

    onClose();
  }

  return (
    <>
      <h2
        style={{
          marginTop: 0,
          color: "#2F3A3F",
        }}
      >
        Client Workspace
      </h2>

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

      <hr
        style={{
          margin: "30px 0",
        }}
      />

      <h3>Garments</h3>

      <p
        style={{
          color: "#777",
        }}
      >
        No garments have been added yet.
      </p>

      <Button>
        + New Garment
      </Button>

      <hr
        style={{
          margin: "30px 0",
        }}
      />

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <Button onClick={handleSave}>
          💾 Save Changes
        </Button>

        <Button onClick={handleDelete}>
          🗑 Delete Client
        </Button>

        <Button onClick={onClose}>
          Close
        </Button>
      </div>
    </>
  );
}