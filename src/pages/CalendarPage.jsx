import { useMemo, useState } from "react";

import CalendarToolbar from "../features/calendar/CalendarToolbar";
import CalendarGrid from "../features/calendar/CalendarGrid";

import { useChrysalis } from "../context/ChrysalisProvider";

import {
  buildCalendar,
  endOfMonth,
  monthLabel,
  nextMonth,
  previousMonth,
  sameDay,
  startOfMonth,
} from "../features/calendar/calendarUtils";

export default function CalendarPage({
  clients = [],
  jobs = [],
}) {
  const [displayMonth, setDisplayMonth] =
    useState(new Date());

  const [selectedDate, setSelectedDate] =
    useState(new Date());

  const {
    openClient,
    openJob,
  } = useChrysalis();

  const today = new Date();

  const calendarDays = useMemo(
    () => buildCalendar(displayMonth),
    [displayMonth]
  );

  const monthStart =
    startOfMonth(displayMonth);

  const monthEnd =
    endOfMonth(displayMonth);

  function goPrevious() {
    setDisplayMonth(
      previousMonth(displayMonth)
    );
  }

  function goNext() {
    setDisplayMonth(
      nextMonth(displayMonth)
    );
  }

  function goToday() {
    const now = new Date();

    setDisplayMonth(now);
    setSelectedDate(now);
  }

  function parseCalendarDate(value) {
    if (!value) return null;

    if (
      typeof value === "string" &&
      /^\d{2}\/\d{2}\/\d{4}$/.test(value)
    ) {
      const [day, month, year] =
        value.split("/").map(Number);

      const date = new Date(
        year,
        month - 1,
        day
      );

      if (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      ) {
        return date;
      }

      return null;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? null
      : date;
  }

  function getEventsForDate(date) {
    const events = [];

    clients.forEach((client) => {
      (client.appointments || []).forEach(
        (appointment) => {
          if (!appointment.date) return;

          const appointmentDate =
            parseCalendarDate(
              appointment.date
            );

          if (
            appointmentDate &&
            sameDay(
              appointmentDate,
              date
            )
          ) {
            events.push({
              type: "appointment",
              client,
              appointment,
              icon: "👤",
              colour: "#1976D2",
              label:
                appointment.title ||
                client.name,
            });
          }
        }
      );
    });

    jobs.forEach((job) => {
      if (!job.dueDate) return;

      const due = parseCalendarDate(
        job.dueDate
      );

      if (due && sameDay(due, date)) {
        events.push({
          type: "job",
          client: clients.find(
            (c) => c.id === job.clientId
          ),
          jobId: job.id,
          job,
          icon: "💼",
          colour: "#C62828",
          label:
            job.reference ||
            job.title ||
            "Job",
        });
      }
    });

    return events.slice(0, 3);
  }

  return (
    <>
      <CalendarToolbar
        monthLabel={monthLabel(displayMonth)}
        onPrevious={goPrevious}
        onToday={goToday}
        onNext={goNext}
      />

      <CalendarGrid
        calendarDays={calendarDays}
        monthStart={monthStart}
        monthEnd={monthEnd}
        today={today}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        getEventsForDate={getEventsForDate}
        sameDay={sameDay}
      />

      <div
        style={{
          marginTop: 30,
          background: "#FFFFFF",
          border: "1px solid #DDDDDD",
          borderRadius: 12,
          padding: 20,
        }}
      >
        <h3
          style={{
            marginTop: 0,
            marginBottom: 12,
          }}
        >
          Selected Day
        </h3>

        <p
          style={{
            color: "#666",
            marginBottom: 20,
          }}
        >
          {selectedDate.toLocaleDateString(
            "en-AU",
            {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            }
          )}
        </p>

        {getEventsForDate(selectedDate).length === 0 ? (
          <p
            style={{
              color: "#999999",
              fontStyle: "italic",
            }}
          >
            No appointments or jobs scheduled.
          </p>
        ) : (
          getEventsForDate(selectedDate).map(
            (event, index) => (
              <div
                key={index}
                onClick={() => {
                  if (
                    event.type === "appointment" &&
                    event.client
                  ) {
                    openClient(event.client);
                  }

                  if (
                    event.type === "job" &&
                    event.client
                  ) {
                    openJob(
                      event.client,
                      event.jobId
                    );
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  marginBottom: 10,
                  borderLeft: `5px solid ${event.colour}`,
                  background: "#F8F8F8",
                  borderRadius: 8,
                  cursor: "pointer",
                  transition: "0.2s",
                }}
              >
                <span
                  style={{
                    fontSize: 20,
                  }}
                >
                  {event.icon}
                </span>

                <div>
                  <div
                    style={{
                      fontWeight: 600,
                    }}
                  >
                    {event.label}
                  </div>

                  <div
                    style={{
                      color: "#666",
                      fontSize: 13,
                    }}
                  >
                    {event.type === "appointment"
                      ? "Appointment"
                      : "Job Due"}
                  </div>
                </div>
              </div>
            )
          )
        )}
      </div>
    </>
  );
}
