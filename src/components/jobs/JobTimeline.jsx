const TYPE_COLOURS = {
  created: "#6366F1",
  status: "#2563EB",
  payment: "#16A34A",
  fitting: "#EA580C",
  measurement: "#7C3AED",
  photo: "#0891B2",
  note: "#6B7280",
};

export default function JobTimeline({ job }) {
  const timeline = job.timeline || [];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      {timeline.length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: "#777",
            border: "2px dashed #DDD",
            borderRadius: 12,
          }}
        >
          No timeline activity.
        </div>
      ) : (
        timeline.map((event) => (
          <TimelineItem
            key={event.id}
            event={event}
          />
        ))
      )}
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
            {event.date
  ? new Date(event.date).toLocaleString("en-AU")
  : "Unknown date"}
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