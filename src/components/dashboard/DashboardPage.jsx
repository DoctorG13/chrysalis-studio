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

  return (
    <main style={dashboardStyle}>
      <WelcomeCard />

      <section style={todayShellStyle}>
        <div style={todayHeaderStyle}>
          <div>
            <div style={eyebrowStyle}>Today</div>
            <h2 style={todayTitleStyle}>This Morning's View</h2>
          </div>

          {onOpenCalendar && (
            <button type="button" onClick={onOpenCalendar} style={calendarButtonStyle}>
              📅 Calendar
            </button>
          )}
        </div>

        <TodaysWorkPanel
          clients={clients}
          jobs={allJobs}
          onSelectJob={onSelectJob}
        />
      </section>

      <div style={lowerGridStyle}>
        <JobsDueThisWeek jobs={allJobs} />
        <RecentActivity clients={clients} jobs={allJobs} />
      </div>
    </main>
  );
}

const dashboardStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
  marginBottom: 24,
};

const todayShellStyle = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: 14,
  boxShadow: "0 2px 8px rgba(47,58,63,0.045)",
  overflow: "hidden",
};

const todayHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  padding: "14px 18px",
  background: "#F7F8F9",
  borderBottom: "1px solid #E7E9EB",
};

const eyebrowStyle = {
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 1.2,
  textTransform: "uppercase",
  color: "#8B1E3F",
  marginBottom: 2,
};

const todayTitleStyle = {
  margin: 0,
  color: "#2F3A3F",
  fontSize: 18,
  lineHeight: 1.2,
};

const calendarButtonStyle = {
  border: "1px solid #D8DDE0",
  borderRadius: 9,
  background: "#FFFFFF",
  color: "#2F3A3F",
  padding: "8px 13px",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const lowerGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 14,
};
