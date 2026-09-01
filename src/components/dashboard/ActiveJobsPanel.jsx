import { useEffect, useMemo, useState } from "react";

import Card from "../common/Card";
import EmptyState from "../common/EmptyState";

const DEFAULT_WORKFLOW_STAGES = [
  "Quote",
  "Cutting",
  "Sewing",
  "Fitting",
  "Finishing",
  "Completed",
  "Collected",
];

export default function ActiveJobsPanel({
  jobs = [],
  clients = [],
  onSelectJob,
}) {
  const [workflowStages, setWorkflowStages] = useState(
    DEFAULT_WORKFLOW_STAGES
  );

  useEffect(() => {
    let cancelled = false;

    async function loadWorkflowSettings() {
      try {
        const response = await fetch("/api/settings");

        if (!response.ok) return;

        const payload = await response.json();

        const configured =
          payload?.settings?.jobs?.workflowStages;

        if (!configured) return;

        const stages = parseWorkflowStages(configured);

        if (!cancelled && stages.length > 0) {
          setWorkflowStages(stages);
        }
      } catch {
        // Keep the default workflow if settings cannot be loaded.
      }
    }

    loadWorkflowSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeJobs = useMemo(() => {
    return [...jobs]
      .filter(
        (job) =>
          !["Completed", "Collected", "Cancelled", "Archived"].includes(
            String(job.status || "").trim()
          )
      )
      .sort((a, b) => {
        const score = (job) => {
          if (job.overdue) return 0;
          if (job.dueToday) return 1;
          if (job.needsAttention) return 2;

          const aStage = getStageIndex(
            a,
            workflowStages
          );

          const bStage = getStageIndex(
            b,
            workflowStages
          );

          return aStage - bStage;
        };

        const scoreDifference = score(a) - score(b);

        if (scoreDifference !== 0) {
          return scoreDifference;
        }

        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;

        return (
          new Date(a.dueDate).getTime() -
          new Date(b.dueDate).getTime()
        );
      });
  }, [jobs, workflowStages]);

  return (
    <Card title="Active Jobs">
      {activeJobs.length === 0 ? (
        <EmptyState
          icon="Jobs"
          title="No Active Jobs"
          message="Everything has been completed."
        />
      ) : (
        <div style={listStyle}>
          {activeJobs.map((job) => (
            <JobRow
              key={job.id ?? job.reference ?? job.name}
              job={job}
              clients={clients}
              workflowStages={workflowStages}
              onClick={() => onSelectJob?.(job)}
            />
          ))}
        </div>
      )}

      {activeJobs.length > 0 && (
        <WorkflowHint />
      )}
    </Card>
  );
}

function JobRow({
  job,
  clients,
  workflowStages,
  onClick,
}) {
  const client = clients.find(
    (item) =>
      String(item.id) ===
      String(job.clientId)
  );

  const clientName =
    client?.name ||
    [client?.firstName, client?.lastName]
      .filter(Boolean)
      .join(" ") ||
    job.clientName ||
    "Unknown client";

  const title =
    job.name ||
    job.title ||
    job.description ||
    "Untitled Job";

  const reference =
    job.reference ||
    job.jobReference ||
    "";

  const priority =
    job.priority ||
    "Normal";

  const stageIndex = getStageIndex(
    job,
    workflowStages
  );

  const currentStage =
    workflowStages[stageIndex] ||
    job.status ||
    "Active";

  const nextStage =
    workflowStages[stageIndex + 1] ||
    "";

  const progress =
    getWorkflowProgress(
      stageIndex,
      workflowStages.length
    );

  const outstanding =
    getOutstanding(job);

  const colour = job.overdue
    ? "#DC2626"
    : job.dueToday
      ? "#EA580C"
      : job.needsAttention
        ? "#CA8A04"
        : "#8B1E3F";

  const dueLabel = getDueLabel(
    job.dueDate,
    job.overdue,
    job.dueToday
  );

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...rowStyle,
        borderLeftColor: colour,
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.background =
          "#FAFBFC";
        event.currentTarget.style.boxShadow =
          "0 3px 10px rgba(31,41,51,.07)";
        event.currentTarget.style.transform =
          "translateY(-1px)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background =
          "#FFFFFF";
        event.currentTarget.style.boxShadow =
          "0 1px 3px rgba(31,41,51,.035)";
        event.currentTarget.style.transform =
          "translateY(0)";
      }}
    >
      <div style={topRowStyle}>
        <div style={identityStyle}>
          <div style={referenceStyle}>
            {reference || "JOB"}
          </div>

          <strong style={titleStyle}>
            {title}
          </strong>

          <span style={clientStyle}>
            {clientName}
          </span>
        </div>

        <div
          style={{
            ...priorityStyle,
            ...(priority === "Urgent"
              ? urgentPriorityStyle
              : priority === "High"
                ? highPriorityStyle
                : {}),
          }}
        >
          {priority}
        </div>

        <span
          style={{
            ...arrowStyle,
            color: colour,
          }}
          aria-hidden="true"
        >
          {"\u2192"}
        </span>
      </div>

      <div style={workflowAreaStyle}>
        <div style={workflowHeaderStyle}>
          <div style={stageHeadingStyle}>
            <span style={stageLabelStyle}>
              CURRENT STAGE
            </span>

            <strong
              style={{
                ...stageValueStyle,
                color: colour,
              }}
            >
              {currentStage}
            </strong>
          </div>

          {nextStage && (
            <div style={nextStageStyle}>
              Next: <strong>{nextStage}</strong>
            </div>
          )}
        </div>

        <WorkflowBar
          stages={workflowStages}
          currentIndex={stageIndex}
          colour={colour}
        />
      </div>

      <div style={bottomRowStyle}>
        <div style={detailGroupStyle}>
          {dueLabel && (
            <Detail
              label="Due"
              value={dueLabel}
              emphasis={
                job.overdue ||
                job.dueToday
              }
            />
          )}

          {outstanding > 0 && (
            <Detail
              label="Balance"
              value={formatCurrency(
                outstanding
              )}
              emphasis
            />
          )}

          {job.nextAction && (
            <Detail
              label="Next Action"
              value={job.nextAction}
            />
          )}
        </div>

        <div style={progressStyle}>
          <span>
            {progress}% complete
          </span>
        </div>
      </div>
    </button>
  );
}

