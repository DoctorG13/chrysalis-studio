import { JOB_WORKFLOW, parseJobDate } from "../../constants/jobWorkflow";

const PRODUCTION_STAGES = JOB_WORKFLOW.filter(
  (stage) => !["Quote", "Cancelled", "Collected"].includes(stage)
);

function startOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function formatDate(value) {
  const date = parseJobDate(value);
  if (!date) return "No due date";

  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isOverdue(job, today) {
  if (["Collected", "Cancelled"].includes(job?.status)) return false;

  const dueDate = parseJobDate(job?.dueDate);
  return Boolean(dueDate && startOfDay(dueDate) < today);
}

function getStageHours(job, stage) {
  const entry = job?.workflowHours?.[stage];
  const estimated = Number(entry?.estimated);
  const actual = Number(entry?.actual);

  return {
    estimated: Number.isFinite(estimated) && estimated >= 0 ? estimated : 0,
    actual: Number.isFinite(actual) && actual >= 0 ? actual : 0,
  };
}

function getClientName(job, clients) {
  if (job?.clientName) return job.clientName;

  const client = clients.find(
    (item) => String(item?.id) === String(job?.clientId)
  );

  return client?.name || "Unknown Client";
}

function WorkloadJobCard({ job, clients, onOpenJob }) {
  const today = startOfDay();
  const overdue = isOverdue(job, today);
  const hours = getStageHours(job, job.status);
  const clientName = getClientName(job, clients);

  return (
    <button
      type="button"
      onClick={() => onOpenJob?.(job)}
      style={{
        width: "100%",
        border: overdue ? "1px solid #FCA5A5" : "1px solid #E2E8F0",
        borderRadius: 12,
        background: overdue ? "#FFF7F7" : "#FFFFFF",
        padding: 14,
        textAlign: "left",
        cursor: "pointer",
        fontFamily: "inherit",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "flex-start",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              color: "#8B1E3F",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 0.5,
            }}
          >
            {job.reference || "CHR-NEW"}
          </div>
          <div
            style={{
              marginTop: 5,
              color: "#1F2937",
              fontWeight: 800,
              fontSize: 14,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {job.name || "Untitled Job"}
          </div>
          <div style={{ marginTop: 3, color: "#64748B", fontSize: 12 }}>
            {clientName}
          </div>
        </div>

        <span
          style={{
            flexShrink: 0,
            padding: "4px 7px",
            borderRadius: 999,
            background: overdue ? "#DC2626" : "#F1F5F9",
            color: overdue ? "#FFFFFF" : "#475569",
            fontSize: 10,
            fontWeight: 800,
          }}
        >
          {overdue ? "OVERDUE" : "ACTIVE"}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          marginTop: 12,
          paddingTop: 10,
          borderTop: "1px solid #EEF2F7",
          color: overdue ? "#B91C1C" : "#64748B",
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        <span>Due {formatDate(job.dueDate)}</span>
        <span>
          {hours.estimated > 0 ? `${hours.estimated.toFixed(1)}h est.` : "No hours set"}
        </span>
      </div>

      {hours.actual > 0 && (
        <div style={{ marginTop: 5, color: "#64748B", fontSize: 11 }}>
          {hours.actual.toFixed(1)}h actual
        </div>
      )}
    </button>
  );
}

export default function ProductionWorkloadPanel({
  jobs = [],
  clients = [],
  onOpenJob,
}) {
  const today = startOfDay();
  const activeJobs = jobs.filter(
    (job) => !["Collected", "Cancelled"].includes(job?.status)
  );

  const productionJobs = activeJobs.filter((job) =>
    PRODUCTION_STAGES.includes(job?.status)
  );

  const dueToday = productionJobs.filter((job) => {
    const due = parseJobDate(job?.dueDate);
    return due && startOfDay(due).getTime() === today.getTime();
  });

  const overdue = productionJobs.filter((job) => isOverdue(job, today));

  const estimatedHours = productionJobs.reduce((total, job) => {
    const hours = getStageHours(job, job.status);
    return total + hours.estimated;
  }, 0);

  const stages = PRODUCTION_STAGES.map((stage) => ({
    stage,
    jobs: productionJobs
      .filter((job) => job.status === stage)
      .sort((a, b) => {
        const aDate = parseJobDate(a.dueDate)?.getTime() ?? Number.POSITIVE_INFINITY;
        const bDate = parseJobDate(b.dueDate)?.getTime() ?? Number.POSITIVE_INFINITY;
        return aDate - bDate;
      }),
  }));

  return (
    <section
      style={{
        border: "1px solid #E2E8F0",
        borderRadius: 16,
        background: "#F8FAFC",
        padding: 18,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: "#2F3A3F", fontSize: 21 }}>
            Production Workload
          </h2>
          <p style={{ margin: "5px 0 0", color: "#64748B", fontSize: 13 }}>
            See what is currently on the workroom floor, by workflow stage.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Summary label="Active" value={productionJobs.length} />
          <Summary label="Due Today" value={dueToday.length} />
          <Summary label="Overdue" value={overdue.length} danger={overdue.length > 0} />
          <Summary label="Stage Hours" value={`${estimatedHours.toFixed(1)}h`} />
        </div>
      </div>

      {productionJobs.length === 0 ? (
        <div
          style={{
            marginTop: 16,
            padding: 28,
            border: "1px dashed #CBD5E1",
            borderRadius: 12,
            background: "#FFFFFF",
            textAlign: "center",
            color: "#64748B",
            fontSize: 13,
          }}
        >
          No active production jobs are currently assigned to a production stage.
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            gap: 12,
            overflowX: "auto",
            marginTop: 16,
            paddingBottom: 6,
          }}
        >
          {stages.map(({ stage, jobs: stageJobs }) => (
            <div
              key={stage}
              style={{
                flex: "0 0 245px",
                minHeight: 150,
                border: "1px solid #E2E8F0",
                borderRadius: 13,
                background: "#FFFFFF",
                padding: 12,
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <div style={{ color: "#334155", fontWeight: 800, fontSize: 13 }}>
                  {stage}
                </div>
                <span
                  style={{
                    minWidth: 24,
                    padding: "3px 6px",
                    borderRadius: 999,
                    background: stageJobs.length ? "#8B1E3F" : "#E2E8F0",
                    color: stageJobs.length ? "#FFFFFF" : "#64748B",
                    fontSize: 10,
                    fontWeight: 800,
                    textAlign: "center",
                  }}
                >
                  {stageJobs.length}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {stageJobs.length === 0 ? (
                  <div style={{ color: "#94A3B8", fontSize: 11, padding: "10px 2px" }}>
                    No jobs
                  </div>
                ) : (
                  stageJobs.map((job) => (
                    <WorkloadJobCard
                      key={job.id}
                      job={job}
                      clients={clients}
                      onOpenJob={onOpenJob}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Summary({ label, value, danger = false }) {
  return (
    <div
      style={{
        padding: "7px 10px",
        borderRadius: 9,
        border: danger ? "1px solid #FCA5A5" : "1px solid #CBD5E1",
        background: danger ? "#FEF2F2" : "#FFFFFF",
        color: danger ? "#B91C1C" : "#475569",
        fontSize: 11,
        fontWeight: 800,
      }}
    >
      {label}: {value}
    </div>
  );
}
