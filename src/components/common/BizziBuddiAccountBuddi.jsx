import { useEffect, useMemo, useState } from "react";
import BizziBuddiLogo from "./BizziBuddiLogo";
import { buildBizziBuddiIntelligence } from "../../utils/bizzibuddiIntelligence";

function normalise(value) {
  return String(value || "").trim().toLowerCase();
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(Number(amount) || 0);
}

function getClientName(person) {
  return person?.name || "Unnamed person";
}

function getJobTitle(job) {
  return job?.title || "Untitled job";
}

function getUpcomingAppointments(appointments) {
  const now = new Date();
  return appointments
    .filter((appointment) => {
      if (!appointment?.date) return false;
      const value = new Date(appointment.date + "T" + (appointment.time || "23:59"));
      return !Number.isNaN(value.getTime()) && value >= now;
    })
    .sort((a, b) => (a.date + "T" + (a.time || "")).localeCompare(b.date + "T" + (b.time || "")));
}

function renderAnswer(text) {
  return String(text || "").split("\n").map((line, index) => {
    const trimmed = line.trim();
    const bullet = /^[-*]\s+/.test(trimmed);
    const content = bullet ? trimmed.replace(/^[-*]\s+/, "") : line;
    const parts = content.split(/(\*\*[^*]+\*\*)/g);

    return (
      <div key={index} style={bullet ? bulletLineStyle : answerLineStyle}>
        {bullet && <span style={bulletMarkerStyle}>•</span>}
        <span>
          {parts.map((part, partIndex) =>
            part.startsWith("**") && part.endsWith("**")
              ? <strong key={partIndex}>{part.slice(2, -2)}</strong>
              : <span key={partIndex}>{part}</span>
          )}
        </span>
      </div>
    );
  });
}

function getProposedProductionActions(context) {
  const jobs = context?.intelligence?.workload?.jobs || [];
  const records = context?.productionRecords || [];
  const proposals = [];

  for (const job of jobs) {
    const record = records.find((item) => String(item.jobId) === String(job.jobId));
    if (!record) continue;

    if (job.stage === "Not started") {
      proposals.push({
        key: "start-production-" + job.jobId,
        type: "production-stage",
        jobId: job.jobId,
        title: "Start production",
        detail: job.title + " is not started. Buddi can move it to In production.",
        nextStage: "In production",
        urgency: job.dueDays !== null && job.dueDays < 0 ? "overdue" : job.dueDays === 0 ? "due-today" : job.pressure === "Overloaded" || job.pressure === "Heavy" ? "high" : "normal",
      });
    }

    const incompleteTask = (record.tasks || []).find((task) => !task.complete && String(task.title || "").trim());

    if (incompleteTask && (job.pressure === "Overloaded" || job.pressure === "Heavy" || job.dueDays !== null && job.dueDays <= 0)) {
      proposals.push({
        key: "complete-task-" + job.jobId + "-" + String(incompleteTask.id),
        type: "production-task",
        jobId: job.jobId,
        taskId: String(incompleteTask.id),
        taskTitle: String(incompleteTask.title).trim(),
        title: "Mark task complete",
        detail: job.title + " has an outstanding task: " + String(incompleteTask.title).trim() + ".",
        urgency: job.dueDays !== null && job.dueDays < 0 ? "overdue" : job.dueDays === 0 ? "due-today" : job.pressure === "Overloaded" || job.pressure === "Heavy" ? "high" : "normal",
      });
    }

    if (job.stage === "Ready" && job.remainingTasks === 0) {
      proposals.push({
        key: "complete-production-" + job.jobId,
        type: "production-stage",
        jobId: job.jobId,
        title: "Mark production complete",
        detail: job.title + " is Ready with all production tasks complete.",
        nextStage: "Complete",
        urgency: "normal",
      });
    }

    if (proposals.length >= 2) break;
  }

  return proposals;
}

function getSuggestedActions(question, context, handlers) {
  const value = String(question || "").trim().toLowerCase();
  const items = context?.dashboardAttention?.items || [];
  const actions = [];

  const add = (key, label, onClick) => {
    if (!onClick || actions.some((action) => action.key === key)) return;
    actions.push({ key, label, onClick });
  };

  if (
    value.includes("attention") ||
    value.includes("urgent") ||
    value.includes("today") ||
    value.includes("focus") ||
    value.includes("next")
  ) {
    const priorityItems = context?.intelligence?.priorityItemsTop || [];
    for (const item of priorityItems) {
      if (item.actionKey === "finance") add("finance", "Review payments →", handlers.onFinance);
      if (item.actionKey === "calendar") add("calendar", "Open today's calendar →", handlers.onCalendar);
      if (item.actionKey === "jobs") add("jobs", "Review jobs →", handlers.onJobs);
      if (item.actionKey === "production") add("production", "Open production →", handlers.onProduction);
      if (actions.length >= 4) break;
    }
  }

  if (value.includes("owe") || value.includes("invoice") || value.includes("payment") || value.includes("money")) add("finance", "Open finance →", handlers.onFinance);
  if (value.includes("coming up") || value.includes("calendar") || value.includes("appointment") || value.includes("booking")) add("calendar", "Open calendar →", handlers.onCalendar);
  if (value.includes("job") || value.includes("work") || value.includes("in progress") || value.includes("waiting")) add("jobs", "Open jobs →", handlers.onJobs);
  if (
    value.includes("production") ||
    value.includes("ready") ||
    value.includes("workload") ||
    value.includes("pressure") ||
    value.includes("capacity") ||
    value.includes("tasks remaining")
  ) add("production", "Open production →", handlers.onProduction);

  return actions.slice(0, 4);
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

function parseNaturalDate(value) {
  const text = normalise(value);
  if (!text) return "";

  const today = new Date();

  if (text === "today") return getLocalDateKey(today);

  if (text === "tomorrow") {
    const date = new Date(today);
    date.setDate(date.getDate() + 1);
    return getLocalDateKey(date);
  }

  const weekdayMatch = text.match(/^(?:next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i);
  if (weekdayMatch) {
    const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const target = weekdays.indexOf(weekdayMatch[1].toLowerCase());
    const current = today.getDay();
    let offset = (target - current + 7) % 7;
    if (offset === 0 || /^next\s+/i.test(text)) offset += 7;
    const date = new Date(today);
    date.setDate(date.getDate() + offset);
    return getLocalDateKey(date);
  }

  const numericMatch = text.match(/^(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))?$/);
  if (numericMatch) {
    const day = Number(numericMatch[1]);
    const month = Number(numericMatch[2]) - 1;
    let year = numericMatch[3] ? Number(numericMatch[3]) : today.getFullYear();
    if (year < 100) year += 2000;
    const date = new Date(year, month, day);
    if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
      return getLocalDateKey(date);
    }
  }

  const monthMatch = text.match(/^(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+(\d{4}))?$/i);
  if (monthMatch) {
    const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    const day = Number(monthMatch[1]);
    const month = months.indexOf(monthMatch[2].toLowerCase());
    let year = monthMatch[3] ? Number(monthMatch[3]) : today.getFullYear();
    let date = new Date(year, month, day);

    if (!monthMatch[3] && date < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
      year += 1;
      date = new Date(year, month, day);
    }

    if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
      return getLocalDateKey(date);
    }
  }

  return "";
}

function parseNaturalPrice(value) {
  const match = String(value || "").match(/(?:\$\s*|(?:price|priced|cost)(?:\s+(?:is|of|at))?\s*\$?\s*)(\d[\d,]*(?:\.\d+)?)\s*(k)?/i);
  if (!match) return "";

  let amount = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(amount)) return "";
  if (match[2]) amount *= 1000;

  return String(Math.round(amount * 100) / 100);
}

function getPersonName(person) {
  return person?.name || [person?.firstName, person?.lastName].filter(Boolean).join(" ") || "Unnamed person";
}

function findPersonMatch(people, requestedName) {
  const target = normalise(requestedName);
  if (!target) return null;
  const exact = people.filter((person) => normalise(getPersonName(person)) === target);
  if (exact.length === 1) return exact[0];
  const partial = people.filter((person) => {
    const name = normalise(getPersonName(person));
    return name.startsWith(target + " ") || target.startsWith(name + " ");
  });
  return partial.length === 1 ? partial[0] : null;
}

function titleCaseJobTitle(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/(^|[\s-])([A-Za-zÀ-ÖØ-öø-ÿ])/g, (_, prefix, letter) => prefix + letter.toUpperCase())
    .replace(/([A-Za-zÀ-ÖØ-öø-ÿ])([A-ZÀ-ÖØ-öø-ÿ]+)/g, (_, first, rest) => first + rest.toLowerCase());
}

