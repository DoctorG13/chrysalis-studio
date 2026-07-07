// 🦋 Chrysalis Studio
// Dashboard Intelligence

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

export function getJobsDueThisWeek(clients = []) {
  const today = new Date();
  const nextWeek = new Date();

  nextWeek.setDate(today.getDate() + 7);

  return getAllJobs(clients).filter((job) => {
    if (!job.dueDate) return false;

    const due = new Date(job.dueDate);

    return due >= today && due <= nextWeek;
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

  const activeJobs =
    getActiveJobs(clients);

  const dueThisWeek =
    getJobsDueThisWeek(clients);

  const outstanding =
    getOutstandingPayments(clients);

  const focus = [];

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
      `💰 $${outstanding.toFixed(
        2
      )} outstanding`
    );
  }

  if (!focus.length) {
    focus.push(
      "Everything is under control today."
    );
    focus.push(
      "A great day to prepare upcoming garments or contact clients."
    );
  }

  return {
    appointments,
    activeJobs,
    dueThisWeek,
    outstanding,
    focus,
  };
}