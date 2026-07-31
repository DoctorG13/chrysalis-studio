import { useMemo, useState } from "react";

const WEEK_DAYS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function startOfCalendar(date) {
  const first = startOfMonth(date);

  const day = first.getDay();

  const mondayOffset =
    day === 0
      ? -6
      : 1 - day;

  const result = new Date(first);

  result.setDate(first.getDate() + mondayOffset);

  return result;
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildCalendar(month) {
  const start = startOfCalendar(month);

  const days = [];

  for (let i = 0; i < 42; i++) {
    const date = new Date(start);

    date.setDate(start.getDate() + i);

    days.push(date);
  }

  return days;
}

export default function CalendarPage({
  clients = [],
  jobs = [],
}) {
  const [displayMonth, setDisplayMonth] =
    useState(new Date());

  const [selectedDate, setSelectedDate] =
    useState(new Date());

  const today = new Date();

  const monthStart = startOfMonth(displayMonth);

  const monthEnd = endOfMonth(displayMonth);

  const monthTitle =
    displayMonth.toLocaleDateString(
      "en-AU",
      {
        month: "long",
        year: "numeric",
      }
    );

  const calendarDays = useMemo(
    () => buildCalendar(displayMonth),
    [displayMonth]
  );

  function previousMonth() {
    setDisplayMonth(
      new Date(
        displayMonth.getFullYear(),
        displayMonth.getMonth() - 1,
        1
      )
    );
  }

  function nextMonth() {
    setDisplayMonth(
      new Date(
        displayMonth.getFullYear(),
        displayMonth.getMonth() + 1,
        1
      )
    );
  }

  function goToday() {
    const now = new Date();

    setDisplayMonth(now);

    setSelectedDate(now);
  }

  function eventsForDate(date) {
    const events = [];

    clients.forEach((client) => {
      (client.appointments || []).forEach(
        (appointment) => {
          if (!appointment.date) return;

          const d = new Date(
            appointment.date
          );

          if (sameDay(d, date)) {
            events.push({
              type: "appointment",
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

      const due = new Date(job.dueDate);

      if (sameDay(due, date)) {
        events.push({
          type: "job",
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
    <div>

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          marginBottom: 30,
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
            Schedule appointments,
            fittings, due dates
            and collections.
          </p>

        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
          }}
        >

          <button
            onClick={previousMonth}
          >
            ◀
          </button>

          <button
            onClick={goToday}
          >
            Today
          </button>

          <button
            onClick={nextMonth}
          >
            ▶
          </button>

        </div>

      </div>

      <div
        style={{
          textAlign: "center",
          marginBottom: 24,
          fontSize: 28,
          fontWeight: 700,
        }}
      >
        {monthTitle}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(7,1fr)",
          gap: 8,
          marginBottom: 10,
        }}
      >
        {WEEK_DAYS.map((day) => (
          <div
            key={day}
            style={{
              textAlign: "center",
              fontWeight: 700,
              padding: 10,
            }}
          >
            {day}
          </div>
        ))}
      </div>

      <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(7,1fr)",
    gap: 8,
  }}
>
  {calendarDays.map((date) => {
          const inMonth =
            date >= monthStart &&
            date <= monthEnd;

          const isToday =
            sameDay(date, today);

          const isSelected =
            sameDay(
              date,
              selectedDate
            );

          const events =
            eventsForDate(date);

          return (
            <div
              key={date.toISOString()}
              onClick={() =>
                setSelectedDate(
                  new Date(date)
                )
              }
              style={{
                minHeight: 130,
                padding: 10,
                borderRadius: 12,
                cursor: "pointer",
                border: isSelected
                  ? "2px solid #F4C542"
                  : "1px solid #DDDDDD",
                background: inMonth
                  ? "#FFFFFF"
                  : "#F4F4F4",
                transition: "0.2s",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontWeight: isToday
                      ? 700
                      : 500,
                    color: inMonth
                      ? "#222"
                      : "#AAA",
                  }}
                >
                  {date.getDate()}
                </span>

                {isToday && (
                  <span
                    style={{
                      background:
                        "#F4C542",
                      color: "#2F3A3F",
                      fontSize: 10,
                      padding:
                        "2px 6px",
                      borderRadius: 12,
                      fontWeight: 700,
                    }}
                  >
                    TODAY
                  </span>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection:
                    "column",
                  gap: 4,
                }}
              >
                {events.length === 0 && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "#BBBBBB",
                      fontStyle:
                        "italic",
                    }}
                  >
                    No events
                  </div>
                )}

                {events.map(
                  (
                    event,
                    index
                  ) => (
                    <div
                      key={index}
                      style={{
                        background:
                          event.colour,
                        color:
                          "white",
                        borderRadius: 6,
                        padding:
                          "4px 6px",
                        fontSize: 11,
                        overflow:
                          "hidden",
                        whiteSpace:
                          "nowrap",
                        textOverflow:
                          "ellipsis",
                      }}
                    >
                      {event.type ===
                      "appointment"
                        ? "👤 "
                        : "✂️ "}
                      {event.label}
                    </div>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 32,
          padding: 20,
          borderRadius: 12,
          background: "#FFFFFF",
          border:
            "1px solid #DDDDDD",
        }}
      >
        <h3
          style={{
            marginTop: 0,
          }}
        >
          Selected Day
        </h3>

        <p
          style={{
            color: "#666",
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

        {eventsForDate(
          selectedDate
        ).length === 0 ? (
          <p
            style={{
              color: "#999",
            }}
          >
            No appointments,
            fittings or due
            jobs scheduled.
          </p>
        ) : (
          eventsForDate(
            selectedDate
          ).map(
            (
              event,
              index
            ) => (
              <div
                key={index}
                style={{
                  marginBottom: 10,
                  padding: 12,
                  borderLeft: `5px solid ${event.colour}`,
                  background:
                    "#FAFAFA",
                  borderRadius: 8,
                }}
              >
                <strong>
                  {event.label}
                </strong>

                <div
                  style={{
                    color: "#666",
                    marginTop: 4,
                    fontSize: 13,
                  }}
                >
                  {event.type ===
                  "appointment"
                    ? "Appointment"
                    : "Job Due"}
                </div>
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}