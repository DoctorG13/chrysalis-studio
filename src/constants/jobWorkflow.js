export const JOB_WORKFLOW = [
  "Quote",
  "Booked",
  "Pattern",
  "Cutting",
  "Construction",
  "First Fitting",
  "Alterations",
  "Ready",
  "Collected",
  "Completed",
];

export const JOB_STATUS_COLOURS = {
  Quote: "#94A3B8",
  Booked: "#3B82F6",
  Pattern: "#8B5CF6",
  Cutting: "#F97316",
  Construction: "#F59E0B",
  "First Fitting": "#EC4899",
  Alterations: "#EAB308",
  Ready: "#10B981",
  Collected: "#059669",
  Completed: "#16A34A",
  Cancelled: "#6B7280",
};

export function getWorkflowProgress(status) {
  const index = JOB_WORKFLOW.indexOf(status);

  if (index < 0) return 0;

  return Math.round(
    (index / (JOB_WORKFLOW.length - 1)) * 100
  );
}