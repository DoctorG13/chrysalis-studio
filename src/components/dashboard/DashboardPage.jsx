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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        marginBottom: 24,
      }}
    >
      <WelcomeCard />

      <div style={todayViewWrapperStyle}>
        {onOpenCalendar && (
          <button
            type="button"
            onClick={onOpenCalendar}
            style={calendarButtonStyle}
          >
            📅 Open Calendar →
          </button>
        )}

        <TodaysWorkPanel
          clients={clients}
          jobs={allJobs}
          onSelectJob={onSelectJob}
        />
      </div>

      <section style={sectionStackStyle}>
        <JobsDueThisWeek jobs={allJobs} />
        <RecentActivity clients={clients} jobs={allJobs} />
      </section>
    </div>
  );
}

const todayViewWrapperStyle = {
  position: "relative",
};

const calendarButtonStyle = {
  position: "absolute",
  top: 12,
  right: 12,
  zIndex: 5,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 38,
  padding: "8px 15px",
  border: "1px solid #8B1E3F",
  borderRadius: 999,
  background: "#FFFFFF",
  color: "#8B1E3F",
  whiteSpace: "nowrap",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 1px 4px rgba(47,58,63,0.08)",
};

const sectionStackStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};
