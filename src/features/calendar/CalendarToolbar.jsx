export default function CalendarToolbar({
  monthLabel,
  onPrevious,
  onToday,
  onNext,
}) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        marginBottom: 14,
        padding: "8px 0 10px",
        background: "#FFFFFF",
        borderBottom: "1px solid #E5E5E5",
      }}
    >
      <div
        style={{
          minWidth: 0,
          flex: 1,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 24,
            lineHeight: 1.1,
            color: "#2F3A3F",
          }}
        >
          📅 Calendar
        </h1>

        <p
          style={{
            margin: "3px 0 0",
            color: "#777",
            fontSize: 12,
            lineHeight: 1.2,
          }}
        >
          Appointments, fittings, due dates & collections
        </p>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexShrink: 0,
        }}
      >
        <button onClick={onPrevious}>
          ◀
        </button>

        <button onClick={onToday}>
          Today
        </button>

        <button onClick={onNext}>
          ▶
        </button>
      </div>

      <div
        style={{
          minWidth: 170,
          fontSize: 20,
          fontWeight: 700,
          textAlign: "right",
          color: "#2F3A3F",
          flexShrink: 0,
        }}
      >
        {monthLabel}
      </div>
    </div>
  );
}
