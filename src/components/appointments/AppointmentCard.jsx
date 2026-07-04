import Card from "../common/Card";
import Badge from "../common/Badge";

export default function AppointmentCard({
  appointment,
  onOpen,
}) {
  const {
    type,
    date,
    time,
    location,
    status,
    notes,
  } = appointment;

  function badgeVariant() {
    switch (status) {
      case "Completed":
        return "success";

      case "Scheduled":
        return "info";

      case "Cancelled":
        return "danger";

      case "Pending":
        return "warning";

      default:
        return "neutral";
    }
  }

  return (
    <Card
      title={type}
      subtitle={`${date} • ${time}`}
      icon="📅"
      actions={
        <Badge variant={badgeVariant()}>
          {status}
        </Badge>
      }
    >
      {location && (
        <p
          style={{
            marginTop: 0,
          }}
        >
          <strong>Location:</strong> {location}
        </p>
      )}

      {notes && (
        <p
          style={{
            marginBottom: 20,
          }}
        >
          {notes}
        </p>
      )}

      <button
        onClick={() => onOpen(appointment)}
      >
        Open Appointment
      </button>
    </Card>
  );
}