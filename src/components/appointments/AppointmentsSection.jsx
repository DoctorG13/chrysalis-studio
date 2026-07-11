import { useState } from "react";
import Button from "../common/Button";
import TextInput from "../common/TextInput";

const appointmentTypes = [
  "Initial Consultation",
  "Measure",
  "First Fitting",
  "Second Fitting",
  "Final Fitting",
  "Collection",
  "Other",
];

export default function AppointmentsSection({
  appointments = [],
  setAppointments,
}) {
  const [type, setType] = useState("Initial Consultation");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  function addAppointment() {
    if (!date || !time) return;

    setAppointments([
      ...appointments,
      {
        id: crypto.randomUUID(),
        type,
        date,
        time,
        notes,
      },
    ]);

    setType("Initial Consultation");
    setDate("");
    setTime("");
    setNotes("");
  }

  function removeAppointment(id) {
    setAppointments(
      appointments.filter((a) => a.id !== id)
    );
  }

  return (
    <>
      <div
        style={{
          display: "grid",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <label>
          Appointment Type
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              marginTop: 4,
            }}
          >
            {appointmentTypes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

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
          label="Notes"
          value={notes}
          onChange={setNotes}
        />

        <Button onClick={addAppointment}>
          ➕ Add Appointment
        </Button>
      </div>

      <div
        style={{
          display: "grid",
          gap: 10,
        }}
      >
        {appointments.length === 0 && (
          <div
            style={{
              color: "#888",
            }}
          >
            No appointments yet.
          </div>
        )}

        {appointments.map((appointment) => (
          <div
            key={appointment.id}
            style={{
              border: "1px solid #E5E7EB",
              borderRadius: 10,
              padding: 14,
            }}
          >
            <strong>{appointment.type}</strong>

            <div>
              📅 {appointment.date}
            </div>

            <div>
              🕒 {appointment.time}
            </div>

            {appointment.notes && (
              <div>{appointment.notes}</div>
            )}

            <div style={{ marginTop: 10 }}>
              <Button
                onClick={() =>
                  removeAppointment(appointment.id)
                }
              >
                🗑 Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}