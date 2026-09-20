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

function ThinkingIndicator() {
  return (
    <div role="status" aria-live="polite" style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 14px", borderRadius: 12, background: "#FBF3F5", color: "#6B3A49", fontSize: 13, fontWeight: 700 }}>
      <span>Buddi is thinking</span>
      <span className="buddi-thinking-dots" aria-hidden="true"><span /><span /><span /></span>
    </div>
  );
}

export default function BuddiAssistant({ open, onClose, currentPage, clients = [], jobs = [] }) {
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const insights = useMemo(() => {
    const overdueJobs = jobs.filter(isOverdue);
    const activeJobs = jobs.filter((job) => !isClosedJob(job));
    const outstanding = jobs.reduce((total, job) => {
      const value = Number(job?.outstanding ?? job?.balanceDue ?? job?.amountDue ?? 0);
      return total + (Number.isFinite(value) ? value : 0);
    }, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const dueThisWeek = jobs.filter((job) => {
      const date = new Date(getJobDate(job));
      return !Number.isNaN(date.getTime()) && date >= today && date < weekEnd && !isClosedJob(job);
    });

    return { overdueJobs, activeJobs, outstanding, dueThisWeek };
  }, [jobs]);

  const prompts = [
    { id: "week", label: "What’s happening this week?" },
    { id: "attention", label: "What needs attention today?" },
    { id: "garments", label: "Show overdue garments" },
    { id: "money", label: "Who owes money?" },
  ];

  async function answerQuestion(rawQuestion) {
    const trimmedQuestion = String(rawQuestion || "").trim();
    if (!trimmedQuestion || isLoading) return;

    setQuestion("");
    setSelectedPrompt(null);
    setIsLoading(true);

    const context = {
      currentPage,
      clients: clients.map((client) => ({ id: client?.id, name: getClientName(client), email: client?.email || "", phone: client?.phone || "" })),
      jobs: jobs.map((job) => ({
        id: job?.id,
        clientId: job?.clientId || job?.client_id || null,
        clientName: getClientName(clients.find((client) => client?.id === job?.clientId || client?.id === job?.client_id)),
        name: getJobLabel(job),
        status: job?.status || "",
        dueDate: getJobDate(job),
        outstanding: job?.outstanding ?? job?.balanceDue ?? job?.amountDue ?? 0,
      })),
      calculatedInsights: { overdueJobs: insights.overdueJobs.length, dueThisWeek: insights.dueThisWeek.length, activeJobs: insights.activeJobs.length, outstanding: insights.outstanding },
    };

    const thinkingDuration = 2100 + Math.floor(Math.random() * 2501);
    const minimumThinkingTime = new Promise((resolve) => setTimeout(resolve, thinkingDuration));

    try {
      const [response] = await Promise.all([
        fetch("/api/donna/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: trimmedQuestion, context }) }),
        minimumThinkingTime,
      ]);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Buddi could not answer right now.");

      setConversation((items) => [...items, { question: trimmedQuestion, answer: payload.answer || "I couldn't generate an answer." }]);
    } catch (error) {
      await minimumThinkingTime;
      setConversation((items) => [...items, { question: trimmedQuestion, answer: `I couldn't reach the live Buddi service. ${error.message || "Please check that the server is running and configured correctly."}` }]);
    } finally {
      setIsLoading(false);
    }
  }

  if (!open) return null;

  return (
    <aside aria-label="Buddi assistant" style={{ position: "fixed", right: 24, bottom: 94, zIndex: 1199, width: "min(420px, calc(100vw - 32px))", maxHeight: "min(720px, calc(100vh - 130px))", overflowY: "auto", background: "#FFFFFF", border: "1px solid #E8E8E8", borderRadius: 20, boxShadow: "0 22px 70px rgba(47,58,63,.25)", color: "#2F3A3F" }}>
      <style>{`
        @keyframes buddiDotPulse { 0%, 60%, 100% { opacity: .25; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-3px); } }
        #buddi-assistant-title { text-transform: none !important; text-transform: none; font-variant: normal !important; }
        .buddi-thinking-dots { display: inline-flex; gap: 4px; align-items: center; }
        .buddi-thinking-dots span { width: 6px; height: 6px; border-radius: 50%; background: #8B1E3F; animation: buddiDotPulse 1.2s infinite ease-in-out; }
        .buddi-thinking-dots span:nth-child(2) { animation-delay: .15s; }
        .buddi-thinking-dots span:nth-child(3) { animation-delay: .3s; }
        @media (prefers-reduced-motion: reduce) { .buddi-thinking-dots span { animation: none; opacity: .7; } }
      `}</style>

      <header style={{ padding: "20px 20px 18px", borderBottom: "1px solid #ECE8E5", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg, #FFF8FA 0%, #FFFFFF 65%)" }}>
        <div>
          <div id="buddi-assistant-title" style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 900, letterSpacing: ".1em", textTransform: "none", fontVariant: "normal", color: "#8B1E3F" }}>
            <span aria-hidden="true">🦋</span>
            <span>BizziBuddi Assistant</span>
          </div>
          <h2 style={{ margin: "6px 0 0", fontSize: 23 }}>Hi, I’m Buddi</h2>
          <p style={{ margin: "5px 0 0", color: "#6B7478", fontSize: 13 }}>Your intelligent studio companion.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close Buddi assistant" style={{ border: "none", background: "transparent", fontSize: 24, cursor: "pointer", color: "#6B7478" }}>×</button>
      </header>

      <div style={{ padding: 20 }}>
        <div style={{ marginBottom: 16, padding: "12px 13px", borderRadius: 12, background: "#F8F5F2", border: "1px solid #EEE7E2", fontSize: 13, lineHeight: 1.5 }}>
          <strong style={{ color: "#8B1E3F" }}>Ask Buddi anything about your studio.</strong>
          <div style={{ marginTop: 3, color: "#6B7478" }}>You’re viewing <strong>{currentPage}</strong>. Buddi can help you understand your workload, garments, clients and finances.</div>
        </div>

        <form onSubmit={(event) => { event.preventDefault(); answerQuestion(question); }} style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask Buddi something..." aria-label="Ask Buddi a question" disabled={isLoading} style={{ flex: 1, minWidth: 0, padding: "12px 12px", border: "1px solid #DCD5D1", borderRadius: 10, fontSize: 14 }} />
          <button type="submit" disabled={!question.trim() || isLoading} style={{ border: "none", borderRadius: 10, padding: "0 14px", background: isLoading ? "#C8AAB4" : "#8B1E3F", color: "#FFFFFF", fontWeight: 800, cursor: isLoading ? "wait" : "pointer" }}>Ask</button>
        </form>

        <div style={{ display: "grid", gap: 9 }}>
          {prompts.map((prompt) => (
            <button key={prompt.id} type="button" onClick={() => { setSelectedPrompt(prompt.id); answerQuestion(prompt.label); }} disabled={isLoading} style={{ textAlign: "left", padding: "12px 14px", border: "1px solid #E5DFDC", borderRadius: 11, background: selectedPrompt === prompt.id ? "#FBF3F5" : "#FFFFFF", color: "#2F3A3F", cursor: isLoading ? "wait" : "pointer", fontWeight: 700, opacity: isLoading ? .65 : 1 }}>{prompt.label}</button>
          ))}
        </div>

        {isLoading && <div style={{ marginTop: 16 }}><ThinkingIndicator /></div>}

        {conversation.length > 0 && (
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {conversation.slice(-5).reverse().map((entry, index) => (
              <div key={`${entry.question}-${index}`} style={{ padding: 14, borderRadius: 11, background: "#F7F5F2", fontSize: 14, lineHeight: 1.5 }}>
                <div style={{ fontWeight: 800, marginBottom: 6, color: "#8B1E3F" }}>{entry.question}</div>
                <div>{entry.answer}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 18, paddingTop: 12, borderTop: "1px solid #ECE8E5", fontSize: 12, color: "#8A9295" }}>Buddi uses your current workspace information to help answer your questions.</div>
      </div>
    </aside>
  );
}
