export const JOB_STATUS = {
  QUOTE: "Quote",
  AWAITING_DEPOSIT: "Awaiting Deposit",
  IN_PROGRESS: "In Progress",
  WAITING_FOR_FABRIC: "Waiting For Fabric",
  READY_FOR_FITTING: "Ready For Fitting",
  READY_FOR_COLLECTION: "Ready For Collection",
  COMPLETED: "Completed",
};

const STATUS_COLOURS = {
  [JOB_STATUS.QUOTE]: "#6B7280",
  [JOB_STATUS.AWAITING_DEPOSIT]: "#F59E0B",
  [JOB_STATUS.IN_PROGRESS]: "#2563EB",
  [JOB_STATUS.WAITING_FOR_FABRIC]: "#7C3AED",
  [JOB_STATUS.READY_FOR_FITTING]: "#0891B2",
  [JOB_STATUS.READY_FOR_COLLECTION]: "#10B981",
  [JOB_STATUS.COMPLETED]: "#16A34A",
};

export default function StatusBadge({ status }) {
  const background =
    STATUS_COLOURS[status] || "#64748B";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "6px 12px",
        borderRadius: 999,
        background,
        color: "#fff",
        fontWeight: 600,
        fontSize: 12,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}