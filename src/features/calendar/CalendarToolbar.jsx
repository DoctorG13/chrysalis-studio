export default function CalendarToolbar({
  monthLabel,
  onPrevious,
  onToday,
  onNext,
}) {
  const buttonStyle = {
    border: "1px solid #D7DCE0",
    background: "#FFFFFF",
    color: "#30383D",
    borderRadius: 7,
    minHeight: 34,
    padding: "0 11px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    transition: "background 160ms ease, border-color 160ms ease, color 160ms ease, transform 160ms ease",
  };

  function handleEnter(event) {
    event.currentTarget.style.background = "#8B1E3F";
    event.currentTarget.style.borderColor = "#8B1E3F";
    event.currentTarget.style.color = "#FFFFFF";
    event.currentTarget.style.transform = "translateY(-1px)";
  }

  function handleLeave(event) {
    event.currentTarget.style.background = "#FFFFFF";
    event.currentTarget.style.borderColor = "#D7DCE0";
    event.currentTarget.style.color = "#30383D";
    event.currentTarget.style.transform = "translateY(0)";
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        marginBottom: 10,
        padding: "10px 0 12px",
        background: "#FFFFFF",
        borderBottom: "1px solid #D9DEE2",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 22,
            lineHeight: 1.15,
            color: "#20262B",
          }}
        >
          Calendar
        </h1>
        <p
          style={{
            margin: "3px 0 0",
            color: "#737B81",
            fontSize: 11,
          }}
        >
          Appointments, fittings and garment due dates
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button
          type="button"
          onClick={onPrevious}
          style={buttonStyle}
          aria-label="Previous month"
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          ←
        </button>
        <button
          type="button"
          onClick={onToday}
          style={{ ...buttonStyle, color: "#8B1E3F", borderColor: "#C96A83" }}
          onMouseEnter={(event) => {
            event.currentTarget.style.background = "#8B1E3F";
            event.currentTarget.style.borderColor = "#8B1E3F";
            event.currentTarget.style.color = "#FFFFFF";
            event.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.background = "#FFFFFF";
            event.currentTarget.style.borderColor = "#C96A83";
            event.currentTarget.style.color = "#8B1E3F";
            event.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Today
        </button>
        <button
          type="button"
          onClick={onNext}
          style={buttonStyle}
          aria-label="Next month"
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          →
        </button>
      </div>

      <strong
        style={{
          minWidth: 155,
          textAlign: "right",
          color: "#30383D",
          fontSize: 17,
          whiteSpace: "nowrap",
        }}
      >
        {monthLabel}
      </strong>
    </div>
  );
}
