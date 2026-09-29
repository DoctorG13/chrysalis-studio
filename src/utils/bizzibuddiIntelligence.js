export function formatBizziBuddiCurrency(amount) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(Number(amount) || 0);
}

function dateDaysFrom(todayKey, value) {
  if (!value) return null;
  const due = new Date(value + "T00:00:00");
  const today = new Date(todayKey + "T00:00:00");
  if (Number.isNaN(due.getTime()) || Number.isNaN(today.getTime())) return null;
  return Math.ceil((due - today) / 86400000);
}

export function buildBizziBuddiPriorityItems({
  todayKey,
  invoices = [],
  appointments = [],
  jobs = [],
  productionRecords = [],
}) {
  const today = new Date(todayKey + "T00:00:00");
  const overdueInvoices = invoices.filter(
    (invoice) =>
      invoice.status !== "Paid" &&
      invoice.dueDate &&
      (invoice.status === "Overdue" || invoice.dueDate < todayKey)
  );
  const dueSoonInvoices = invoices.filter((invoice) => {
    if (invoice.status === "Paid" || !invoice.dueDate) return false;
    const days = dateDaysFrom(todayKey, invoice.dueDate);
    return days !== null && days >= 0 && days <= 7;
  });
  const appointmentsToday = appointments.filter((appointment) => appointment.date === todayKey);
  const waitingJobs = jobs.filter((job) => job.status === "Waiting");
  const productionNeedsAttention = jobs.filter((job) =>
    ["Overdue", "Tasks outstanding", "Stage update needed"].includes(job.productionReadiness)
  );
  const productionDueSoon = jobs.filter((job) => {
    if (!job.productionDueDate || job.productionReadiness === "Complete") return false;
    const days = dateDaysFrom(todayKey, job.productionDueDate);
    return days !== null && days >= 0 && days <= 7;
  });
  const readyProduction = jobs.filter((job) => job.productionReadiness === "Ready");
  const productionRecordReady = productionRecords.filter((record) => record.stage === "Ready");

  const items = [
    ...overdueInvoices.map((invoice) => ({
      key: "invoice-overdue-" + invoice.id,
      type: "overdue-payment",
      icon: "💳",
      label: "Payment overdue",
      title: invoice.clientName || invoice.client || "Invoice requires attention",
      detail: `${formatBizziBuddiCurrency(Math.max(0, (Number(invoice.amount) || 0) - (Number(invoice.amountPaid) || 0)))} outstanding · Due ${invoice.dueDate}`,
      actionKey: "finance",
      tone: "urgent",
    })),
    ...dueSoonInvoices.map((invoice) => ({
      key: "invoice-soon-" + invoice.id,
      type: "payment-due-soon",
      icon: "💰",
      label: invoice.dueDate === todayKey ? "Due today" : "Due soon",
      title: invoice.clientName || invoice.client || "Invoice due soon",
      detail: `${formatBizziBuddiCurrency(Math.max(0, (Number(invoice.amount) || 0) - (Number(invoice.amountPaid) || 0)))} outstanding · Due ${invoice.dueDate}`,
      actionKey: "finance",
      tone: "attention",
    })),
    ...productionNeedsAttention.map((job) => ({
      key: "production-attention-" + job.id,
      type: "production-attention",
      icon: "🏭",
      label: job.productionReadiness,
      title: job.title || "Production job",
      detail: job.productionReadinessDetail || "Production needs a workflow update.",
      actionKey: "jobs",
      tone: job.productionReadiness === "Overdue" ? "urgent" : "attention",
    })),
    ...productionDueSoon
      .filter((job) => !productionNeedsAttention.some((item) => item.id === job.id))
      .map((job) => ({
        key: "production-due-" + job.id,
        type: "production-due-soon",
        icon: "📦",
        label: "Production due soon",
        title: job.title || "Production job",
        detail: `Ready by ${job.productionDueDate}`,
        actionKey: "jobs",
        tone: "today",
      })),
    ...appointmentsToday.map((appointment) => ({
      key: "appointment-" + appointment.id,
      type: "appointment-today",
      icon: "📅",
      label: "Today",
      title: appointment.title || "Appointment",
      detail: `${appointment.time || "Time not set"}${appointment.personName ? ` · ${appointment.personName}` : ""}`,
      actionKey: "calendar",
      tone: "today",
    })),
    ...waitingJobs.map((job) => ({
      key: "waiting-" + job.id,
      type: "waiting-job",
      icon: "⏳",
      label: "Waiting",
      title: job.title || "Job waiting",
      detail: job.clientName || job.client || "This job is waiting for the next step.",
      actionKey: "jobs",
      tone: "attention",
    })),
    ...readyProduction.map((job) => ({
      key: "production-ready-" + job.id,
      type: "production-ready",
      icon: "✅",
      label: "Ready",
      title: job.title || "Production job",
      detail: job.productionDueDate ? `Ready by ${job.productionDueDate}` : "Production has reached the Ready stage.",
      actionKey: "jobs",
      tone: "ready",
    })),
    ...productionRecordReady
      .filter((record) => !readyProduction.some((job) => job.id === record.jobId))
      .map((record) => ({
        key: "production-record-ready-" + record.id,
        type: "production-ready",
        icon: "✅",
        label: "Ready",
        title: record.jobTitle || "Production job",
        detail: record.dueDate ? `Ready by ${record.dueDate}` : "Production has reached the Ready stage.",
        actionKey: "production",
        tone: "ready",
      })),
  ];

  const priorityWeight = { urgent: 400, attention: 300, today: 200, ready: 100 };
  return items
    .filter((item, index, all) => all.findIndex((candidate) => candidate.key === item.key) === index)
    .map((item) => ({
      ...item,
      priorityScore:
        (priorityWeight[item.tone] || 0) +
        (item.label === "Payment overdue" ? 40 : 0) +
        (item.label === "Overdue" ? 30 : 0) +
        (item.label === "Due today" ? 20 : 0) +
        (item.label === "Today" ? 15 : 0),
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}


export function buildBizziBuddiWorkload({
  todayKey = new Date().toISOString().slice(0, 10),
  jobs = [],
  productionRecords = [],
  timeEntries = [],
} = {}) {
  const today = new Date(todayKey + "T00:00:00");
  const productionByJob = new Map(productionRecords.map((record) => [record.jobId, record]));

  const activeJobs = jobs
    .filter((job) => job.status !== "Complete")
    .map((job) => {
      const record = productionByJob.get(job.id);
      const tasks = record?.tasks || [];
      const completedTasks = tasks.filter((task) => task.complete).length;
      const stage = record?.stage || job.productionStage || "Not started";
      const dueDate = record?.dueDate || job.productionDueDate || "";
      const dueDays = dueDate
        ? Math.ceil((new Date(dueDate + "T00:00:00") - today) / 86400000)
        : null;
      const remainingTasks = Math.max(0, tasks.length - completedTasks);
      const overdue = Boolean(dueDays !== null && dueDays < 0);
      const dueToday = dueDays === 0;

      const pressureScore =
        (overdue ? 100 : 0) +
        (dueToday ? 70 : 0) +
        (dueDays !== null && dueDays > 0 && dueDays <= 3 ? 40 : 0) +
        (dueDays !== null && dueDays > 3 && dueDays <= 7 ? 20 : 0) +
        remainingTasks * 5 +
        (stage === "Not started" ? 10 : 0);

      const pressure = pressureScore >= 100
        ? "Overloaded"
        : pressureScore >= 70
          ? "Heavy"
          : pressureScore >= 35
            ? "Normal"
            : "Light";

      const loggedSeconds = timeEntries
        .filter((entry) => entry.jobId === job.id)
        .reduce((sum, entry) => sum + Number(entry.durationSeconds || 0), 0);

      return {
        jobId: job.id,
        title: job.title || "Untitled job",
        clientName: job.clientName || job.client || "Unassigned",
        stage,
        dueDate,
        dueDays,
        overdue,
        dueToday,
        remainingTasks,
        loggedSeconds,
        pressure,
        pressureScore,
      };
    })
    .sort((a, b) => b.pressureScore - a.pressureScore);

  const averagePressure = activeJobs.length
    ? activeJobs.reduce((sum, job) => sum + job.pressureScore, 0) / activeJobs.length
    : 0;

  return {
    jobs: activeJobs,
    activeJobs: activeJobs.length,
    tasksRemaining: activeJobs.reduce((sum, job) => sum + job.remainingTasks, 0),
    loggedSeconds: activeJobs.reduce((sum, job) => sum + job.loggedSeconds, 0),
    overloadedJobs: activeJobs.filter((job) => job.pressure === "Overloaded").length,
    heavyJobs: activeJobs.filter((job) => job.pressure === "Heavy").length,
    averagePressure: Math.round(averagePressure),
    level: averagePressure >= 100
      ? "Overloaded"
      : averagePressure >= 60
        ? "Heavy"
        : averagePressure >= 30
          ? "Normal"
          : "Light",
  };
}

export function buildBizziBuddiIntelligence(data = {}) {
  const {
    todayKey = new Date().toISOString().slice(0, 10),
    invoices = [],
    appointments = [],
    jobs = [],
    productionRecords = [],
    timeEntries = [],
  } = data;
  const priorityItems = buildBizziBuddiPriorityItems(data);
  const workload = buildBizziBuddiWorkload({ todayKey, jobs, productionRecords, timeEntries });
  const outstandingInvoices = invoices.filter((invoice) => invoice.status !== "Paid");
  const completedJobs = jobs.filter((job) => job.status === "Complete");
  const activeProduction = productionRecords.filter((record) => record.stage && record.stage !== "Complete");

  return {
    todayKey,
    workload,
    priorityItems,
    priorityCount: priorityItems.length,
    priorityItemsTop: priorityItems.slice(0, 6),
    openJobs: jobs.filter((job) => job.status !== "Complete").length,
    completedJobs: completedJobs.length,
    waitingJobs: jobs.filter((job) => job.status === "Waiting").length,
    upcomingAppointments: appointments.filter((appointment) => {
      if (!appointment?.date) return false;
      const value = new Date(appointment.date + "T" + (appointment.time || "23:59"));
      return !Number.isNaN(value.getTime()) && value >= new Date();
    }).length,
    overdueInvoices: invoices.filter(
      (invoice) =>
        invoice.status !== "Paid" &&
        invoice.dueDate &&
        (invoice.status === "Overdue" || invoice.dueDate < todayKey)
    ).length,
    outstandingAmount: outstandingInvoices.reduce(
      (sum, invoice) =>
        sum + Math.max(0, (Number(invoice.amount) || 0) - (Number(invoice.amountPaid) || 0)),
      0
    ),
    activeProduction: activeProduction.length,
    readyProduction: productionRecords.filter((record) => record.stage === "Ready").length,
    completionRate: jobs.length ? Math.round((completedJobs.length / jobs.length) * 100) : 0,
  };
}
