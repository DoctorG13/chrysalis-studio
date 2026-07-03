import JobCard from "./JobCard";

export default function JobList({
  jobs = [],
  onJobClick,
}) {
  if (jobs.length === 0) {
    return (
      <p
        style={{
          color: "#777",
        }}
      >
        No jobs have been created yet.
      </p>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: 16,
      }}
    >
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          onClick={onJobClick}
        />
      ))}
    </div>
  );
}