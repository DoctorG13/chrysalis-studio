import { useEffect, useMemo, useRef, useState } from "react";
import CalendarToolbar from "../features/calendar/CalendarToolbar";
import CalendarGrid from "../features/calendar/CalendarGrid";
import TodayView from "../features/calendar/TodayView";
import ChrysalisActionButton from "../features/calendar/ChrysalisActionButton";
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

export default function CalendarPage({ clients = [], jobs = [] }) {
  const [displayMonth, setDisplayMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isScrolled, setIsScrolled] = useState(false);
  const pageRef = useRef(null);
  const todayRef = useRef(null);
  const calendarRef = useRef(null);
  const resultsRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const { openClient, openJob } = useChrysalis();
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

  function parseCalendarDate(value) {
    if (!value) return null;
    if (typeof value === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      const [day, month, year] = value.split("/").map(Number);
      const date = new Date(year, month - 1, day);
      return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
    }
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      const [year, month, day] = value.slice(0, 10).split("-").map(Number);
      return new Date(year, month - 1, day);
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function getClientName(client) {
    if (!client) return "";
    if (client.name) return client.name;
    return [client.firstName, client.lastName].filter(Boolean).join(" ");
  }

  function getOutstanding(job) {
    if (job.balance !== undefined && job.balance !== null) return Number(job.balance) || 0;
    if (job.outstanding !== undefined && job.outstanding !== null) return Number(job.outstanding) || 0;
    const quote = Number(job.price || 0);
    const paid = (job.payments || []).reduce((total, payment) => total + Number(payment.amount || 0), 0);
    return Math.max(quote - paid, 0);
  }

  function getEventsForDate(date) {
    const events = [];
    clients.forEach((client) => {
      (client.appointments || []).forEach((appointment) => {
        const appointmentDate = parseCalendarDate(appointment.date);
        if (appointmentDate && sameDay(appointmentDate, date)) events.push({ id: appointment.id, type: "appointment", client, appointment, icon: "👤", colour: "#1976D2", label: appointment.title || appointment.type || getClientName(client) || "Appointment" });
      });
      (client.fittings || []).forEach((fitting) => {
        const fittingDate = parseCalendarDate(fitting.date);
        if (fittingDate && sameDay(fittingDate, date)) events.push({ id: fitting.id, type: "fitting", client, fitting, icon: "👗", colour: "#8B1E3F", label: fitting.title || "Fitting" });
      });
    });
    jobs.forEach((job) => {
      if (!job.dueDate) return;
      const due = parseCalendarDate(job.dueDate);
      if (!due || !sameDay(due, date)) return;
      const client = clients.find((candidate) => String(candidate.id) === String(job.clientId));
      events.push({ id: job.id, type: "job", client, jobId: job.id, job, icon: "💼", colour: "#C62828", label: job.reference || job.title || job.name || "Job" });
    });
    return events.slice(0, 4);
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
        <CalendarToolbar monthLabel={monthLabel(displayMonth)} onPrevious={goPrevious} onToday={goToday} onNext={goNext} />
      </div>

      <CalendarGrid calendarDays={calendarDays} monthStart={monthStart} monthEnd={monthEnd} today={today} selectedDate={selectedDate} onSelectDate={selectDate} getEventsForDate={getEventsForDate} sameDay={sameDay} />

      <div ref={resultsRef} style={{ scrollMarginTop: NAV_HEIGHT + NAV_GAP, marginTop: 30, background: "#FFFFFF", border: "1px solid #DDDDDD", borderRadius: 12, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Selected Day</h3>
          <ChrysalisActionButton onClick={scrollToCalendar}>↑ Back to Calendar</ChrysalisActionButton>
        </div>
        <p style={{ color: "#666", marginBottom: 20 }}>{selectedDate.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        {selectedEvents.length === 0 ? <p style={{ color: "#999999", fontStyle: "italic" }}>No appointments, fittings or jobs scheduled.</p> : selectedEvents.map((event, index) => (
          <div
            key={event.id || event.jobId || event.appointment?.id || event.fitting?.id || index}
            onClick={() => {
              if ((event.type === "appointment" || event.type === "fitting") && event.client) openClient(event.client);
              if (event.type === "job" && event.client) openJob(event.client, event.jobId);
            }}
            role="button"
            tabIndex={event.client ? 0 : -1}
            onKeyDown={(keyboardEvent) => {
              if (!event.client || !["Enter", " "].includes(keyboardEvent.key)) return;
              keyboardEvent.preventDefault();
              if (event.type === "job") openJob(event.client, event.jobId);
              else openClient(event.client);
            }}
            style={eventCardStyle}
            onMouseEnter={(eventTarget) => {
              eventTarget.currentTarget.style.background = "#FFF9FB";
              eventTarget.currentTarget.style.boxShadow = "0 3px 10px rgba(139,30,63,0.10)";
              eventTarget.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(eventTarget) => {
              eventTarget.currentTarget.style.background = "#F8F8F8";
              eventTarget.currentTarget.style.boxShadow = "none";
              eventTarget.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <span style={{ fontSize: 20 }}>{event.icon}</span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{event.label}</div>
              <div style={{ color: "#666", fontSize: 13, marginTop: 3 }}>{event.type === "fitting" ? "Fitting" : event.type === "job" ? "Job due" : "Appointment"}</div>
            </div>
            <span style={eventArrowStyle}>→</span>
          </div>
        ))}
      </div>

      {isScrolled && <div style={{ position: "fixed", right: 30, bottom: 24, zIndex: 100 }}><ChrysalisActionButton onClick={scrollToTop}>↑ Back to Top</ChrysalisActionButton></div>}
    </div>
  );
}

const navigationShellStyle = {
  position: "sticky", top: -30, zIndex: 50, display: "flex", flexWrap: "wrap", gap: 6,
  padding: 7, marginBottom: 18, background: "#FFFFFF", border: "1px solid #E1E4E7",
  borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};

const eventCardStyle = {
  display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", marginBottom: 10,
  borderLeft: "5px solid #8B1E3F", background: "#F8F8F8", borderRadius: 8, cursor: "pointer",
  transition: "transform 160ms ease, box-shadow 160ms ease, background 160ms ease",
};

const eventArrowStyle = { marginLeft: "auto", color: "#8B1E3F", fontWeight: 800, fontSize: 18 };
