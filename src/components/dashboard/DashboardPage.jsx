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

      <TodaysWorkPanel
        clients={clients}
        jobs={allJobs}
        onSelectJob={onSelectJob}
        onOpenCalendar={onOpenCalendar}
      />

      <section style={sectionStackStyle}>
        <JobsDueThisWeek jobs={allJobs} />
        <RecentActivity clients={clients} jobs={allJobs} />
      </section>
    </div>
  );
}

const sectionStackStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};
