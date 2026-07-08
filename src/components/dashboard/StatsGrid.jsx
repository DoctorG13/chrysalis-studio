import StatCard from "../common/StatCard";

import {
  getActiveJobs,
  getAppointmentsToday,
  getOutstandingPayments,
  getOverdueJobs,
} from "../../utils/dashboard";

export default function StatsGrid({
  clients = [],
  onClientsClick,
  onJobsClick,
  onAppointmentsClick,
  onPaymentsClick,
}) {
  const activeJobs = getActiveJobs(clients);
  const overdueJobs = getOverdueJobs(clients);
  const todaysAppointments = getAppointmentsToday(clients);
  const outstandingPayments =
    getOutstandingPayments(clients);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit,minmax(220px,1fr))",
        gap: 20,
        marginBottom: 30,
      }}
    >
      <StatCard
        icon="👥"
        title="Clients"
        value={clients.length}
        subtitle="Registered clients"
        onClick={onClientsClick}
      />

      <StatCard
        icon="💼"
        title="Active Jobs"
        value={activeJobs.length}
        subtitle={
          overdueJobs.length > 0
            ? `${overdueJobs.length} overdue`
            : "Currently in progress"
        }
        onClick={onJobsClick}
      />

      <StatCard
        icon="📅"
        title="Today's Appointments"
        value={todaysAppointments.length}
        subtitle={
          todaysAppointments.length === 0
            ? "No appointments today"
            : "Scheduled today"
        }
        onClick={onAppointmentsClick}
      />

      <StatCard
        icon="💰"
        title="Outstanding"
        value={`$${outstandingPayments.toFixed(2)}`}
        subtitle={
          outstandingPayments === 0
            ? "All payments received"
            : "Awaiting payment"
        }
        onClick={onPaymentsClick}
      />
    </div>
  );
}