import { useMemo } from "react";

import WelcomeCard from "./WelcomeCard";
import JobsDueThisWeek from "./JobsDueThisWeek";
import RecentActivity from "./RecentActivity";
import TodaysWorkPanel from "./TodaysWorkPanel";

export default function DashboardPage({
  clients = [],
  jobs = [],
  onSelectJob,
  onOpenCalendar,
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

  return (
    <main style={dashboardStyle}>
      <WelcomeCard />

      <section style={metricsStyle} aria-label="Dashboard summary">
        <Metric icon="📅" label="Today's Appointments" value={appointmentCount} action="View today" onClick={onOpenCalendar} />
        <Metric icon="👗" label="Today's Fittings" value={fittingCount} action="View today" onClick={onOpenCalendar} />
        <Metric icon="💼" label="Active Jobs" value={activeJobs.length} action={activeJobs.length ? "View all" : null} onClick={activeJobs.length ? () => onSelectJob?.(activeJobs[0]) : undefined} />
        <Metric icon="💰" label="Outstanding Payments" value={formatCurrency(outstanding)} action={outstanding > 0 ? "View payments" : null} onClick={outstanding > 0 ? () => onSelectJob?.(allJobs.find((job) => getOutstanding(job) > 0)) : undefined} />
      </section>

      <div style={mainGridStyle}>
        <div style={leftColumnStyle}>
          <section style={sectionStyle}>
            <SectionHeader title="Today" />
            <TodaysWorkPanel clients={clients} jobs={allJobs} onSelectJob={onSelectJob} />
          </section>

          {attentionJobs.length > 0 && (
            <NeedsAttention jobs={attentionJobs} clients={clients} onSelectJob={onSelectJob} />
          )}
        </div>

        <div style={rightColumnStyle}>
          <JobsDueThisWeek jobs={allJobs} onSelectJob={onSelectJob} />
          <RecentActivity clients={clients} jobs={allJobs} />
        </div>
      </div>
    </main>
  );
}

function Metric({ icon, label, value, action, onClick }) {
  return (
    <div style={metricStyle}>
      <span style={metricIconStyle}>{icon}</span>
      <div style={metricContentStyle}>
        <span style={metricLabelStyle}>{label}</span>
        <strong style={metricValueStyle}>{value}</strong>
        {action && onClick ? (
          <button type="button" onClick={onClick} style={metricActionStyle}>{action}</button>
        ) : null}
      </div>
    </div>
  );
}

function NeedsAttention({ jobs, clients, onSelectJob }) {
  return (
    <section style={attentionStyle}>
      <div style={attentionHeaderStyle}>
        <h2 style={attentionTitleStyle}>⚠️ <span>Needs Attention</span></h2>
      </div>
      <div style={attentionBodyStyle}>
        {jobs.slice(0, 3).map((job) => {
          const client = clients.find((item) => String(item.id) === String(job.clientId));
          return (
            <div key={job.id ?? job.reference ?? job.name} style={attentionRowStyle}>
              <span style={{ ...attentionDotStyle, color: job.overdue ? "#C5304D" : "#B54708" }}>•</span>
              <div style={attentionContentStyle}>
                <strong>{job.reference || job.name || job.title || "Job"}</strong>
                <span>{getClientName(client)} · {job.nextAction || (job.overdue ? "Overdue" : "Needs attention")}</span>
              </div>
              <OpenButton onClick={() => onSelectJob?.(job)} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SectionHeader({ title }) {
  return (
    <div style={sectionHeaderStyle}>
      <h2 style={sectionTitleStyle}>{title}</h2>
    </div>
  );
}

function OpenButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={openButtonStyle}
      onMouseEnter={(event) => {
        event.currentTarget.style.background = "#8B1E3F";
        event.currentTarget.style.color = "#FFFFFF";
        event.currentTarget.style.boxShadow = "0 3px 8px rgba(139,30,63,.18)";
        event.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = "#FFFFFF";
        event.currentTarget.style.color = "#8B1E3F";
        event.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,.04)";
        event.currentTarget.style.transform = "translateY(0)";
      }}
    >
      Open <span aria-hidden="true">→</span>
    </button>
  );
}

function getClientName(client) {
  if (!client) return "Unknown client";
  return client.name || [client.firstName, client.lastName].filter(Boolean).join(" ") || "Unknown client";
}

function getOutstanding(job) {
  if (job.balance !== undefined && job.balance !== null) return Math.max(Number(job.balance) || 0, 0);
  if (job.outstanding !== undefined && job.outstanding !== null) return Math.max(Number(job.outstanding) || 0, 0);
  if (Array.isArray(job.invoices) && job.invoices.length) {
    return Math.max(job.invoices.reduce((sum, invoice) => sum + Number(invoice.balance ?? 0), 0), 0);
  }
  const price = Number(job.price || 0);
  const paid = (job.payments || []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  return Math.max(price - paid, 0);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

const dashboardStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  marginBottom: 16,
};

const metricsStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  background: "#FFFFFF",
  borderTop: "1px solid #E1E4E7",
  borderBottom: "1px solid #E1E4E7",
};

const metricStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  minWidth: 0,
  minHeight: 76,
  padding: "10px 20px",
  borderRight: "1px solid #E1E4E7",
};

const metricIconStyle = { width: 34, textAlign: "center", fontSize: 25, lineHeight: 1, flexShrink: 0 };
const metricContentStyle = { display: "flex", flexDirection: "column", gap: 1, minWidth: 0 };
const metricLabelStyle = { color: "#687178", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: .2, whiteSpace: "nowrap" };
const metricValueStyle = { color: "#171D22", fontSize: 23, lineHeight: 1.02 };
const metricActionStyle = { alignSelf: "flex-start", margin: "2px 0 0", padding: 0, border: 0, background: "transparent", color: "#9A2348", fontSize: 11, fontWeight: 700, cursor: "pointer" };

const mainGridStyle = { display: "grid", gridTemplateColumns: "minmax(0, 1.08fr) minmax(360px, .92fr)", gap: 14, alignItems: "start" };
const leftColumnStyle = { display: "flex", flexDirection: "column", gap: 12, minWidth: 0 };
const rightColumnStyle = { display: "flex", flexDirection: "column", gap: 12, minWidth: 0 };

const sectionStyle = { background: "#FFFFFF", border: "1px solid #DEE2E6", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 4px rgba(31,41,51,.03)" };
const sectionHeaderStyle = { minHeight: 46, display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid #E4E7EA" };
const sectionTitleStyle = { margin: 0, color: "#20262B", fontSize: 17, lineHeight: 1.2 };

const attentionStyle = { background: "#FFF9FB", border: "1px solid #E8C7CF", borderRadius: 8, overflow: "hidden" };
const attentionHeaderStyle = { minHeight: 44, display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid #F0DCE1" };
const attentionTitleStyle = { margin: 0, display: "flex", alignItems: "center", gap: 7, color: "#8B1E3F", fontSize: 15 };
const attentionBodyStyle = { padding: "0 16px" };
const attentionRowStyle = { display: "flex", alignItems: "center", gap: 8, minHeight: 60, borderBottom: "1px solid #F0DCE1" };
const attentionDotStyle = { fontSize: 20, lineHeight: 1 };
const attentionContentStyle = { display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 };

const openButtonStyle = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, flexShrink: 0, minWidth: 98, height: 38, padding: "0 16px", border: "1px solid #C96A83", borderRadius: 999, background: "#FFFFFF", color: "#8B1E3F", fontSize: 13, fontWeight: 700, lineHeight: 1, cursor: "pointer", boxShadow: "0 1px 2px rgba(31,41,51,.04)", transition: "background 160ms ease, color 160ms ease, box-shadow 160ms ease, transform 160ms ease" };
