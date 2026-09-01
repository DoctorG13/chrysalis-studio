import { useState } from "react";

import Button from "../common/Button";
import TextInput from "../common/TextInput";

import { createJob } from "../../models/Job";

const selectStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  marginTop: 6,
  border: "1px solid #DDD",
  borderRadius: 10,
  fontSize: 16,
  outline: "none",
  backgroundColor: "#FFF",
  color: "#2F3A3F",
};

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
        placeholder="e.g. Wedding Dress"
      />

      <TextInput
        label="Due Date"
        type="date"
        value={dueDate}
        onChange={setDueDate}
      />

      <div style={{ marginBottom: 20 }}>
        <label
          style={{
            fontSize: 14,
            color: "#666",
            fontWeight: 600,
          }}
        >
          Priority
        </label>

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          style={selectStyle}
        >
          <option value="Low">Low</option>
          <option value="Normal">Normal</option>
          <option value="High">High</option>
          <option value="Urgent">Urgent</option>
        </select>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label
          style={{
            fontSize: 14,
            color: "#666",
            fontWeight: 600,
          }}
        >
          Status
        </label>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={selectStyle}
        >
          <option value="Quote">Quote</option>
          <option value="Accepted">Accepted</option>
          <option value="In Progress">In Progress</option>
          <option value="Awaiting Fitting">Awaiting Fitting</option>
          <option value="Ready">Ready</option>
          <option value="Collected">Collected</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
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
          Description
        </label>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add notes about this job..."
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
          Create Job
        </Button>

        <Button onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </>
  );
}
