import Card from "../components/common/Card";
import Button from "../components/common/Button";
import StatCard from "../components/common/StatCard";

export default function StudioPage() {
  return (
    <>
      <h1
        style={{
          marginTop: 0,
          color: "#2F3A3F",
        }}
      >
        Today's Studio
      </h1>

      <p
        style={{
          color: "#777",
          marginBottom: 30,
        }}
      >
        Welcome back. Your studio is ready.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 20,
          marginBottom: 30,
        }}
      >
        <StatCard
          title="Clients"
          value="0"
        />

        <StatCard
          title="Garments"
          value="0"
        />

        <StatCard
          title="Appointments"
          value="0"
        />

        <StatCard
          title="Revenue"
          value="$0"
        />
      </div>

      <Card title="Quick Actions">

        <div
          style={{
            display: "flex",
            gap: 15,
          }}
        >
          <Button>
            + Client
          </Button>

          <Button>
            + Garment
          </Button>

          <Button>
            + Appointment
          </Button>
        </div>

      </Card>
    </>
  );
}