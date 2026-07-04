import Card from "../common/Card";
import Badge from "../common/Badge";
import Divider from "../common/Divider";
import EmptyState from "../common/EmptyState";

export default function AppointmentOverview({
  appointment,
}) {
  if (!appointment) {
    return (
      <EmptyState
        icon="📅"
        title="No Appointment Selected"
        message="Select an appointment from the list to view its details."
      />
    );
  }

  return (
    <Card
      title={appointment.type}
      subtitle={`${appointment.date} • ${appointment.time}`}
      icon="📅"
      actions={
        <Badge variant="info">
          {appointment.status}
        </Badge>
      }
    >
      <div>
        <strong>Location</strong>
        <p>{appointment.location || "Not specified"}</p>
      </div>

      <Divider />

      <div>
        <strong>Notes</strong>
        <p>{appointment.notes || "No notes recorded."}</p>
      </div>

      <Divider />

      <div>
        <strong>Created</strong>
        <p>{appointment.created || "Unknown"}</p>
      </div>

      <Divider />

      <div>
        <strong>Last Updated</strong>
        <p>{appointment.updated || "Unknown"}</p>
      </div>
    </Card>
  );
}