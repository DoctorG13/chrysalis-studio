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

export function getWorkflowIndex(status) {
  const index = JOB_WORKFLOW.indexOf(status);
  return index < 0 ? 0 : index;
}

export function getNextWorkflowStep(status) {
  const index = getWorkflowIndex(status);

  if (index >= JOB_WORKFLOW.length - 1) {
    return null;
  }

  return JOB_WORKFLOW[index + 1];
}

export function isCompleted(status) {
  return status === "Completed";
}

export function isReadyForCollection(status) {
  return status === "Ready";
}

export function isCollected(status) {
  return status === "Collected";
}

export function isCancelled(status) {
  return status === "Cancelled";
}

export function isOverdue(job) {
  if (!job?.dueDate) return false;

  if (
    isCompleted(job.status) ||
    isCollected(job.status) ||
    isCancelled(job.status)
  ) {
    return false;
  }

  return new Date(job.dueDate) < new Date();
}

export function needsAttention(job) {
  if (!job) return false;

  if (isOverdue(job)) return true;

  const outstanding = Number(
    job.balance ??
      job.outstanding ??
      0
  );

  return outstanding > 0 && job.status === "Ready";
}

export function isDueToday(job) {
  if (!job?.dueDate) return false;

  const today = new Date();
  const due = new Date(job.dueDate);

  return (
    today.getFullYear() === due.getFullYear() &&
    today.getMonth() === due.getMonth() &&
    today.getDate() === due.getDate()
  );
}

export function getNextAction(job) {
  switch (job.status) {
    case "Quote":
      return "Book client";

    case "Booked":
      return "Draft pattern";

    case "Pattern":
      return "Cut fabric";

    case "Cutting":
      return "Begin construction";

    case "Construction":
      return "Prepare first fitting";

    case "First Fitting":
      return "Complete alterations";

    case "Alterations":
      return "Final preparation";

    case "Ready":
      return "Await collection";

    case "Collected":
      return "Archive job";

    case "Completed":
      return "Finished";

    default:
      return "";
  }
}

export function enrichJob(job) {
  return {
    ...job,

    progress: getWorkflowProgress(job.status),

    workflowIndex: getWorkflowIndex(job.status),

    overdue: isOverdue(job),

    dueToday: isDueToday(job),

    needsAttention: needsAttention(job),

    nextAction: getNextAction(job),

    nextStep: getNextWorkflowStep(job.status),
  };
}