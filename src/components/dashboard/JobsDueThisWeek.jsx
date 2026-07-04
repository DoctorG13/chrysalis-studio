import Card from "../common/Card";
import EmptyState from "../common/EmptyState";

import { getJobsDueThisWeek } from "../../utils/dashboard";

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
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        border: "1px solid #E5E7EB",
        borderRadius: 10,
        background: "#FFFFFF",
      }}
    >
      <div>
        <div
          style={{
            fontWeight: 600,
          }}
        >
          {job.name}
        </div>

        <div
          style={{
            fontSize: 13,
            color: "#777",
            marginTop: 4,
          }}
        >
          {job.status}
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