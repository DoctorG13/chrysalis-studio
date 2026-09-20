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
  if (text.includes("overdue") || text.includes("garment") || text.includes("production")) return { page: "garments", label: text.includes("overdue") ? "Overdue" : "All Garments", labelText: text.includes("overdue") ? "Open overdue garments" : "Open garment production" };
  if (text.includes("owe") || text.includes("payment") || text.includes("money") || text.includes("deposit") || text.includes("invoice")) return { page: "finance", label: "Overview", labelText: "Open Finance" };
  if (text.includes("appointment") || text.includes("calendar") || text.includes("this week") || text.includes("upcoming")) return { page: "calendar", label: "Calendar", labelText: "Open calendar" };
  if (text.includes("client") || text.includes("people")) return { page: "people", label: "All People", labelText: "Open clients" };
  if (text.includes("job") || text.includes("workload")) return { page: "jobs", label: "All Jobs", labelText: "Open jobs" };
  return null;
}

function ThinkingIndicator() {
  return <div role="status" aria-live="polite" style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 14px", borderRadius: 12, background: "#FBF3F5", color: "#6B3A49", fontSize: 13, fontWeight: 700 }}><span>Buddi is thinking</span><span className="buddi-thinking-dots" aria-hidden="true"><span /><span /><span /></span></div>;
}

