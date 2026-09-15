import { useMemo, useState } from "react";
import ChrysalisActionButton from "./ChrysalisActionButton";

const DAY_NAMES = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

const START_HOUR = 7;
const END_HOUR = 20;
const HOUR_HEIGHT = 64;

function startOfWeek(value) {
  const date = new Date(value);
  const day = date.getDay();
  const mondayOffset =
    day === 0 ? -6 : 1 - day;

  date.setDate(
    date.getDate() + mondayOffset
  );

  date.setHours(0, 0, 0, 0);

  return date;
}

function addDays(value, days) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function parseDate(value) {
  if (!value) return null;

  const stringValue = String(value);

  if (/^\d{4}-\d{2}-\d{2}/.test(stringValue)) {
    const [year, month, day] = stringValue
      .slice(0, 10)
      .split("-")
      .map(Number);

    return new Date(year, month - 1, day);
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(stringValue)) {
    const [day, month, year] = stringValue
      .split("/")
      .map(Number);

    return new Date(year, month - 1, day);
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function parseTime(value) {
  const match = String(value || "09:00").match(
    /(\d{1,2}):(\d{2})/
  );

  if (!match) {
    return {
      hours: 9,
      minutes: 0,
    };
  }

  return {
    hours: Number(match[1]),
    minutes: Number(match[2]),
  };
}

function clientName(client) {
  if (!client) return "";

  if (client.name) {
    return client.name;
  }

  return [
    client.firstName,
    client.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function formatDate(date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function snapMinutes(minutes) {
  return Math.round(minutes / 15) * 15;
}

function calculateDropPosition(
  event,
  dayColumn,
  day
) {
  if (!dayColumn) return null;

  const rect =
    dayColumn.getBoundingClientRect();

  const relativeY = Math.max(
    0,
    Math.min(
      rect.height,
      event.clientY - rect.top
    )
  );

  const rawMinutes =
    (relativeY / HOUR_HEIGHT) * 60;

  const snappedMinutes =
    snapMinutes(rawMinutes);

  const totalMinutes = Math.min(
    (END_HOUR - START_HOUR) * 60 - 15,
    Math.max(
      0,
      snappedMinutes
    )
  );

  const hours =
    START_HOUR +
    Math.floor(totalMinutes / 60);

  const minutes =
    totalMinutes % 60;

  return {
    date: formatDate(day),
    hour: hours,
    minutes,
    time: `${String(hours).padStart(
      2,
      "0"
    )}:${String(minutes).padStart(
      2,
      "0"
    )}`,
  };
}

export default function CalendarWeekView({
  weekDate,
  clients = [],
  jobs = [],
  onSelectDate,
  onOpenAppointment,
  onOpenClient,
  onOpenJob,
  onNewAppointment,
  onPreviousWeek,
  onNextWeek,
  onToday,
  onRescheduleEvent,
}) {
  const [draggingEvent, setDraggingEvent] =
    useState(null);

  const [dropTarget, setDropTarget] =
    useState(null);

  const weekStart =
    startOfWeek(weekDate);

  const days = useMemo(
    () =>
      DAY_NAMES.map((_, index) =>
        addDays(weekStart, index)
      ),
    [weekStart]
  );

  const calendarItems = useMemo(() => {
    const items = [];

    clients.forEach((client) => {
      const name = clientName(client);

      (client.appointments || []).forEach(
        (appointment) => {
          const date = parseDate(
            appointment.date
          );

          if (!date) return;

          items.push({
            type: "appointment",
            appointment,
            client,
            date,
            time:
              appointment.time ||
              "09:00",
            label:
              name ||
              "Appointment",
            subLabel:
              appointment.title ||
              appointment.type ||
              "Appointment",
          });
        }
      );

      (client.fittings || []).forEach(
        (fitting) => {
          const date = parseDate(
            fitting.date
          );

          if (!date) return;

          items.push({
            type: "fitting",
            fitting,
            client,
            date,
            time:
              fitting.time ||
              "09:00",
            label:
              name ||
              "Fitting",
            subLabel:
              fitting.title ||
              "Fitting",
          });
        }
      );
    });

    jobs.forEach((job) => {
      const date = parseDate(
        job.dueDate
      );

      if (!date) return;

      const client = clients.find(
        (candidate) =>
          String(candidate.id) ===
          String(job.clientId)
      );

      const name = clientName(client);

      items.push({
        type: "job",
        job,
        client,
        date,
        time:
          job.time ||
          "09:00",
        label:
          name || "Job",
        subLabel:
          job.title ||
          job.name ||
          "Job",
      });
    });

    return items;
  }, [clients, jobs]);

  function eventsForDay(day) {
    return calendarItems.filter(
      (item) =>
        sameDay(item.date, day)
    );
  }

  function handleDragStart(
    event,
    item
  ) {
    if (
      item.type !== "appointment" &&
      item.type !== "job"
    ) {
      return;
    }

    const record =
      item.type === "appointment"
        ? item.appointment
        : item.job;

    if (!record?.id) return;

    const payload = {
      type: item.type,
      id: String(record.id),
    };

    event.dataTransfer.effectAllowed =
      "move";

    event.dataTransfer.setData(
      "application/chrysalis-calendar",
      JSON.stringify(payload)
    );

    event.dataTransfer.setData(
      "text/plain",
      JSON.stringify(payload)
    );

    setDraggingEvent(payload);
  }

  function handleDragEnd() {
    setDraggingEvent(null);
    setDropTarget(null);
  }

  function handleDragOver(
    event,
    day,
    dayColumn
  ) {
    if (!draggingEvent) return;

    event.preventDefault();
    event.stopPropagation();

    event.dataTransfer.dropEffect =
      "move";

    const position =
      calculateDropPosition(
        event,
        dayColumn,
        day
      );

    if (!position) return;

    setDropTarget({
      date: position.date,
      hour: position.hour,
      minutes: position.minutes,
    });
  }

  function handleDrop(
    event,
    day,
    dayColumn
  ) {
    event.preventDefault();
    event.stopPropagation();

    const raw =
      event.dataTransfer.getData(
        "application/chrysalis-calendar"
      ) ||
      event.dataTransfer.getData(
        "text/plain"
      );

    if (!raw) {
      handleDragEnd();
      return;
    }

    let payload;

    try {
      payload = JSON.parse(raw);
    } catch {
      handleDragEnd();
      return;
    }

    if (
      !payload?.type ||
      !payload?.id
    ) {
      handleDragEnd();
      return;
    }

    const position =
      calculateDropPosition(
        event,
        dayColumn,
        day
      );

    handleDragEnd();

    if (!position) return;

    onRescheduleEvent?.({
      type: payload.type,
      id: payload.id,
      date: position.date,
      time: position.time,
    });
  }

  const weekLabel = `${weekStart.toLocaleDateString(
    "en-AU",
    {
      day: "numeric",
      month: "short",
    }
  )} – ${addDays(
    weekStart,
    6
  ).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;

  return (
    <section style={sectionStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>
            Week View
          </div>

          <h2 style={titleStyle}>
            {weekLabel}
          </h2>
        </div>

        <div style={actionsStyle}>
          <ChrysalisActionButton
            onClick={onPreviousWeek}
          >
            ←
          </ChrysalisActionButton>

          <ChrysalisActionButton
            onClick={onToday}
            variant="accent"
          >
            Today
          </ChrysalisActionButton>

          <ChrysalisActionButton
            onClick={onNextWeek}
          >
            →
          </ChrysalisActionButton>
        </div>
      </div>

      <div style={calendarWrapperStyle}>
        <div style={calendarStyle}>
          <div style={timeHeaderStyle} />

          {days.map((day, index) => (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() =>
                onSelectDate(day)
              }
              style={dayHeaderStyle}
            >
              <span>
                {DAY_NAMES[index]}
              </span>

              <strong>
                {day.getDate()}
              </strong>
            </button>
          ))}

          <div style={timeColumnStyle}>
            {Array.from(
              {
                length:
                  END_HOUR -
                  START_HOUR +
                  1,
              },
              (_, index) => (
                <div
                  key={index}
                  style={timeLabelStyle}
                >
                  {String(
                    START_HOUR +
                      index
                  ).padStart(
                    2,
                    "0"
                  )}
                  :00
                </div>
              )
            )}
          </div>

          {days.map((day) => {
            const dayEvents =
              eventsForDay(day);

            return (
              <div
                key={day.toISOString()}
                style={dayColumnStyle}
                onDragOver={(event) =>
                  handleDragOver(
                    event,
                    day,
                    event.currentTarget
                  )
                }
                onDrop={(event) =>
                  handleDrop(
                    event,
                    day,
                    event.currentTarget
                  )
                }
              >
                {Array.from(
                  {
                    length:
                      END_HOUR -
                      START_HOUR,
                  },
                  (_, hourIndex) => {
                    const hour =
                      START_HOUR +
                      hourIndex;

                    const isDropTarget =
                      dropTarget?.date ===
                        formatDate(day) &&
                      dropTarget?.hour ===
                        hour;

                    return (
                      <button
                        key={hour}
                        type="button"
                        aria-label={`Add appointment ${day.toLocaleDateString(
                          "en-AU"
                        )} ${hour}:00`}
                        onClick={() =>
                          onNewAppointment(
                            new Date(
                              day.getFullYear(),
                              day.getMonth(),
                              day.getDate(),
                              hour,
                              0
                            )
                          )
                        }
                        style={{
                          ...slotStyle,
                          ...(isDropTarget
                            ? dropTargetStyle
                            : {}),
                        }}
                      />
                    );
                  }
                )}

                {dayEvents.map(
                  (item, index) => {
                    const {
                      hours,
                      minutes,
                    } = parseTime(
                      item.time
                    );

                    const top =
                      Math.max(
                        0,
                        (
                          hours +
                          minutes / 60 -
                          START_HOUR
                        ) *
                          HOUR_HEIGHT
                      );

                    const duration =
                      Number(
                        item
                          .appointment
                          ?.duration ||
                          item
                            .fitting
                            ?.duration ||
                          item.job
                            ?.duration ||
                          60
                      );

                    const height =
                      Math.max(
                        34,
                        (duration /
                          60) *
                          HOUR_HEIGHT -
                          5
                      );

                    const record =
                      item.type ===
                      "appointment"
                        ? item.appointment
                        : item.type ===
                          "job"
                        ? item.job
                        : null;

                    const isDraggable =
                      Boolean(
                        record?.id
                      );

                    const isDragging =
                      draggingEvent &&
                      draggingEvent.type ===
                        item.type &&
                      String(
                        draggingEvent.id
                      ) ===
                        String(
                          record?.id
                        );

                    const background =
                      item.type ===
                      "appointment"
                        ? "#1976D2"
                        : "#8B1E3F";

                    return (
                      <button
                        key={`${item.type}-${record?.id || index}`}
                        type="button"
                        draggable={
                          isDraggable
                        }
                        onDragStart={(
                          dragEvent
                        ) =>
                          handleDragStart(
                            dragEvent,
                            item
                          )
                        }
                        onDragEnd={
                          handleDragEnd
                        }
                        onClick={() => {
                          if (
                            item.type ===
                            "appointment"
                          ) {
                            onOpenAppointment?.(
                              item.appointment
                            );
                            return;
                          }

                          if (
                            item.type ===
                            "job"
                          ) {
                            onOpenJob?.(
                              item.client,
                              item.job
                            );
                            return;
                          }

                          onOpenClient?.(
                            item.client
                          );
                        }}
                        style={{
                          ...eventStyle,
                          top,
                          height,
                          background,
                          opacity:
                            isDragging
                              ? 0.5
                              : 1,
                          cursor:
                            isDraggable
                              ? "grab"
                              : "pointer",
                        }}
                        title={`${item.label} • ${item.subLabel}`}
                      >
                        <strong
                          style={{
                            width:
                              "100%",
                            overflow:
                              "hidden",
                            whiteSpace:
                              "nowrap",
                            textOverflow:
                              "ellipsis",
                          }}
                        >
                          {item.label}
                        </strong>

                        <span
                          style={{
                            width:
                              "100%",
                            overflow:
                              "hidden",
                            whiteSpace:
                              "nowrap",
                            textOverflow:
                              "ellipsis",
                            opacity: 0.9,
                          }}
                        >
                          {
                            item.subLabel
                          }
                        </span>
                      </button>
                    );
                  }
                )}

                {dropTarget?.date ===
                  formatDate(day) &&
                  draggingEvent && (
                    <div
                      style={{
                        position:
                          "absolute",
                        left: 4,
                        right: 4,
                        top:
                          (
                            (
                              dropTarget.hour +
                              dropTarget.minutes /
                                60
                            ) -
                              START_HOUR
                          ) *
                            HOUR_HEIGHT,
                        height: 4,
                        borderRadius: 999,
                        background:
                          "#8B1E3F",
                        pointerEvents:
                          "none",
                        zIndex: 30,
                      }}
                    />
                  )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={footerStyle}>
        <span>
          Drag an appointment
          or job to another day
          or time to reschedule
          it.
        </span>

        <ChrysalisActionButton
          onClick={() =>
            onNewAppointment(
              weekStart
            )
          }
          variant="accent"
        >
          ＋ Appointment
        </ChrysalisActionButton>
      </div>
    </section>
  );
}

const sectionStyle = {
  marginTop: 18,
  background: "#FFFFFF",
  border: "1px solid #D9DEE2",
  borderRadius: 12,
  overflow: "hidden",
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  padding: "14px 16px",
  borderBottom:
    "1px solid #E1E4E7",
};

const eyebrowStyle = {
  color: "#8B1E3F",
  fontSize: 10,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 0.7,
};

const titleStyle = {
  margin: "3px 0 0",
  fontSize: 18,
  color: "#20262B",
};

const actionsStyle = {
  display: "flex",
  gap: 6,
};

const calendarWrapperStyle = {
  overflowX: "auto",
};

const calendarStyle = {
  display: "grid",
  gridTemplateColumns:
    "58px repeat(7, minmax(100px, 1fr))",
  minWidth: 780,
};

const timeHeaderStyle = {
  borderRight:
    "1px solid #E1E4E7",
  borderBottom:
    "1px solid #E1E4E7",
  minHeight: 54,
};

const dayHeaderStyle = {
  minHeight: 54,
  border: 0,
  borderRight:
    "1px solid #E1E4E7",
  borderBottom:
    "1px solid #E1E4E7",
  background: "#FAFAFA",
  color: "#4B555B",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 2,
  cursor: "pointer",
  fontFamily: "inherit",
};

const timeColumnStyle = {
  borderRight:
    "1px solid #E1E4E7",
  background: "#FAFAFA",
};

const timeLabelStyle = {
  height: HOUR_HEIGHT,
  boxSizing: "border-box",
  padding: "7px 6px",
  textAlign: "right",
  fontSize: 10,
  color: "#8A9297",
  borderBottom:
    "1px solid #EEF0F2",
};

const dayColumnStyle = {
  position: "relative",
  height:
    (END_HOUR -
      START_HOUR) *
    HOUR_HEIGHT,
  borderRight:
    "1px solid #E1E4E7",
  background: "#FFFFFF",
};

const slotStyle = {
  display: "block",
  width: "100%",
  height: HOUR_HEIGHT,
  padding: 0,
  border: 0,
  borderBottom:
    "1px solid #EEF0F2",
  background: "transparent",
  cursor: "pointer",
  transition:
    "background .12s ease",
};

const dropTargetStyle = {
  background:
    "rgba(139,30,63,.10)",
  boxShadow:
    "inset 0 0 0 2px rgba(139,30,63,.28)",
};

const eventStyle = {
  position: "absolute",
  left: 4,
  right: 4,
  padding: "6px 7px",
  border: 0,
  borderRadius: 6,
  color: "#FFFFFF",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 2,
  overflow: "hidden",
  cursor: "grab",
  textAlign: "left",
  fontFamily: "inherit",
  boxSizing: "border-box",
  boxShadow:
    "0 2px 6px rgba(0,0,0,.12)",
};

const footerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "10px 14px",
  borderTop:
    "1px solid #E1E4E7",
  color: "#727B80",
  fontSize: 11,
};