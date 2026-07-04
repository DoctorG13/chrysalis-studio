import Card from "../common/Card";
import Button from "../common/Button";

export default function QuickActions({
  onNewClient,
  onNewJob,
  onNewAppointment,
  onRecordPayment,
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

          <Button onClick={onNewJob}>
            + New Job
          </Button>

          <Button onClick={onNewAppointment}>
            + Appointment
          </Button>

          <Button onClick={onRecordPayment}>
            + Payment
          </Button>
        </div>
      </Card>
    </div>
  );
}