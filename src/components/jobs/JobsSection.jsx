import JobCard from "./JobCard";
import Button from "../common/Button";

export default function JobsSection({
  jobs = [],
  onNewJob,
  onOpenJob,
}) {

  const activeJobs = jobs.filter(
    (job) => job.status !== "Completed"
  );

  const completedJobs = jobs.filter(
    (job) => job.status === "Completed"
  );

  const outstanding = jobs.reduce(
    (total, job) =>
      total +
      Math.max(
        0,
        Number(job.price || 0) -
          Number(job.deposit || 0)
      ),
    0
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              color: "#2F3A3F",
            }}
          >
            Jobs
          </h2>

          <div
            style={{
              color: "#666",
              marginTop: 4,
            }}
          >
            {jobs.length} Total Jobs
          </div>
        </div>

        <Button onClick={onNewJob}>
          + New Job
        </Button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(180px,1fr))",
          gap: 20,
        }}
      >
        <SummaryCard
          title="Total Jobs"
          value={jobs.length}
        />

        <SummaryCard
          title="Active"
          value={activeJobs.length}
        />

        <SummaryCard
          title="Completed"
          value={completedJobs.length}
        />

        <SummaryCard
          title="Outstanding"
          value={`$${outstanding.toFixed(2)}`}
        />
      </div>

      {jobs.length === 0 ? (
        <div
          style={{
            border: "2px dashed #DDD",
            borderRadius: 12,
            padding: 60,
            textAlign: "center",
          }}
        >
          <h3>No Jobs Yet</h3>

          <p>Create your first job to begin.</p>

          <Button onClick={onNewJob}>
            Create Job
          </Button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill,minmax(380px,1fr))",
            gap: 20,
          }}
        >
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onOpen={onOpenJob}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  title,
  value,
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: 20,
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: "#777",
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 28,
          fontWeight: 700,
          color: "#2F3A3F",
        }}
      >
        {value}
      </div>
    </div>
  );
}