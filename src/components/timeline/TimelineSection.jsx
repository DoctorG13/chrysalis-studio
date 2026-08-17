import { useEffect, useState } from "react";
import {
  createTimelineEvent,
  deleteTimelineEvent,
  getTimeline,
  updateTimelineEvent,
} from "../../services/timelineApi";

const EVENT_TYPES = ["note", "created", "updated", "appointment", "fitting", "payment", "measurement", "asset", "invoice"];

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("en-AU", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function eventIcon(type) {
  return {
    created: "🟢",
    updated: "✏️",
    appointment: "📅",
    fitting: "👗",
    payment: "💰",
    measurement: "📏",
    asset: "📷",
    invoice: "🧾",
    note: "📝",
  }[type] || "•";
}

export default function TimelineSection({ clientId, jobId = "" }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState("");
  const [draft, setDraft] = useState({ type: "note", title: "", description: "" });
  const [showComposer, setShowComposer] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setEvents(await getTimeline({ clientId, jobId }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load timeline.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [clientId, jobId]);

  function startNew() {
    setEditingId("");
    setDraft({ type: "note", title: "", description: "" });
    setShowComposer(true);
  }

  function startEdit(event) {
    setEditingId(event.id);
    setDraft({
      type: event.type || "note",
      title: event.title || "",
      description: event.description || "",
    });
    setShowComposer(true);
  }

  async function save() {
    if (!draft.title.trim()) {
      setError("Please enter a timeline title.");
      return;
    }
    setError("");
    try {
      const event = {
        id: editingId || undefined,
        clientId,
        jobId: jobId || undefined,
        type: draft.type,
        title: draft.title.trim(),
        description: draft.description.trim(),
        date: editingId ? events.find((item) => item.id === editingId)?.date : new Date().toISOString(),
      };
      if (editingId) {
        await updateTimelineEvent(event);
      } else {
        await createTimelineEvent(event);
      }
      setShowComposer(false);
      setEditingId("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save timeline event.");
    }
  }

  async function remove(event) {
    if (!window.confirm(`Delete timeline event “${event.title}”?`)) return;
    setError("");
    try {
      await deleteTimelineEvent(event.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete timeline event.");
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>History</div>
          <div style={styles.title}>Timeline</div>
          <div style={styles.subtitle}>A chronological record of activity.</div>
        </div>
        <button onClick={startNew} style={styles.primary}>+ Add Note</button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {showComposer && (
        <div style={styles.composer}>
          <div style={styles.formGrid}>
            <label style={styles.label}>Type<select value={draft.type} onChange={(e) => setDraft((current) => ({ ...current, type: e.target.value }))} style={styles.input}>{EVENT_TYPES.map((type) => <option key={type} value={type}>{type[0].toUpperCase() + type.slice(1)}</option>)}</select></label>
            <label style={styles.label}>Title<input value={draft.title} onChange={(e) => setDraft((current) => ({ ...current, title: e.target.value }))} style={styles.input} placeholder="Timeline event" /></label>
          </div>
          <label style={styles.label}>Description<textarea value={draft.description} onChange={(e) => setDraft((current) => ({ ...current, description: e.target.value }))} style={{ ...styles.input, minHeight: 80, resize: "vertical" }} placeholder="What happened?" /></label>
          <div style={styles.actions}><button onClick={() => setShowComposer(false)} style={styles.secondary}>Cancel</button><button onClick={save} style={styles.primary}>{editingId ? "Save Changes" : "Add Event"}</button></div>
        </div>
      )}

      {loading ? <div style={styles.empty}>Loading timeline…</div> : events.length === 0 ? <div style={styles.empty}>No timeline events yet.</div> : (
        <div style={styles.timeline}>
          {events.map((event) => (
            <div key={event.id} style={styles.event}>
              <div style={styles.icon}>{eventIcon(event.type)}</div>
              <div style={styles.content}>
                <div style={styles.eventTop}><div><strong>{event.title}</strong><span style={styles.type}>{event.type}</span></div><span style={styles.date}>{formatDate(event.date || event.createdAt)}</span></div>
                {event.description && <div style={styles.description}>{event.description}</div>}
                <div style={styles.eventActions}><button onClick={() => startEdit(event)} style={styles.link}>Edit</button><button onClick={() => remove(event)} style={styles.linkDanger}>Delete</button></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: { padding: 2 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 18 },
  eyebrow: { fontSize: 11, fontWeight: 800, letterSpacing: 1.1, textTransform: "uppercase", color: "#8B1E3F" },
  title: { fontSize: 21, fontWeight: 800, color: "#2F3A3F", marginTop: 3 },
  subtitle: { color: "#777", fontSize: 13, marginTop: 3 },
  primary: { border: 0, borderRadius: 8, padding: "9px 13px", background: "#8B1E3F", color: "#fff", fontWeight: 800, cursor: "pointer" },
  secondary: { border: "1px solid #D9DEE2", borderRadius: 8, padding: "9px 13px", background: "#fff", color: "#2F3A3F", fontWeight: 700, cursor: "pointer" },
  composer: { border: "1px solid #E5E7EB", borderRadius: 12, padding: 16, background: "#FAFAFA", marginBottom: 18 },
  formGrid: { display: "grid", gridTemplateColumns: "180px 1fr", gap: 12, marginBottom: 12 },
  label: { display: "flex", flexDirection: "column", gap: 6, fontSize: 11, fontWeight: 800, color: "#666", marginBottom: 12 },
  input: { boxSizing: "border-box", width: "100%", border: "1px solid #D9DEE2", borderRadius: 7, padding: "9px 10px", background: "#fff", color: "#2F3A3F", fontSize: 13 },
  actions: { display: "flex", justifyContent: "flex-end", gap: 8 },
  error: { background: "#FFF1F1", border: "1px solid #F2B8B8", color: "#A21D1D", borderRadius: 8, padding: 10, marginBottom: 14, fontSize: 13 },
  empty: { padding: 28, textAlign: "center", color: "#888", border: "1px dashed #D9DEE2", borderRadius: 10 },
  timeline: { position: "relative", borderLeft: "2px solid #E7E8EA", marginLeft: 12, paddingLeft: 24 },
  event: { position: "relative", display: "flex", gap: 13, paddingBottom: 20 },
  icon: { position: "absolute", left: -38, top: 0, width: 24, height: 24, borderRadius: "50%", background: "#fff", border: "2px solid #E7E8EA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 },
  content: { flex: 1, minWidth: 0 },
  eventTop: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" },
  type: { marginLeft: 8, fontSize: 10, textTransform: "uppercase", letterSpacing: .5, color: "#8B1E3F", fontWeight: 800 },
  date: { color: "#888", fontSize: 11, whiteSpace: "nowrap" },
  description: { color: "#555", fontSize: 13, marginTop: 5, whiteSpace: "pre-wrap" },
  eventActions: { display: "flex", gap: 10, marginTop: 7 },
  link: { border: 0, background: "transparent", padding: 0, color: "#555", fontSize: 11, fontWeight: 700, cursor: "pointer" },
  linkDanger: { border: 0, background: "transparent", padding: 0, color: "#B42318", fontSize: 11, fontWeight: 700, cursor: "pointer" },
};
