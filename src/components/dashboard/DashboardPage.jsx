import { useMemo } from "react";

import WelcomeCard from "./WelcomeCard";
import StatsGrid from "./StatsGrid";
import TodaysPriorities from "./TodaysPriorities";
import JobsDueThisWeek from "./JobsDueThisWeek";
import QuickActions from "./QuickActions";
import RecentActivity from "./RecentActivity";

export default function DashboardPage({
  clients = [],
  jobs = [],

  onNewClient,

  onClientsClick,
  onJobsClick,
  onAppointmentsClick,
  onPaymentsClick,
}) {
  const dashboard = useMemo(() => {
    const today = new Date();

    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const dueThisWeek = jobs.filter((job) => {
      if (!job.dueDate) return false;

      const due = new Date(job.dueDate);

      return due >= startOfToday && due <= endOfWeek;
    });

    return {
      totalClients: clients.length,

      totalJobs: jobs.length,

      overdueJobs: jobs.filter((j) => j.overdue).length,

      dueToday: jobs.filter((j) => j.dueToday).length,

      readyForCollection: jobs.filter(
        (j) => j.status === "Ready"
      ).length,

      needsAttention: jobs.filter(
        (j) => j.needsAttention
      ).length,

      outstandingPayments: jobs.reduce(
        (total, job) =>
          total +
          Number(job.balance ?? job.outstanding ?? 0),
        0
      ),

      jobsDueThisWeek: dueThisWeek.length,
    };
  }, [clients, jobs]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 30,
        marginBottom: 40,
      }}
    >
      <WelcomeCard
        clients={clients}
        dashboard={dashboard}
      />

      <StatsGrid
        clients={clients}
        jobs={jobs}
        dashboard={dashboard}
        onClientsClick={onClientsClick}
        onJobsClick={onJobsClick}
        onAppointmentsClick={onAppointmentsClick}
        onPaymentsClick={onPaymentsClick}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(420px,1fr))",
          gap: 24,
        }}
      >
        <TodaysPriorities
          clients={clients}
          jobs={jobs}
          dashboard={dashboard}
        />

        <JobsDueThisWeek
          clients={clients}
          jobs={jobs}
          dashboard={dashboard}
        />

        <RecentActivity
          clients={clients}
          jobs={jobs}
          dashboard={dashboard}
        />
      </div>

      <QuickActions
        onNewClient={onNewClient}
      />
    </div>
  );
}