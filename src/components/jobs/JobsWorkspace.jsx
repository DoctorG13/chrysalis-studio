import { useMemo, useRef, useState, useEffect } from "react";

import JobsSection from "./JobsSection";
import JobEditor from "./JobEditor";
import Button from "../common/Button";
export default function JobsWorkspace({
  jobs = [],
  clients = [],
  setClients,
  onClose,
}) {
  const editorRef = useRef(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("All");
  const [selectedJobId, setSelectedJobId] =
    useState(null);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        search.trim() === "" ||
        job.name
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        job.clientName
          ?.toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" ||
        job.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [jobs, search, statusFilter]);

  const selectedJob =
    filteredJobs.find(
      (job) => job.id === selectedJobId
    ) || null;

    useEffect(() => {
  if (selectedJob && editorRef.current) {
    editorRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}, [selectedJob]);

  function saveJob(updatedJob) {
    const updatedClients = clients.map((client) => {
      if (client.id !== updatedJob.clientId)
        return client;

      return {
        ...client,
        jobs: (client.jobs || []).map((job) =>
          job.id === updatedJob.id
            ? updatedJob
            : job
        ),
      };
    });

    setClients(updatedClients);
  }

  function deleteJob(jobId) {
    const updatedClients = clients.map(
      (client) => ({
        ...client,
        jobs: (client.jobs || []).filter(
          (job) => job.id !== jobId
        ),
      })
    );

    setClients(updatedClients);
    setSelectedJobId(null);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
        padding: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
            }}
          >
            Jobs Workspace
          </h1>

          <div
            style={{
              color: "#777",
              marginTop: 6,
            }}
          >
            {filteredJobs.length} Jobs
          </div>
        </div>

        <Button onClick={onClose}>
          Close
        </Button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <input
          placeholder="Search jobs..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          style={{
            flex: 1,
            minWidth: 260,
            padding: 10,
            borderRadius: 8,
            border:
              "1px solid #ccc",
          }}
        />

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(
              e.target.value
            )
          }
          style={{
            padding: 10,
            borderRadius: 8,
          }}
        >
          <option>All</option>
          <option>New</option>
          <option>In Progress</option>
          <option>Ready</option>
          <option>Completed</option>
        </select>
      </div>

     <>
  <JobsSection
  jobs={filteredJobs}
  selectedJobId={selectedJobId}
  onOpenJob={(job) => setSelectedJobId(job.id)}
  onNewJob={() => {}}
/>

  {selectedJob && (
  <div
    ref={editorRef}
    style={{
      marginTop: 24,
      borderTop: "1px solid #ddd",
      paddingTop: 24,
    }}
    >
      <JobEditor
        job={selectedJob}
        onSave={saveJob}
        onDelete={deleteJob}
        onCancel={() => setSelectedJobId(null)}
      />
    </div>
  )}
</>
    </div>
  );
}