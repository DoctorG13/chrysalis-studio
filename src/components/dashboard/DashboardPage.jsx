import { useMemo } from "react";

import WelcomeCard from "./WelcomeCard";
import JobsDueThisWeek from "./JobsDueThisWeek";
import RecentActivity from "./RecentActivity";
import QuickJobFinder from "./QuickJobFinder";

export default function DashboardPage({
  clients = [],
  jobs = [],
  ownerName = "Donna",
  onSelectJob,
  onOpenCalendar,
  onNewClient,
  onNewAppointment,
  onNewJob,
  onRecordPayment,
}) {
  const allJobs = useMemo(() => {
    if (jobs.length > 0) return jobs;
    return clients.flatMap((client) => client.jobs ?? []);
  }, [clients, jobs]);

  const activeJobs = allJobs.filter(
    (job) => !["Completed", "Cancelled", "Archived"].includes(String(job.status || "").trim())
  );

  const outstanding = allJobs.reduce((sum, job) => sum + getOutstanding(job), 0);
  const todayKey = new Date().toDateString();

  const appointmentCount = clients.reduce(
    (count, client) => count + (client.appointments || []).filter((item) => new Date(item.date).toDateString() === todayKey).length,
    0
  );

  const fittingCount = clients.reduce(
    (count, client) => count + (client.fittings || []).filter((item) => new Date(item.date).toDateString() === todayKey).length,
    0
  );

  const attentionJobs = allJobs.filter((job) => job.overdue || job.dueToday || job.needsAttention);

  const todayFocus = useMemo(() => {
    const items = [];

    const todaysAppointment = clients
      .flatMap((client) => (client.appointments || []).map((appointment) => ({ appointment, client })))
      .filter(({ appointment }) => new Date(appointment.date).toDateString() === todayKey)
      .sort((a, b) => timeToMinutes(a.appointment.time) - timeToMinutes(b.appointment.time))[0];

    if (todaysAppointment) {
      items.push({
        icon: "📅",
        title: `${formatTime(todaysAppointment.appointment.time)} Fitting`,
        subtitle: getClientName(todaysAppointment.client),
        tag: "Today",
        tone: "today",
        onClick: findRelatedJob(todaysAppointment.appointment, allJobs, todaysAppointment.client),
      });
    }

    const priorityJob = activeJobs.find((job) => !getOutstanding(job)) || activeJobs[0];
    if (priorityJob && items.length < 2) {
      items.push({
        icon: "✂️",
        title: priorityJob.name || priorityJob.title || priorityJob.reference || "Active Job",
        subtitle: `Ready for ${priorityJob.status || "work"}`,
        tag: "Open Job",
        tone: "job",
        onClick: priorityJob,
      });
    }

    const owingJob = allJobs.find((job) => getOutstanding(job) > 0);
    if (owingJob && items.length < 3) {
      const client = clients.find((candidate) => String(candidate.id) === String(owingJob.clientId));
      items.push({
        icon: "💰",
        title: "Outstanding Payment",
        subtitle: `${formatCurrency(getOutstanding(owingJob))} owing${client ? ` – ${getClientName(client)}` : ""}`,
        tag: "Collect",
        tone: "payment",
        onClick: owingJob,
      });
    }

    if (items.length < 3) {
      const fitting = clients
        .flatMap((client) => (client.fittings || []).map((item) => ({ item, client })))
        .find(({ item }) => new Date(item.date).toDateString() === todayKey);
      if (fitting) {
        items.push({
          icon: "👗",
          title: fitting.item.title || "Fitting",
          subtitle: getClientName(fitting.client),
          tag: "Today",
          tone: "today",
        });
      }
    }

    return items.slice(0, 3);
  }, [clients, allJobs, activeJobs, todayKey]);

  return (
    <main style={dashboardStyle}>
      <WelcomeCard ownerName={ownerName} />

      <section style={metricsStyle} aria-label="Dashboard summary">
        <Metric icon="📅" label="Appointments" value={appointmentCount} onClick={onOpenCalendar} />
        <Metric icon="✂️" label="Fittings" value={fittingCount} onClick={onOpenCalendar} />
        <Metric icon="💼" label="Active Jobs" value={activeJobs.length} onClick={activeJobs.length ? () => onSelectJob?.(activeJobs[0]) : undefined} />
        <Metric icon="💰" label="Outstanding" value={formatCurrency(outstanding)} onClick={outstanding > 0 ? () => onSelectJob?.(allJobs.find((job) => getOutstanding(job) > 0)) : undefined} last />
      </section>

      <QuickJobFinder jobs={allJobs} clients={clients} onSelectJob={onSelectJob} />

      <div style={lowerGridStyle}>
        <TodayFocus items={todayFocus} onSelectJob={onSelectJob} />
        <JobsDueThisWeek jobs={allJobs} onSelectJob={onSelectJob} />
        <RecentActivity clients={clients} jobs={allJobs} />
      </div>

      <QuickActions
        onNewClient={onNewClient}
        onNewAppointment={onNewAppointment || onOpenCalendar}
        onNewJob={onNewJob}
        onRecordPayment={onRecordPayment}
        onCalendar={onOpenCalendar}
      />

      {attentionJobs.length > 0 && (
        <NeedsAttention jobs={attentionJobs} clients={clients} onSelectJob={onSelectJob} />
      )}
    </main>
  );
}

