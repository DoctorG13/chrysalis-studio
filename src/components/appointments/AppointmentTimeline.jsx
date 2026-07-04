const TYPE_COLOURS = {
  created: "#6366F1",
  reminder: "#2563EB",
  attended: "#16A34A",
  cancelled: "#DC2626",
  rescheduled: "#EA580C",
  note: "#6B7280",
};

export default function AppointmentTimeline({
  appointment,
}) {
  const timeline = appointment.timeline || [];

  if (timeline.length === 0) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: "#777",
          border: "2px dashed #DDD",
          borderRadius: 12,
        }}
      >
        No appointment activity yet.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      {timeline.map((event) => (
        <TimelineItem
          key={event.id}
          event={event}
        />
      ))}
    </div>
  );
}

function TimelineItem({ event }) {
  const colour =
    TYPE_COLOURS[event.type] || "#64748B";

  return (
    <div
      style={{
        display: "flex",
        gap: 18,
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          marginTop: 6,
          background: colour,
          flexShrink: 0,
        }}
      />

      <div
        style={{
          flex: 1,
          background: "#FFF",
          border: "1px solid #DDD",
          borderRadius: 12,
          padding: 18,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <strong>{event.title}</strong>

          <span
            style={{
              color: "#777",
              fontSize: 12,
            }}
          >
            {new Date(event.date).toLocaleString(
              "en-AU"
            )}
          </span>
        </div>

        {event.description && (
          <div
            style={{
              color: "#555",
              lineHeight: 1.5,
            }}
          >
            {event.description}
          </div>
        )}
      </div>
    </div>
  );
}