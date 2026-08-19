import { useEffect, useMemo, useRef, useState } from "react";
import CalendarToolbar from "../features/calendar/CalendarToolbar";
import CalendarGrid from "../features/calendar/CalendarGrid";
import TodayView from "../features/calendar/TodayView";
import ChrysalisActionButton from "../features/calendar/ChrysalisActionButton";
import AppointmentEditor from "../features/calendar/AppointmentEditor";
import { useChrysalis } from "../context/ChrysalisProvider";
import { buildCalendar, endOfMonth, monthLabel, nextMonth, previousMonth, sameDay, startOfMonth } from "../features/calendar/calendarUtils";

const NAV_HEIGHT = 54;
const NAV_GAP = 12;

function getScrollContainer(element) {
  let current = element?.parentElement;
  while (current) {
    const style = window.getComputedStyle(current);
    if (/(auto|scroll)/.test(style.overflowY) && current.scrollHeight > current.clientHeight) return current;
    current = current.parentElement;
  }
  return document.scrollingElement || document.documentElement;
}

function scrollToElement(element, offset = NAV_HEIGHT + NAV_GAP) {
  if (!element) return;
  const container = getScrollContainer(element);
  const elementRect = element.getBoundingClientRect();
  const containerRect = container === document.scrollingElement || container === document.documentElement ? { top: 0 } : container.getBoundingClientRect();
  const targetTop = container.scrollTop + (elementRect.top - containerRect.top) - offset;
  container.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
}

