import Card from "../common/Card";
import Button from "../common/Button";

export default function QuickActions({
  onNewClient,
}) {
  return (
    <div
      style={{
        marginTop: 30,
      }}
    >
      <Card title="Quick Actions">
        <div
          style={{
            display: "flex",
            gap: 15,
            flexWrap: "wrap",
          }}
        >
          <Button onClick={onNewClient}>
            + New Client
          </Button>

          <Button>
            + New Garment
          </Button>

          <Button>
            + Appointment
          </Button>
        </div>
      </Card>
    </div>
  );
}