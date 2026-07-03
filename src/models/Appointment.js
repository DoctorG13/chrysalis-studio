export function createAppointment({
  type = "Consultation",
  date = "",
  time = "",
  duration = 60,
  location = "",
  jobId = "",
  status = "Scheduled",
  notes = "",
}) {
  return {
    id: crypto.randomUUID(),

    type,
    date,
    time,
    duration,
    location,

    jobId,

    status,

    notes,

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function updateAppointment(appointment, updates) {
  return {
    ...appointment,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
}

export function appointmentStatusColour(status) {
  switch (status) {
    case "Completed":
      return "#2E8B57";

    case "Cancelled":
      return "#C0392B";

    case "No Show":
      return "#D35400";

    case "Scheduled":
    default:
      return "#2980B9";
  }
}

export function appointmentTypeIcon(type) {
  switch (type) {
    case "Initial Consultation":
      return "📝";

    case "First Fitting":
      return "🧵";

    case "Second Fitting":
      return "✂️";

    case "Final Fitting":
      return "👗";

    case "Collection":
      return "📦";

    default:
      return "📅";
  }
}