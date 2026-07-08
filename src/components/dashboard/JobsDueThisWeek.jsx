import Card from "../common/Card";
import EmptyState from "../common/EmptyState";

import {
  getJobsDueThisWeek,
  getJobHealth,
} from "../../utils/dashboard";

export default function JobsDueThisWeek({
  clients = [],
}) {
  const jobs = getJobsDueThisWeek(clients);

  return (
    <Card title="Jobs Due This Week">
      {jobs.length === 0 ? (
        <EmptyState
          icon="🧵"
          title="Nothing Due"
          message="No garments are due this week."
        />
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {jobs.map((job) => (
            <JobRow
              key={job.id}
              job={job}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function JobRow({ job }) {
  const health = getJobHealth(job);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderRadius: 10,
        background: "#FFFFFF",
        border: `2px solid ${health.colour}`,
      }}
    >
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 600,
          }}
        >
          <span>{health.icon}</span>
          <span>{job.name}</span>
        </div>

        <div
          style={{
            marginTop: 6,
            fontSize: 13,
            color: "#666",
          }}
        >
          {job.status}
        </div>

        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            color: health.colour,
            fontWeight: 600,
          }}
        >
          {health.label}
        </div>
      </div>

      <div
        style={{
          textAlign: "right",
        }}
      >
        <div
          style={{
            fontWeight: 600,
          }}
        >
          {job.dueDate}
        </div>

        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            color: "#999",
          }}
        >
          Due Date
        </div>
      </div>
    </div>
  );
}