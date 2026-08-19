import ChrysalisActionButton from "./ChrysalisActionButton";

export default function CalendarToolbar({
  monthLabel,
  onPrevious,
  onToday,
  onNext,
  onAddAppointment,
}) {
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
        <h1 style={{ margin: 0, fontSize: 22, lineHeight: 1.15, color: "#20262B" }}>Calendar</h1>
        <p style={{ margin: "3px 0 0", color: "#737B81", fontSize: 11 }}>
          Appointments, fittings and garment due dates
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <ChrysalisActionButton onClick={onPrevious} ariaLabel="Previous month" title="Previous month">←</ChrysalisActionButton>
        <ChrysalisActionButton onClick={onToday} variant="accent">Today</ChrysalisActionButton>
        <ChrysalisActionButton onClick={onNext} ariaLabel="Next month" title="Next month">→</ChrysalisActionButton>
        <ChrysalisActionButton onClick={onAddAppointment} variant="accent">＋ Appointment</ChrysalisActionButton>
      </div>

      <strong style={{ minWidth: 155, textAlign: "right", color: "#30383D", fontSize: 17, whiteSpace: "nowrap" }}>
        {monthLabel}
      </strong>
    </div>
  );
}