function WorkflowBar({
  stages,
  currentIndex,
  colour,
}) {
  const usableStages = stages.filter(
    (stage) =>
      !["Completed", "Collected"].includes(
        String(stage).trim()
      )
  );

  if (usableStages.length === 0) {
    return null;
  }

  return (
    <div style={workflowBarStyle}>
      {usableStages.map(
        (stage, index) => {
          const completed =
            index < currentIndex;

          const current =
            index === currentIndex;

          return (
            <div
              key={`${stage}-${index}`}
              style={workflowStepStyle}
            >
              <div
                style={{
                  ...workflowLineStyle,
                  background:
                    completed || current
                      ? colour
                      : "#E2E6E9",
                }}
              />

              <div
                style={{
                  ...workflowDotStyle,
                  background:
                    completed || current
                      ? colour
                      : "#FFFFFF",
                  borderColor:
                    completed || current
                      ? colour
                      : "#CBD1D5",
                  boxShadow: current
                    ? `0 0 0 3px ${colour}18`
                    : "none",
                }}
              />

              <span
                style={{
                  ...workflowLabelStyle,
                  color: current
                    ? colour
                    : completed
                      ? "#555E65"
                      : "#90979D",
                  fontWeight: current
                    ? 800
                    : 600,
                }}
              >
                {stage}
              </span>
            </div>
          );
        }
      )}
    </div>
  );
}

