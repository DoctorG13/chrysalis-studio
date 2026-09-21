import { useMemo, useState } from "react";

function getJobDate(job) {
  return job?.dueDate || job?.completionDate || job?.date || job?.fittingDate || "";
}

function normalise(value) {
  return String(value || "").trim().toLowerCase();
}

function isClosedJob(job) {
  return ["completed", "ready", "cancelled"].includes(normalise(job?.status));
}

function isOverdue(job) {
  const date = getJobDate(job);
  if (!date || isClosedJob(job)) return false;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);
  return parsed < today;
}

function getClientName(client) {
  return client?.name || [client?.firstName, client?.lastName].filter(Boolean).join(" ") || "Unnamed client";
}

function getJobLabel(job) {
  return job?.name || job?.title || job?.garmentType || job?.description || "Untitled job";
}

function getNavigationAction(question) {
  const text = normalise(question);
  if (text.includes("overdue") || text.includes("garment") || text.includes("production")) {
    return { page: "garments", label: "Overdue", labelText: text.includes("overdue") ? "Open overdue garments" : "Open garment production" };
  }
  if (text.includes("owe") || text.includes("payment") || text.includes("money") || text.includes("deposit") || text.includes("invoice")) {
    return { page: "finance", label: "Overview", labelText: "Open Finance" };
  }
  if (text.includes("appointment") || text.includes("calendar") || text.includes("this week") || text.includes("upcoming")) {
    return { page: "calendar", label: "Calendar", labelText: "Open calendar" };
  }
  if (text.includes("client") || text.includes("people")) {
    return { page: "people", label: "All People", labelText: "Open clients" };
  }
  if (text.includes("job") || text.includes("workload")) {
    return { page: "jobs", label: "All Jobs", labelText: "Open jobs" };
  }
  return null;
}

function ThinkingIndicator() {
  return (
    <div style={thinkingStyle} role="status" aria-live="polite">
      <span style={buddiDot}>🦋</span>
      <span>Buddi is thinking</span>
      <span style={thinkingDots}><i /><i /><i /></span>
    </div>
  );
}

function Field({ label, children }) {
  return <label style={fieldStyle}><span style={fieldLabelStyle}>{label}</span>{children}</label>;
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #DDD7D4",
  borderRadius: 10,
  padding: "11px 12px",
  background: "#FFFEFD",
  color: "#293239",
  font: "inherit",
  fontSize: 13,
  outline: "none",
};

const buttonStyle = {
  border: "1px solid #E2D8D8",
  borderRadius: 999,
  padding: "8px 12px",
  background: "#FFFFFF",
  color: "#5B2638",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};

const primaryButtonStyle = {
  ...buttonStyle,
  borderColor: "#A92C55",
  background: "#A92C55",
  color: "#FFFFFF",
};

