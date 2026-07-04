import WelcomeCard from "./WelcomeCard";
import StatsGrid from "./StatsGrid";
import TodaysPriorities from "./TodaysPriorities";
import JobsDueThisWeek from "./JobsDueThisWeek";
import QuickActions from "./QuickActions";
import RecentActivity from "./RecentActivity";

export default function DashboardPage({
  clients = [],

  onNewClient,

  onClientsClick,
  onJobsClick,
  onAppointmentsClick,
  onPaymentsClick,
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 30,
        marginBottom: 40,
      }}
    >
      <WelcomeCard clients={clients} />

      <StatsGrid
        clients={clients}
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
        />

        <JobsDueThisWeek
          clients={clients}
        />

        <RecentActivity
          clients={clients}
        />
      </div>

      <QuickActions
        onNewClient={onNewClient}
      />
    </div>
  );
}