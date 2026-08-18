import { useMemo, useRef, useState } from "react";

import CalendarToolbar from "../features/calendar/CalendarToolbar";
import CalendarGrid from "../features/calendar/CalendarGrid";
import { useChrysalis } from "../context/ChrysalisProvider";
import { buildCalendar, endOfMonth, monthLabel, nextMonth, previousMonth, sameDay, startOfMonth } from "../features/calendar/calendarUtils";

function parseDate(value) {
  if (!value) return null;
  const text = String(value).trim();
  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const date = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
    return date.getFullYear() === Number(match[3]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[1]) ? date : null;
  }
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function clientName(client) {
  if (!client) return "Unknown client";
  if (client.name) return client.name;
  return [client.firstName, client.lastName].filter(Boolean).join(" ") || "Unknown client";
}

function sortEvents(a, b) {
  return String(a.time || "").localeCompare(String(b.time || ""));
}

export default function CalendarPage({ clients = [], jobs = [] }) {
  const [displayMonth, setDisplayMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const calendarTopRef = useRef(null);
  const resultsRef = useRef(null);
  const { appointments = [], openClient, openJob } = useChrysalis();
  const today = new Date();

  const calendarDays = useMemo(() => buildCalendar(displayMonth), [displayMonth]);
  const monthStart = startOfMonth(displayMonth);
  const monthEnd = endOfMonth(displayMonth);

  const allEvents = useMemo(() => {
    const events = [];
    appointments.forEach((appointment) => {
      const date = parseDate(appointment.date);
      if (!date) return;
      events.push({ id: `appointment-${appointment.id}`, type: "appointment", date, time: appointment.time || "", client: clients.find((item) => item.id === appointment.clientId), appointment, icon: "👤", colour: "#1976D2", label: appointment.type || "Appointment" });
    });

    jobs.forEach((job) => {
      const client = clients.find((item) => item.id === job.clientId);
      const dueDate = parseDate(job.dueDate);
      if (dueDate) events.push({ id: `job-${job.id}`, type: "job", date: dueDate, time: "", client, job, jobId: job.id, icon: "💼", colour: "#C62828", label: job.reference || job.name || "Job Due" });

      (job.fittings || []).forEach((fitting) => {
        const fittingDate = parseDate(fitting.date);
        if (!fittingDate) return;
        events.push({ id: `fitting-${fitting.id}`, type: "fitting", date: fittingDate, time: fitting.time || "", client, job, jobId: job.id, fitting, icon: "👗", colour: "#8B1E3F", label: fitting.title || "Fitting" });
      });
    });

    return events.sort(sortEvents);
  }, [appointments, clients, jobs]);

  const selectedEvents = useMemo(() => allEvents.filter((event) => sameDay(event.date, selectedDate)).sort(sortEvents), [allEvents, selectedDate]);
  const todayEvents = useMemo(() => allEvents.filter((event) => sameDay(event.date, today)).sort(sortEvents), [allEvents, today]);
  const upcomingEvents = useMemo(() => allEvents.filter((event) => event.date > today && !sameDay(event.date, today)).slice(0, 8), [allEvents, today]);

  function selectDate(date) {
    setSelectedDate(new Date(date));
    window.requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function goToday() {
    const now = new Date();
    setDisplayMonth(now);
    setSelectedDate(now);
    window.requestAnimationFrame(() => calendarTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function openEvent(event) {
    if (event.client && event.type === "appointment") openClient(event.client);
    if (event.client && (event.type === "job" || event.type === "fitting")) openJob(event.client, event.jobId);
  }

  return (
    <div style={{ padding: 30, maxWidth: 1400, margin: "0 auto" }}>
      <div ref={calendarTopRef}><CalendarToolbar monthLabel={monthLabel(displayMonth)} onPrevious={() => setDisplayMonth(previousMonth(displayMonth))} onToday={goToday} onNext={() => setDisplayMonth(nextMonth(displayMonth))} /></div>

      <section style={panel}>
        <div style={eyebrow}>Today</div>
        <div style={headerRow}>
          <div><h1 style={heading}>Today at a glance</h1><div style={muted}>{today.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div></div>
          <div style={countBadge}>{todayEvents.length} {todayEvents.length === 1 ? "item" : "items"}</div>
        </div>
        {todayEvents.length === 0 ? <div style={empty}>🎉 Nothing scheduled for today.</div> : <div style={todayGrid}>{todayEvents.map((event) => <EventCard key={event.id} event={event} onClick={() => openEvent(event)} />)}</div>}
        <div style={eyebrow}>Upcoming</div>
        {upcomingEvents.length === 0 ? <div style={muted}>No upcoming appointments, fittings or job due dates.</div> : <div style={upcomingList}>{upcomingEvents.map((event) => <button key={event.id} type="button" onClick={() => selectDate(event.date)} style={upcomingRow}><span style={{ fontSize: 20 }}>{event.icon}</span><span style={{ flex: 1, textAlign: "left" }}><strong>{event.label}</strong><small>{clientName(event.client)} · {event.date.toLocaleDateString("en-AU", { day: "numeric", month: "short" })}{event.time ? ` · ${event.time}` : ""}</small></span><span>›</span></button>)}</div>}
      </section>

      <CalendarGrid calendarDays={calendarDays} monthStart={monthStart} monthEnd={monthEnd} today={today} selectedDate={selectedDate} onSelectDate={selectDate} getEventsForDate={(date) => allEvents.filter((event) => sameDay(event.date, date)).slice(0, 3)} sameDay={sameDay} />

      <section ref={resultsRef} style={{ ...panel, marginTop: 30, scrollMarginTop: 90 }}>
        <div style={headerRow}><div><div style={eyebrow}>Selected Day</div><h2 style={selectedHeading}>{selectedDate.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</h2></div><button type="button" onClick={goToday} style={secondaryButton}>Today</button></div>
        {selectedEvents.length === 0 ? <div style={empty}>No appointments, fittings or jobs scheduled for this day.</div> : <div style={{ display: "grid", gap: 10 }}>{selectedEvents.map((event) => <EventCard key={event.id} event={event} onClick={() => openEvent(event)} detailed />)}</div>}
      </section>
    </div>
  );
}

function EventCard({ event, onClick, detailed = false }) {
  return <button type="button" onClick={onClick} style={{ ...eventCard, borderLeft: `5px solid ${event.colour}` }}><div style={eventIcon}>{event.icon}</div><div style={{ minWidth: 0, flex: 1 }}><div style={eventTitle}>{event.label}</div><div style={eventClient}>{clientName(event.client)}</div>{event.type === "appointment" && <div style={eventMeta}>{event.time || "All day"} · Appointment</div>}{event.type === "fitting" && <div style={eventMeta}>{event.time || "All day"} · {event.job?.reference || "Fitting"}</div>}{event.type === "job" && <div style={eventMeta}>{event.job?.reference || "Job"} · Due</div>}{detailed && event.job?.status && <span style={status}>{event.job.status}</span>}</div></button>;
}

const panel = { background: "#FFFFFF", border: "1px solid #E1E5E8", borderRadius: 16, padding: 22, marginBottom: 22, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" };
const eyebrow = { color: "#8B1E3F", fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 5 };
const heading = { margin: 0, color: "#2F3A3F", fontSize: 26 };
const selectedHeading = { margin: "3px 0 0", color: "#2F3A3F", fontSize: 20 };
const headerRow = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 18 };
const countBadge = { background: "#F4C542", color: "#2F3A3F", borderRadius: 999, padding: "7px 12px", fontWeight: 800, fontSize: 12 };
const muted = { color: "#777", fontSize: 13 };
const empty = { padding: 22, borderRadius: 10, background: "#F7F8F9", color: "#666", textAlign: "center", marginBottom: 18 };
const todayGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 12, marginBottom: 25 };
const eventCard = { display: "flex", gap: 12, width: "100%", padding: 14, borderTop: "1px solid #E8EAED", borderRight: "1px solid #E8EAED", borderBottom: "1px solid #E8EAED", borderRadius: 10, background: "#fff", cursor: "pointer", textAlign: "left", color: "#2F3A3F" };
const eventIcon = { fontSize: 23, flexShrink: 0 };
const eventTitle = { fontWeight: 800, color: "#2F3A3F", fontSize: 14 };
const eventClient = { color: "#555", fontSize: 13, marginTop: 3 };
const eventMeta = { color: "#888", fontSize: 12, marginTop: 5 };
const status = { display: "inline-block", marginTop: 7, padding: "3px 7px", borderRadius: 999, background: "#EEF2F5", color: "#445", fontSize: 10, fontWeight: 800 };
const upcomingList = { display: "grid", gap: 6, marginTop: 8 };
const upcomingRow = { display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", border: "1px solid #E8EAED", borderRadius: 9, background: "#fff", color: "#2F3A3F", cursor: "pointer" };
const secondaryButton = { border: "1px solid #D5D9DD", background: "#fff", color: "#2F3A3F", borderRadius: 8, padding: "8px 12px", fontWeight: 700, cursor: "pointer" };