export default function BuddiAssistant({ open, onClose, currentPage, clients = [], jobs = [], onNavigate }) {
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [clientDraft, setClientDraft] = useState(null);
  const [clientSaving, setClientSaving] = useState(false);
  const [clientMessage, setClientMessage] = useState("");
  const [appointmentDraft, setAppointmentDraft] = useState(null);
  const [appointmentSaving, setAppointmentSaving] = useState(false);
  const [appointmentMessage, setAppointmentMessage] = useState("");

  const insights = useMemo(() => {
    const overdueJobs = jobs.filter(isOverdue);
    const activeJobs = jobs.filter((job) => !isClosedJob(job));
    const outstanding = jobs.reduce((total, job) => {
      const value = Number(job?.outstanding ?? job?.balanceDue ?? job?.amountDue ?? 0);
      return total + (Number.isFinite(value) ? value : 0);
    }, 0);
    return { overdueJobs, activeJobs, outstanding };
  }, [jobs]);

  const prompts = ["What needs attention today?", "Show overdue garments", "Who owes money?", "What’s happening this week?", "Create an appointment"];

  function openCreateClientForm() {
    setClientDraft({ firstName: "", lastName: "", phone: "", email: "", notes: "" });
    setClientMessage("");
    setAppointmentDraft(null);
  }

  function openCreateAppointmentForm() {
    setAppointmentDraft({ clientId: clients[0]?.id || "", type: "Consultation", date: "", time: "", duration: 60, location: "", notes: "" });
    setAppointmentMessage("");
    setClientDraft(null);
  }

  async function confirmCreateClient() {
    if (!clientDraft?.firstName?.trim() || !clientDraft?.lastName?.trim()) {
      setClientMessage("Please enter the client's first and last name.");
      return;
    }
    setClientSaving(true);
    try {
      const response = await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ client: clientDraft }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "The client could not be saved.");
      const name = `${clientDraft.firstName} ${clientDraft.lastName}`;
      setClientDraft(null);
      setConversation((items) => [...items, { question: "Create a new client", answer: `Created ${name} successfully.`, action: { page: "people", label: "All People", labelText: "Open clients" } }]);
      onNavigate?.("people", "All People");
    } catch (error) {
      setClientMessage(error.message || "The client could not be saved.");
    } finally {
      setClientSaving(false);
    }
  }

  async function confirmCreateAppointment() {
    if (!appointmentDraft?.clientId || !appointmentDraft?.date || !appointmentDraft?.time) {
      setAppointmentMessage("Please select a client and enter a date and time.");
      return;
    }
    setAppointmentSaving(true);
    setAppointmentMessage("");
    try {
      const response = await fetch("/api/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ appointment: appointmentDraft }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.ok === false) throw new Error(payload?.error || "The appointment could not be saved.");
      const name = getClientName(clients.find((client) => String(client.id) === String(appointmentDraft.clientId)));
      setAppointmentDraft(null);
      setConversation((items) => [...items, { question: "Create an appointment", answer: `Created a ${appointmentDraft.type} appointment for ${name} on ${appointmentDraft.date} at ${appointmentDraft.time}.`, action: { page: "calendar", label: "Calendar", labelText: "Open calendar" } }]);
      onNavigate?.("calendar", "Calendar");
    } catch (error) {
      setAppointmentMessage(error.message || "The appointment could not be saved.");
    } finally {
      setAppointmentSaving(false);
    }
  }

  async function answerQuestion(raw) {
    const value = String(raw || "").trim();
    if (!value || isLoading) return;
    setQuestion("");
    if (/(?:create|add|new)\s+(?:an?\s+)?appointment|book\s+(?:an?\s+)?appointment/i.test(value)) {
      openCreateAppointmentForm();
      return;
    }
    if (/(?:create|add|new)\s+(?:a\s+)?new\s+client|add\s+client/i.test(value)) {
      openCreateClientForm();
      return;
    }
    setIsLoading(true);
    const context = {
      currentPage,
      clients: clients.map((client) => ({ id: client?.id, name: getClientName(client), email: client?.email || "", phone: client?.phone || "" })),
      jobs: jobs.map((job) => ({ id: job?.id, clientId: job?.clientId || job?.client_id || null, clientName: getClientName(clients.find((client) => client?.id === job?.clientId || client?.id === job?.client_id)), name: getJobLabel(job), status: job?.status || "", dueDate: getJobDate(job), outstanding: job?.outstanding ?? job?.balanceDue ?? job?.amountDue ?? 0 })),
      calculatedInsights: { overdueJobs: insights.overdueJobs.length, activeJobs: insights.activeJobs.length, outstanding: insights.outstanding },
    };
    const wait = new Promise((resolve) => setTimeout(resolve, 900 + Math.floor(Math.random() * 900)));
    try {
      const [response] = await Promise.all([fetch("/api/donna/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: value, context }) }), wait]);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Buddi could not answer right now.");
      setConversation((items) => [...items, { question: value, answer: payload.answer || "I couldn't generate an answer.", action: getNavigationAction(value) }]);
    } catch (error) {
      await wait;
      setConversation((items) => [...items, { question: value, answer: `I couldn't reach the live Buddi service. ${error.message || "Please check that the server is running and configured correctly."}`, action: null }]);
    } finally {
      setIsLoading(false);
    }
  }

  if (!open) return null;

  return (
    <aside aria-label="Buddi assistant" style={panelStyle}>
      <header style={headerStyle}>
        <div style={brandRowStyle}>
          <div style={brandMarkStyle}>🦋</div>
          <div>
            <div style={brandEyebrowStyle}>BIZZIBUDDI</div>
            <div style={brandTitleStyle}>Studio companion</div>
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close Buddi assistant" title="Close chat" style={closeButtonStyle}>×</button>
        <div style={heroStyle}>
          <div style={heroGreetingStyle}>Hi, I’m Buddi<span style={{ color: "#A92C55" }}>.</span></div>
          <p style={heroSubStyle}>A little help for your studio, whenever you need it.</p>
        </div>
      </header>

      <div style={contentStyle}>
        <div style={welcomeCardStyle}>
          <div style={welcomeIconStyle}>✦</div>
          <div><strong style={{ display: "block", marginBottom: 3 }}>What can I help with?</strong><span>Ask about your workload, clients, garments, payments or calendar.</span></div>
        </div>

        {clientDraft && (
          <section style={actionCardStyle}>
            <div style={cardHeadingStyle}><span style={cardIconStyle}>＋</span><div><div style={cardKickerStyle}>New record</div><h3 style={cardTitleStyle}>Create a client</h3></div></div>
            <div style={formGridStyle}>
              <Field label="First name"><input style={inputStyle} value={clientDraft.firstName} onChange={(event) => setClientDraft((draft) => ({ ...draft, firstName: event.target.value }))} placeholder="First name" disabled={clientSaving} /></Field>
              <Field label="Last name"><input style={inputStyle} value={clientDraft.lastName} onChange={(event) => setClientDraft((draft) => ({ ...draft, lastName: event.target.value }))} placeholder="Last name" disabled={clientSaving} /></Field>
              <Field label="Phone"><input style={inputStyle} value={clientDraft.phone} onChange={(event) => setClientDraft((draft) => ({ ...draft, phone: event.target.value }))} placeholder="Phone" disabled={clientSaving} /></Field>
              <Field label="Email"><input style={inputStyle} value={clientDraft.email} onChange={(event) => setClientDraft((draft) => ({ ...draft, email: event.target.value }))} placeholder="Email" disabled={clientSaving} /></Field>
            </div>
            <Field label="Notes"><textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={clientDraft.notes} onChange={(event) => setClientDraft((draft) => ({ ...draft, notes: event.target.value }))} placeholder="Optional notes" disabled={clientSaving} /></Field>
            {clientMessage && <div style={errorStyle}>{clientMessage}</div>}
            <div style={formActionsStyle}><button type="button" style={buttonStyle} onClick={() => setClientDraft(null)}>Cancel</button><button type="button" style={primaryButtonStyle} onClick={confirmCreateClient} disabled={clientSaving}>{clientSaving ? "Saving…" : "Save client"}</button></div>
          </section>
        )}

        {appointmentDraft && (
          <section style={actionCardStyle}>
            <div style={cardHeadingStyle}><span style={cardIconStyle}>◷</span><div><div style={cardKickerStyle}>New record</div><h3 style={cardTitleStyle}>Create an appointment</h3></div></div>
            <p style={cardIntroStyle}>Review the details before adding it to your calendar.</p>
            <div style={formGridStyle}>
              <Field label="Client"><select style={inputStyle} value={appointmentDraft.clientId} onChange={(event) => setAppointmentDraft((draft) => ({ ...draft, clientId: event.target.value }))} disabled={appointmentSaving}><option value="">Select client</option>{clients.map((client) => <option key={client.id} value={client.id}>{getClientName(client)}</option>)}</select></Field>
              <Field label="Appointment type"><select style={inputStyle} value={appointmentDraft.type} onChange={(event) => setAppointmentDraft((draft) => ({ ...draft, type: event.target.value }))} disabled={appointmentSaving}>{["Consultation", "Initial Consultation", "First Fitting", "Second Fitting", "Final Fitting", "Collection", "Other"].map((type) => <option key={type}>{type}</option>)}</select></Field>
              <Field label="Date"><input style={inputStyle} type="date" value={appointmentDraft.date} onChange={(event) => setAppointmentDraft((draft) => ({ ...draft, date: event.target.value }))} disabled={appointmentSaving} /></Field>
              <Field label="Time"><input style={inputStyle} type="time" value={appointmentDraft.time} onChange={(event) => setAppointmentDraft((draft) => ({ ...draft, time: event.target.value }))} disabled={appointmentSaving} /></Field>
              <Field label="Duration (minutes)"><input style={inputStyle} type="number" min="5" step="5" value={appointmentDraft.duration} onChange={(event) => setAppointmentDraft((draft) => ({ ...draft, duration: Number(event.target.value) }))} disabled={appointmentSaving} /></Field>
              <Field label="Location"><input style={inputStyle} value={appointmentDraft.location} onChange={(event) => setAppointmentDraft((draft) => ({ ...draft, location: event.target.value }))} placeholder="Optional" disabled={appointmentSaving} /></Field>
            </div>
            <Field label="Notes"><textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={appointmentDraft.notes} onChange={(event) => setAppointmentDraft((draft) => ({ ...draft, notes: event.target.value }))} placeholder="Optional notes" disabled={appointmentSaving} /></Field>
            {appointmentMessage && <div style={errorStyle}>{appointmentMessage}</div>}
            <div style={formActionsStyle}><button type="button" style={buttonStyle} onClick={() => setAppointmentDraft(null)}>Cancel</button><button type="button" style={primaryButtonStyle} onClick={confirmCreateAppointment} disabled={appointmentSaving}>{appointmentSaving ? "Saving…" : "Save appointment"}</button></div>
          </section>
        )}

        <form onSubmit={(event) => { event.preventDefault(); answerQuestion(question); }} style={composerStyle}>
          <input style={composerInputStyle} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask Buddi something…" disabled={isLoading} />
          <button type="submit" style={composerButtonStyle} disabled={!question.trim() || isLoading} aria-label="Send question">↑</button>
        </form>

        <div style={quickActionsStyle}>
          <span style={quickLabelStyle}>Quick questions</span>
          <div style={quickPillsStyle}>{prompts.map((prompt) => <button key={prompt} type="button" style={quickPillStyle} onClick={() => answerQuestion(prompt)} disabled={isLoading}>{prompt}</button>)}</div>
        </div>

        {isLoading && <ThinkingIndicator />}

        {conversation.length > 0 && (
          <div style={conversationStyle}>
            {conversation.slice(-6).map((entry, index) => (
              <article key={`${entry.question}-${index}`} style={messageGroupStyle}>
                <div style={userMessageStyle}><span style={messageAvatarStyle}>You</span><span>{entry.question}</span></div>
                <div style={buddiMessageStyle}><span style={messageAvatarStyle}>🦋</span><div style={{ flex: 1 }}><div style={messageLabelStyle}>Buddi</div><div style={messageTextStyle}>{entry.answer}</div>{entry.action && onNavigate && <button type="button" style={inlineActionStyle} onClick={() => onNavigate(entry.action.page, entry.action.label)}>{entry.action.labelText} <span>→</span></button>}</div></div>
              </article>
            ))}
          </div>
        )}

        <div style={footerNoteStyle}><span>🛡</span> Buddi uses the current studio workspace to help you.</div>
      </div>
    </aside>
  );
}

const panelStyle = { position: "fixed", right: 24, bottom: 94, zIndex: 1199, width: "min(460px, calc(100vw - 32px))", maxHeight: "min(760px, calc(100vh - 118px))", overflow: "hidden", display: "flex", flexDirection: "column", background: "#FFFCFA", border: "1px solid #E7DEDA", borderRadius: 24, boxShadow: "0 24px 80px rgba(43, 35, 39, .25)", color: "#293239" };
const headerStyle = { position: "relative", padding: "22px 24px 20px", background: "linear-gradient(145deg, #FFFDFC 0%, #F7EFEC 100%)", borderBottom: "1px solid #E9DFDB" };
const brandRowStyle = { display: "flex", alignItems: "center", gap: 10 };
const brandMarkStyle = { width: 38, height: 38, display: "grid", placeItems: "center", borderRadius: 13, background: "#A92C55", color: "#FFFFFF", fontSize: 19, boxShadow: "0 5px 14px rgba(169,44,85,.22)" };
const brandEyebrowStyle = { color: "#A92C55", fontSize: 11, fontWeight: 900, letterSpacing: ".16em" };
const brandTitleStyle = { marginTop: 2, color: "#75686A", fontSize: 11, fontWeight: 600 };
const closeButtonStyle = { position: "absolute", top: 20, right: 20, width: 34, height: 34, border: "1px solid #DCD0CE", borderRadius: 10, background: "#FFFFFF", color: "#6A5C60", fontSize: 21, lineHeight: 1, cursor: "pointer" };
const heroStyle = { marginTop: 25, paddingRight: 24 };
const heroGreetingStyle = { fontSize: 30, lineHeight: 1.12, fontWeight: 800, letterSpacing: "-.04em", color: "#293239" };
const heroSubStyle = { margin: "9px 0 0", color: "#76696B", fontSize: 13, lineHeight: 1.5 };
const contentStyle = { padding: 20, overflowY: "auto" };
const welcomeCardStyle = { display: "flex", gap: 12, alignItems: "flex-start", padding: 15, marginBottom: 16, border: "1px solid #E8DEDA", borderRadius: 15, background: "#FFFFFF", color: "#75686A", fontSize: 12, lineHeight: 1.5 };
const welcomeIconStyle = { width: 30, height: 30, flex: "0 0 auto", display: "grid", placeItems: "center", borderRadius: 10, background: "#F6E7EC", color: "#A92C55", fontSize: 18 };
const actionCardStyle = { marginBottom: 16, padding: 16, border: "1px solid #E4D7DB", borderRadius: 16, background: "#FFFFFF", boxShadow: "0 5px 18px rgba(65,45,52,.05)" };
const cardHeadingStyle = { display: "flex", gap: 10, alignItems: "center", marginBottom: 14 };
const cardIconStyle = { width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: 11, background: "#F6E7EC", color: "#A92C55", fontSize: 20 };
const cardKickerStyle = { color: "#A92C55", fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".12em" };
const cardTitleStyle = { margin: "3px 0 0", fontSize: 17, lineHeight: 1.2, color: "#293239" };
const cardIntroStyle = { margin: "-4px 0 14px", color: "#75686A", fontSize: 12, lineHeight: 1.5 };
const formGridStyle = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 11, marginBottom: 11 };
const fieldStyle = { display: "flex", flexDirection: "column", gap: 5, minWidth: 0 };
const fieldLabelStyle = { color: "#75686A", fontSize: 11, fontWeight: 800 };
const formActionsStyle = { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 };
const errorStyle = { marginTop: 10, padding: "9px 11px", borderRadius: 9, background: "#FFF1F2", border: "1px solid #F0C9D0", color: "#A12745", fontSize: 12, lineHeight: 1.4 };
const composerStyle = { display: "flex", alignItems: "center", gap: 8, padding: 6, marginBottom: 15, border: "1px solid #DCD0CE", borderRadius: 14, background: "#FFFFFF", boxShadow: "0 4px 15px rgba(43,35,39,.04)" };
const composerInputStyle = { flex: 1, minWidth: 0, border: 0, outline: 0, padding: "10px 10px", background: "transparent", color: "#293239", font: "inherit", fontSize: 13 };
const composerButtonStyle = { width: 36, height: 36, border: 0, borderRadius: 10, background: "#A92C55", color: "#FFFFFF", fontSize: 20, cursor: "pointer" };
const quickActionsStyle = { marginBottom: 18 };
const quickLabelStyle = { display: "block", marginBottom: 9, color: "#8A7B7E", fontSize: 10, fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase" };
const quickPillsStyle = { display: "flex", flexWrap: "wrap", gap: 7 };
const quickPillStyle = { ...buttonStyle, padding: "8px 11px", fontSize: 11, textAlign: "left" };
const thinkingStyle = { display: "flex", alignItems: "center", gap: 8, padding: "11px 13px", marginBottom: 14, borderRadius: 12, background: "#F6E7EC", color: "#8C3B55", fontSize: 12, fontWeight: 700 };
const buddiDot = { fontSize: 16 };
const thinkingDots = { display: "inline-flex", gap: 3, marginLeft: 2 };
const conversationStyle = { display: "flex", flexDirection: "column", gap: 15 };
const messageGroupStyle = { display: "flex", flexDirection: "column", gap: 8 };
const userMessageStyle = { display: "flex", alignItems: "flex-start", gap: 8, justifyContent: "flex-end", color: "#67595D", fontSize: 12, lineHeight: 1.5 };
const buddiMessageStyle = { display: "flex", alignItems: "flex-start", gap: 9, padding: 13, border: "1px solid #E7DEDA", borderRadius: "5px 15px 15px 15px", background: "#FFFFFF", color: "#3E474C", fontSize: 13, lineHeight: 1.55 };
const messageAvatarStyle = { display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto", minWidth: 28, height: 28, padding: "0 7px", borderRadius: 9, background: "#F6E7EC", color: "#A92C55", fontSize: 10, fontWeight: 900 };
const messageLabelStyle = { marginBottom: 4, color: "#A92C55", fontSize: 10, fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase" };
const messageTextStyle = { whiteSpace: "pre-wrap" };
const inlineActionStyle = { ...primaryButtonStyle, marginTop: 11, padding: "7px 11px", fontSize: 11 };
const footerNoteStyle = { display: "flex", gap: 7, alignItems: "center", marginTop: 18, paddingTop: 14, borderTop: "1px solid #E9DFDB", color: "#9A8D90", fontSize: 10, lineHeight: 1.4 };
