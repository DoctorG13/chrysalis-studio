import { useEffect, useRef, useState } from "react";

import Button from "../common/Button";
import TextInput from "../common/TextInput";
import { ThriveDialog, useThriveDialog } from "../common/ThriveDialog";

const appointmentTypes = [
  "Initial Consultation",
  "Measure",
  "First Fitting",
  "Second Fitting",
  "Final Fitting",
  "Collection",
  "Other",
];

function createId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function AppointmentsSection({
  clientId,
  appointments = [],
  createAppointment,
  updateAppointment,
  deleteAppointment,
}) {
  const [type, setType] = useState("Initial Consultation");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const { confirm, dialogProps } = useThriveDialog();

  const editorRef = useRef(null);

  useEffect(() => {
    if (!editingId) return;

    requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [editingId]);

  function resetForm() {
    setType("Initial Consultation");
    setDate("");
    setTime("");
    setNotes("");
    setError("");
    setEditingId(null);
  }

  function startEdit(appointment) {
    setEditingId(appointment.id);
    setType(appointment.type || "Initial Consultation");
    setDate(appointment.date || "");
    setTime(appointment.time || "");
    setNotes(appointment.notes || "");
    setError("");
  }

  async function saveAppointment() {
    setError("");

    if (!date) {
      setError("Please select an appointment date.");
      return;
    }

    if (!time) {
      setError("Please select an appointment time.");
      return;
    }

    if (!clientId) {
      setError("Unable to save appointment: client is missing.");
      return;
    }

    const appointment = {
      id: editingId || createId(),
      clientId,
      type,
      date,
      time,
      notes: notes.trim(),
      duration: 60,
      location: "",
      status: "Scheduled",
      jobId: "",
    };

    setIsSaving(true);

    try {
      if (editingId) {
        await updateAppointment(appointment);
      } else {
        await createAppointment(appointment);
      }

      resetForm();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save appointment."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = await confirm({
      title: "Delete Appointment",
      message: "Delete this appointment? This cannot be undone.",
      confirmLabel: "Delete Appointment",
      danger: true,
    });
    if (!confirmed) return;

    setError("");
    setIsSaving(true);

    try {
      await deleteAppointment(id);

      if (editingId === id) {
        resetForm();
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete appointment."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <div
        style={{
          display: "grid",
          gap: 10,
          marginBottom: 24,
        }}
      >
        {appointments.length === 0 && (
          <div
            style={{
              color: "#888",
              padding: 12,
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
              background: "#FFFFFF",
            }}
          >
            <strong>{appointment.type}</strong>

            <div>📅 {appointment.date}</div>
            <div>🕒 {appointment.time}</div>

            {appointment.notes && (
              <div style={{ marginTop: 4 }}>
                {appointment.notes}
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 12,
              }}
            >
              <Button
                onClick={() => startEdit(appointment)}
                disabled={isSaving}
              >
                ✎ Edit
              </Button>

              <Button
                onClick={() => handleDelete(appointment.id)}
                disabled={isSaving}
              >
                🗑 Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div
        ref={editorRef}
        style={{
          borderTop: "1px solid #E5E7EB",
          paddingTop: 22,
          marginTop: 8,
          scrollMarginTop: 90,
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 14,
          }}
        >
          {editingId ? "Edit Appointment" : "Add Appointment"}
        </div>

        <div
          style={{
            display: "grid",
            gap: 12,
          }}
        >
          <label>
            Appointment Type

            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              disabled={isSaving}
              style={{
                width: "100%",
                padding: 10,
                marginTop: 4,
              }}
            >
              {appointmentTypes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
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

          {error && (
            <div
              role="alert"
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                background: "#FFF1F2",
                border: "1px solid #FECDD3",
                color: "#9F1239",
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: 10,
            }}
          >
            <Button onClick={saveAppointment} disabled={isSaving}>
              {isSaving
                ? "Saving..."
                : editingId
                  ? "💾 Save Changes"
                  : "➕ Add Appointment"}
            </Button>

            {editingId && (
              <Button onClick={resetForm} disabled={isSaving}>
                Cancel Edit
              </Button>
            )}
          </div>
        </div>
      </div>
      <ThriveDialog {...dialogProps} />
    </div>
  );
}
