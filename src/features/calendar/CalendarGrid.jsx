import CalendarDay from "./CalendarDay";

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarGrid({
  calendarDays,
  monthStart,
  monthEnd,
  today,
  selectedDate,
  onSelectDate,
  getEventsForDate,
  sameDay,
}) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, marginBottom: 10 }}>
        {WEEK_DAYS.map((day) => (
          <div key={day} style={{ textAlign: "center", fontWeight: 700, padding: 10, color: "#2F3A3F" }}>
            {day}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
        {calendarDays.map((date) => (
          <CalendarDay
            key={date.toISOString()}
            date={date}
            inMonth={date >= monthStart && date <= monthEnd}
            isToday={sameDay(date, today)}
            isSelected={sameDay(date, selectedDate)}
            events={getEventsForDate(date)}
            onClick={() => onSelectDate(new Date(date))}
          />
        ))}
      </div>
    </>
  );
}
