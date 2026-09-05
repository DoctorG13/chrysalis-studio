const TYPE_STYLES = {
  created: {
    icon: "✨",
    background: "#EEF2FF",
    colour: "#4F46E5",
  },

  workflow: {
    icon: "🔄",
    background: "#FFF5F7",
    colour: "#8B1E3F",
  },

  status: {
    icon: "🔄",
    background: "#EFF6FF",
    colour: "#2563EB",
  },

  payment: {
    icon: "💰",
    background: "#ECFDF5",
    colour: "#16A34A",
  },

  fitting: {
    icon: "✂️",
    background: "#FFF7ED",
    colour: "#EA580C",
  },

  measurement: {
    icon: "📏",
    background: "#F5F3FF",
    colour: "#7C3AED",
  },

  photo: {
    icon: "📷",
    background: "#ECFEFF",
    colour: "#0891B2",
  },

  note: {
    icon: "📝",
    background: "#F3F4F6",
    colour: "#6B7280",
  },
};

export default function JobTimeline({ job }) {
  const timeline = [...(job.timeline || [])].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 18,
        padding: 24,
        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
      }}
    >
      <div style={{ marginBottom: 22 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: "#8B1E3F",
            marginBottom: 5,
          }}
        >
          Timeline
        </div>

        <div style={{ fontSize: 14, color: "#777" }}>
          A history of activity and changes for this job.
        </div>
      </div>

      {timeline.length === 0 ? (
        <EmptyTimeline />
      ) : (
        <div style={{ position: "relative" }}>
          <div
            style={{
              position: "absolute",
              left: 18,
              top: 20,
              bottom: 20,
              width: 2,
              background: "#E5E7EB",
            }}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            {timeline.map((event, index) => (
              <TimelineItem
                key={event.id || `${event.date}-${index}`}
                event={event}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineItem({ event }) {
  const style = TYPE_STYLES[event.type] || TYPE_STYLES.note;
  const formattedDate = formatTimelineDate(event.date);
  const isWorkflowEvent = event.type === "workflow";
  const transition = getWorkflowTransition(event);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: "50%",
          background: style.background,
          border: "3px solid #FFFFFF",
          boxShadow: `0 0 0 1px ${style.colour}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          zIndex: 1,
          fontSize: 16,
        }}
      >
        {style.icon}
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          background: isWorkflowEvent ? "#FFF9FA" : "#F8F9FA",
          border: isWorkflowEvent
            ? "1px solid #E7B8C5"
            : "1px solid #E8EAED",
          borderRadius: 12,
          padding: "13px 14px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            marginBottom: isWorkflowEvent || event.description ? 8 : 0,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#2F3A3F",
              }}
            >
              {getEventTitle(event)}
            </div>

            <div
              style={{
                marginTop: 3,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: style.colour,
              }}
            >
              {isWorkflowEvent ? "Workflow" : event.type || "Activity"}
            </div>
          </div>

          {formattedDate && (
            <div
              style={{
                fontSize: 11,
                color: "#888",
                whiteSpace: "nowrap",
              }}
            >
              {formattedDate}
            </div>
          )}
        </div>

        {isWorkflowEvent && transition ? (
          <WorkflowTransition transition={transition} />
        ) : (
          event.description && (
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.5,
                color: "#666",
              }}
            >
              {event.description}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function WorkflowTransition({ transition }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 8,
      }}
    >
      <StageBadge label={transition.from} muted />

      <span
        aria-hidden="true"
        style={{
          color: "#8B1E3F",
          fontSize: 17,
          fontWeight: 800,
          lineHeight: 1,
        }}
      >
        →
      </span>

      <StageBadge label={transition.to} />
    </div>
  );
}

function StageBadge({ label, muted = false }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: 28,
        padding: "4px 10px",
        borderRadius: 999,
        background: muted ? "#F1F2F3" : "#8B1E3F",
        color: muted ? "#5F686E" : "#FFFFFF",
        border: muted ? "1px solid #D9DDE1" : "1px solid #8B1E3F",
        fontSize: 12,
        fontWeight: 800,
      }}
    >
      {label}
    </span>
  );
}

function getEventTitle(event) {
  if (event.type === "workflow") {
    return event.title || "Workflow Status Changed";
  }

  return event.title || "Job activity";
}

function getWorkflowTransition(event) {
  const description = String(event.description || "");
  const separatorIndex = description.indexOf("→");

  if (separatorIndex === -1) return null;

  const from = description.slice(0, separatorIndex).trim();
  const to = description.slice(separatorIndex + 1).trim();

  if (!from || !to) return null;

  return { from, to };
}

function EmptyTimeline() {
  return (
    <div
      style={{
        padding: 24,
        borderRadius: 12,
        background: "#F8F9FA",
        border: "1px solid #E8EAED",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 8 }}>🕒</div>

      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "#555",
          marginBottom: 4,
        }}
      >
        No timeline activity
      </div>

      <div style={{ fontSize: 13, color: "#888" }}>
        Activity for this job will appear here as it progresses.
      </div>
    </div>
  );
}

function formatTimelineDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
