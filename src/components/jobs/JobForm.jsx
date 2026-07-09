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

  function createTimelineEvent(title, type = "system") {
    return {
      id:
        globalThis.crypto?.randomUUID?.() ??
        `timeline-${Date.now()}`,
      title,
      type,
      date: new Date().toISOString(),
    };
  }

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
      timeline: [
        createTimelineEvent("Job Created"),
      ],
    });

    onSave(job);
  }

  return (
    <>
      <h2>Create Job</h2>

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

      <TextInput
        label="Priority"
        value={priority}
        onChange={setPriority}
      />

      <TextInput
        label="Status"
        value={status}
        onChange={setStatus}
      />

      <TextInput
        label="Description"
        value={description}
        onChange={setDescription}
      />

      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 24,
        }}
      >
        <Button onClick={handleSave}>
          Save
        </Button>

        <Button onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </>
  );
}