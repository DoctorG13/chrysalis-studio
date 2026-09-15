import { useState } from "react";

import Button from "../common/Button";
import TextInput from "../common/TextInput";

import { createAppointment } from "../../models/Appointment";

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

export default function AppointmentForm({
  jobs = [],
  onSave,
  onCancel,
}) {
  const [type, setType] = useState("Initial Consultation");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [location, setLocation] = useState("");
  const [jobId, setJobId] = useState("");
  const [status, setStatus] = useState("Scheduled");
  const [notes, setNotes] = useState("");

  function handleSave() {
    if (!date) {
      alert("Please select an appointment date.");
      return;
    }

    const appointment = createAppointment({
      type,
      date,
      time,
      duration: Number(duration),
      location,
      jobId,
      status,
      notes,
    });

    onSave(appointment);
  }

  return (
    <>
      <h2
        style={{
          marginTop: 0,
          color: "#2F3A3F",
        }}
      >
        New Appointment
      </h2>

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
          Appointment Type
        </label>

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={selectStyle}
        >
          <option>Initial Consultation</option>
          <option>First Fitting</option>
          <option>Second Fitting</option>
          <option>Final Fitting</option>
          <option>Collection</option>
          <option>General Appointment</option>
        </select>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          gap: 16,
        }}
      >
        <TextInput
          label="Date"
          type="date"
          value={date}
          onChange={setDate}
        />

        <TextInput
          label="Time"
          type="time"
          value={time}
          onChange={setTime}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "0.7fr 1.3fr",
          gap: 16,
        }}
      >
        <TextInput
          label="Duration (minutes)"
          type="number"
          value={duration}
          onChange={setDuration}
        />

        <TextInput
          label="Location"
          value={location}
          onChange={setLocation}
          placeholder="e.g. Studio"
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
          Linked Job
        </label>

        <select
          value={jobId}
          onChange={(e) => setJobId(e.target.value)}
          style={selectStyle}
        >
          <option value="">None</option>

          {jobs.map((job) => (
            <option
              key={job.id}
              value={job.id}
            >
              {job.name}
            </option>
          ))}
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
          Status
        </label>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={selectStyle}
        >
          <option>Scheduled</option>
          <option>Completed</option>
          <option>Cancelled</option>
          <option>No Show</option>
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
          Notes
        </label>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes about this appointment..."
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
          Save Appointment
        </Button>

        <Button onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </>
  );
}
