// 🦋 Chrysalis Studio
// Dashboard Intelligence

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getAllJobs(clients = []) {
  return clients.flatMap((client) => client.jobs || []);
}

export function getAllAppointments(clients = []) {
  return clients.flatMap((client) => client.appointments || []);
}

export function getAllPayments(clients = []) {
  return clients.flatMap((client) => client.payments || []);
}

export function getActiveJobs(clients = []) {
  return getAllJobs(clients).filter(
    (job) =>
      !["Completed", "Collected", "Cancelled"].includes(job.status)
  );
}

export function getOutstandingPayments(clients = []) {
  return getAllJobs(clients).reduce((total, job) => {
    const quote = Number(job.price || 0);

    const paid = (job.payments || []).reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );

    return total + Math.max(0, quote - paid);
  }, 0);
}

export function getAppointmentsToday(clients = []) {
  const today = new Date().toLocaleDateString("en-AU");

  return getAllAppointments(clients).filter(
    (appointment) => appointment.date === today
  );
}

export function getOverdueJobs(clients = []) {
  const today = startOfDay();

  return getActiveJobs(clients).filter((job) => {
    if (!job.dueDate) return false;

    return startOfDay(job.dueDate) < today;
  });
}

export function getJobsDueToday(clients = []) {
  const today = startOfDay();

  return getActiveJobs(clients).filter((job) => {
    if (!job.dueDate) return false;

    return startOfDay(job.dueDate).getTime() === today.getTime();
  });
}

export function getJobsDueThisWeek(clients = []) {
  const today = startOfDay();
  const nextWeek = startOfDay();

  nextWeek.setDate(today.getDate() + 7);

  return getActiveJobs(clients).filter((job) => {
    if (!job.dueDate) return false;

    const due = startOfDay(job.dueDate);

    return due > today && due <= nextWeek;
  });
}

export function getJobHealth(job) {
  if (!job) {
    return {
      level: "unknown",
      label: "Unknown",
      icon: "⚪",
      colour: "#9CA3AF",
    };
  }

  const today = startOfDay();

  if (job.dueDate) {
    const due = startOfDay(job.dueDate);

    if (due < today) {
      return {
        level: "critical",
        label: "Overdue",
        icon: "🔴",
        colour: "#DC2626",
      };
    }

    if (due.getTime() === today.getTime()) {
      return {
        level: "warning",
        label: "Due Today",
        icon: "🟠",
        colour: "#EA580C",
      };
    }
  }

  if (job.priority === "High") {
    return {
      level: "attention",
      label: "High Priority",
      icon: "🟡",
      colour: "#CA8A04",
    };
  }

  return {
    level: "healthy",
    label: "On Track",
    icon: "🟢",
    colour: "#16A34A",
  };
}

export function getRecentActivity(clients = [], limit = 5) {
  return getAllJobs(clients)
    .flatMap((job) => job.timeline || [])
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit);
}

export function getDashboardInsights(clients = []) {
  const appointments = getAppointmentsToday(clients);
  const activeJobs = getActiveJobs(clients);
  const overdueJobs = getOverdueJobs(clients);
  const dueToday = getJobsDueToday(clients);
  const dueThisWeek = getJobsDueThisWeek(clients);
  const outstanding = getOutstandingPayments(clients);

  const focus = [];

  if (overdueJobs.length) {
    focus.push({
      level: "critical",
      message: `🔴 ${overdueJobs.length} overdue job${overdueJobs.length === 1 ? "" : "s"}`,
    });
  }

  if (dueToday.length) {
    focus.push({
      level: "warning",
      message: `🟠 ${dueToday.length} job${dueToday.length === 1 ? "" : "s"} due today`,
    });
  }

  if (appointments.length) {
    focus.push({
      level: "info",
      message: `📅 ${appointments.length} appointment${appointments.length === 1 ? "" : "s"} today`,
    });
  }

  if (dueThisWeek.length) {
    focus.push({
      level: "info",
      message: `🧵 ${dueThisWeek.length} job${dueThisWeek.length === 1 ? "" : "s"} due this week`,
    });
  }

  if (outstanding > 0) {
    focus.push({
      level: "success",
      message: `💰 $${outstanding.toFixed(2)} outstanding`,
    });
  }

  return {
    appointments,
    activeJobs,
    overdueJobs,
    dueToday,
    dueThisWeek,
    outstanding,
    focus,
  };
}