export default function BuddiAssistant({ open, onClose, currentPage, clients = [], jobs = [], onNavigate }) {
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [clientDraft, setClientDraft] = useState(null);
  const [clientSaving, setClientSaving] = useState(false);
  const [clientMessage, setClientMessage] = useState("");

  const insights = useMemo(() => {
    const overdueJobs = jobs.filter(isOverdue);
    const activeJobs = jobs.filter((job) => !isClosedJob(job));
    const outstanding = jobs.reduce((total, job) => { const value = Number(job?.outstanding ?? job?.balanceDue ?? job?.amountDue ?? 0); return total + (Number.isFinite(value) ? value : 0); }, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7);
    const dueThisWeek = jobs.filter((job) => { const date = new Date(getJobDate(job)); return !Number.isNaN(date.getTime()) && date >= today && date < weekEnd && !isClosedJob(job); });
    return { overdueJobs, activeJobs, outstanding, dueThisWeek };
  }, [jobs]);

  const prompts = [
    { id: "attention", label: "What needs attention today?" },
    { id: "garments", label: "Show overdue garments" },
    { id: "money", label: "Who owes money?" },
    { id: "week", label: "What’s happening this week?" },
  ];

  function openCreateClientForm() {
    setClientDraft({ firstName: "", lastName: "", phone: "", email: "", notes: "" });
    setClientMessage("");
  }

  async function confirmCreateClient() {
    if (!clientDraft?.firstName?.trim() || !clientDraft?.lastName?.trim()) { setClientMessage("Please enter the client's first and last name."); return; }
    setClientSaving(true); setClientMessage("");
    try {
      const response = await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ client: { ...clientDraft, firstName: clientDraft.firstName.trim(), lastName: clientDraft.lastName.trim(), phone: clientDraft.phone.trim(), email: clientDraft.email.trim(), notes: clientDraft.notes.trim() } }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "The client could not be saved.");
      const fullName = `${clientDraft.firstName.trim()} ${clientDraft.lastName.trim()}`;
      setClientDraft(null);
      setClientMessage("Client created successfully.");
      setConversation((items) => [...items, { question: "Create a new client", answer: `Created ${fullName} successfully.`, action: { page: "people", label: "All People", labelText: "Open clients" } }]);
      if (onNavigate) onNavigate("people", "All People");
      window.setTimeout(() => window.location.reload(), 500);
    } catch (error) { setClientMessage(error.message || "The client could not be saved."); }
    finally { setClientSaving(false); }
  }

  async function answerQuestion(rawQuestion) {
    const trimmedQuestion = String(rawQuestion || "").trim();
    if (!trimmedQuestion || isLoading) return;
    if (/(?:create|add|new)\s+(?:a\s+)?new\s+client|add\s+client/i.test(trimmedQuestion)) { setQuestion(""); setSelectedPrompt(null); openCreateClientForm(); return; }
    setQuestion(""); setSelectedPrompt(null); setIsLoading(true);
    const context = { currentPage, clients: clients.map((client) => ({ id: client?.id, name: getClientName(client), email: client?.email || "", phone: client?.phone || "" })), jobs: jobs.map((job) => ({ id: job?.id, clientId: job?.clientId || job?.client_id || null, clientName: getClientName(clients.find((client) => client?.id === job?.clientId || client?.id === job?.client_id)), name: getJobLabel(job), status: job?.status || "", dueDate: getJobDate(job), outstanding: job?.outstanding ?? job?.balanceDue ?? job?.amountDue ?? 0 })), calculatedInsights: { overdueJobs: insights.overdueJobs.length, dueThisWeek: insights.dueThisWeek.length, activeJobs: insights.activeJobs.length, outstanding: insights.outstanding } };
    const minimumThinkingTime = new Promise((resolve) => setTimeout(resolve, 2200));
    try {
      const [response] = await Promise.all([fetch("/api/donna/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: trimmedQuestion, context }) }), minimumThinkingTime]);
      const payload = await response.json(); if (!response.ok) throw new Error(payload?.error || "Buddi could not answer right now.");
      setConversation((items) => [...items, { question: trimmedQuestion, answer: payload.answer || "I couldn't generate an answer.", action: getNavigationAction(trimmedQuestion) }]);
    } catch (error) { await minimumThinkingTime; setConversation((items) => [...items, { question: trimmedQuestion, answer: `I couldn't reach the live Buddi service. ${error.message || "Please check that the server is running and configured correctly."}`, action: null }]); }
    finally { setIsLoading(false); }
  }

  if (!open) return null;
  return (
    <aside aria-label="Buddi assistant" style={{ position: "fixed", right: 24, bottom: 94, zIndex: 1199, width: "min(420px, calc(100vw - 32px))", maxHeight: "min(720px, calc(100vh - 130px))", overflowY: "auto", background: "#FFFFFF", border: "1px solid #E8E8E8", borderRadius: 20, boxShadow: "0 22px 70px rgba(47,58,63,.25)", color: "#2F3A3F" }}>
      <style>{`@keyframes buddiDotPulse { 0%, 60%, 100% { opacity: .25; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-3px); } } .buddi-thinking-dots { display: inline-flex; gap: 4px; align-items: center; } .buddi-thinking-dots span { width: 6px; height: 6px; border-radius: 50%; background: #8B1E3F; animation: buddiDotPulse 1.2s infinite ease-in-out; } .buddi-thinking-dots span:nth-child(2) { animation-delay: .15s; } .buddi-thinking-dots span:nth-child(3) { animation-delay: .3s; } @media (prefers-reduced-motion: reduce) { .buddi-thinking-dots span { animation: none; opacity: .7; } }`}</style>
      <header style={{ padding: "20px 20px 18px", borderBottom: "1px solid #ECE8E5", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg, #FFF8FA 0%, #FFFFFF 65%)" }}><div><div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 900, letterSpacing: ".1em", textTransform: "none", fontVariant: "normal", fontVariantCaps: "normal", color: "#8B1E3F" }}><span aria-hidden="true">🦋</span>BizziBuddi Assistant</div><h2 style={{ margin: "6px 0 0", fontSize: 23 }}>Hi, I’m Buddi</h2><p style={{ margin: "5px 0 0", color: "#6B7478", fontSize: 13 }}>Your intelligent studio companion.</p></div><button type="button" onClick={onClose} aria-label="Close Buddi assistant" title="Close chat" style={{ border: "none", background: "transparent", fontSize: 24, cursor: "pointer", color: "#6B7478" }}>×</button></header>
      <div style={{ padding: 20 }}>
        <div style={{ marginBottom: 16, padding: "12px 13px", borderRadius: 12, background: "#F8F5F2", border: "1px solid #EEE7E2", fontSize: 13, lineHeight: 1.5 }}><strong style={{ color: "#8B1E3F" }}>Ask Buddi anything about your studio.</strong><div style={{ marginTop: 3, color: "#6B7478" }}>You’re viewing <strong>{currentPage}</strong>. Buddi can help you understand your workload, garments, clients and finances.</div></div>
        {clientDraft && <div style={{ marginBottom: 16, padding: 16, border: "1px solid #E5DFDC", borderRadius: 12, background: "#FFFDFC" }}><h3 style={{ margin: "0 0 6px", fontSize: 17 }}>Create new client</h3><p style={{ margin: "0 0 14px", color: "#6B7478", fontSize: 13 }}>Enter the details, then confirm before saving.</p><div style={{ display: "grid", gap: 9 }}>{[["firstName", "First name"], ["lastName", "Last name"], ["phone", "Phone"], ["email", "Email"]].map(([key, label]) => <input key={key} value={clientDraft[key]} onChange={(event) => setClientDraft((draft) => ({ ...draft, [key]: event.target.value }))} placeholder={label} aria-label={label} disabled={clientSaving} style={{ padding: "11px 12px", border: "1px solid #DCD5D1", borderRadius: 9, fontSize: 14 }} />)}<textarea value={clientDraft.notes} onChange={(event) => setClientDraft((draft) => ({ ...draft, notes: event.target.value }))} placeholder="Notes (optional)" rows={3} disabled={clientSaving} style={{ padding: "11px 12px", border: "1px solid #DCD5D1", borderRadius: 9, fontSize: 14, resize: "vertical" }} /></div>{clientMessage && <div style={{ marginTop: 10, color: "#8B1E3F", fontSize: 13 }}>{clientMessage}</div>}<div style={{ display: "flex", gap: 9, marginTop: 13 }}><button type="button" onClick={confirmCreateClient} disabled={clientSaving} style={{ border: "none", borderRadius: 9, padding: "10px 13px", background: "#8B1E3F", color: "#FFFFFF", fontWeight: 800, cursor: "pointer" }}>{clientSaving ? "Saving…" : "Confirm & save"}</button><button type="button" onClick={() => { setClientDraft(null); setClientMessage(""); }} disabled={clientSaving} style={{ border: "1px solid #DCD5D1", borderRadius: 9, padding: "10px 13px", background: "#FFFFFF", color: "#6B3A49", fontWeight: 800, cursor: "pointer" }}>Cancel</button></div></div>}
        <form onSubmit={(event) => { event.preventDefault(); answerQuestion(question); }} style={{ display: "flex", gap: 8, marginBottom: 14 }}><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask Buddi something..." aria-label="Ask Buddi a question" disabled={isLoading} style={{ flex: 1, minWidth: 0, padding: "12px 12px", border: "1px solid #DCD5D1", borderRadius: 10, fontSize: 14 }} /><button type="submit" disabled={!question.trim() || isLoading} style={{ border: "none", borderRadius: 10, padding: "0 14px", background: isLoading ? "#C8AAB4" : "#8B1E3F", color: "#FFFFFF", fontWeight: 800, cursor: isLoading ? "wait" : "pointer" }}>Ask</button></form>
        <div style={{ display: "grid", gap: 9 }}>{prompts.map((prompt) => <button key={prompt.id} type="button" onClick={() => { setSelectedPrompt(prompt.id); answerQuestion(prompt.label); }} disabled={isLoading} style={{ textAlign: "left", padding: "12px 14px", border: "1px solid #E5DFDC", borderRadius: 11, background: selectedPrompt === prompt.id ? "#FBF3F5" : "#FFFFFF", color: "#2F3A3F", cursor: isLoading ? "wait" : "pointer", fontWeight: 700, opacity: isLoading ? .65 : 1 }}>{prompt.label}</button>)}</div>
        {isLoading && <div style={{ marginTop: 16 }}><ThinkingIndicator /></div>}
        {conversation.length > 0 && <div style={{ display: "grid", gap: 12, marginTop: 16 }}>{conversation.slice(-5).reverse().map((entry, index) => <div key={`${entry.question}-${index}`} style={{ padding: 14, borderRadius: 11, background: "#F7F5F2", fontSize: 14, lineHeight: 1.5 }}><div style={{ fontWeight: 800, marginBottom: 6, color: "#8B1E3F" }}>{entry.question}</div><div>{entry.answer}</div>{entry.action && onNavigate && <button type="button" onClick={() => onNavigate(entry.action.page, entry.action.label)} style={{ marginTop: 12, border: "none", borderRadius: 9, padding: "10px 12px", background: "#8B1E3F", color: "#FFFFFF", fontWeight: 800, cursor: "pointer" }}>{entry.action.labelText} →</button>}</div>)}</div>}
        <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid #ECE8E5" }}><div style={{ fontSize: 12, color: "#8A9295", marginBottom: 12 }}>Buddi uses your current workspace information to help answer your questions.</div><button type="button" onClick={onClose} style={{ width: "100%", minHeight: 42, border: "1px solid #DCD5D1", borderRadius: 10, background: "#FFFFFF", color: "#6B3A49", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Close chat</button></div>
      </div>
    </aside>
  );
}
