import { useMemo } from "react";
import ChrysalisActionButton from "./ChrysalisActionButton";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const START_HOUR = 7;
const END_HOUR = 20;
const HOUR_HEIGHT = 64;

function startOfWeek(value) {
  const date = new Date(value);
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + mondayOffset);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(value, days) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function parseDate(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(String(value))) {
    const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(String(value))) {
    const [day, month, year] = String(value).split("/").map(Number);
    return new Date(year, month - 1, day);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseTime(value) {
  const match = String(value || "09:00").match(/(\d{1,2}):(\d{2})/);
  if (!match) return { hours: 9, minutes: 0 };
  return { hours: Number(match[1]), minutes: Number(match[2]) };
}

function clientName(client) {
  if (!client) return "";
  return client.name || [client.firstName, client.lastName].filter(Boolean).join(" ");
}

export default function CalendarWeekView({
  weekDate,
  clients = [],
  onSelectDate,
  onOpenAppointment,
  onOpenClient,
  onOpenJob,
  onNewAppointment,
  onPreviousWeek,
  onNextWeek,
  onToday,
}) {
  const weekStart = startOfWeek(weekDate);
  const days = useMemo(() => DAY_NAMES.map((_, index) => addDays(weekStart, index)), [weekStart]);
  const appointments = useMemo(() => {
    const items = [];
    clients.forEach((client) => {
      (client.appointments || []).forEach((appointment) => {
        const date = parseDate(appointment.date);
        if (date) items.push({ type: "appointment", appointment, client, date, time: appointment.time || "09:00", label: appointment.title || appointment.type || "Appointment" });
      });
      (client.fittings || []).forEach((fitting) => {
        const date = parseDate(fitting.date);
        if (date) items.push({ type: "fitting", fitting, client, date, time: fitting.time || "09:00", label: fitting.title || "Fitting" });
      });
    });
    return items;
  }, [clients]);

  function eventsForDay(day) {
    return appointments.filter((item) => sameDay(item.date, day));
  }

  const weekLabel = `${weekStart.toLocaleDateString("en-AU", { day: "numeric", month: "short" })} – ${addDays(weekStart, 6).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <section style={sectionStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>Week View</div>
          <h2 style={titleStyle}>{weekLabel}</h2>
        </div>
        <div style={actionsStyle}>
          <ChrysalisActionButton onClick={onPreviousWeek}>←</ChrysalisActionButton>
          <ChrysalisActionButton onClick={onToday} variant="accent">Today</ChrysalisActionButton>
          <ChrysalisActionButton onClick={onNextWeek}>→</ChrysalisActionButton>
        </div>
      </div>

      <div style={calendarStyle}>
        <div style={timeHeaderStyle} />
        {days.map((day, index) => (
          <button key={day.toISOString()} type="button" onClick={() => onSelectDate(day)} style={dayHeaderStyle}>
            <span>{DAY_NAMES[index]}</span>
            <strong>{day.getDate()}</strong>
          </button>
        ))}

        <div style={timeColumnStyle}>
          {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => (
            <div key={index} style={timeLabelStyle}>{String(START_HOUR + index).padStart(2, "0")}:00</div>
          ))}
        </div>

        {days.map((day) => (
          <div key={day.toISOString()} style={dayColumnStyle}>
            {Array.from({ length: END_HOUR - START_HOUR }, (_, hourIndex) => {
              const hour = START_HOUR + hourIndex;
              return (
                <button
                  key={hour}
                  type="button"
                  aria-label={`Add appointment ${day.toLocaleDateString("en-AU")} ${hour}:00`}
                  onClick={() => onNewAppointment(new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0))}
                  style={slotStyle}
                />
              );
            })}
            {eventsForDay(day).map((event, index) => {
              const { hours, minutes } = parseTime(event.time);
              const top = Math.max(0, ((hours + minutes / 60) - START_HOUR) * HOUR_HEIGHT);
              const duration = Number(event.appointment?.duration || event.fitting?.duration || 60);
              const height = Math.max(34, (duration / 60) * HOUR_HEIGHT - 5);
              return (
                <button
                  key={`${event.type}-${event.appointment?.id || event.fitting?.id || index}`}
                  type="button"
                  onClick={() => event.type === "appointment" ? onOpenAppointment(event.appointment) : onOpenClient?.(event.client)}
                  style={{ ...eventStyle, top, height, background: event.type === "appointment" ? "#1976D2" : "#8B1E3F" }}
                  title={`${event.label} • ${event.time}`}
                >
                  <strong>{event.label}</strong>
                  <span>{event.time}{event.client && ` • ${clientName(event.client)}`}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div style={footerStyle}>
        <span>Click an empty time slot to create an appointment.</span>
        <ChrysalisActionButton onClick={() => onNewAppointment(weekStart)} variant="accent">＋ Appointment</ChrysalisActionButton>
      </div>
    </section>
  );
}

const sectionStyle = { marginTop: 18, background: "#FFFFFF", border: "1px solid #D9DEE2", borderRadius: 12, overflow: "hidden" };
const headerStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "14px 16px", borderBottom: "1px solid #E1E4E7" };
const eyebrowStyle = { color: "#8B1E3F", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.7 };
const titleStyle = { margin: "3px 0 0", fontSize: 18, color: "#20262B" };
const actionsStyle = { display: "flex", gap: 6 };
const calendarStyle = { display: "grid", gridTemplateColumns: "58px repeat(7, minmax(100px, 1fr))", minWidth: 780, overflowX: "auto" };
const timeHeaderStyle = { borderRight: "1px solid #E1E4E7", borderBottom: "1px solid #E1E4E7", minHeight: 54 };
const dayHeaderStyle = { minHeight: 54, border: 0, borderRight: "1px solid #E1E4E7", borderBottom: "1px solid #E1E4E7", background: "#FAFAFA", color: "#4B555B", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, cursor: "pointer", fontFamily: "inherit" };
const timeColumnStyle = { borderRight: "1px solid #E1E4E7", background: "#FAFAFA" };
const timeLabelStyle = { height: HOUR_HEIGHT, boxSizing: "border-box", padding: "7px 6px", textAlign: "right", fontSize: 10, color: "#8A9297", borderBottom: "1px solid #EEF0F2" };
const dayColumnStyle = { position: "relative", height: (END_HOUR - START_HOUR) * HOUR_HEIGHT, borderRight: "1px solid #E1E4E7", background: "#FFFFFF" };
const slotStyle = { display: "block", width: "100%", height: HOUR_HEIGHT, padding: 0, border: 0, borderBottom: "1px solid #EEF0F2", background: "transparent", cursor: "pointer" };
const eventStyle = { position: "absolute", left: 4, right: 4, padding: "6px 7px", border: 0, borderRadius: 6, color: "#FFFFFF", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2, overflow: "hidden", cursor: "pointer", textAlign: "left", fontFamily: "inherit", boxSizing: "border-box", boxShadow: "0 2px 6px rgba(0,0,0,.12)" };
const footerStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 14px", borderTop: "1px solid #E1E4E7", color: "#727B80", fontSize: 11 };
