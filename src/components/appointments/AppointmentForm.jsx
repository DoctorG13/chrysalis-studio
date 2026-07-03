import { useState } from "react";

import Button from "../common/Button";
import TextInput from "../common/TextInput";

import { createAppointment } from "../../models/Appointment";

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
        <label>Appointment Type</label>

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            marginTop: 6,
            borderRadius: 8,
          }}
        >
          <option>Initial Consultation</option>
          <option>First Fitting</option>
          <option>Second Fitting</option>
          <option>Final Fitting</option>
          <option>Collection</option>
          <option>General Appointment</option>
        </select>
      </div>

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
      />

      <div style={{ marginBottom: 20 }}>
        <label>Linked Job</label>

        <select
          value={jobId}
          onChange={(e) => setJobId(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            marginTop: 6,
            borderRadius: 8,
          }}
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
          <option>Scheduled</option>
          <option>Completed</option>
          <option>Cancelled</option>
          <option>No Show</option>
        </select>
      </div>

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
          Save Appointment
        </Button>

        <Button onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </>
  );
}