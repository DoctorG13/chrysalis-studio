export default function CalendarToolbar({
  monthLabel,
  onPrevious,
  onToday,
  onNext,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
      }}
    >
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: 34,
          }}
        >
          📅 Calendar
        </h1>

        <p
          style={{
            marginTop: 8,
            color: "#666",
          }}
        >
          Schedule appointments, fittings,
          due dates and collections.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
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
          fontSize: 26,
          fontWeight: 700,
          minWidth: 220,
          textAlign: "right",
        }}
      >
        {monthLabel}
      </div>
    </div>
  );
}