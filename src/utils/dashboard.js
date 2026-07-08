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
  return clients.flatMap(
    (client) => client.appointments || []
  );
}

export function getAllPayments(clients = []) {
  return clients.flatMap(
    (client) => client.payments || []
  );
}

export function getActiveJobs(clients = []) {
  return getAllJobs(clients).filter(
    (job) =>
      !["Completed", "Collected", "Cancelled"].includes(
        job.status
      )
  );
}

export function getOutstandingPayments(clients = []) {
  return getAllJobs(clients).reduce((total, job) => {
    const quote = Number(job.price || 0);

    const paid = (job.payments || []).reduce(
      (sum, payment) =>
        sum + Number(payment.amount || 0),
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

    return (
      startOfDay(job.dueDate).getTime() ===
      today.getTime()
    );
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

export function getRecentActivity(
  clients = [],
  limit = 5
) {
  return getAllJobs(clients)
    .flatMap((job) => job.timeline || [])
    .sort(
      (a, b) =>
        new Date(b.date) - new Date(a.date)
    )
    .slice(0, limit);
}

export function getDashboardInsights(
  clients = []
) {
  const appointments =
    getAppointmentsToday(clients);

  const overdueJobs =
    getOverdueJobs(clients);

  const dueToday =
    getJobsDueToday(clients);

  const dueThisWeek =
    getJobsDueThisWeek(clients);

  const activeJobs =
    getActiveJobs(clients);

  const outstanding =
    getOutstandingPayments(clients);

  const focus = [];

  if (overdueJobs.length) {
    focus.push(
      `🔴 ${overdueJobs.length} overdue job${
        overdueJobs.length === 1 ? "" : "s"
      } require immediate attention`
    );
  }

  if (dueToday.length) {
    focus.push(
      `🟠 ${dueToday.length} job${
        dueToday.length === 1 ? "" : "s"
      } due today`
    );
  }

  if (appointments.length) {
    focus.push(
      `📅 ${appointments.length} appointment${
        appointments.length === 1 ? "" : "s"
      } today`
    );
  }

  if (dueThisWeek.length) {
    focus.push(
      `🧵 ${dueThisWeek.length} job${
        dueThisWeek.length === 1 ? "" : "s"
      } due this week`
    );
  }

  if (outstanding > 0) {
    focus.push(
      `💰 Collect $${outstanding.toFixed(
        2
      )} in outstanding payments`
    );
  }

  if (!focus.length) {
    focus.push(
      "🎉 You're all caught up today."
    );
    focus.push(
      "Use today to prepare upcoming garments or contact clients."
    );
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