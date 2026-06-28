import { useState } from "react";

import TextInput from "../common/TextInput";
import Button from "../common/Button";
import { createClient } from "../../models/Client";

export default function ClientForm({
  onSave,
  onCancel,
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  function handleSave() {
    const client = createClient({
      firstName,
      lastName,
      phone,
      email,
      notes,
    });

    onSave(client);

    setFirstName("");
    setLastName("");
    setPhone("");
    setEmail("");
    setNotes("");
  }

  return (
    <>
      <h2
        style={{
          marginTop: 0,
          marginBottom: 25,
          color: "#2F3A3F",
        }}
      >
        New Client
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

      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 30,
        }}
      >
        <Button onClick={handleSave}>
          Save Client
        </Button>

        <Button onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </>
  );
}