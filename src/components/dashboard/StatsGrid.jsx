import StatCard from "../common/StatCard";

export default function StatsGrid({
  dashboard,
  onClientsClick,
  onJobsClick,
  onAppointmentsClick,
  onPaymentsClick,
}) {
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
        value={dashboard.totalClients}
        subtitle="Registered clients"
        onClick={onClientsClick}
      />

      <StatCard
        icon="💼"
        title="Jobs"
        value={dashboard.totalJobs}
        subtitle={
          dashboard.overdueJobs > 0
            ? `${dashboard.overdueJobs} overdue`
            : "All on schedule"
        }
        onClick={onJobsClick}
      />

      <StatCard
        icon="📅"
        title="Due Today"
        value={dashboard.dueToday}
        subtitle={
          dashboard.dueToday === 0
            ? "Nothing due today"
            : "Requires attention today"
        }
        onClick={onAppointmentsClick}
      />

      <StatCard
        icon="🧵"
        title="Ready"
        value={dashboard.readyForCollection}
        subtitle="Ready for collection"
        onClick={onJobsClick}
      />

      <StatCard
        icon="⚠️"
        title="Attention"
        value={dashboard.needsAttention}
        subtitle={
          dashboard.needsAttention === 0
            ? "Everything looks good"
            : "Jobs requiring action"
        }
        onClick={onJobsClick}
      />

      <StatCard
        icon="💰"
        title="Outstanding"
        value={`$${dashboard.outstandingPayments.toFixed(2)}`}
        subtitle={
          dashboard.outstandingPayments === 0
            ? "Fully paid"
            : "Awaiting payment"
        }
        onClick={onPaymentsClick}
      />
    </div>
  );
}