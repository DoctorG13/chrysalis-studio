import { useState } from "react";

import Button from "../common/Button";
import TextInput from "../common/TextInput";

import { createJob } from "../../models/Job";

export default function JobForm({
  onSave,
  onCancel,
}) {
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [status, setStatus] = useState("Quote");
  const [description, setDescription] = useState("");

  function handleSave() {
    if (!name.trim()) {
      alert("Please enter a Job Name.");
      return;
    }

    const job = createJob({
      name,
      dueDate,
      priority,
      status,
      description,
    });

    onSave(job);
  }

  return (
    <>
      <h2
        style={{
          marginTop: 0,
          color: "#2F3A3F",
        }}
      >
        New Job
      </h2>

      <TextInput
        label="Job Name"
        value={name}
        onChange={setName}
      />

      <TextInput
        label="Due Date"
        type="date"
        value={dueDate}
        onChange={setDueDate}
      />

      <div style={{ marginBottom: 20 }}>
        <label>Priority</label>

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            marginTop: 6,
            borderRadius: 8,
          }}
        >
          <option>Low</option>
          <option>Normal</option>
          <option>High</option>
          <option>Urgent</option>
        </select>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>Status</label>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            marginTop: 6,
            borderRadius: 8,
          }}
        >
          <option>Quote</option>
<option>Booked</option>
<option>Pattern</option>
<option>Cutting</option>
<option>Construction</option>
<option>First Fitting</option>
<option>Alterations</option>
<option>Ready</option>
<option>Collected</option>
<option>Completed</option>
<option>Cancelled</option>
        </select>
      </div>

      <TextInput
        label="Description"
        value={description}
        onChange={setDescription}
      />

      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 30,
        }}
      >
        <Button onClick={handleSave}>
          Create Job
        </Button>

        <Button onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </>
  );
}