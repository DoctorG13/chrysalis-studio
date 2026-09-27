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

export function buildBizziBuddiIntelligence(data = {}) {
  const {
    todayKey = new Date().toISOString().slice(0, 10),
    invoices = [],
    appointments = [],
    jobs = [],
    productionRecords = [],
  } = data;
  const priorityItems = buildBizziBuddiPriorityItems(data);
  const outstandingInvoices = invoices.filter((invoice) => invoice.status !== "Paid");
  const completedJobs = jobs.filter((job) => job.status === "Complete");
  const activeProduction = productionRecords.filter((record) => record.stage && record.stage !== "Complete");

  return {
    todayKey,
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
