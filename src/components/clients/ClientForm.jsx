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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0 16px",
        }}
      >
        <TextInput
          label="First Name"
          value={firstName}
          onChange={setFirstName}
          placeholder="First name"
        />

        <TextInput
          label="Last Name"
          value={lastName}
          onChange={setLastName}
          placeholder="Last name"
        />

        <TextInput
          label="Phone"
          type="tel"
          value={phone}
          onChange={setPhone}
          placeholder="0400 000 000"
        />

        <TextInput
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="client@example.com"
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label
          style={{
            display: "block",
            fontSize: 14,
            color: "#666",
            fontWeight: 600,
            marginBottom: 6,
          }}
        >
          Notes
        </label>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes about this client..."
          rows={4}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "12px 14px",
            border: "1px solid #DDD",
            borderRadius: 10,
            fontSize: 16,
            lineHeight: 1.5,
            outline: "none",
            resize: "vertical",
            fontFamily: "inherit",
            color: "#2F3A3F",
          }}
        />
      </div>

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
