import { useMemo } from "react";

import WelcomeCard from "./WelcomeCard";
import JobsDueThisWeek from "./JobsDueThisWeek";
import RecentActivity from "./RecentActivity";
import TodaysWorkPanel from "./TodaysWorkPanel";

export default function DashboardPage({ clients = [], jobs = [], onSelectJob, onOpenCalendar }) {
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
              📅 Calendar →
            </button>
          )}
        </div>
        <TodaysWorkPanel clients={clients} jobs={allJobs} onSelectJob={onSelectJob} />
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
  gap: 12,
  marginBottom: 20,
};

const todayShellStyle = {
  background: "transparent",
  border: 0,
  borderRadius: 0,
  boxShadow: "none",
  overflow: "visible",
};

const todayHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  padding: "5px 2px 9px",
};

const eyebrowStyle = {
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 1.3,
  textTransform: "uppercase",
  color: "#8B1E3F",
  marginBottom: 1,
};

const todayTitleStyle = {
  margin: 0,
  color: "#2F3A3F",
  fontSize: 17,
  lineHeight: 1.2,
};

const calendarButtonStyle = {
  border: "1px solid #D8DDE0",
  borderRadius: 8,
  background: "#FFFFFF",
  color: "#2F3A3F",
  padding: "7px 11px",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const lowerGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
};
