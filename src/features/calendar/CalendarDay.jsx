import { useState } from "react";

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

function getClientName(event) {
  if (event.clientName) {
    return event.clientName;
  }

  if (event.client?.name) {
    return event.client.name;
  }

  return [
    event.client?.firstName,
    event.client?.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function getEventTitle(event) {
  if (event.type === "appointment") {
    return (
      event.appointment?.title ||
      event.appointment?.type ||
      "Appointment"
    );
  }

  if (event.type === "job") {
    return (
      event.job?.title ||
      event.job?.name ||
      "Job"
    );
  }

  if (event.type === "fitting") {
    return (
      event.fitting?.title ||
      "Fitting"
    );
  }

  return event.label || "Event";
}

function hasCalendarDrag(event) {
  if (!event?.dataTransfer) {
    return false;
  }

  const types = Array.from(
    event.dataTransfer.types || []
  );

  return (
    types.includes(
      "application/chrysalis-calendar"
    ) ||
    types.includes("text/plain")
  );
}

export default function CalendarDay({
  date,
  inMonth,
  isToday,
  isSelected,
  events = [],
  onClick,
  onOpenAppointment,
  onOpenJob,
  onOpenClient,
  onRescheduleEvent,
}) {
  const [isDragging, setIsDragging] =
    useState(false);

  const [isDragOver, setIsDragOver] =
    useState(false);

  function handleDragStart(
    event,
    calendarEvent
  ) {
    if (
      calendarEvent.type !==
        "appointment" &&
      calendarEvent.type !== "job"
    ) {
      return;
    }

    const record =
      calendarEvent.type ===
      "appointment"
        ? calendarEvent.appointment
        : calendarEvent.job;

    if (!record?.id) {
      return;
    }

    const payload = {
      type: calendarEvent.type,
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

    setIsDragging(true);
  }

  function handleDragEnd() {
    setIsDragging(false);
    setIsDragOver(false);
  }

  function handleDragOver(event) {
    if (!hasCalendarDrag(event)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    event.dataTransfer.dropEffect =
      "move";

    setIsDragOver(true);
  }

  function handleDragLeave(event) {
    if (
      !event.currentTarget.contains(
        event.relatedTarget
      )
    ) {
      setIsDragOver(false);
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    const raw =
      event.dataTransfer.getData(
        "application/chrysalis-calendar"
      ) ||
      event.dataTransfer.getData(
        "text/plain"
      );

    setIsDragging(false);
    setIsDragOver(false);

    if (!raw) {
      return;
    }

    let payload;

    try {
      payload = JSON.parse(raw);
    } catch {
      return;
    }

    if (
      !payload?.type ||
      !payload?.id
    ) {
      return;
    }

    if (
      payload.type !==
        "appointment" &&
      payload.type !== "job"
    ) {
      return;
    }

    onRescheduleEvent?.({
      type: payload.type,
      id: payload.id,
      date: formatDate(date),
    });
  }

  function handleEventClick(
    calendarEvent,
    clickEvent
  ) {
    clickEvent.stopPropagation();

    if (
      calendarEvent.type ===
      "appointment"
    ) {
      onOpenAppointment?.(
        calendarEvent.appointment
      );

      return;
    }

    if (
      calendarEvent.type === "job"
    ) {
      onOpenJob?.(
        calendarEvent.client,
        calendarEvent.job
      );

      return;
    }

    if (calendarEvent.client) {
      onOpenClient?.(
        calendarEvent.client
      );
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Select ${date.toLocaleDateString(
        "en-AU",
        {
          weekday: "long",
          day: "numeric",
          month: "long",
        }
      )}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        minHeight: 116,
        padding: 9,
        borderRadius: 8,
        cursor: isDragging
          ? "grabbing"
          : "pointer",
        border: isSelected
          ? "2px solid #8B1E3F"
          : "1px solid #D9DEE2",
        background:
          isDragOver
            ? "#FFF4F7"
            : isSelected
            ? "#FFF9FB"
            : inMonth
            ? "#FFFFFF"
            : "#F6F7F8",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        textAlign: "left",
        appearance: "none",
        WebkitAppearance:
          "none",
        fontFamily: "inherit",
        color: "inherit",
        boxSizing: "border-box",
        transition:
          "border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.borderColor =
          "#C96A83";

        event.currentTarget.style.boxShadow =
          "0 3px 10px rgba(31,41,51,.07)";

        event.currentTarget.style.transform =
          "translateY(-1px)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.borderColor =
          isSelected
            ? "#8B1E3F"
            : "#D9DEE2";

        event.currentTarget.style.boxShadow =
          "none";

        event.currentTarget.style.transform =
          "translateY(0)";
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          width: "100%",
          marginBottom: 7,
        }}
      >
        <span
          style={{
            fontWeight: isToday
              ? 800
              : 600,
            color: inMonth
              ? "#20262B"
              : "#A7ADB1",
            fontSize: 13,
          }}
        >
          {date.getDate()}
        </span>

        {isToday && (
          <span
            style={{
              background: "#8B1E3F",
              color: "#FFFFFF",
              fontSize: 8,
              fontWeight: 800,
              padding: "3px 6px",
              borderRadius: 999,
              letterSpacing: 0.3,
            }}
          >
            TODAY
          </span>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          width: "100%",
          overflow: "hidden",
        }}
      >
        {events
          .slice(0, 4)
          .map((calendarEvent, index) => {
            const isDraggable =
              calendarEvent.type ===
                "appointment" ||
              calendarEvent.type === "job";

            const clientName =
              getClientName(
                calendarEvent
              );

            const eventTitle =
              getEventTitle(
                calendarEvent
              );

            return (
              <div
                key={
                  calendarEvent.id ||
                  index
                }
                draggable={isDraggable}
                onDragStart={(dragEvent) =>
                  handleDragStart(
                    dragEvent,
                    calendarEvent
                  )
                }
                onDragEnd={
                  handleDragEnd
                }
                onClick={(clickEvent) =>
                  handleEventClick(
                    calendarEvent,
                    clickEvent
                  )
                }
                title={
                  clientName
                    ? `${clientName} • ${eventTitle}`
                    : eventTitle
                }
                style={{
                  background:
                    calendarEvent.colour ||
                    "#687178",
                  color: "#FFFFFF",
                  borderRadius: 5,
                  padding: "5px 6px",
                  fontSize: 10,
                  fontWeight: 700,
                  width: "100%",
                  boxSizing:
                    "border-box",
                  cursor: isDraggable
                    ? "grab"
                    : "pointer",
                  userSelect: "none",
                  overflow: "hidden",
                  opacity: isDragging
                    ? 0.65
                    : 1,
                }}
              >
                <div
                  style={{
                    overflow: "hidden",
                    whiteSpace:
                      "nowrap",
                    textOverflow:
                      "ellipsis",
                    lineHeight:
                      "13px",
                  }}
                >
                  {clientName ||
                    "No client"}
                </div>

                <div
                  style={{
                    marginTop: 2,
                    fontSize: 9,
                    fontWeight: 600,
                    opacity: 0.9,
                    overflow: "hidden",
                    whiteSpace:
                      "nowrap",
                    textOverflow:
                      "ellipsis",
                    lineHeight:
                      "12px",
                  }}
                >
                  {eventTitle}
                </div>
              </div>
            );
          })}

        {events.length > 4 && (
          <span
            style={{
              color: "#8B1E3F",
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            +{events.length - 4} more
          </span>
        )}

        {events.length === 0 &&
          inMonth && (
            <span
              style={{
                color: "#B1B7BB",
                fontSize: 10,
              }}
            >
              No events
            </span>
          )}
      </div>
    </button>
  );
}