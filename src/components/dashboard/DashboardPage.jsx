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

  const outstanding = allJobs.reduce((sum, job) => {
    if (job.balance !== undefined && job.balance !== null) return sum + Math.max(Number(job.balance) || 0, 0);
    if (job.outstanding !== undefined && job.outstanding !== null) return sum + Math.max(Number(job.outstanding) || 0, 0);
    const price = Number(job.price || 0);
    const paid = (job.payments || []).reduce((total, payment) => total + Number(payment.amount || 0), 0);
    return sum + Math.max(price - paid, 0);
  }, 0);

  const todayKey = new Date().toDateString();
  const appointmentCount = clients.reduce(
    (count, client) => count + (client.appointments || []).filter((item) => new Date(item.date).toDateString() === todayKey).length,
    0
  );
  const fittingCount = clients.reduce(
    (count, client) => count + (client.fittings || []).filter((item) => new Date(item.date).toDateString() === todayKey).length,
    0
  );

  return (
    <main style={dashboardStyle}>
      <WelcomeCard />

      <section style={metricsStyle} aria-label="Dashboard summary">
        <Metric icon="📅" label="Today's Appointments" value={appointmentCount} action={onOpenCalendar ? "View today" : null} onClick={onOpenCalendar} />
        <Metric icon="👗" label="Today's Fittings" value={fittingCount} action={onOpenCalendar ? "View today" : null} onClick={onOpenCalendar} />
        <Metric icon="💼" label="Active Jobs" value={activeJobs.length} action={activeJobs.length ? "View all" : null} onClick={activeJobs.length ? () => onSelectJob?.(activeJobs[0]) : undefined} />
        <Metric icon="💰" label="Outstanding Payments" value={formatCurrency(outstanding)} action={outstanding > 0 ? "View payments" : null} onClick={outstanding > 0 ? () => onSelectJob?.(allJobs.find((job) => getOutstanding(job) > 0)) : undefined} />
      </section>

      <div style={mainGridStyle}>
        <div style={leftColumnStyle}>
          <section style={todayCardStyle}>
            <div style={sectionHeaderStyle}>
              <h2 style={sectionTitleStyle}>Today</h2>
            </div>
            <TodaysWorkPanel clients={clients} jobs={allJobs} onSelectJob={onSelectJob} />
          </section>

          <JobsDueThisWeek jobs={allJobs} onSelectJob={onSelectJob} />
        </div>

        <RecentActivity clients={clients} jobs={allJobs} />
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

function getOutstanding(job) {
  if (job.balance !== undefined && job.balance !== null) return Math.max(Number(job.balance) || 0, 0);
  if (job.outstanding !== undefined && job.outstanding !== null) return Math.max(Number(job.outstanding) || 0, 0);
  const price = Number(job.price || 0);
  const paid = (job.payments || []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  return Math.max(price - paid, 0);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
  }).format(value);
}

const dashboardStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 22,
  marginBottom: 30,
};

const metricsStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  borderTop: "1px solid #E5E7EB",
  borderBottom: "1px solid #E5E7EB",
  background: "#FFF",
};

const metricStyle = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  minWidth: 0,
  padding: "18px 26px",
  borderRight: "1px solid #E5E7EB",
};

const metricIconStyle = {
  fontSize: 28,
  lineHeight: 1,
  filter: "saturate(.8)",
};

const metricContentStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 3,
  minWidth: 0,
};

const metricLabelStyle = {
  color: "#697178",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 0.35,
};

const metricValueStyle = {
  color: "#1F2933",
  fontSize: 24,
  lineHeight: 1.05,
};

const metricActionStyle = {
  alignSelf: "flex-start",
  margin: "2px 0 0",
  padding: 0,
  border: 0,
  background: "transparent",
  color: "#9A2348",
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
};

const mainGridStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.12fr) minmax(340px, .88fr)",
  gap: 18,
  alignItems: "start",
};

const leftColumnStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 18,
  minWidth: 0,
};

const todayCardStyle = {
  background: "#FFF",
  border: "1px solid #E1E4E7",
  borderRadius: 10,
  overflow: "hidden",
  boxShadow: "0 2px 8px rgba(31,41,51,.035)",
};

const sectionHeaderStyle = {
  padding: "18px 20px 15px",
  borderBottom: "1px solid #E8EAED",
};

const sectionTitleStyle = {
  margin: 0,
  color: "#1F2933",
  fontSize: 18,
  lineHeight: 1.2,
};
