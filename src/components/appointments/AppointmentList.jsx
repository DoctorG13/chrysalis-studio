import AppointmentCard from "./AppointmentCard";
import EmptyState from "../common/EmptyState";

import { spacing } from "../../theme";

export default function AppointmentList({
  appointments = [],
  onAppointmentClick,
}) {
  if (appointments.length === 0) {
    return (
      <EmptyState
        icon="📅"
        title="No Appointments"
        message="This client doesn't have any appointments scheduled yet."
      />
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: spacing.lg,
      }}
    >
      {appointments.map((appointment) => (
        <AppointmentCard
          key={appointment.id}
          appointment={appointment}
          onOpen={onAppointmentClick}
        />
      ))}
    </div>
  );
}