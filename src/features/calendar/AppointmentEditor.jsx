import { useEffect, useMemo, useState } from "react";

import ChrysalisActionButton from "./ChrysalisActionButton";
import { ThriveDialog, useThriveDialog } from "../../components/common/ThriveDialog";

const APPOINTMENT_TYPES = [
  "Consultation",
  "Fitting",
  "Measurement",
  "Collection",
  "Alteration",
  "Other",
];

const STATUSES = ["Scheduled", "Confirmed", "Completed", "Cancelled"];

function toDateInput(value) {
  if (!value) return "";
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
    const [day, month, year] = text.split("/");
    return `${year}-${month}-${day}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function emptyAppointment(date = "") {
  return {
    id: "",
    clientId: "",
    jobId: "",
    type: "Consultation",
    date: toDateInput(date),
    time: "09:00",
    duration: 60,
    location: "",
    status: "Scheduled",
    notes: "",
  };
}

export default function AppointmentEditor({
  clients = [],
  jobs = [],
  appointment = null,
  defaultDate = "",
  onSave,
  onDelete,
  onClose,
}) {
  const [form, setForm] = useState(() => appointment ? { ...emptyAppointment(), ...appointment, date: toDateInput(appointment.date) } : emptyAppointment(defaultDate));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const { confirm, dialogProps } = useThriveDialog();

  useEffect(() => {
    setForm(appointment ? { ...emptyAppointment(), ...appointment, date: toDateInput(appointment.date) } : emptyAppointment(defaultDate));
    setError("");
  }, [appointment, defaultDate]);

  const clientJobs = useMemo(
    () => jobs.filter((job) => String(job.clientId) === String(form.clientId)),
    [jobs, form.clientId]
  );

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function changeClient(value) {
    setForm((current) => ({ ...current, clientId: value, jobId: "" }));
  }

  async function handleSave(event) {
    event.preventDefault();
    setError("");
    if (!form.clientId) {
      setError("Please select a client.");
      return;
    }
    if (!form.date) {
      setError("Please select a date.");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        ...form,
        id: form.id || undefined,
        duration: Number(form.duration) || 60,
      });
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save appointment.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!form.id || !onDelete) return;

    const confirmed = await confirm({
      title: "Delete Appointment",
      message: "Delete this appointment? This cannot be undone.",
      confirmLabel: "Delete Appointment",
      danger: true,
    });

    if (!confirmed) return;

    setDeleting(true);
    setError("");
    try {
      await onDelete(form.id);
      onClose();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete appointment.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={overlayStyle} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form onSubmit={handleSave} style={modalStyle}>
        <div style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>{form.id ? "Edit Appointment" : "New Appointment"}</div>
            <h2 style={titleStyle}>{form.id ? "Update appointment" : "Add an appointment"}</h2>
          </div>
          <ChrysalisActionButton onClick={onClose} ariaLabel="Close appointment editor">×</ChrysalisActionButton>
        </div>

        {error && <div style={errorStyle}>{error}</div>}

        <div style={gridStyle}>
          <Field label="Client" required>
            <select value={form.clientId} onChange={(event) => changeClient(event.target.value)} style={inputStyle}>
              <option value="">Select a client…</option>
              {clients.map((client) => <option key={client.id} value={client.id}>{client.name || [client.firstName, client.lastName].filter(Boolean).join(" ")}</option>)}
            </select>
          </Field>

          <Field label="Job">
            <select value={form.jobId} onChange={(event) => updateField("jobId", event.target.value)} style={inputStyle} disabled={!form.clientId}>
              <option value="">No job linked</option>
              {clientJobs.map((job) => <option key={job.id} value={job.id}>{job.reference || job.name || job.title || "Job"}</option>)}
            </select>
          </Field>

          <Field label="Appointment type">
            <select value={form.type} onChange={(event) => updateField("type", event.target.value)} style={inputStyle}>
              {APPOINTMENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </Field>

          <Field label="Status">
            <select value={form.status} onChange={(event) => updateField("status", event.target.value)} style={inputStyle}>
              {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </Field>

          <Field label="Date" required>
            <input type="date" value={form.date} onChange={(event) => updateField("date", event.target.value)} style={inputStyle} />
          </Field>

          <Field label="Time">
            <input type="time" value={form.time} onChange={(event) => updateField("time", event.target.value)} style={inputStyle} />
          </Field>

          <Field label="Duration (minutes)">
            <input type="number" min="5" step="5" value={form.duration} onChange={(event) => updateField("duration", event.target.value)} style={inputStyle} />
          </Field>

          <Field label="Location">
            <input type="text" value={form.location} onChange={(event) => updateField("location", event.target.value)} placeholder="Studio, shop, etc." style={inputStyle} />
          </Field>

          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Notes">
              <textarea value={form.notes} onChange={(event) => updateField("notes", event.target.value)} rows={4} placeholder="Appointment notes…" style={{ ...inputStyle, resize: "vertical", minHeight: 92 }} />
            </Field>
          </div>
        </div>

        <div style={footerStyle}>
          {form.id && <ChrysalisActionButton onClick={handleDelete} disabled={deleting || saving}>{deleting ? "Deleting…" : "Delete Appointment"}</ChrysalisActionButton>}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <ChrysalisActionButton onClick={onClose} disabled={saving || deleting}>Cancel</ChrysalisActionButton>
            <ChrysalisActionButton type="submit" variant="accent" disabled={saving || deleting}>{saving ? "Saving…" : "Save Appointment"}</ChrysalisActionButton>
          </div>
        </div>
      </form>

      <ThriveDialog {...dialogProps} />
    </div>
  );
}

function Field({ label, required = false, children }) {
  return <label style={fieldStyle}><span style={labelStyle}>{label}{required ? " *" : ""}</span>{children}</label>;
}

const overlayStyle = { position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(31, 38, 43, 0.42)", backdropFilter: "blur(3px)" };
const modalStyle = { width: "min(720px, 100%)", maxHeight: "calc(100vh - 48px)", overflowY: "auto", background: "#FFFFFF", border: "1px solid #D9DEE2", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,.20)", padding: 22 };
const headerStyle = { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, paddingBottom: 16, borderBottom: "1px solid #E4E7E9", marginBottom: 18 };
const eyebrowStyle = { color: "#8B1E3F", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.7 };
const titleStyle = { margin: "4px 0 0", color: "#20262B", fontSize: 21 };
const errorStyle = { marginBottom: 16, padding: "10px 12px", borderRadius: 8, border: "1px solid #E6A7A7", background: "#FFF3F3", color: "#9B1C1C", fontSize: 13, fontWeight: 600 };
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 };
const fieldStyle = { display: "flex", flexDirection: "column", gap: 6 };
const labelStyle = { fontSize: 12, fontWeight: 800, color: "#4B555B" };
const inputStyle = { width: "100%", boxSizing: "border-box", border: "1px solid #D7DCE0", background: "#FFFFFF", color: "#30383D", borderRadius: 7, minHeight: 38, padding: "8px 10px", fontSize: 13, fontFamily: "inherit", outline: "none" };
const footerStyle = { display: "flex", alignItems: "center", gap: 8, paddingTop: 18, marginTop: 18, borderTop: "1px solid #E4E7E9" };
