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

export default function BizziBuddiAccountBuddi({ account, people, jobs, appointments, invoices, automationEvents, productionRecords, initialPrompt = "", onFinance, onCalendar, onJobs, onProduction, onSaveProduction, onBack }) {
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState("");
  const [actionMessage, setActionMessage] = useState("");

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

  async function askBuddi(rawQuestion) {
    const value = String(rawQuestion || "").trim();
    if (!value || isLoading) return;

    setQuestion("");
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
