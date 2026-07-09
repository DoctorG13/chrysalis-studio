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
  const today = startOfDay();

  return getAllAppointments(clients).filter((appointment) => {
    if (!appointment.date) return false;
    return startOfDay(appointment.date).getTime() === today.getTime();
  });
}

export function getOverdueJobs(clients = []) {
  return getActiveJobs(clients).filter((job) => job.overdue);
}

export function getJobsDueToday(clients = []) {
  return getActiveJobs(clients).filter((job) => job.dueToday);
}

export function getJobsDueThisWeek(clients = []) {
  const today = startOfDay();

  const end = startOfDay();
  end.setDate(end.getDate() + 7);

  return getActiveJobs(clients)
    .filter((job) => {
      if (!job.dueDate) return false;

      const due = startOfDay(job.dueDate);

      return due >= today && due <= end;
    })
    .sort(
      (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
    );
}

export function getJobHealth(job) {
  if (job?.overdue) {
    return {
      level: "critical",
      label: "Overdue",
      icon: "🔴",
      colour: "#DC2626",
    };
  }

  if (job?.dueToday) {
    return {
      level: "warning",
      label: "Due Today",
      icon: "🟠",
      colour: "#EA580C",
    };
  }

  if (job?.needsAttention) {
    return {
      level: "attention",
      label: "Needs Attention",
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

export function getTodaysPriorities(clients = []) {
  return getActiveJobs(clients)
    .filter(
      (job) =>
        job.overdue ||
        job.dueToday ||
        job.needsAttention
    )
    .sort((a, b) => {
      const score = (job) => {
        if (job.overdue) return 1;
        if (job.dueToday) return 2;
        if (job.needsAttention) return 3;
        return 99;
      };

      return score(a) - score(b);
    });
}

export function getDashboardInsights(clients = []) {
  const appointments = getAppointmentsToday(clients);
  const activeJobs = getActiveJobs(clients);
  const overdueJobs = getOverdueJobs(clients);
  const dueToday = getJobsDueToday(clients);
  const dueThisWeek = getJobsDueThisWeek(clients);
  const outstanding = getOutstandingPayments(clients);
  const priorities = getTodaysPriorities(clients);

  return {
    appointments,
    activeJobs,
    overdueJobs,
    dueToday,
    dueThisWeek,
    outstanding,
    priorities,

    stats: {
      clients: clients.length,
      activeJobs: activeJobs.length,
      overdue: overdueJobs.length,
      dueToday: dueToday.length,
      dueThisWeek: dueThisWeek.length,
      outstanding,
      priorities: priorities.length,
      readyForCollection: activeJobs.filter(
        (j) => j.status === "Ready"
      ).length,
      needsAttention: activeJobs.filter(
        (j) => j.needsAttention
      ).length,
    },
  };
}