function WorkflowHint() {
  return (
    <div style={hintStyle}>
      <span style={hintIconStyle}>
        ?
      </span>

      <div style={hintContentStyle}>
        <strong>
          Want to customise your workflow?
        </strong>

        <span>
          Go to Settings {"\u2192"} Jobs &amp;
          Workflow to change your stages.
        </span>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  emphasis = false,
}) {
  return (
    <div style={detailStyle}>
      <span style={detailLabelStyle}>
        {label}
      </span>

      <span
        style={{
          ...detailValueStyle,
          color: emphasis
            ? "#8B1E3F"
            : "#343B41",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function parseWorkflowStages(value) {
  if (Array.isArray(value)) {
    return value
      .map((stage) => String(stage).trim())
      .filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((stage) => stage.trim())
    .filter(Boolean);
}

function normaliseStage(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getStageIndex(
  job,
  workflowStages
) {
  const jobStage =
    job.stage ||
    job.workflowStage ||
    job.status ||
    "";

  const normalisedJobStage =
    normaliseStage(jobStage);

  const exactIndex =
    workflowStages.findIndex(
      (stage) =>
        normaliseStage(stage) ===
        normalisedJobStage
    );

  if (exactIndex >= 0) {
    return exactIndex;
  }

  const aliases = {
    "in progress": "cutting",
    "awaiting fitting": "fitting",
    "ready for fitting": "fitting",
    "ready": "finishing",
  };

  const alias =
    aliases[normalisedJobStage];

  if (alias) {
    const aliasIndex =
      workflowStages.findIndex(
        (stage) =>
          normaliseStage(stage) ===
          alias
      );

    if (aliasIndex >= 0) {
      return aliasIndex;
    }
  }

  return 0;
}

function getWorkflowProgress(
  stageIndex,
  stageCount
) {
  if (stageCount <= 1) {
    return 100;
  }

  return Math.round(
    (stageIndex /
      Math.max(stageCount - 1, 1)) *
      100
  );
}

function getDueLabel(
  date,
  overdue,
  dueToday
) {
  if (!date) return "";

  if (overdue) {
    return "Overdue";
  }

  if (dueToday) {
    return "Today";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return String(date);
  }

  return parsed.toLocaleDateString(
    "en-AU",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function getOutstanding(job) {
  if (
    job.balance !== undefined &&
    job.balance !== null
  ) {
    return Math.max(
      Number(job.balance) || 0,
      0
    );
  }

  if (
    job.outstanding !== undefined &&
    job.outstanding !== null
  ) {
    return Math.max(
      Number(job.outstanding) || 0,
      0
    );
  }

  const price = Number(
    job.price ||
      job.total ||
      job.totalAmount ||
      0
  );

  const paid = (
    job.payments || []
  ).reduce(
    (sum, payment) =>
      sum +
      Number(
        payment.amount || 0
      ),
    0
  );

  return Math.max(
    price - paid,
    0
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat(
    "en-AU",
    {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  ).format(Number(value) || 0);
}

const listStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const rowStyle = {
  width: "100%",
  display: "block",
  padding: "13px 15px",
  borderTop: "1px solid #E6E9EC",
  borderRight: "1px solid #E6E9EC",
  borderBottom: "1px solid #E6E9EC",
  borderLeft: "4px solid #8B1E3F",
  borderRadius: 7,
  background: "#FFFFFF",
  textAlign: "left",
  cursor: "pointer",
  boxShadow:
    "0 1px 3px rgba(31,41,51,.035)",
  transition:
    "background 150ms ease, box-shadow 150ms ease, transform 150ms ease",
};

const topRowStyle = {
  display: "grid",
  gridTemplateColumns:
    "minmax(0, 1fr) auto 18px",
  gap: 14,
  alignItems: "center",
};

const identityStyle = {
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  gap: 2,
};

const referenceStyle = {
  color: "#8B1E3F",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 0.5,
};

const titleStyle = {
  overflow: "hidden",
  color: "#20262B",
  fontSize: 14,
  lineHeight: 1.25,
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const clientStyle = {
  overflow: "hidden",
  color: "#687178",
  fontSize: 11,
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const priorityStyle = {
  padding: "5px 9px",
  borderRadius: 999,
  background: "#F1F3F4",
  color: "#5F686F",
  fontSize: 9,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 0.35,
};

const highPriorityStyle = {
  background: "#FFF4E8",
  color: "#A14D00",
};

const urgentPriorityStyle = {
  background: "#FCECEF",
  color: "#8B1E3F",
};

const arrowStyle = {
  fontSize: 20,
  fontWeight: 400,
  lineHeight: 1,
};

const workflowAreaStyle = {
  marginTop: 12,
  paddingTop: 10,
  borderTop: "1px solid #EEF0F2",
};

const workflowHeaderStyle = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 12,
};

const stageHeadingStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const stageLabelStyle = {
  color: "#8A9298",
  fontSize: 8,
  fontWeight: 800,
  letterSpacing: 0.45,
};

const stageValueStyle = {
  fontSize: 12,
  lineHeight: 1.2,
};

const nextStageStyle = {
  color: "#7B8389",
  fontSize: 10,
  whiteSpace: "nowrap",
};

const workflowBarStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(55px, 1fr))",
  gap: 0,
  marginTop: 10,
};

const workflowStepStyle = {
  position: "relative",
  minWidth: 0,
};

const workflowLineStyle = {
  position: "absolute",
  top: 5,
  left: 0,
  right: 0,
  height: 2,
};

const workflowDotStyle = {
  position: "relative",
  zIndex: 1,
  width: 11,
  height: 11,
  margin: "0 auto",
  border: "2px solid #CBD1D5",
  borderRadius: "50%",
  boxSizing: "border-box",
};

const workflowLabelStyle = {
  display: "block",
  marginTop: 6,
  overflow: "hidden",
  padding: "0 2px",
  fontSize: 8,
  lineHeight: 1.15,
  textAlign: "center",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const bottomRowStyle = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 12,
  marginTop: 10,
};

const detailGroupStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px 18px",
  minWidth: 0,
};

const detailStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  minWidth: 55,
};

const detailLabelStyle = {
  color: "#8A9298",
  fontSize: 8,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 0.35,
};

const detailValueStyle = {
  color: "#343B41",
  fontSize: 10,
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const progressStyle = {
  flexShrink: 0,
  color: "#8A9298",
  fontSize: 9,
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const hintStyle = {
  display: "flex",
  alignItems: "center",
  gap: 9,
  marginTop: 10,
  padding:
    "9px 11px",
  border:
    "1px solid #E3E7EA",
  borderRadius: 6,
  background: "#F8F9FA",
};

const hintIconStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 18,
  height: 18,
  borderRadius: "50%",
  background: "#8B1E3F",
  color: "#FFFFFF",
  fontSize: 10,
  fontWeight: 800,
  flexShrink: 0,
};

const hintContentStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  color: "#687178",
  fontSize: 9,
  lineHeight: 1.3,
};