import { useMemo, useRef, useState, useEffect } from "react";

import JobsSection from "./JobsSection";
import JobEditor from "./JobEditor";
import Button from "../common/Button";

export default function JobsWorkspace({
  jobs = [],
  clients = [],
  updateJob,
  deleteJob,
  onClose,
}) {
  const editorRef = useRef(null);
  const feedbackTimerRef = useRef(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(null);

  const clientLookup = useMemo(() => {
    return new Map(
      clients.map((client) => [client.id, client])
    );
  }, [clients]);

  const searchableJobs = useMemo(() => {
    return jobs.map((job) => {
      const client = clientLookup.get(job.clientId);

      return {
        ...job,
        searchIndex: [
          job.name,
          job.clientName,
          client?.phone,
          job.reference,
          job.status,
          job.dueDate,
          job.nextAction,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
      };
    });
  }, [jobs, clientLookup]);

  const filteredJobs = useMemo(() => {
    const term = search.trim().toLowerCase();

    return searchableJobs.filter((job) => {
      const matchesSearch =
        term === "" ||
        job.searchIndex.includes(term);

      const matchesStatus =
        statusFilter === "All" ||
        job.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [searchableJobs, search, statusFilter]);

  const selectedJob =
    filteredJobs.find(
      (job) => job.id === selectedJobId
    ) || null;

  useEffect(() => {
    if (filteredJobs.length === 1) {
      setSelectedJobId(filteredJobs[0].id);
    }
  }, [filteredJobs]);

  useEffect(() => {
    if (selectedJob && editorRef.current) {
      editorRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selectedJob]);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  function showSaveFeedback(type, message) {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }

    setSaveFeedback({ type, message });

    if (type === "success") {
      feedbackTimerRef.current = setTimeout(() => {
        setSaveFeedback(null);
      }, 4000);
    }
  }

  async function saveJob(updatedJob) {
    const existing =
      jobs.find((job) => job.id === updatedJob.id) ||
      updatedJob;

    const timeline = [...(updatedJob.timeline || [])];

    if (existing.status === updatedJob.status) {
      timeline.push({
        id: crypto.randomUUID(),
        type: "note",
        title: "Job Updated",
        description: "Job information updated.",
        date: new Date().toISOString(),
      });
    }

    setIsSaving(true);
    setSaveFeedback(null);

    try {
      await updateJob({
        ...updatedJob,
        timeline,
        updatedAt: new Date().toISOString(),
      });

      showSaveFeedback(
        "success",
        "Job saved successfully."
      );
    } catch (error) {
      showSaveFeedback(
        "error",
        error instanceof Error
          ? error.message
          : "Unable to save job."
      );
      throw error;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteJob(jobId) {
    setIsSaving(true);
    setSaveFeedback(null);

    try {
      await deleteJob(jobId);
      setSelectedJobId(null);
    } finally {
      setIsSaving(false);
    }
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
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Jobs Workspace</h1>

          <div
            style={{
              color: "#777",
              marginTop: 6,
            }}
          >
            Showing {filteredJobs.length} of {jobs.length} jobs
          </div>
        </div>

        <Button onClick={onClose}>Close</Button>
      </div>

      {saveFeedback && (
        <div
          role="status"
          aria-live="polite"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 18px",
            borderRadius: 12,
            background:
              saveFeedback.type === "success"
                ? "#ECFDF5"
                : "#FEF2F2",
            border:
              saveFeedback.type === "success"
                ? "1px solid #A7F3D0"
                : "1px solid #FECACA",
            color:
              saveFeedback.type === "success"
                ? "#166534"
                : "#991B1B",
            boxShadow:
              "0 4px 14px rgba(0,0,0,0.08)",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          <span style={{ fontSize: 18 }}>
            {saveFeedback.type === "success" ? "✓" : "⚠"}
          </span>
          <span>{saveFeedback.message}</span>
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          placeholder="Search client, garment, reference, phone..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{
            flex: 1,
            minWidth: 320,
            padding: 10,
            borderRadius: 8,
            border: "1px solid #ccc",
          }}
        />

        {search && (
          <Button onClick={() => setSearch("")}>Clear</Button>
        )}

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
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

      {isSaving && (
        <div style={{ color: "#777", fontSize: 13 }}>
          Saving job…
        </div>
      )}

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
            onDelete={handleDeleteJob}
            onCancel={() => setSelectedJobId(null)}
          />
        </div>
      )}
    </div>
  );
}
