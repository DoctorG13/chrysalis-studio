const TYPE_STYLES = {
  created: {
    icon: "✨",
    background: "#EEF2FF",
    colour: "#4F46E5",
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

export default function JobTimeline({
  job,
}) {
  const timeline = [
    ...(job.timeline || []),
  ].sort(
    (a, b) =>
      new Date(b.date) -
      new Date(a.date)
  );

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 18,
        padding: 24,
        boxShadow:
          "0 2px 10px rgba(0,0,0,0.03)",
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: 22,
        }}
      >
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

        <div
          style={{
            fontSize: 14,
            color: "#777",
          }}
        >
          A history of activity and changes
          for this job.
        </div>
      </div>

      {timeline.length === 0 ? (
        <EmptyTimeline />
      ) : (
        <div
          style={{
            position: "relative",
          }}
        >
          {/* Timeline line */}
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
            {timeline.map(
              (event, index) => (
                <TimelineItem
                  key={
                    event.id ||
                    `${event.date}-${index}`
                  }
                  event={event}
                />
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineItem({
  event,
}) {
  const style =
    TYPE_STYLES[event.type] ||
    TYPE_STYLES.note;

  const formattedDate =
    formatTimelineDate(
      event.date
    );

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
      }}
    >
      {/* Event icon */}
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: "50%",
          background:
            style.background,
          border:
            "3px solid #FFFFFF",
          boxShadow:
            "0 0 0 1px #E5E7EB",
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

      {/* Event content */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          background: "#F8F9FA",
          border:
            "1px solid #E8EAED",
          borderRadius: 12,
          padding: "13px 14px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "flex-start",
            gap: 12,
            marginBottom:
              event.description
                ? 6
                : 0,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#2F3A3F",
            }}
          >
            {event.title ||
              "Job activity"}
          </div>

          {formattedDate && (
            <div
              style={{
                fontSize: 11,
                color: "#888",
                whiteSpace:
                  "nowrap",
              }}
            >
              {formattedDate}
            </div>
          )}
        </div>

        {event.description && (
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.5,
              color: "#666",
            }}
          >
            {event.description}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyTimeline() {
  return (
    <div
      style={{
        padding: 24,
        borderRadius: 12,
        background: "#F8F9FA",
        border:
          "1px solid #E8EAED",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 28,
          marginBottom: 8,
        }}
      >
        🕒
      </div>

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

      <div
        style={{
          fontSize: 13,
          color: "#888",
        }}
      >
        Activity for this job will appear
        here as it progresses.
      </div>
    </div>
  );
}

function formatTimelineDate(
  value
) {
  if (!value) return "";

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    "en-AU",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );
}