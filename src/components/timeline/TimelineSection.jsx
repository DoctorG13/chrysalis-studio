import { useEffect, useMemo, useState } from "react";
import { ThriveDialog, useThriveDialog } from "../common/ThriveDialog";
import {
  createTimelineEvent,
  deleteTimelineEvent,
  getTimeline,
  updateTimelineEvent,
} from "../../services/timelineApi";

const EVENT_TYPES = [
  "note",
  "created",
  "updated",
  "appointment",
  "fitting",
  "payment",
  "measurement",
  "asset",
  "invoice",
];

const FILTERS = [
  { value: "all", label: "All Activity" },
  { value: "client", label: "Client" },
  { value: "jobs", label: "Jobs" },
];

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
    workflow: "🔄",
    status: "🔄",
    note: "📝",
  }[type] || "•";
}

function getEventDate(event) {
  return event.date || event.createdAt || event.updatedAt || "";
}

function getJobLabel(job) {
  return job.reference || job.name || job.title || `Job ${job.id}`;
}

function normaliseJobEvent(job, event, index) {
  return {
    ...event,
    id: `job:${job.id}:${event.id || index}`,
    jobId: job.id,
    jobReference: getJobLabel(job),
    source: "job",
    date: getEventDate(event),
  };
}

export default function TimelineSection({ clientId, jobId = "", jobs = [] }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState("");
  const [draft, setDraft] = useState({
    type: "note",
    title: "",
    description: "",
  });
  const [showComposer, setShowComposer] = useState(false);
  const [filter, setFilter] = useState("all");
  const { confirm, dialogProps } = useThriveDialog();

  const clientJobs = useMemo(
    () =>
      jobs.filter(
        (job) => String(job.clientId) === String(clientId)
      ),
    [jobs, clientId]
  );

  const jobEvents = useMemo(
    () =>
      clientJobs.flatMap((job) =>
        (job.timeline || []).map((event, index) =>
          normaliseJobEvent(job, event, index)
        )
      ),
    [clientJobs]
  );

  const filteredEvents = useMemo(() => {
    const combined = [...events, ...jobEvents];

    const seen = new Set();
    const deduplicated = combined.filter((event) => {
      const key = [
        event.jobId || "client",
        event.type || "",
        event.title || "",
        event.description || "",
        getEventDate(event),
      ].join("|");

      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return deduplicated
      .filter((event) => {
        if (filter === "client") return !event.jobId;
        if (filter === "jobs") return Boolean(event.jobId);
        return true;
      })
      .sort(
        (a, b) =>
          new Date(getEventDate(b)).getTime() -
          new Date(getEventDate(a)).getTime()
      );
  }, [events, jobEvents, filter]);

  async function load() {
    setLoading(true);
    setError("");

    try {
      setEvents(await getTimeline({ clientId, jobId }));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load timeline."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [clientId, jobId]);

  function startNew() {
    setEditingId("");
    setDraft({
      type: "note",
      title: "",
      description: "",
    });
    setShowComposer(true);
  }

  function startEdit(event) {
    if (event.source === "job") return;

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
        date: editingId
          ? events.find((item) => item.id === editingId)?.date
          : new Date().toISOString(),
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
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save timeline event."
      );
    }
  }

  async function remove(event) {
    if (event.source === "job") return;

    const confirmed = await confirm({
      title: "Delete Timeline Event",
      message: `Delete timeline event “${event.title}”? This cannot be undone.`,
      confirmLabel: "Delete Event",
      danger: true,
    });

    if (!confirmed) return;

    setError("");

    try {
      await deleteTimelineEvent(event.id);
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete timeline event."
      );
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>History</div>
          <div style={styles.title}>Client Timeline</div>
          <div style={styles.subtitle}>
            A complete chronological history across this client and their jobs.
          </div>
        </div>

        <button onClick={startNew} style={styles.primary}>
          + Add Note
        </button>
      </div>

      {clientJobs.length > 0 && (
        <div style={styles.summary}>
          <span>
            <strong>{clientJobs.length}</strong>{" "}
            {clientJobs.length === 1 ? "job" : "jobs"} in history
          </span>
          <span>
            <strong>{filteredEvents.length}</strong> events shown
          </span>
        </div>
      )}

      <div style={styles.filters} aria-label="Timeline filters">
        {FILTERS.map((item) => {
          const active = filter === item.value;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              style={active ? styles.filterActive : styles.filter}
              aria-pressed={active}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {showComposer && (
        <div style={styles.composer}>
          <div style={styles.formGrid}>
            <label style={styles.label}>
              Type
              <select
                value={draft.type}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    type: event.target.value,
                  }))
                }
                style={styles.input}
              >
                {EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type[0].toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </label>

            <label style={styles.label}>
              Title
              <input
                value={draft.title}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                style={styles.input}
                placeholder="Timeline event"
              />
            </label>
          </div>

          <label style={styles.label}>
            Description
            <textarea
              value={draft.description}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              style={{
                ...styles.input,
                minHeight: 80,
                resize: "vertical",
              }}
              placeholder="What happened?"
            />
          </label>

          <div style={styles.actions}>
            <button
              onClick={() => setShowComposer(false)}
              style={styles.secondary}
            >
              Cancel
            </button>
            <button onClick={save} style={styles.primary}>
              {editingId ? "Save Changes" : "Add Event"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={styles.empty}>Loading timeline…</div>
      ) : filteredEvents.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>🕒</div>
          <strong>No timeline events yet.</strong>
          <div style={styles.emptyText}>
            Activity for this client will appear here as their relationship with
            the studio develops.
          </div>
        </div>
      ) : (
        <div style={styles.timeline}>
          {filteredEvents.map((event) => (
            <TimelineEvent
              key={event.id}
              event={event}
              onEdit={startEdit}
              onDelete={remove}
            />
          ))}
        </div>
      )}

      <ThriveDialog {...dialogProps} />
    </div>
  );
}

function TimelineEvent({ event, onEdit, onDelete }) {
  const isJobEvent = event.source === "job";

  return (
    <div style={styles.event}>
      <div style={styles.icon}>{eventIcon(event.type)}</div>

      <div style={styles.content}>
        <div style={styles.eventTop}>
          <div style={{ minWidth: 0 }}>
            <strong style={styles.eventTitle}>{event.title}</strong>

            <span style={styles.type}>
              {isJobEvent ? "Job" : event.type || "Activity"}
            </span>
          </div>

          <span style={styles.date}>{formatDate(getEventDate(event))}</span>
        </div>

        {isJobEvent && (
          <div style={styles.jobReference}>
            💼 {event.jobReference}
          </div>
        )}

        {event.description && (
          <div style={styles.description}>{event.description}</div>
        )}

        {!isJobEvent && (
          <div style={styles.eventActions}>
            <button onClick={() => onEdit(event)} style={styles.link}>
              Edit
            </button>
            <button onClick={() => onDelete(event)} style={styles.linkDanger}>
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrapper: { padding: 2 },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: "#8B1E3F",
  },
  title: {
    fontSize: 21,
    fontWeight: 800,
    color: "#2F3A3F",
    marginTop: 3,
  },
  subtitle: { color: "#777", fontSize: 13, marginTop: 3 },
  primary: {
    border: 0,
    borderRadius: 8,
    padding: "9px 13px",
    background: "#8B1E3F",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
  summary: {
    display: "flex",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 12,
    color: "#687078",
    fontSize: 12,
  },
  filters: {
    display: "flex",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 16,
  },
  filter: {
    border: "1px solid #D9DEE2",
    borderRadius: 999,
    padding: "6px 11px",
    background: "#fff",
    color: "#5D6870",
    fontSize: 11,
    fontWeight: 800,
    cursor: "pointer",
  },
  filterActive: {
    border: "1px solid #8B1E3F",
    borderRadius: 999,
    padding: "6px 11px",
    background: "#8B1E3F",
    color: "#fff",
    fontSize: 11,
    fontWeight: 800,
    cursor: "pointer",
  },
  composer: {
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    padding: 16,
    background: "#FAFAFA",
    marginBottom: 18,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "180px 1fr",
    gap: 12,
    marginBottom: 12,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 11,
    fontWeight: 800,
    color: "#666",
    marginBottom: 12,
  },
  input: {
    boxSizing: "border-box",
    width: "100%",
    border: "1px solid #D9DEE2",
    borderRadius: 7,
    padding: "9px 10px",
    background: "#fff",
    color: "#2F3A3F",
    fontSize: 13,
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
  },
  secondary: {
    border: "1px solid #D9DEE2",
    borderRadius: 8,
    padding: "9px 13px",
    background: "#fff",
    color: "#2F3A3F",
    fontWeight: 700,
    cursor: "pointer",
  },
  error: {
    background: "#FFF1F1",
    border: "1px solid #F2B8B8",
    color: "#A21D1D",
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
    fontSize: 13,
  },
  empty: {
    padding: 28,
    textAlign: "center",
    color: "#888",
    border: "1px dashed #D9DEE2",
    borderRadius: 10,
  },
  emptyIcon: { fontSize: 28, marginBottom: 8 },
  emptyText: { marginTop: 5, fontSize: 13 },
  timeline: {
    position: "relative",
    borderLeft: "2px solid #E7E8EA",
    marginLeft: 12,
    paddingLeft: 24,
  },
  event: {
    position: "relative",
    display: "flex",
    gap: 13,
    paddingBottom: 20,
  },
  icon: {
    position: "absolute",
    left: -38,
    top: 0,
    width: 24,
    height: 24,
    borderRadius: "50%",
    background: "#fff",
    border: "2px solid #E7E8EA",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
  },
  content: { flex: 1, minWidth: 0 },
  eventTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  eventTitle: { color: "#2F3A3F", fontSize: 13 },
  type: {
    marginLeft: 8,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#8B1E3F",
    fontWeight: 800,
  },
  date: { color: "#888", fontSize: 11, whiteSpace: "nowrap" },
  jobReference: {
    display: "inline-flex",
    marginTop: 5,
    padding: "4px 8px",
    borderRadius: 6,
    background: "#F5F6F7",
    color: "#5B656C",
    fontSize: 11,
    fontWeight: 800,
  },
  description: {
    color: "#555",
    fontSize: 13,
    marginTop: 5,
    whiteSpace: "pre-wrap",
    lineHeight: 1.45,
  },
  eventActions: { display: "flex", gap: 10, marginTop: 7 },
  link: {
    border: 0,
    background: "transparent",
    padding: 0,
    color: "#555",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
  },
  linkDanger: {
    border: 0,
    background: "transparent",
    padding: 0,
    color: "#B42318",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
  },
};