function parseNaturalTime(value) {
  const raw = String(value || "").trim().toLowerCase().replace(/\s+/g, "");
  const match = raw.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)$/);
  if (match) {
    let hour = Number(match[1]);
    const minute = Number(match[2] || 0);
    if (hour < 1 || hour > 12 || minute > 59) return "";
    if (match[3] === "am" && hour === 12) hour = 0;
    if (match[3] === "pm" && hour !== 12) hour += 12;
    return String(hour).padStart(2, "0") + ":" + String(minute).padStart(2, "0");
  }

  const twentyFour = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFour) {
    const hour = Number(twentyFour[1]);
    const minute = Number(twentyFour[2]);
    if (hour > 23 || minute > 59) return "";
    return String(hour).padStart(2, "0") + ":" + String(minute).padStart(2, "0");
  }

  return "";
}

function parseNaturalPaymentRequest(rawQuestion, people) {
  const value = String(rawQuestion || "").trim();
  const draft = {
    amount: "",
    date: getLocalDateKey(),
    method: "Other",
    personId: "",
    requestedPersonName: "",
    description: "Payment",
    invoiceId: "",
  };

  let remainder = value
    .replace(/^(?:please\s+)?(?:record|take|add|log)\s+(?:a\s+)?(?:\$?\s*[\d,.]+(?:k)?\s+)?(?:payment|deposit)\b[,:]?\s*/i, "")
    .trim();

  const amountMatch = remainder.match(/(?:\$\s*)?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?|\d+(?:\.\d+)?k)\b/i);
  if (amountMatch) {
    draft.amount = parseNaturalPrice(amountMatch[0]);
    remainder = remainder.replace(amountMatch[0], " ");
  }

  const dateMatch = remainder.match(/\b(?:on\s+|for\s+)?(today|yesterday|tomorrow|(?:next\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|\d{1,2}[\/.-]\d{1,2}(?:[\/.-]\d{2,4})?|\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+\d{4})?)\b/i);
  if (dateMatch) {
    const parsed = dateMatch[1].toLowerCase() === "yesterday"
      ? getLocalDateKey(new Date(Date.now() - 86400000))
      : parseNaturalDate(dateMatch[1]);
    draft.date = parsed || draft.date;
    remainder = remainder.replace(dateMatch[0], " ");
  }

  const methodMatch = remainder.match(/\b(?:via|by|method)\s+(cash|card|eftpos|bank\s+transfer|transfer|direct\s+debit|other)\b/i);
  if (methodMatch) {
    draft.method = methodMatch[1].replace(/\b\w/g, (letter) => letter.toUpperCase());
    remainder = remainder.replace(methodMatch[0], " ");
  }

  const personMatch = remainder.match(/\b(?:from|for|by)\s+([^,;]+?)(?=\s+(?:for|on|via|by|method)\b|[,;]|$)/i);
  if (personMatch) {
    const requestedPersonName = personMatch[1].trim();
    draft.requestedPersonName = requestedPersonName;
    const person = findPersonMatch(people, requestedPersonName);
    if (person) draft.personId = person.id;
    remainder = remainder.replace(personMatch[0], " ");
  }

  draft.description = remainder
    .replace(/\b(?:payment|deposit)\b/gi, "")
    .replace(/^\s*(?:for|from|by|on|via)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[,;:.-]+\s*/g, "")
    .replace(/\s*[,;:.-]+$/g, "")
    .trim() || "Payment";

  return draft;
}

function parseNaturalAppointmentRequest(rawQuestion, people) {
  const value = String(rawQuestion || "").trim();
  const draft = {
    title: "",
    date: "",
    time: "",
    personId: "",
    requestedPersonName: "",
    duration: "60",
    status: "Booked",
    notes: "",
  };

  let remainder = value
    .replace(/^(?:please\s+)?(?:book|schedule|arrange|create|add)\s+(?:an?\s+)?(?:appointment\b)?[,:]?\s*/i, "")
    .trim();

  const timeMatch = remainder.match(/\bat\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)|\d{1,2}:\d{2})\b/i);
  if (timeMatch) {
    draft.time = parseNaturalTime(timeMatch[1]);
    remainder = remainder.replace(timeMatch[0], " ");
  }

  const dateMatch = remainder.match(/\b(?:on\s+|for\s+)?(today|tomorrow|(?:next\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|\d{1,2}[\/.-]\d{1,2}(?:[\/.-]\d{2,4})?|\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+\d{4})?)\b/i);
  if (dateMatch) {
    draft.date = parseNaturalDate(dateMatch[1]);
    remainder = remainder.replace(dateMatch[0], " ");
  }

  const durationMatch = remainder.match(/\b(?:for|lasting)\s+(\d{1,3})\s*(minutes?|mins?|hours?|hrs?)\b/i);
  if (durationMatch) {
    const amount = Number(durationMatch[1]);
    draft.duration = /hour/i.test(durationMatch[2]) ? String(amount * 60) : String(amount);
    remainder = remainder.replace(durationMatch[0], " ");
  }

  const statusMatch = remainder.match(/\bstatus\s+(booked|confirmed|pending|cancelled)\b/i);
  if (statusMatch) {
    draft.status = statusMatch[1].replace(/^./, (letter) => letter.toUpperCase());
    remainder = remainder.replace(statusMatch[0], " ");
  }

  let personMatch = remainder.match(/^(?:for\s+)?([A-Za-z][A-Za-z.'-]*(?:\s+[A-Za-z][A-Za-z.'-]*){0,4})\s+in\s+for\s+/i);
  if (personMatch) {
    const requestedPersonName = personMatch[1].trim();
    draft.requestedPersonName = requestedPersonName;
    const person = findPersonMatch(people, requestedPersonName);
    if (person) draft.personId = person.id;
    remainder = remainder.replace(personMatch[0], "");
  } else {
    personMatch = remainder.match(/\b(?:for|with)\s+([^,;]+?)(?=\s+(?:for|on|at|in)\b|[,;]|$)/i);
    if (personMatch) {
      const requestedPersonName = personMatch[1].trim();
      draft.requestedPersonName = requestedPersonName;
      const person = findPersonMatch(people, requestedPersonName);
      if (person) draft.personId = person.id;
      remainder = remainder.replace(personMatch[0], " ");
    }
  }

  draft.title = remainder
    .replace(/^for\s+/i, "")
    .replace(/^a\s+/i, "")
    .replace(/^an\s+/i, "")
    .replace(/^the\s+/i, "")
    .replace(/\b(?:appointment|in|for|on|at|with)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[,;:.-]+\s*/g, "")
    .replace(/\s*[,;:.-]+$/g, "")
    .replace(/[,;:\s]+$/g, "")
    .trim();

  draft.title = titleCaseJobTitle(draft.title);
  return draft;
}


function parseNaturalJobRequest(rawQuestion, people) {
  const value = String(rawQuestion || "").trim();
  const draft = { title: "", personId: "", requestedPersonName: "", status: "New", dueDate: "", price: "" };
  let remainder = value
    .replace(/^(?:please\s+)?(?:create|add|new)\s+(?:a\s+|an\s+)?(?:new\s+)?job\b[,:]?\s*/i, "")
    .trim();

  const dateMatch = remainder.match(/\b(?:due|by|on)\s+(today|tomorrow|(?:next\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|\d{1,2}[\/.-]\d{1,2}(?:[\/.-]\d{2,4})?|\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+\d{4})?)/i);
  if (dateMatch) {
    draft.dueDate = parseNaturalDate(dateMatch[1]);
    remainder = remainder.replace(dateMatch[0], " ");
  }

  const priceMatch = remainder.match(/(?:\$\s*\d[\d,]*(?:\.\d+)?\s*k?|\b(?:price|priced|cost)(?:\s+(?:is|of|at))?\s*\$?\s*\d[\d,]*(?:\.\d+)?\s*k?)/i);
  if (priceMatch) {
    draft.price = parseNaturalPrice(priceMatch[0]);
    remainder = remainder.replace(priceMatch[0], " ");
  }

  const personMatch = remainder.match(/\bfor\s+([^,;]+?)(?=\s+(?:for|with|as|status)\b|[,;]|$)/i);
  if (personMatch) {
    const requestedPersonName = personMatch[1].trim();
    const person = findPersonMatch(people, requestedPersonName);
    draft.requestedPersonName = requestedPersonName;

    if (person) {
      draft.personId = person.id;
    }

    remainder = remainder.replace(personMatch[0], " ");
  }

  const statusMatch = remainder.match(/\b(?:status|stage)\s+(new|in\s+progress|waiting|complete)\b/i);
  if (statusMatch) {
    const statusMap = { new: "New", "in progress": "In progress", waiting: "Waiting", complete: "Complete" };
    draft.status = statusMap[statusMatch[1].toLowerCase()] || "New";
    remainder = remainder.replace(statusMatch[0], " ");
  }

  draft.title = remainder
    .replace(/\b(?:due|by|on|for|with|as)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[,;:.-]+\s*/g, "")
    .replace(/\s*[,;:.-]+$/g, "")
    .replace(/\s*[,;]\s*[,;]+/g, ", ")
    .replace(/[,;:\s]+$/g, "")
    .trim();

  draft.title = titleCaseJobTitle(draft.title);

  return draft;
}