function parseCalendarDate(value) {
  if (!value) return null;
  if (typeof value === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [day, month, year] = value.split("/").map(Number);
    return new Date(year, month - 1, day);
  }
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [year, month, day] = value.slice(0, 10).split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function clientName(client) {
  if (!client) return "";
  if (client.name) return client.name;
  return [client.firstName, client.lastName].filter(Boolean).join(" ");
}

export default function CalendarPage({ clients = [], jobs = [] }) {
  const [displayMonth, setDisplayMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isScrolled, setIsScrolled] = useState(false);
  const [appointmentEditor, setAppointmentEditor] = useState(null);
  const pageRef = useRef(null);
  const todayRef = useRef(null);
  const calendarRef = useRef(null);
  const resultsRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const { openClient, openJob, appointments = [], createAppointment, updateAppointment, deleteAppointment } = useChrysalis();
  const today = new Date();

  const calendarDays = useMemo(() => buildCalendar(displayMonth), [displayMonth]);
  const monthStart = startOfMonth(displayMonth);
  const monthEnd = endOfMonth(displayMonth);

  useEffect(() => {
    const container = getScrollContainer(pageRef.current);
    scrollContainerRef.current = container;
    const handleScroll = () => setIsScrolled(container.scrollTop > 160);
    handleScroll();
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  function goPrevious() { setDisplayMonth(previousMonth(displayMonth)); }
  function goNext() { setDisplayMonth(nextMonth(displayMonth)); }
  function selectDate(date) {
    setSelectedDate(new Date(date));
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => scrollToElement(resultsRef.current)));
  }
  function goToday() {
    const now = new Date();
    setDisplayMonth(now);
    setSelectedDate(now);
    window.requestAnimationFrame(() => scrollToElement(calendarRef.current));
  }
  function scrollToToday() { scrollToElement(todayRef.current); }
  function scrollToCalendar() { scrollToElement(calendarRef.current); }
  function scrollToSelectedDay() { scrollToElement(resultsRef.current); }
  function scrollToTop() {
    const container = scrollContainerRef.current || getScrollContainer(pageRef.current);
    container.scrollTo({ top: 0, behavior: "smooth" });
  }

  function getEventsForDate(date) {
    const events = [];
    clients.forEach((client) => {
      (client.appointments || []).forEach((appointment) => {
        const appointmentDate = parseCalendarDate(appointment.date);
        if (appointmentDate && sameDay(appointmentDate, date)) {
          events.push({ id: appointment.id, type: "appointment", client, appointment, icon: "👤", colour: "#1976D2", label: appointment.title || appointment.type || clientName(client) || "Appointment" });
        }
      });
      (client.fittings || []).forEach((fitting) => {
        const fittingDate = parseCalendarDate(fitting.date);
        if (fittingDate && sameDay(fittingDate, date)) {
          events.push({ id: fitting.id, type: "fitting", client, fitting, icon: "👗", colour: "#8B1E3F", label: fitting.title || "Fitting" });
        }
      });
    });
    jobs.forEach((job) => {
      const due = parseCalendarDate(job.dueDate);
      if (!due || !sameDay(due, date)) return;
      const client = clients.find((candidate) => String(candidate.id) === String(job.clientId));
      events.push({ id: job.id, type: "job", client, jobId: job.id, job, icon: "💼", colour: "#C62828", label: job.reference || job.title || job.name || "Job" });
    });
    return events.slice(0, 4);
  }

  function openNewAppointment(date = selectedDate) {
    setAppointmentEditor({ appointment: null, date: date.toISOString().slice(0, 10) });
  }

  function openExistingAppointment(appointment) {
    if (!appointment) return;
    setAppointmentEditor({ appointment, date: appointment.date });
  }

  const selectedEvents = getEventsForDate(selectedDate);

  return (
    <div ref={pageRef} style={{ position: "relative" }}>
      <div style={navigationShellStyle} aria-label="Calendar section navigation">
        <ChrysalisActionButton onClick={scrollToTop}>↑ Top</ChrysalisActionButton>
        <ChrysalisActionButton onClick={scrollToToday} variant="accent">🦋 Today</ChrysalisActionButton>
        <ChrysalisActionButton onClick={scrollToCalendar}>📅 Calendar</ChrysalisActionButton>
        <ChrysalisActionButton onClick={scrollToSelectedDay}>📋 Selected Day</ChrysalisActionButton>
      </div>

      <div ref={todayRef} style={{ scrollMarginTop: NAV_HEIGHT + NAV_GAP }}>
        <TodayView clients={clients} jobs={jobs} today={today} onOpenClient={openClient} onOpenJob={openJob} />
      </div>

      <div ref={calendarRef} style={{ marginTop: 8, marginBottom: 16, scrollMarginTop: NAV_HEIGHT + NAV_GAP }}>
        <CalendarToolbar monthLabel={monthLabel(displayMonth)} onPrevious={goPrevious} onToday={goToday} onNext={goNext} onAddAppointment={() => openNewAppointment()} />
      </div>

      <CalendarGrid calendarDays={calendarDays} monthStart={monthStart} monthEnd={monthEnd} today={today} selectedDate={selectedDate} onSelectDate={selectDate} getEventsForDate={getEventsForDate} sameDay={sameDay} />

      <div ref={resultsRef} style={{ scrollMarginTop: NAV_HEIGHT + NAV_GAP, marginTop: 30, background: "#FFFFFF", border: "1px solid #DDDDDD", borderRadius: 12, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 12 }}>
          <div>
            <h3 style={{ margin: 0 }}>Selected Day</h3>
            <p style={{ color: "#666", margin: "6px 0 0" }}>{selectedDate.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <ChrysalisActionButton onClick={() => openNewAppointment(selectedDate)} variant="accent">＋ Appointment</ChrysalisActionButton>
            <ChrysalisActionButton onClick={scrollToCalendar}>↑ Back to Calendar</ChrysalisActionButton>
          </div>
        </div>

        {selectedEvents.length === 0 ? (
          <p style={{ color: "#999999", fontStyle: "italic" }}>No appointments, fittings or jobs scheduled.</p>
        ) : selectedEvents.map((event, index) => {
          const appointment = event.type === "appointment" ? event.appointment : null;
          return (
            <div key={event.id || event.jobId || index} style={eventCardStyle}>
              <span style={{ fontSize: 20 }}>{event.icon}</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{event.label}</div>
                <div style={{ color: "#666", fontSize: 13, marginTop: 3 }}>
                  {event.type === "fitting" ? "Fitting" : event.type === "job" ? "Job due" : "Appointment"}
                  {appointment?.time ? ` • ${appointment.time}` : ""}
                  {event.client ? ` • ${clientName(event.client)}` : ""}
                </div>
                {appointment?.location && <div style={{ color: "#777", fontSize: 12, marginTop: 3 }}>📍 {appointment.location}</div>}
              </div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {event.type === "appointment" && <ChrysalisActionButton onClick={() => openExistingAppointment(appointment)}>Edit</ChrysalisActionButton>}
                {event.client && <ChrysalisActionButton onClick={() => event.type === "job" ? openJob(event.client, event.jobId) : openClient(event.client)} variant="accent">Open →</ChrysalisActionButton>}
              </div>
            </div>
          );
        })}
      </div>

      {isScrolled && <div style={{ position: "fixed", right: 30, bottom: 24, zIndex: 100 }}><ChrysalisActionButton onClick={scrollToTop}>↑ Back to Top</ChrysalisActionButton></div>}

      {appointmentEditor && (
        <AppointmentEditor
          clients={clients}
          jobs={jobs}
          appointment={appointmentEditor.appointment}
          defaultDate={appointmentEditor.date}
          onSave={async (appointment) => appointment.id ? updateAppointment(appointment) : createAppointment(appointment)}
          onDelete={deleteAppointment}
          onClose={() => setAppointmentEditor(null)}
        />
      )}
    </div>
  );
}

const navigationShellStyle = { position: "sticky", top: -30, zIndex: 50, display: "flex", flexWrap: "wrap", gap: 6, padding: 7, marginBottom: 18, background: "#FFFFFF", border: "1px solid #E1E4E7", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" };
const eventCardStyle = { display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", marginBottom: 10, borderLeft: "5px solid #8B1E3F", background: "#F8F8F8", borderRadius: 8 };