function Metric({ icon, label, value, onClick, last = false }) {
  const content = (
    <>
      <span style={metricIconStyle} aria-hidden="true">{icon}</span>
      <span style={metricLabelStyle}>{label}</span>
      <strong style={metricValueStyle}>{value}</strong>
    </>
  );
  const style = { ...metricStyle, borderRight: last ? 0 : "1px solid #D9DEE2" };
  if (!onClick) return <div style={style}>{content}</div>;
  return <button type="button" onClick={onClick} style={style} onMouseEnter={(e) => { e.currentTarget.style.background = "#FFF9FB"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "#FFFFFF"; }}>{content}</button>;
}

function TodayFocus({ items, onSelectJob }) {
  return (
    <section style={cardStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>Today's Focus</h2>
        <span style={badgeStyle}>{items.length} {items.length === 1 ? "item" : "items"}</span>
      </div>
      {items.length === 0 ? (
        <div style={emptyFocusStyle}>Nothing needs your attention today.</div>
      ) : (
        <div style={focusListStyle}>
          {items.map((item, index) => (
            <button key={`${item.title}-${index}`} type="button" style={focusRowStyle} onClick={() => item.onClick && onSelectJob?.(item.onClick)} onMouseEnter={(e) => { e.currentTarget.style.background = "#FFF9FB"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "#FFFFFF"; }}>
              <span style={focusIconStyle}>{item.icon}</span>
              <span style={focusContentStyle}><strong>{item.title}</strong><small>{item.subtitle}</small></span>
              <span style={{ ...focusTagStyle, ...(tagTones[item.tone] || {}) }}>{item.tag}</span>
            </button>
          ))}
        </div>
      )}
      <div style={footerLinkStyle}>View all priorities <span>→</span></div>
    </section>
  );
}

function QuickActions({ onNewClient, onNewAppointment, onNewJob, onRecordPayment, onCalendar }) {
  const actions = [
    ["👤", "+ New Client", onNewClient],
    ["📅", "+ New Appointment", onNewAppointment],
    ["💼", "+ New Job", onNewJob],
    ["💰", "+ Record Payment", onRecordPayment],
    ["📅", "Calendar", onCalendar],
  ];
  return (
    <section style={quickActionsStyle} aria-label="Quick Actions">
      <strong style={quickActionsTitleStyle}>Quick Actions</strong>
      <div style={quickActionListStyle}>
        {actions.map(([icon, label, handler]) => (
          <button key={label} type="button" onClick={handler} disabled={!handler} style={{ ...quickActionButtonStyle, opacity: handler ? 1 : 0.62 }}>
            <span>{icon}</span>{label}
          </button>
        ))}
      </div>
    </section>
  );
}

function NeedsAttention({ jobs, clients, onSelectJob }) {
  const overdueJobs = jobs.filter((job) => job.overdue);
  const primaryJob = overdueJobs[0] || jobs[0];
  if (!primaryJob) return null;
  const client = clients.find((item) => String(item.id) === String(primaryJob.clientId));
  return (
    <section style={attentionStyle}>
      <div style={attentionHeaderStyle}><h2 style={attentionTitleStyle}>⚠ <span>Needs Attention</span></h2></div>
      <div style={attentionBodyStyle}><div style={attentionRowStyle}><span style={attentionDotStyle}>•</span><div style={attentionContentStyle}><strong>{overdueJobs.length > 1 ? `${overdueJobs.length} garments are overdue` : primaryJob.reference || primaryJob.name || primaryJob.title || "Job needs attention"}</strong><span>{overdueJobs.length > 1 ? "Please review and update" : `${getClientName(client)} — ${primaryJob.nextAction || "Please review and update"}`}</span></div><OpenButton onClick={() => onSelectJob?.(primaryJob)} /></div></div>
    </section>
  );
}

function OpenButton({ onClick }) { return <button type="button" onClick={onClick} style={openButtonStyle}>Open →</button>; }

function getClientName(client) { if (!client) return "Unknown client"; return client.name || [client.firstName, client.lastName].filter(Boolean).join(" ") || "Unknown client"; }
function getOutstanding(job) {
  if (job.balance !== undefined && job.balance !== null) return Math.max(Number(job.balance) || 0, 0);
  if (job.outstanding !== undefined && job.outstanding !== null) return Math.max(Number(job.outstanding) || 0, 0);
  if (Array.isArray(job.invoices) && job.invoices.length) return Math.max(job.invoices.reduce((sum, invoice) => sum + Number(invoice.balance ?? 0), 0), 0);
  const price = Number(job.price || 0);
  const paid = (job.payments || []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  return Math.max(price - paid, 0);
}
function formatCurrency(value) { return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0); }
function timeToMinutes(value) { if (!value) return 9999; const match = String(value).trim().match(/^(\d{1,2}):(\d{2})(?:\s*([ap]m))?$/i); if (!match) return 9999; let hour = Number(match[1]); const minute = Number(match[2]); const meridiem = match[3]?.toLowerCase(); if (meridiem === "pm" && hour < 12) hour += 12; if (meridiem === "am" && hour === 12) hour = 0; return hour * 60 + minute; }
function formatTime(value) { const minutes = timeToMinutes(value); if (minutes === 9999) return value || "Time TBC"; const hour = Math.floor(minutes / 60); return `${hour % 12 || 12}:${String(minutes % 60).padStart(2, "0")} ${hour >= 12 ? "pm" : "am"}`; }
function findRelatedJob(item, jobs, client) { if (item?.jobId) return jobs.find((job) => String(job.id) === String(item.jobId)) || null; if (item?.jobReference) return jobs.find((job) => String(job.reference) === String(item.jobReference)) || null; if (client?.id) { const matches = jobs.filter((job) => String(job.clientId) === String(client.id)); if (matches.length === 1) return matches[0]; } return null; }

const dashboardStyle = { display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 1320, marginBottom: 16 };
const metricsStyle = { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", background: "#FFFFFF", border: "1px solid #D9DEE2", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 3px rgba(31,41,51,.025)" };
const metricStyle = { display: "flex", alignItems: "center", justifyContent: "center", gap: 9, minWidth: 0, minHeight: 58, padding: "8px 16px", boxSizing: "border-box", border: 0, background: "#FFFFFF", color: "#20262B", fontFamily: "inherit", textAlign: "left", cursor: "pointer" };
const metricIconStyle = { fontSize: 16, lineHeight: 1, flexShrink: 0 };
const metricLabelStyle = { color: "#687178", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" };
const metricValueStyle = { color: "#171D22", fontSize: 19, lineHeight: 1, whiteSpace: "nowrap" };
const lowerGridStyle = { display: "grid", gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 0.95fr) minmax(0, 1.05fr)", gap: 10, alignItems: "start" };
const cardStyle = { background: "#FFFFFF", border: "1px solid #D9DEE2", borderRadius: 9, overflow: "hidden", boxShadow: "0 1px 4px rgba(31,41,51,.025)", minWidth: 0 };
const headerStyle = { minHeight: 50, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "0 16px", borderBottom: "1px solid #D9DEE2" };
const titleStyle = { margin: 0, color: "#20262B", fontSize: 18, lineHeight: 1.2 };
const badgeStyle = { display: "inline-flex", alignItems: "center", minHeight: 25, padding: "0 9px", borderRadius: 999, background: "#F8E9EE", color: "#8B1E3F", fontSize: 10, fontWeight: 800 };
const focusListStyle = { padding: "0 12px" };
const focusRowStyle = { width: "100%", minHeight: 70, display: "flex", alignItems: "center", gap: 10, padding: "8px 4px", border: 0, borderBottom: "1px solid #E5E8EA", background: "#FFFFFF", textAlign: "left", cursor: "pointer", fontFamily: "inherit" };
const focusIconStyle = { width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 9, background: "#F3E8EE", fontSize: 18, flexShrink: 0 };
const focusContentStyle = { display: "flex", flexDirection: "column", gap: 3, minWidth: 0, flex: 1 };
const focusTagStyle = { padding: "4px 7px", borderRadius: 999, fontSize: 10, fontWeight: 800, whiteSpace: "nowrap" };
const tagTones = { today: { background: "#FFF0D7", color: "#A35B00" }, job: { background: "#F0EDF7", color: "#6C4A8E" }, payment: { background: "#FBE9EF", color: "#A52850" } };
const emptyFocusStyle = { minHeight: 130, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, color: "#687178", fontSize: 12, textAlign: "center" };
const footerLinkStyle = { minHeight: 38, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#8B1E3F", fontSize: 11, fontWeight: 800 };
const quickActionsStyle = { display: "flex", alignItems: "center", gap: 16, padding: "10px 14px", background: "#FFFFFF", border: "1px solid #D9DEE2", borderRadius: 9, boxShadow: "0 1px 4px rgba(31,41,51,.025)" };
const quickActionsTitleStyle = { color: "#20262B", fontSize: 13, whiteSpace: "nowrap" };
const quickActionListStyle = { display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 8, flex: 1, minWidth: 0 };
const quickActionButtonStyle = { minHeight: 36, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "0 10px", border: "1px solid #E1E5E8", borderRadius: 7, background: "#FFFFFF", color: "#8B1E3F", fontSize: 11, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" };
const attentionStyle = { background: "#FFF9FB", border: "1px solid #E3C3CB", borderRadius: 9, overflow: "hidden" };
const attentionHeaderStyle = { minHeight: 46, display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid #E8D5DA" };
const attentionTitleStyle = { margin: 0, display: "flex", alignItems: "center", gap: 8, color: "#8B1E3F", fontSize: 16 };
const attentionBodyStyle = { padding: "0 16px" };
const attentionRowStyle = { display: "flex", alignItems: "center", gap: 10, minHeight: 76 };
const attentionDotStyle = { color: "#D95773", fontSize: 22, lineHeight: 1 };
const attentionContentStyle = { display: "flex", flexDirection: "column", gap: 4, minWidth: 0, flex: 1, fontSize: 12 };
const openButtonStyle = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, minWidth: 76, height: 34, padding: "0 12px", border: "1px solid #C96A83", borderRadius: 999, background: "#FFFFFF", color: "#8B1E3F", fontSize: 11, fontWeight: 800, cursor: "pointer" };
