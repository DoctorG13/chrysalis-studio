import { useMemo } from "react";

import WelcomeCard from "./WelcomeCard";
import StatsGrid from "./StatsGrid";
import TodaysPriorities from "./TodaysPriorities";
import JobsDueThisWeek from "./JobsDueThisWeek";
import QuickActions from "./QuickActions";
import RecentActivity from "./RecentActivity";
import TodaysWorkPanel from "./TodaysWorkPanel";

import { parseJobDate } from "../../constants/jobWorkflow";

export default function DashboardPage({
  clients = [],
  jobs = [],

  onNewClient,

  onClientsClick,
  onJobsClick,
  onAppointmentsClick,
  onPaymentsClick,

  onSelectJob,
}) {
  const allJobs = useMemo(() => {
    if (jobs.length > 0) {
      return jobs;
    }

    return clients.flatMap(
      (client) => client.jobs ?? []
    );
  }, [clients, jobs]);

  const dashboard = useMemo(() => {
    const today = new Date();

    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const dueThisWeek = allJobs.filter((job) => {
      const due = parseJobDate(job.dueDate);

      if (!due) return false;

      const dueDay = new Date(
        due.getFullYear(),
        due.getMonth(),
        due.getDate()
      );

      return (
        dueDay >= startOfToday &&
        dueDay <= endOfWeek
      );
    });

    return {
      totalClients: clients.length,

      totalJobs: allJobs.length,

      overdueJobs: allJobs.filter(
        (j) => j.overdue
      ).length,

      dueToday: allJobs.filter(
        (j) => j.dueToday
      ).length,

      readyForCollection: allJobs.filter(
        (j) => j.status === "Ready"
      ).length,

      needsAttention: allJobs.filter(
        (j) => j.needsAttention
      ).length,

      outstandingPayments: allJobs.reduce(
        (total, job) =>
          total +
          Number(
            job.balance ??
              job.outstanding ??
              0
          ),
        0
      ),

      jobsDueThisWeek: dueThisWeek.length,
    };
  }, [clients, allJobs]);

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

      <TodaysWorkPanel
        jobs={allJobs}
        onSelectJob={onSelectJob}
      />

      <StatsGrid
        dashboard={dashboard}
        onClientsClick={onClientsClick}
        onJobsClick={onJobsClick}
        onAppointmentsClick={
          onAppointmentsClick
        }
        onPaymentsClick={
          onPaymentsClick
        }
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
          jobs={allJobs}
          dashboard={dashboard}
        />

        <JobsDueThisWeek
          clients={clients}
          jobs={allJobs}
          dashboard={dashboard}
        />

        <RecentActivity
          clients={clients}
          jobs={allJobs}
          dashboard={dashboard}
        />
      </div>

      <QuickActions
        onNewClient={onNewClient}
      />
    </div>
  );
}