function ThinkingIndicator() {
  return (
    <div style={thinkingStyle} role="status" aria-live="polite">
      <strong>Buddi is thinking</strong>
      <span style={thinkingDotsStyle} aria-hidden="true">
        <i style={{ ...thinkingDotStyle, animationDelay: "0s" }} />
        <i style={{ ...thinkingDotStyle, animationDelay: "0.14s" }} />
        <i style={{ ...thinkingDotStyle, animationDelay: "0.28s" }} />
      </span>
    </div>
  );
}

export default function BizziBuddiAccountBuddi({ account, people, jobs, appointments, invoices, automationEvents, productionRecords, initialPrompt = "", onFinance, onCalendar, onJobs, onProduction, onSaveProduction, onAddJob, onAddPerson, onAddAppointment, onRecordPayment, onBack }) {
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [jobDraft, setJobDraft] = useState(null);
  const [appointmentDraft, setAppointmentDraft] = useState(null);
  const [paymentDraft, setPaymentDraft] = useState(null);
  const [newClientDraft, setNewClientDraft] = useState(null);
  const [jobSaving, setJobSaving] = useState(false);
  const [jobMessage, setJobMessage] = useState("");

  const businessContext = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const upcomingAppointments = getUpcomingAppointments(appointments);
    const outstandingInvoices = invoices.filter((invoice) => invoice.status !== "Paid");
    const overdueInvoices = outstandingInvoices.filter((invoice) => invoice.dueDate && invoice.dueDate < today);
    const jobStatus = ["New", "In progress", "Waiting", "Complete"].map((status) => ({
      status,
      count: jobs.filter((job) => job.status === status).length,
    }));
    const productionStatus = ["Not started", "In production", "Quality check", "Ready", "Complete"].map((stage) => ({
      stage,
      count: productionRecords.filter((record) => record.stage === stage).length,
    }));
    const intelligence = buildBizziBuddiIntelligence({
      todayKey: today,
      invoices,
      appointments,
      jobs,
      productionRecords,
    });
    const dashboardAttention = intelligence.priorityItems;

    return {
      product: "BizziBuddi",
      businessName: account?.business || "Your business",
      membership: account?.plan || "Free",
      people: people.map((person) => ({
        name: getClientName(person),
        email: person?.email || "",
        phone: person?.phone || "",
      })),
      jobs: jobs.map((job) => ({
        title: getJobTitle(job),
        client: job?.clientName || "",
        status: job?.status || "",
      })),
      calendar: {
        upcomingCount: upcomingAppointments.length,
        upcoming: upcomingAppointments.slice(0, 10).map((appointment) => ({
          title: appointment?.title || "Untitled appointment",
          date: appointment?.date || "",
          time: appointment?.time || "",
          person: appointment?.personName || "",
          status: appointment?.status || "Booked",
        })),
      },
      finance: {
        invoiceCount: invoices.length,
        outstandingCount: outstandingInvoices.length,
        outstandingAmount: outstandingInvoices.reduce((sum, invoice) => sum + Math.max(0, (Number(invoice.amount) || 0) - (Number(invoice.amountPaid) || 0)), 0),
        overdueCount: overdueInvoices.length,
      },
      jobsByStatus: jobStatus,
      production: productionStatus,
      dashboardAttention: {
        count: dashboardAttention.length,
        items: dashboardAttention,
      },
      automation: {
        eventCount: automationEvents.length,
        recentEvents: automationEvents.slice(0, 8).map((event) => ({
          title: event?.title || "",
          detail: event?.detail || "",
        })),
      },
      productionRecords,
      intelligence: {
        ...intelligence,
        attentionCount: intelligence.priorityCount,
        attentionSummary: intelligence.priorityItemsTop.map((item) => ({
          type: item.type,
          title: item.title,
          detail: item.detail,
        })),
        workloadSummary: {
          jobs: jobs.length,
          openJobs: intelligence.openJobs,
          waitingJobs: intelligence.waitingJobs,
          productionRecords: productionRecords.length,
          activeProduction: intelligence.activeProduction,
          readyProduction: intelligence.readyProduction,
          upcomingAppointments: intelligence.upcomingAppointments,
          pressure: intelligence.workload.level,
          activeJobs: intelligence.workload.activeJobs,
          tasksRemaining: intelligence.workload.tasksRemaining,
          loggedSeconds: intelligence.workload.loggedSeconds,
          overloadedJobs: intelligence.workload.overloadedJobs,
          heavyJobs: intelligence.workload.heavyJobs,
          topJobs: intelligence.workload.jobs.slice(0, 5).map((job) => ({
            title: job.title,
            clientName: job.clientName,
            stage: job.stage,
            dueDate: job.dueDate,
            dueDays: job.dueDays,
            remainingTasks: job.remainingTasks,
            loggedSeconds: job.loggedSeconds,
            pressure: job.pressure,
          })),
        },
        financeSummary: {
          invoiceCount: invoices.length,
          outstandingCount: outstandingInvoices.length,
          overdueCount: intelligence.overdueInvoices,
          outstandingAmount: intelligence.outstandingAmount,
        },
      },
    };
  }, [account, people, jobs, appointments, invoices, automationEvents, productionRecords]);

  const proposedProductionActions = getProposedProductionActions(businessContext);
  const productionAttentionJobs = (businessContext.intelligence?.workload?.jobs || [])
    .filter((job) => (job.dueDays !== null && job.dueDays <= 0) || job.pressure === "Overloaded" || job.pressure === "Heavy")
    .slice(0, 4);

  const financeAttentionInvoices = invoices
    .filter((invoice) => {
      if (invoice.status === "Paid" || !invoice.dueDate) return false;
      const due = new Date(invoice.dueDate + "T00:00:00");
      const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00");
      if (Number.isNaN(due.getTime()) || Number.isNaN(today.getTime())) return false;
      const days = Math.ceil((due - today) / 86400000);
      return invoice.status === "Overdue" || days <= 7;
    })
    .sort((a, b) => {
      const aDue = a.status === "Overdue" ? -1 : new Date(a.dueDate + "T00:00:00").getTime();
      const bDue = b.status === "Overdue" ? -1 : new Date(b.dueDate + "T00:00:00").getTime();
      return aDue - bDue;
    })
    .slice(0, 4);

  const prompts = [
    "What needs attention today?",
    "How is my business looking?",
    "What should I focus on next?",
    "Who owes me money?",
    "Which jobs need attention?",
    "How is my production workload looking?",
    "What is coming up?",
  ];

  useEffect(() => {
    const prompt = String(initialPrompt || "").trim();
    if (!prompt) return;
    askBuddi(prompt);
  }, [initialPrompt]);

  async function confirmProductionAction(action) {
    if (!action || !onSaveProduction || actionBusy) return;

    const record = productionRecords.find((item) => String(item.jobId) === String(action.jobId));
    if (!record) {
      setActionMessage("The production record is no longer available. Please open Production and refresh the job.");
      return;
    }

    setActionBusy(action.key);
    setActionMessage("");

    try {
      if (action.type === "production-task") {
        const tasks = (record.tasks || []).map((task) =>
          String(task.id) === String(action.taskId)
            ? { ...task, complete: true }
            : task
        );

        await onSaveProduction({
          ...record,
          tasks,
        });
      } else {
        await onSaveProduction({
          ...record,
          stage: action.nextStage,
        });
      }

      setActionMessage(action.title + " completed for " + (record.jobTitle || "the production job") + ".");
    } catch (error) {
      setActionMessage(error.message || "Buddi could not complete that action.");
    } finally {
      setActionBusy("");
    }
  }

  async function confirmCreateJob() {
    if (!jobDraft?.title?.trim() || (!jobDraft?.personId && !newClientDraft?.name?.trim()) || !onAddJob) {
      if (!onAddJob) {
        setJobMessage("Job creation is not available in this workspace yet.");
      } else if (!jobDraft?.personId && jobDraft?.requestedPersonName && !newClientDraft?.name?.trim()) {
        setJobMessage("Please select an existing person or create a new client before saving.");
      } else {
        setJobMessage("Please select a person and enter a job title.");
      }
      return;
    }

    setJobSaving(true);
    setJobMessage("");

    try {
      let personId = jobDraft.personId;
      let personName = "";

      if (!personId && newClientDraft?.name?.trim() && onAddPerson) {
        const createdPerson = await onAddPerson({
          name: newClientDraft.name.trim(),
          email: newClientDraft.email.trim(),
          phone: newClientDraft.phone.trim(),
        });
        personId = createdPerson.id;
        personName = getPersonName(createdPerson);
      } else {
        const person = people.find((item) => String(item.id) === String(personId));
        personName = getPersonName(person);
      }

      const savedJob = await onAddJob({
        title: jobDraft.title.trim(),
        personId,
        status: jobDraft.status || "New",
        dueDate: jobDraft.dueDate || "",
        price: Number(jobDraft.price) || 0,
      });

      setJobDraft(null);
      setNewClientDraft(null);
      setConversation((current) => [
        {
          question: "Create a new job",
          answer: "Created " + (savedJob?.title || jobDraft.title) + " for " + (personName || "the selected person") + " successfully.",
          actions: [],
        },
        ...current,
      ].slice(0, 8));
      onJobs?.();
    } catch (error) {
      setJobMessage(error.message || "The job could not be saved.");
    } finally {
      setJobSaving(false);
    }
  }

  async function confirmCreateAppointment() {
    if (!appointmentDraft?.title?.trim() || !appointmentDraft?.date || !appointmentDraft?.time || (!appointmentDraft?.personId && !newClientDraft?.name?.trim()) || !onAddAppointment) {
      if (!onAddAppointment) {
        setJobMessage("Appointment creation is not available in this workspace yet.");
      } else if (!appointmentDraft?.personId && appointmentDraft?.requestedPersonName && !newClientDraft?.name?.trim()) {
        setJobMessage("Please select an existing person or create a new client before saving.");
      } else if (!appointmentDraft?.date || !appointmentDraft?.time) {
        setJobMessage("Please enter an appointment date and time before saving.");
      } else {
        setJobMessage("Please select a person and enter an appointment title.");
      }
      return;
    }

    setJobSaving(true);
    setJobMessage("");

    try {
      let personId = appointmentDraft.personId;
      let personName = "";

      if (!personId && newClientDraft?.name?.trim() && onAddPerson) {
        const createdPerson = await onAddPerson({
          name: newClientDraft.name.trim(),
          email: newClientDraft.email.trim(),
          phone: newClientDraft.phone.trim(),
        });
        personId = createdPerson.id;
        personName = getPersonName(createdPerson);
      } else {
        const person = people.find((item) => String(item.id) === String(personId));
        personName = getPersonName(person);
      }

      const savedAppointment = await onAddAppointment({
        title: appointmentDraft.title.trim(),
        date: appointmentDraft.date,
        time: appointmentDraft.time,
        personId,
        jobId: appointmentDraft.jobId || "",
        duration: Number(appointmentDraft.duration) || 60,
        buffer: 0,
        status: appointmentDraft.status || "Booked",
        notes: appointmentDraft.notes || "",
      });

      setAppointmentDraft(null);
      setNewClientDraft(null);
      setConversation((current) => [
        {
          question: "Create a new appointment",
          answer: "Booked " + (savedAppointment?.title || appointmentDraft.title) + " for " + (personName || "the selected person") + " on " + savedAppointment.date + " at " + savedAppointment.time + ".",
          actions: [],
        },
        ...current,
      ].slice(0, 8));
      onCalendar?.();
    } catch (error) {
      setJobMessage(error.message || "The appointment could not be saved.");
    } finally {
      setJobSaving(false);
    }
  }

  async function confirmRecordPayment() {
    if (!paymentDraft?.personId || !paymentDraft?.amount || !onRecordPayment) {
      setJobMessage(!onRecordPayment
        ? "Payment recording is not available in this workspace yet."
        : "Please select a client and enter a payment amount.");
      return;
    }

    const matchingInvoices = invoices
      .filter((invoice) => String(invoice.personId) === String(paymentDraft.personId) && Number(invoice.balance || 0) > 0);

    if (!paymentDraft.invoiceId) {
      if (matchingInvoices.length === 1) {
        setPaymentDraft((draft) => ({ ...draft, invoiceId: matchingInvoices[0].id }));
      } else {
        setJobMessage(
          matchingInvoices.length
            ? "Please select the invoice to apply this payment to."
            : "No outstanding invoice was found for this client. Create an invoice first, then record the payment."
        );
        return;
      }
    }

    const invoice = matchingInvoices.find((item) => String(item.id) === String(paymentDraft.invoiceId));
    if (!invoice) {
      setJobMessage("Please select a valid outstanding invoice.");
      return;
    }

    const amount = Number(paymentDraft.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > Number(invoice.balance || 0)) {
      setJobMessage("Payment amount must be greater than zero and no more than the selected invoice balance.");
      return;
    }

    setJobSaving(true);
    setJobMessage("");

    try {
      const savedInvoice = await onRecordPayment(invoice.id, {
        amount,
        date: paymentDraft.date || getLocalDateKey(),
        method: paymentDraft.method || "Other",
        description: paymentDraft.description || "Payment",
      });

      setPaymentDraft(null);
      setConversation((current) => [
        {
          question: "Record payment",
          answer: "Recorded $" + amount.toFixed(2) + " from " + (savedInvoice?.personName || getPersonName(people.find((item) => String(item.id) === String(paymentDraft.personId)))) + ".",
          actions: [],
        },
        ...current,
      ].slice(0, 8));
      onFinance?.(savedInvoice?.id);
    } catch (error) {
      setJobMessage(error.message || "The payment could not be recorded.");
    } finally {
      setJobSaving(false);
    }
  }

  async function askBuddi(rawQuestion) {
    const value = String(rawQuestion || "").trim();
    if (!value || isLoading) return;

    setQuestion("");

    const isJobRequest = /^(?:please\s+)?(?:create|add|new)\s+(?:a\s+|an\s+)?(?:new\s+)?job\b/i.test(value);
    const isAppointmentRequest =
      /^(?:please\s+)?(?:book|schedule|arrange|create|add)\s+(?:an?\s+)?appointment\b/i.test(value) ||
      /^(?:please\s+)?(?:book|schedule|arrange)\s+.+\s+in\s+for\b/i.test(value);
    const isPaymentRequest =
      /^(?:please\s+)?(?:record|take|add|log)\b.*\b(?:payment|deposit)\b/i.test(value);

    if (isJobRequest) {
      const prefilledJob = parseNaturalJobRequest(value, people);
      setJobDraft(prefilledJob);
      setJobMessage("");
      setConversation((current) => [
        {
          question: value,
          answer: prefilledJob.requestedPersonName && !prefilledJob.personId
            ? "I found “" + prefilledJob.requestedPersonName + "” in your request, but I couldn’t match that name to a person in this account. You can select an existing person or create a new client below before saving."
            : prefilledJob.title
              ? "I’ve filled in the job details I could understand. Review them below and confirm when you’re ready to save."
              : "I’ve opened the job review form. Add the details you want, then confirm when you’re ready to save.",
          actions: [],
        },
        ...current,
      ].slice(0, 8));
      return;
    }

    if (isAppointmentRequest) {
      const prefilledAppointment = parseNaturalAppointmentRequest(value, people);
      setAppointmentDraft(prefilledAppointment);
      setJobDraft(null);
      setNewClientDraft(null);
      setJobMessage("");
      setConversation((current) => [
        {
          question: value,
          answer: prefilledAppointment.requestedPersonName && !prefilledAppointment.personId
            ? "I found “" + prefilledAppointment.requestedPersonName + "” in your request, but I couldn’t match that person in this account. Select an existing person or create a new client below before saving."
            : "I’ve filled in the appointment details I could understand. Review them below and confirm when you’re ready to save.",
          actions: [],
        },
        ...current,
      ].slice(0, 8));
      return;
    }

    if (isPaymentRequest) {
      const prefilledPayment = parseNaturalPaymentRequest(value, people);
      setPaymentDraft(prefilledPayment);
      setAppointmentDraft(null);
      setJobDraft(null);
      setNewClientDraft(null);
      setJobMessage("");
      setConversation((current) => [
        {
          question: value,
          answer: prefilledPayment.requestedPersonName && !prefilledPayment.personId
            ? "I found “" + prefilledPayment.requestedPersonName + "” in your request, but I couldn’t match that person in this account. Please select the correct person before recording the payment."
            : "I’ve filled in the payment details I could understand. Review them below and confirm when you’re ready to record it.",
          actions: [],
        },
        ...current,
      ].slice(0, 8));
      return;
    }

    setIsLoading(true);
    const wait = new Promise((resolve) => setTimeout(resolve, 450));

    try {
      const [response] = await Promise.all([
        fetch("/api/donna/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: value, context: businessContext }),
        }),
        wait,
      ]);

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Buddi could not answer right now.");

      const answer = payload.answer || "I couldn't generate an answer.";
      setConversation((current) => [
        { question: value, answer, actions: getSuggestedActions(value, businessContext, { onFinance, onCalendar, onJobs, onProduction }) },
        ...current,
      ].slice(0, 8));
    } catch (error) {
      setConversation((current) => [
        {
          question: value,
          answer: `I couldn't reach Buddi right now. ${error.message || "Please check that the assistant service is running."}`,
          actions: [],
        },
        ...current,
      ].slice(0, 8));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section style={panelStyle}>
      <div style={panelHeaderStyle}>
        <button type="button" onClick={onBack} style={backButtonStyle}>← Back to business</button>
        <div style={brandRowStyle}>
          <BizziBuddiLogo size={48} showWordmark={false} />
          <div>
            <div style={eyebrowStyle}>BIZZIBUDDI ASSISTANT</div>
            <h2 style={headingStyle}>Hi, I’m Buddi<span style={{ color: "#2563EB" }}>.</span></h2>
            <p style={subheadingStyle}>Your personal assistant for business.</p>
          </div>
        </div>
      </div>

      <div style={contentStyle}>
        <div style={welcomeCardStyle}>
          <div style={welcomeIconStyle}><BizziBuddiLogo size={26} showWordmark={false} /></div>
          <div>
            <strong style={{ display: "block", marginBottom: 4 }}>Ask Buddi about your business.</strong>
            <span>Buddi can use the information currently stored in this BizziBuddi account to explain what is happening, highlight what may need attention and point you to the right part of your workspace.</span>
          </div>
        </div>

        {productionAttentionJobs.length > 0 && (
          <div style={attentionCardStyle}>
            <small style={quickLabelStyle}>PRODUCTION ATTENTION</small>
            <strong style={{ display: "block", marginTop: 5, fontSize: 16 }}>Work that needs attention.</strong>
            <p style={{ ...subheadingStyle, margin: "5px 0 0", fontSize: 12 }}>
              Buddi has highlighted overdue or high-pressure production work.
            </p>
            <div style={proposalListStyle}>
              {productionAttentionJobs.map((job) => {
                const overdue = job.dueDays !== null && job.dueDays < 0;
                const dueToday = job.dueDays === 0;
                const urgency = overdue
                  ? { border: "1px solid rgba(255,107,138,.55)", background: "rgba(220,50,50,.10)", accent: "#FF8C8C", label: "OVERDUE" }
                  : dueToday
                    ? { border: "1px solid rgba(246,196,83,.50)", background: "rgba(245,158,11,.09)", accent: "#F6C453", label: "DUE TODAY" }
                    : { border: "1px solid rgba(246,196,83,.38)", background: "rgba(245,158,11,.055)", accent: "#F6C453", label: "HIGH PRESSURE" };
                return (
                  <div key={job.jobId} style={{ ...proposalItemStyle, border: urgency.border, background: urgency.background }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <strong style={{ fontSize: 13 }}>{job.title}</strong>
                        <span style={{ ...urgencyBadgeStyle, color: urgency.accent, borderColor: urgency.accent }}>{urgency.label}</span>
                      </div>
                      <span style={{ display: "block", marginTop: 4, color: "#B8C6D6", fontSize: 12 }}>
                        {job.remainingTasks} task{job.remainingTasks === 1 ? "" : "s"} remaining{job.stage ? " · " + job.stage : ""}
                      </span>
                    </div>
                    <button type="button" onClick={() => onProduction?.(job.jobId)} style={{ ...actionButtonStyle, borderColor: urgency.accent, whiteSpace: "nowrap" }}>
                      Open production →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {financeAttentionInvoices.length > 0 && (
          <div style={financeAttentionCardStyle}>
            <small style={quickLabelStyle}>FINANCE ATTENTION</small>
            <strong style={{ display: "block", marginTop: 5, fontSize: 16 }}>Payments that need attention.</strong>
            <p style={{ ...subheadingStyle, margin: "5px 0 0", fontSize: 12 }}>
              Buddi has highlighted overdue and upcoming unpaid invoices.
            </p>
            <div style={proposalListStyle}>
              {financeAttentionInvoices.map((invoice) => {
                const today = new Date().toISOString().slice(0, 10);
                const due = new Date(invoice.dueDate + "T00:00:00");
                const current = new Date(today + "T00:00:00");
                const days = Math.ceil((due - current) / 86400000);
                const overdue = invoice.status === "Overdue" || days < 0;
                const dueToday = !overdue && days === 0;
                const urgency = overdue
                  ? { border: "1px solid rgba(255,107,138,.55)", background: "rgba(220,50,50,.10)", accent: "#FF8C8C", label: "OVERDUE" }
                  : dueToday
                    ? { border: "1px solid rgba(246,196,83,.50)", background: "rgba(245,158,11,.09)", accent: "#F6C453", label: "DUE TODAY" }
                    : { border: "1px solid rgba(246,196,83,.38)", background: "rgba(245,158,11,.055)", accent: "#F6C453", label: "DUE SOON" };
                const outstanding = Math.max(0, (Number(invoice.amount) || 0) - (Number(invoice.amountPaid) || 0));
                return (
                  <div key={invoice.id} style={{ ...proposalItemStyle, border: urgency.border, background: urgency.background }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <strong style={{ fontSize: 13 }}>{invoice.clientName || invoice.client || "Invoice"}</strong>
                        <span style={{ ...urgencyBadgeStyle, color: urgency.accent, borderColor: urgency.accent }}>{urgency.label}</span>
                      </div>
                      <span style={{ display: "block", marginTop: 4, color: "#B8C6D6", fontSize: 12 }}>
                        {formatCurrency(outstanding)} outstanding · Due {invoice.dueDate}
                      </span>
                    </div>
                    <button type="button" onClick={onFinance} style={{ ...actionButtonStyle, borderColor: urgency.accent, whiteSpace: "nowrap" }}>
                      Open finance →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {proposedProductionActions.length > 0 && (
          <div style={proposalCardStyle}>
            <div>
              <small style={quickLabelStyle}>PROPOSED ACTIONS</small>
              <strong style={{ display: "block", marginTop: 5, fontSize: 16 }}>Buddi found something it can help move forward.</strong>
              <p style={{ ...subheadingStyle, margin: "5px 0 0", fontSize: 12 }}>
                Nothing changes until you confirm the action.
              </p>
            </div>

            <div style={proposalListStyle}>
              {proposedProductionActions.map((action) => {
                const urgency = action.urgency || "normal";
                const urgencyStyles = urgency === "overdue"
                  ? { border: "1px solid rgba(255,107,138,.55)", background: "rgba(220,50,50,.10)", accent: "#FF8C8C", label: "OVERDUE" }
                  : urgency === "due-today"
                    ? { border: "1px solid rgba(246,196,83,.50)", background: "rgba(245,158,11,.09)", accent: "#F6C453", label: "DUE TODAY" }
                    : urgency === "high"
                      ? { border: "1px solid rgba(255,180,80,.38)", background: "rgba(245,158,11,.055)", accent: "#F6C453", label: "HIGH PRESSURE" }
                      : { border: "1px solid rgba(255,255,255,.10)", background: "rgba(255,255,255,.025)", accent: "#B8C6D6", label: "" };

                return (
                  <div key={action.key} style={{ ...proposalItemStyle, border: urgencyStyles.border, background: urgencyStyles.background }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <strong style={{ display: "block", fontSize: 13 }}>{action.title}</strong>
                        {urgencyStyles.label && (
                          <span style={{ ...urgencyBadgeStyle, color: urgencyStyles.accent, borderColor: urgencyStyles.accent }}>
                            {urgencyStyles.label}
                          </span>
                        )}
                      </div>
                      <span style={{ display: "block", marginTop: 4, color: "#B8C6D6", fontSize: 12, lineHeight: 1.45 }}>{action.detail}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => confirmProductionAction(action)}
                      disabled={Boolean(actionBusy)}
                      style={{ ...actionButtonStyle, borderColor: urgencyStyles.accent, opacity: actionBusy && actionBusy !== action.key ? .5 : 1, whiteSpace: "nowrap" }}
                    >
                      {actionBusy === action.key ? "Doing…" : "Confirm →"}
                    </button>
                  </div>
                );
              })}
            </div>

            {actionMessage && (
              <div role="status" aria-live="polite" style={actionMessageStyle}>{actionMessage}</div>
            )}
          </div>
        )}

        {paymentDraft && (
          <section style={jobDraftCardStyle}>
            <div>
              <small style={quickLabelStyle}>CONFIRM PAYMENT</small>
              <strong style={{ display: "block", marginTop: 5, fontSize: 16 }}>Review before recording.</strong>
              <p style={{ ...subheadingStyle, margin: "5px 0 0", fontSize: 12 }}>Nothing changes until you confirm.</p>
            </div>

            <div style={jobFormGridStyle}>
              <label style={jobFieldStyle}>
                <span>Client</span>
                <select style={jobInputStyle} value={paymentDraft.personId} onChange={(event) => setPaymentDraft((draft) => ({ ...draft, personId: event.target.value, invoiceId: "" }))} disabled={jobSaving}>
                  <option value="">Select client</option>
                  {people.map((person) => <option key={person.id} value={person.id}>{getPersonName(person)}</option>)}
                </select>
                {paymentDraft.requestedPersonName && !paymentDraft.personId && (
                  <span style={unmatchedPersonStyle}>Requested: {paymentDraft.requestedPersonName} — select the matching client before recording.</span>
                )}
              </label>

              <label style={jobFieldStyle}>
                <span>Invoice</span>
                <select style={jobInputStyle} value={paymentDraft.invoiceId || ""} onChange={(event) => setPaymentDraft((draft) => ({ ...draft, invoiceId: event.target.value }))} disabled={jobSaving || !paymentDraft.personId}>
                  <option value="">Select invoice</option>
                  {invoices.filter((invoice) => String(invoice.personId) === String(paymentDraft.personId) && Number(invoice.balance || 0) > 0).map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>
                      {invoice.number} — ${Number(invoice.balance || 0).toFixed(2)} outstanding
                    </option>
                  ))}
                </select>
              </label>

              <label style={jobFieldStyle}>
                <span>Amount (AUD)</span>
                <input style={jobInputStyle} type="number" min="0.01" step="0.01" value={paymentDraft.amount || ""} onChange={(event) => setPaymentDraft((draft) => ({ ...draft, amount: event.target.value }))} disabled={jobSaving} />
              </label>

              <label style={jobFieldStyle}>
                <span>Date</span>
                <input style={jobInputStyle} type="date" value={paymentDraft.date || ""} onChange={(event) => setPaymentDraft((draft) => ({ ...draft, date: event.target.value }))} disabled={jobSaving} />
              </label>

              <label style={jobFieldStyle}>
                <span>Method</span>
                <select style={jobInputStyle} value={paymentDraft.method || "Other"} onChange={(event) => setPaymentDraft((draft) => ({ ...draft, method: event.target.value }))} disabled={jobSaving}>
                  <option value="Other">Other</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Eftpos">Eftpos</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Direct Debit">Direct Debit</option>
                </select>
              </label>

              <label style={{ ...jobFieldStyle, gridColumn: "1 / -1" }}>
                <span>Description</span>
                <input style={jobInputStyle} value={paymentDraft.description || ""} onChange={(event) => setPaymentDraft((draft) => ({ ...draft, description: event.target.value }))} disabled={jobSaving} />
              </label>
            </div>

            {jobMessage && <div role="alert" style={jobMessageStyle}>{jobMessage}</div>}

            <div style={jobFormActionsStyle}>
              <button type="button" onClick={() => { setPaymentDraft(null); setJobMessage(""); }} disabled={jobSaving} style={secondaryJobButtonStyle}>Cancel</button>
              <button
                type="button"
                onClick={confirmRecordPayment}
                disabled={jobSaving || !onRecordPayment || !paymentDraft.invoiceId}
                style={primaryJobButtonStyle}
              >
                {jobSaving ? "Saving…" : "Confirm & record payment →"}
              </button>
            </div>
          </section>
        )}

        {appointmentDraft && (
          <section style={jobDraftCardStyle}>
            <div>
              <small style={quickLabelStyle}>CONFIRM NEW APPOINTMENT</small>
              <strong style={{ display: "block", marginTop: 5, fontSize: 16 }}>Review before saving.</strong>
              <p style={{ ...subheadingStyle, margin: "5px 0 0", fontSize: 12 }}>
                Buddi has filled in what it could understand. Nothing changes until you confirm.
              </p>
            </div>

            <div style={jobFormGridStyle}>
              <label style={jobFieldStyle}>
                <span>Person</span>
                <select style={jobInputStyle} value={appointmentDraft.personId} onChange={(event) => setAppointmentDraft((draft) => ({ ...draft, personId: event.target.value }))} disabled={jobSaving}>
                  <option value="">Select person</option>
                  {people.map((person) => <option key={person.id} value={person.id}>{getPersonName(person)}</option>)}
                </select>
                {appointmentDraft.requestedPersonName && !appointmentDraft.personId && (
                  <div style={newClientBoxStyle}>
                    <span style={unmatchedPersonStyle}>
                      No existing match for “{appointmentDraft.requestedPersonName}”.
                    </span>
                    {!newClientDraft ? (
                      <button type="button" onClick={() => setNewClientDraft({ name: appointmentDraft.requestedPersonName, email: "", phone: "" })} disabled={jobSaving} style={createClientButtonStyle}>
                        + Create new client
                      </button>
                    ) : (
                      <div style={newClientFieldsStyle}>
                        <input style={jobInputStyle} value={newClientDraft.name} onChange={(event) => setNewClientDraft((draft) => ({ ...draft, name: event.target.value }))} placeholder="Client name" disabled={jobSaving} />
                        <input style={jobInputStyle} type="email" value={newClientDraft.email} onChange={(event) => setNewClientDraft((draft) => ({ ...draft, email: event.target.value }))} placeholder="Email (optional)" disabled={jobSaving} />
                        <input style={jobInputStyle} value={newClientDraft.phone} onChange={(event) => setNewClientDraft((draft) => ({ ...draft, phone: event.target.value }))} placeholder="Phone (optional)" disabled={jobSaving} />
                        <button type="button" onClick={() => setNewClientDraft(null)} disabled={jobSaving} style={cancelClientButtonStyle}>Use existing client instead</button>
                      </div>
                    )}
                  </div>
                )}
              </label>

              <label style={jobFieldStyle}>
                <span>Appointment title</span>
                <input style={jobInputStyle} value={appointmentDraft.title} onChange={(event) => setAppointmentDraft((draft) => ({ ...draft, title: event.target.value }))} placeholder="e.g. Fitting" disabled={jobSaving} />
              </label>

              <label style={jobFieldStyle}>
                <span>Date</span>
                <input style={jobInputStyle} type="date" value={appointmentDraft.date || ""} onChange={(event) => setAppointmentDraft((draft) => ({ ...draft, date: event.target.value }))} disabled={jobSaving} />
              </label>

              <label style={jobFieldStyle}>
                <span>Time</span>
                <input style={jobInputStyle} type="time" value={appointmentDraft.time || ""} onChange={(event) => setAppointmentDraft((draft) => ({ ...draft, time: event.target.value }))} disabled={jobSaving} />
              </label>

              <label style={jobFieldStyle}>
                <span>Duration (minutes)</span>
                <input style={jobInputStyle} type="number" min="5" max="1440" step="5" value={appointmentDraft.duration || "60"} onChange={(event) => setAppointmentDraft((draft) => ({ ...draft, duration: event.target.value }))} disabled={jobSaving} />
              </label>

              <label style={jobFieldStyle}>
                <span>Status</span>
                <select style={jobInputStyle} value={appointmentDraft.status || "Booked"} onChange={(event) => setAppointmentDraft((draft) => ({ ...draft, status: event.target.value }))} disabled={jobSaving}>
                  <option value="Booked">Booked</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Pending">Pending</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </label>

              <label style={{ ...jobFieldStyle, gridColumn: "1 / -1" }}>
                <span>Notes</span>
                <textarea style={{ ...jobInputStyle, minHeight: 76, resize: "vertical" }} value={appointmentDraft.notes || ""} onChange={(event) => setAppointmentDraft((draft) => ({ ...draft, notes: event.target.value }))} placeholder="Optional notes" disabled={jobSaving} />
              </label>
            </div>

            {jobMessage && <div role="alert" style={jobMessageStyle}>{jobMessage}</div>}

            <div style={jobFormActionsStyle}>
              <button type="button" onClick={() => { setAppointmentDraft(null); setJobMessage(""); }} disabled={jobSaving} style={secondaryJobButtonStyle}>Cancel</button>
              <button type="button" onClick={confirmCreateAppointment} disabled={jobSaving || !onAddAppointment} style={primaryJobButtonStyle}>
                {jobSaving ? "Saving…" : "Confirm & save appointment →"}
              </button>
            </div>
          </section>
        )}

        {jobDraft && (
          <section style={jobDraftCardStyle}>
            <div>
              <small style={quickLabelStyle}>CONFIRM NEW JOB</small>
              <strong style={{ display: "block", marginTop: 5, fontSize: 16 }}>Review before saving.</strong>
              <p style={{ ...subheadingStyle, margin: "5px 0 0", fontSize: 12 }}>
                Buddi has filled in what it could understand. Nothing changes until you confirm.
              </p>
            </div>

            <div style={jobFormGridStyle}>
              <label style={jobFieldStyle}>
                <span>Person</span>
                <select style={jobInputStyle} value={jobDraft.personId} onChange={(event) => setJobDraft((draft) => ({ ...draft, personId: event.target.value }))} disabled={jobSaving}>
                  <option value="">Select person</option>
                  {people.map((person) => <option key={person.id} value={person.id}>{getPersonName(person)}</option>)}
                </select>
                {jobDraft.requestedPersonName && !jobDraft.personId && (
                  <div style={newClientBoxStyle}>
                    <span style={unmatchedPersonStyle}>
                      No existing match for “{jobDraft.requestedPersonName}”.
                    </span>
                    {!newClientDraft ? (
                      <button type="button" onClick={() => setNewClientDraft({ name: jobDraft.requestedPersonName, email: "", phone: "" })} disabled={jobSaving} style={createClientButtonStyle}>
                        + Create new client
                      </button>
                    ) : (
                      <div style={newClientFieldsStyle}>
                        <input style={jobInputStyle} value={newClientDraft.name} onChange={(event) => setNewClientDraft((draft) => ({ ...draft, name: event.target.value }))} placeholder="Client name" disabled={jobSaving} />
                        <input style={jobInputStyle} type="email" value={newClientDraft.email} onChange={(event) => setNewClientDraft((draft) => ({ ...draft, email: event.target.value }))} placeholder="Email (optional)" disabled={jobSaving} />
                        <input style={jobInputStyle} value={newClientDraft.phone} onChange={(event) => setNewClientDraft((draft) => ({ ...draft, phone: event.target.value }))} placeholder="Phone (optional)" disabled={jobSaving} />
                        <button type="button" onClick={() => setNewClientDraft(null)} disabled={jobSaving} style={cancelClientButtonStyle}>Use existing client instead</button>
                      </div>
                    )}
                  </div>
                )}
              </label>

              <label style={jobFieldStyle}>
                <span>Job title</span>
                <input style={jobInputStyle} value={jobDraft.title} onChange={(event) => setJobDraft((draft) => ({ ...draft, title: event.target.value }))} placeholder="e.g. Wedding dress" disabled={jobSaving} />
              </label>

              <label style={jobFieldStyle}>
                <span>Due date</span>
                <input style={jobInputStyle} type="date" value={jobDraft.dueDate || ""} onChange={(event) => setJobDraft((draft) => ({ ...draft, dueDate: event.target.value }))} disabled={jobSaving} />
              </label>

              <label style={jobFieldStyle}>
                <span>Price (AUD)</span>
                <input style={jobInputStyle} type="number" min="0" step="0.01" value={jobDraft.price || ""} onChange={(event) => setJobDraft((draft) => ({ ...draft, price: event.target.value }))} placeholder="0.00" disabled={jobSaving} />
              </label>

              <label style={jobFieldStyle}>
                <span>Status</span>
                <select style={jobInputStyle} value={jobDraft.status} onChange={(event) => setJobDraft((draft) => ({ ...draft, status: event.target.value }))} disabled={jobSaving}>
                  <option value="New">New</option>
                  <option value="In progress">In progress</option>
                  <option value="Waiting">Waiting</option>
                  <option value="Complete">Complete</option>
                </select>
              </label>
            </div>

            {jobMessage && <div role="alert" style={jobMessageStyle}>{jobMessage}</div>}

            <div style={jobFormActionsStyle}>
              <button type="button" onClick={() => { setJobDraft(null); setJobMessage(""); }} disabled={jobSaving} style={secondaryJobButtonStyle}>Cancel</button>
              <button type="button" onClick={confirmCreateJob} disabled={jobSaving || !onAddJob} style={primaryJobButtonStyle}>
                {jobSaving ? "Saving…" : "Confirm & save job →"}
              </button>
            </div>
          </section>
        )}

        <div style={quickSectionStyle}>
          <small style={quickLabelStyle}>TRY ASKING</small>
          <div style={quickGridStyle}>
            {prompts.map((prompt) => (
              <button key={prompt} type="button" onClick={() => askBuddi(prompt)} disabled={isLoading} style={quickButtonStyle}>
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={(event) => { event.preventDefault(); askBuddi(question); }} style={composerStyle}>
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask Buddi something about your business…"
            disabled={isLoading}
            style={inputStyle}
          />
          <button type="submit" disabled={!question.trim() || isLoading} style={sendButtonStyle} aria-label="Ask Buddi">↑</button>
        </form>

        {isLoading && <ThinkingIndicator />}

        {conversation.length > 0 && (
          <div style={conversationStyle}>
            {conversation.map((entry, index) => (
              <article key={`${entry.question}-${index}`} style={conversationCardStyle}>
                <div style={questionStyle}><span style={youBadgeStyle}>You</span><span>{entry.question}</span></div>
                <div style={answerStyle}>
                  <span style={buddiBadgeStyle}><BizziBuddiLogo size={24} showWordmark={false} /></span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <strong style={{ display: "block", marginBottom: 6 }}>Buddi</strong>
                    <div>{renderAnswer(entry.answer)}</div>
                    {entry.actions?.length > 0 && (
                      <div style={actionRowStyle}>
                        {entry.actions.map((action) => (
                          <button key={action.key} type="button" onClick={action.onClick} style={actionButtonStyle}>
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div style={privacyNoteStyle}>
          <span>🛡</span>
          <span>Buddi uses the current BizziBuddi account data supplied to this session. It does not create or change records from this screen.</span>
        </div>
      </div>
    </section>
  );
}

const jobDraftCardStyle = {
  marginTop: 20,
  padding: 18,
  borderRadius: 14,
  border: "1px solid rgba(0,180,219,.55)",
  background: "linear-gradient(135deg, rgba(0,180,219,.10), rgba(37,99,235,.08))",
};
const jobFormGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
  marginTop: 16,
};
const jobFieldStyle = {
  display: "grid",
  gap: 6,
  color: "#B8C6D6",
  fontSize: 12,
  fontWeight: 700,
};

const unmatchedPersonStyle = {
  color: "#F6C453",
  fontSize: 11,
  lineHeight: 1.4,
  fontWeight: 600,
};

const newClientBoxStyle = {
  display: "grid",
  gap: 8,
  marginTop: 8,
  padding: 9,
  borderRadius: 9,
  border: "1px solid rgba(246,196,83,.28)",
  background: "rgba(245,158,11,.045)",
};

const createClientButtonStyle = {
  justifySelf: "start",
  minHeight: 34,
  padding: "0 10px",
  borderRadius: 8,
  border: "1px solid rgba(0,180,219,.42)",
  background: "rgba(0,180,219,.08)",
  color: "#FFFFFF",
  fontSize: 11,
  fontWeight: 800,
  cursor: "pointer",
};

const newClientFieldsStyle = {
  display: "grid",
  gap: 7,
};

const cancelClientButtonStyle = {
  justifySelf: "start",
  border: 0,
  padding: 0,
  background: "transparent",
  color: "#B8C6D6",
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
};
const jobInputStyle = {
  width: "100%",
  minHeight: 42,
  boxSizing: "border-box",
  padding: "0 11px",
  borderRadius: 9,
  border: "1px solid rgba(255,255,255,.16)",
  background: "rgba(6,26,43,.58)",
  color: "#FFFFFF",
};
const jobMessageStyle = {
  marginTop: 12,
  padding: 10,
  borderRadius: 9,
  border: "1px solid rgba(255,107,138,.42)",
  background: "rgba(220,50,50,.08)",
  color: "#FFB0BF",
  fontSize: 12,
};
const jobFormActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 16,
};
const primaryJobButtonStyle = {
  minHeight: 42,
  padding: "0 14px",
  border: "1px solid rgba(0,180,219,.65)",
  borderRadius: 9,
  background: "rgba(0,180,219,.16)",
  color: "#FFFFFF",
  fontWeight: 800,
  cursor: "pointer",
};
const secondaryJobButtonStyle = {
  minHeight: 42,
  padding: "0 14px",
  border: "1px solid rgba(255,255,255,.16)",
  borderRadius: 9,
  background: "transparent",
  color: "#B8C6D6",
  fontWeight: 700,
  cursor: "pointer",
};

const panelStyle = {
  width: "100%",
  maxWidth: 940,
  margin: "0 auto",
  boxSizing: "border-box",
  background: "rgba(255,255,255,.045)",
  border: "1px solid rgba(0,180,219,.55)",
  borderRadius: 20,
  overflow: "hidden",
  boxShadow: "0 20px 48px rgba(0,0,0,.42)",
};

const panelHeaderStyle = {
  padding: "22px 24px 24px",
  background: "linear-gradient(145deg, rgba(255,255,255,.055) 0%, rgba(0,180,219,.08) 100%)",
  borderBottom: "1px solid rgba(255,255,255,.12)",
};

const backButtonStyle = {
  border: 0,
  padding: 0,
  background: "transparent",
  color: "#00B4DB",
  fontWeight: 700,
  cursor: "pointer",
};

const brandRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  marginTop: 22,
};

const eyebrowStyle = {
  color: "#00B4DB",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: ".14em",
};

const headingStyle = {
  margin: "5px 0 0",
  fontSize: "clamp(30px, 5vw, 44px)",
  lineHeight: 1,
  letterSpacing: "-.04em",
};

const subheadingStyle = {
  margin: "8px 0 0",
  color: "#B8C6D6",
  fontSize: 14,
};

const contentStyle = {
  padding: 22,
};

const welcomeCardStyle = {
  display: "flex",
  gap: 12,
  alignItems: "flex-start",
  padding: 16,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,.12)",
  background: "rgba(255,255,255,.035)",
  color: "#B8C6D6",
  fontSize: 13,
  lineHeight: 1.55,
};

const welcomeIconStyle = {
  width: 36,
  height: 36,
  display: "grid",
  placeItems: "center",
  flex: "0 0 auto",
  borderRadius: 11,
  background: "rgba(0,180,219,.12)",
};

const quickSectionStyle = {
  marginTop: 22,
};

const quickLabelStyle = {
  color: "#B8C6D6",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: ".12em",
};

const quickGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 10,
  marginTop: 10,
};

const quickButtonStyle = {
  border: "1px solid rgba(0,180,219,.28)",
  borderRadius: 12,
  padding: "11px 12px",
  background: "rgba(0,180,219,.06)",
  color: "#FFFFFF",
  textAlign: "left",
  fontSize: 12,
  lineHeight: 1.35,
  cursor: "pointer",
};

const composerStyle = {
  display: "flex",
  gap: 10,
  marginTop: 20,
};

const inputStyle = {
  flex: 1,
  minWidth: 0,
  minHeight: 52,
  boxSizing: "border-box",
  border: "1px solid rgba(255,255,255,.16)",
  borderRadius: 12,
  padding: "0 15px",
  background: "#0F2D4A",
  color: "#FFFFFF",
  font: "inherit",
  outline: "none",
};

const sendButtonStyle = {
  width: 52,
  minWidth: 52,
  border: 0,
  borderRadius: 12,
  background: "#2563EB",
  color: "#FFFFFF",
  fontSize: 22,
  fontWeight: 700,
  cursor: "pointer",
};

const thinkingStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginTop: 16,
  color: "#00B4DB",
  fontSize: 13,
};

const thinkingDotsStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
};

const thinkingDotStyle = {
  width: 7,
  height: 7,
  borderRadius: "50%",
  background: "#00B4DB",
  animation: "buddiAccountThinkingPulse 1.1s infinite ease-in-out",
};

const conversationStyle = {
  display: "grid",
  gap: 12,
  marginTop: 20,
};

const conversationCardStyle = {
  padding: 16,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,.12)",
  background: "rgba(255,255,255,.025)",
};

const questionStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  color: "#FFFFFF",
  fontSize: 13,
  lineHeight: 1.5,
};

const youBadgeStyle = {
  display: "inline-grid",
  placeItems: "center",
  width: 28,
  height: 28,
  flex: "0 0 auto",
  borderRadius: 9,
  background: "rgba(37,99,235,.16)",
  color: "#00B4DB",
  fontSize: 9,
  fontWeight: 800,
  textTransform: "uppercase",
};

const answerStyle = {
  display: "flex",
  gap: 10,
  marginTop: 14,
  paddingTop: 14,
  borderTop: "1px solid rgba(255,255,255,.09)",
  color: "#B8C6D6",
  fontSize: 13,
  lineHeight: 1.6,
};

const buddiBadgeStyle = {
  display: "grid",
  placeItems: "center",
  width: 28,
  height: 28,
  flex: "0 0 auto",
  borderRadius: 9,
  background: "rgba(0,180,219,.10)",
};

const answerLineStyle = {
  minHeight: 20,
};

const bulletLineStyle = {
  display: "flex",
  gap: 8,
  minHeight: 20,
};

const bulletMarkerStyle = {
  color: "#00B4DB",
  fontWeight: 800,
};

const actionRowStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 14,
};

const actionButtonStyle = {
  border: "1px solid rgba(0,180,219,.38)",
  borderRadius: 10,
  padding: "9px 11px",
  background: "rgba(0,180,219,.07)",
  color: "#FFFFFF",
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
};

const financeAttentionCardStyle = {
  marginTop: 20,
  padding: 16,
  borderRadius: 14,
  border: "1px solid rgba(248,113,113,.34)",
  background: "rgba(220,50,50,.045)",
};

const attentionCardStyle = {
  marginTop: 20,
  padding: 16,
  borderRadius: 14,
  border: "1px solid rgba(246,196,83,.34)",
  background: "rgba(245,158,11,.045)",
};

const proposalCardStyle = {
  marginTop: 20,
  padding: 16,
  borderRadius: 14,
  border: "1px solid rgba(37,99,235,.38)",
  background: "rgba(37,99,235,.07)",
};

const proposalListStyle = {
  display: "grid",
  gap: 9,
  marginTop: 12,
};

const urgencyBadgeStyle = {
  padding: "3px 7px",
  border: "1px solid",
  borderRadius: 999,
  background: "rgba(255,255,255,.025)",
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: ".06em",
};

const proposalItemStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 14,
  alignItems: "center",
  padding: 12,
  borderRadius: 11,
  border: "1px solid rgba(255,255,255,.10)",
  background: "rgba(255,255,255,.025)",
};

const actionMessageStyle = {
  marginTop: 10,
  padding: "9px 11px",
  borderRadius: 9,
  background: "rgba(0,180,219,.08)",
  border: "1px solid rgba(0,180,219,.24)",
  color: "#B8C6D6",
  fontSize: 11,
};

const privacyNoteStyle = {
  display: "flex",
  gap: 8,
  alignItems: "flex-start",
  marginTop: 20,
  padding: 13,
  borderRadius: 11,
  border: "1px solid rgba(255,255,255,.10)",
  background: "rgba(255,255,255,.02)",
  color: "#B8C6D6",
  fontSize: 11,
  lineHeight: 1.5,
};

const styleElement = typeof document !== "undefined" ? document.createElement("style") : null;
if (styleElement && !document.getElementById("bizziBuddiAccountThinkingStyles")) {
  styleElement.id = "bizziBuddiAccountThinkingStyles";
  styleElement.textContent = "@keyframes buddiAccountThinkingPulse { 0%, 80%, 100% { opacity: .25; transform: translateY(0) scale(.75); } 40% { opacity: 1; transform: translateY(-5px) scale(1.2); } }";
  document.head.appendChild(styleElement);
}
