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

  const { openClient, openJob } =
    useChrysalis();

  const today = new Date();

  const calendarDays = useMemo(
    () => buildCalendar(displayMonth),
    [displayMonth]
  );

  const monthStart = startOfMonth(displayMonth);
  const monthEnd = endOfMonth(displayMonth);

  function goPrevious() {
    setDisplayMonth(previousMonth(displayMonth));
  }

  function goNext() {
    setDisplayMonth(nextMonth(displayMonth));
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

  function getClientName(client) {
    if (!client) return "";
    if (client.name) return client.name;

    return [
      client.firstName,
      client.lastName,
    ]
      .filter(Boolean)
      .join(" ");
  }

  function getOutstanding(job) {
    if (
      job.balance !== undefined &&
      job.balance !== null
    ) {
      return Number(job.balance) || 0;
    }

    if (
      job.outstanding !== undefined &&
      job.outstanding !== null
    ) {
      return Number(job.outstanding) || 0;
    }

    const quote = Number(job.price || 0);
    const paid = (job.payments || []).reduce(
      (total, payment) =>
        total + Number(payment.amount || 0),
      0
    );

    return Math.max(quote - paid, 0);
  }

  function getEventsForDate(date) {
    const events = [];

    clients.forEach((client) => {
      (client.appointments || []).forEach(
        (appointment) => {
          if (!appointment.date) return;

          const appointmentDate =
            parseCalendarDate(appointment.date);

          if (
            appointmentDate &&
            sameDay(appointmentDate, date)
          ) {
            events.push({
              type: "appointment",
              client,
              appointment,
              icon: "👤",
              colour: "#1976D2",
              label:
                appointment.title ||
                getClientName(client) ||
                "Appointment",
            });
          }
        }
      );
    });

    jobs.forEach((job) => {
      if (!job.dueDate) return;

      const due = parseCalendarDate(job.dueDate);

      if (due && sameDay(due, date)) {
        const client = clients.find(
          (candidate) =>
            candidate.id === job.clientId
        );

        events.push({
          type: "job",
          client,
          jobId: job.id,
          job,
          icon: "💼",
          colour: "#C62828",
          label:
            job.reference ||
            job.title ||
            job.name ||
            "Job",
        });
      }
    });

    return events.slice(0, 3);
  }

  function formatJobDate(value) {
    const date = parseCalendarDate(value);

    if (!date) return value || "-";

    return date.toLocaleDateString("en-AU", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function renderJobDetails(event) {
    const job = event.job;
    const clientName = getClientName(event.client);
    const outstanding = getOutstanding(job);
    const garment =
      job.garmentType ||
      job.garment ||
      job.garments?.[0]?.type ||
      "General Job";

    const progress =
      typeof job.progress === "number"
        ? job.progress
        : null;

    return (
      <div style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <span
            style={{
              fontSize: 24,
              flexShrink: 0,
            }}
          >
            💼
          </span>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "#2F3A3F",
              }}
            >
              {job.reference ||
                job.title ||
                job.name ||
                "Job"}
            </div>

            {clientName && (
              <div
                style={{
                  marginTop: 3,
                  color: "#666",
                  fontSize: 13,
                }}
              >
                👤 {clientName}
              </div>
            )}
          </div>

          {job.status && (
            <span
              style={{
                background: "#E8EEF7",
                color: "#334E68",
                padding: "5px 10px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              {job.status}
            </span>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <DetailItem label="Garment" value={garment} />

          <DetailItem
            label="Due"
            value={formatJobDate(job.dueDate)}
          />

          <DetailItem
            label="Outstanding"
            value={`$${outstanding.toFixed(2)}`}
            highlight={outstanding > 0}
          />

          {job.nextAction && (
            <DetailItem
              label="Next"
              value={job.nextAction}
            />
          )}
        </div>

        {progress !== null && (
          <div style={{ marginTop: 4 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6,
                fontSize: 12,
                color: "#777",
              }}
            >
              <span>Workflow</span>
              <strong>{progress}%</strong>
            </div>

            <div
              style={{
                height: 7,
                background: "#E5E7EB",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(
                    Math.max(progress, 0),
                    100
                  )}%`,
                  height: "100%",
                  background: "#8B1E3F",
                  borderRadius: 999,
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
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
                key={
                  event.jobId ||
                  event.appointment?.id ||
                  index
                }
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
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "14px 16px",
                  marginBottom: 10,
                  borderLeft: `5px solid ${event.colour}`,
                  background: "#F8F8F8",
                  borderRadius: 8,
                  cursor: "pointer",
                  transition: "0.2s",
                }}
              >
                {event.type === "job" ? (
                  renderJobDetails(event)
                ) : (
                  <>
                    <span
                      style={{ fontSize: 20 }}
                    >
                      {event.icon}
                    </span>

                    <div>
                      <div
                        style={{ fontWeight: 600 }}
                      >
                        {event.label}
                      </div>

                      <div
                        style={{
                          color: "#666",
                          fontSize: 13,
                          marginTop: 3,
                        }}
                      >
                        Appointment
                      </div>
                    </div>
                  </>
                )}
              </div>
            )
          )
        )}
      </div>
    </>
  );
}

function DetailItem({
  label,
  value,
  highlight = false,
}) {
  return (
    <div
      style={{
        background: highlight
          ? "#FFF7E6"
          : "#FFFFFF",
        border: highlight
          ? "1px solid #F3D38A"
          : "1px solid #E8EAED",
        borderRadius: 8,
        padding: "9px 10px",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#888",
          marginBottom: 4,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: highlight
            ? "#8A5A00"
            : "#2F3A3F",
        }}
      >
        {value}
      </div>
    </div>
  );
}
