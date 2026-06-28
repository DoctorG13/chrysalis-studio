import StatCard from "../common/StatCard";

export default function StatsGrid({ clients }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))",
        gap: 20,
        marginBottom: 30,
      }}
    >
      <StatCard
        icon="👥"
        title="Clients"
        value={clients.length}
        subtitle="Registered clients"
      />

      <StatCard
        icon="👗"
        title="Garments"
        value="0"
        subtitle="Active garments"
      />

      <StatCard
        icon="📅"
        title="Appointments"
        value="0"
        subtitle="Today's schedule"
      />

      <StatCard
  icon="💰"
  title="Revenue"
  value="$0"
  subtitle="This financial year"
/>
    </div>
  );
}