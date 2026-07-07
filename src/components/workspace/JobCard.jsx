import Button from "../common/Button";

const WORKFLOW = [
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

const STATUS_COLOURS = {
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

export default function JobCard({
  job,
  onOpen,
}) {
  const quote = Number(job.price || 0);
  const deposit = Number(job.deposit || 0);
  const balance = Math.max(0, quote - deposit);

  const currentStep = Math.max(
    0,
    WORKFLOW.indexOf(job.status)
  );

  const progress =
    job.status === "Completed"
      ? 100
      : Math.round(
          (currentStep / (WORKFLOW.length - 1)) *
            100
        );

  const latestActivity =
    job.timeline?.length > 0
      ? job.timeline[0]
      : null;

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: 20,
        boxShadow:
          "0 2px 8px rgba(0,0,0,.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 20,
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              color: "#2F3A3F",
            }}
          >
            {job.name}
          </h3>

          <div
            style={{
              marginTop: 6,
              color: "#666",
            }}
          >
            {job.garmentType || "General Job"}
          </div>
        </div>

        <div
          style={{
            background:
              STATUS_COLOURS[job.status] ||
              "#64748B",
            color: "#fff",
            padding: "6px 14px",
            borderRadius: 30,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {job.status}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(160px,1fr))",
          gap: 18,
          marginBottom: 20,
        }}
      >
        <div>
          <strong>Due Date</strong>
          <div>{job.dueDate || "-"}</div>
        </div>

        <div>
          <strong>Quoted Price</strong>
          <div>${quote.toFixed(2)}</div>
        </div>

        <div>
          <strong>Deposit Paid</strong>
          <div>${deposit.toFixed(2)}</div>
        </div>

        <div>
          <strong>Outstanding</strong>
          <div>${balance.toFixed(2)}</div>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <span>Production Progress</span>
          <span>{progress}%</span>
        </div>

        <div
          style={{
            height: 10,
            background: "#ECECEC",
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background:
                STATUS_COLOURS[job.status] ||
                "#7B3FF2",
              transition:
                "width .3s ease",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginTop: 12,
          }}
        >
          {WORKFLOW.map((step, index) => {
            const active =
              index === currentStep;
            const complete =
              index < currentStep;

            return (
              <span
                key={step}
                style={{
                  padding: "4px 8px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  background: complete
                    ? "#DCFCE7"
                    : active
                    ? "#DBEAFE"
                    : "#F3F4F6",
                  color: complete
                    ? "#166534"
                    : active
                    ? "#1D4ED8"
                    : "#6B7280",
                }}
              >
                {complete
                  ? "✓ "
                  : active
                  ? "● "
                  : ""}
                {step}
              </span>
            );
          })}
        </div>
      </div>

      {latestActivity && (
        <div
          style={{
            marginBottom: 20,
            padding: 12,
            borderRadius: 8,
            background: "#F8F9FA",
          }}
        >
          <div
            style={{
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Latest Activity
          </div>

          <div>{latestActivity.title}</div>

          <div
            style={{
              fontSize: 12,
              color: "#666",
              marginTop: 4,
            }}
          >
            {new Date(
              latestActivity.date
            ).toLocaleString("en-AU")}
          </div>
        </div>
      )}

      {job.notes && (
        <div
          style={{
            marginBottom: 20,
            color: "#555",
            lineHeight: 1.5,
          }}
        >
          {job.notes}
        </div>
      )}

      <Button onClick={() => onOpen(job)}>
        Open Job
      </Button>
    </div>
  );
}