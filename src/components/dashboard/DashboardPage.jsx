import { useMemo } from "react";

import WelcomeCard from "./WelcomeCard";
import JobsDueThisWeek from "./JobsDueThisWeek";
import RecentActivity from "./RecentActivity";
import TodaysWorkPanel from "./TodaysWorkPanel";

import { parseJobDate } from "../../constants/jobWorkflow";

export default function DashboardPage({
  clients = [],
  jobs = [],
  onSelectJob,
}) {
  const allJobs = useMemo(() => {
    if (jobs.length > 0) return jobs;
    return clients.flatMap((client) => client.jobs ?? []);
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

      return dueDay >= startOfToday && dueDay <= endOfWeek;
    });

    return {
      totalClients: clients.length,
      totalJobs: allJobs.length,
      overdueJobs: allJobs.filter((j) => j.overdue).length,
      dueToday: allJobs.filter((j) => j.dueToday).length,
      readyForCollection: allJobs.filter((j) => j.status === "Ready").length,
      needsAttention: allJobs.filter((j) => j.needsAttention).length,
      outstandingPayments: allJobs.reduce(
        (total, job) => total + getOutstanding(job),
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
        gap: 16,
        marginBottom: 24,
      }}
    >
      <WelcomeCard />

      <TodaysWorkPanel
        clients={clients}
        jobs={allJobs}
        onSelectJob={onSelectJob}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(420px,1fr))",
          gap: 16,
          alignItems: "start",
        }}
      >
        <JobsDueThisWeek jobs={allJobs} />
        <RecentActivity clients={clients} jobs={allJobs} />
      </div>
    </div>
  );
}

function getOutstanding(job) {
  if (job.balance !== undefined && job.balance !== null) {
    return Math.max(Number(job.balance) || 0, 0);
  }

  if (job.outstanding !== undefined && job.outstanding !== null) {
    return Math.max(Number(job.outstanding) || 0, 0);
  }

  if (Array.isArray(job.invoices) && job.invoices.length > 0) {
    return Math.max(
      job.invoices.reduce(
        (total, invoice) => total + Number(invoice.balance ?? 0),
        0
      ),
      0
    );
  }

  const quote = Number(job.price || 0);
  const totalPaid = (job.payments || []).reduce(
    (total, payment) => total + Number(payment.amount || 0),
    0
  );

  return Math.max(quote - totalPaid, 0);
}
