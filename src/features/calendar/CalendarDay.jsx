export default function CalendarDay({
  date,
  inMonth,
  isToday,
  isSelected,
  events = [],
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      style={{
        minHeight: 130,
        padding: 10,
        borderRadius: 12,
        cursor: "pointer",
        border: isSelected
          ? "2px solid #F4C542"
          : "1px solid #DDDDDD",
        background: inMonth
          ? "#FFFFFF"
          : "#F5F5F5",
        display: "flex",
        flexDirection: "column",
        transition: "0.2s",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontWeight: isToday ? 700 : 500,
            color: inMonth ? "#222" : "#AAAAAA",
          }}
        >
          {date.getDate()}
        </span>

        {isToday && (
          <span
            style={{
              background: "#F4C542",
              color: "#2F3A3F",
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: 12,
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
        }}
      >
        {events.length === 0 && (
          <span
            style={{
              color: "#BBBBBB",
              fontSize: 11,
              fontStyle: "italic",
            }}
          >
            No events
          </span>
        )}

        {events.map((event, index) => (
          <div
            key={index}
            style={{
              background: event.colour,
              color: "#FFFFFF",
              borderRadius: 6,
              padding: "4px 6px",
              fontSize: 11,
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            {event.icon} {event.label}
          </div>
        ))}
      </div>
    </div>
  );
}