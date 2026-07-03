import Button from "../common/Button";

const STATUS_COLOURS = {
  Quote: "#6B7280",
  "Awaiting Deposit": "#F59E0B",
  "Waiting For Fabric": "#8B5CF6",
  "In Progress": "#2563EB",
  "Ready For Fitting": "#0EA5E9",
  "Ready For Collection": "#10B981",
  Completed: "#16A34A",
};

export default function JobCard({
  job,
  onOpen,
}) {
  const quote = Number(job.price || 0);
  const deposit = Number(job.deposit || 0);
  const balance = Math.max(0, quote - deposit);

  const progressMap = {
    Quote: 5,
    "Awaiting Deposit": 15,
    "Waiting For Fabric": 30,
    "In Progress": 55,
    "Ready For Fitting": 75,
    "Ready For Collection": 95,
    Completed: 100,
  };

  const progress =
    progressMap[job.status] ?? 0;

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

      <div
        style={{
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            marginBottom: 8,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <span>Progress</span>
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
              background: "#7B3FF2",
              transition:
                "width .3s ease",
            }}
          />
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

      <Button
        onClick={() => onOpen(job)}
      >
        Open Job
      </Button>
    </div>
  );
}