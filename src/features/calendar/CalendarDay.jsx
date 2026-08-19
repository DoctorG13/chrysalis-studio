export default function CalendarDay({
  date,
  inMonth,
  isToday,
  isSelected,
  events = [],
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Select ${date.toLocaleDateString("en-AU", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })}`}
      style={{
        minHeight: 116,
        padding: 9,
        borderRadius: 8,
        cursor: "pointer",
        border: isSelected ? "2px solid #8B1E3F" : "1px solid #D9DEE2",
        background: isSelected ? "#FFF9FB" : inMonth ? "#FFFFFF" : "#F6F7F8",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        textAlign: "left",
        appearance: "none",
        WebkitAppearance: "none",
        fontFamily: "inherit",
        color: "inherit",
        boxSizing: "border-box",
        transition: "border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.borderColor = "#C96A83";
        event.currentTarget.style.boxShadow = "0 3px 10px rgba(31,41,51,.07)";
        event.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.borderColor = isSelected ? "#8B1E3F" : "#D9DEE2";
        event.currentTarget.style.boxShadow = "none";
        event.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          marginBottom: 7,
        }}
      >
        <span
          style={{
            fontWeight: isToday ? 800 : 600,
            color: inMonth ? "#20262B" : "#A7ADB1",
            fontSize: 13,
          }}
        >
          {date.getDate()}
        </span>

        {isToday && (
          <span
            style={{
              background: "#8B1E3F",
              color: "#FFFFFF",
              fontSize: 8,
              fontWeight: 800,
              padding: "3px 6px",
              borderRadius: 999,
              letterSpacing: 0.3,
            }}
          >
            TODAY
          </span>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          width: "100%",
          overflow: "hidden",
        }}
      >
        {events.slice(0, 4).map((event, index) => (
          <span
            key={event.id || index}
            title={event.label}
            style={{
              display: "block",
              background: event.colour || "#687178",
              color: "#FFFFFF",
              borderRadius: 5,
              padding: "4px 6px",
              fontSize: 10,
              fontWeight: 700,
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              width: "100%",
              boxSizing: "border-box",
              pointerEvents: "none",
            }}
          >
            {event.icon} {event.label}
          </span>
        ))}

        {events.length > 4 && (
          <span style={{ color: "#8B1E3F", fontSize: 10, fontWeight: 700 }}>
            +{events.length - 4} more
          </span>
        )}

        {events.length === 0 && inMonth && (
          <span style={{ color: "#B1B7BB", fontSize: 10 }}>No events</span>
        )}
      </div>
    </button>
  );
}
