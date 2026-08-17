import { useEffect, useState } from "react";

import SlidePanel from "../common/SlidePanel";

import JobForm from "../jobs/JobForm";
import JobsSection from "../jobs/JobsSection";
import JobEditor from "../jobs/JobEditor";

export default function ClientJobsPanel({
  client,
  clients,
  createJob,
  updateJob,
  deleteJob,
  initialJobId,
}) {
  const currentClient =
    clients.find((c) => c.id === client.id) || client;

  const jobs = currentClient.jobs || [];

  const [showJobForm, setShowJobForm] =
    useState(false);

  const [selectedJobId, setSelectedJobId] =
    useState(null);

  const [isSaving, setIsSaving] =
    useState(false);

  useEffect(() => {
    if (!initialJobId) return;

    const exists = jobs.some(
      (job) => job.id === initialJobId
    );

    if (exists) {
      setSelectedJobId(initialJobId);
    }
  }, [initialJobId, jobs]);

  const selectedJob =
    jobs.find((job) => job.id === selectedJobId) ||
    null;

  function createTimelineEvent(
    type,
    title,
    description = ""
  ) {
    return {
      id: crypto.randomUUID(),
      type,
      title,
      description,
      date: new Date().toISOString(),
    };
  }

  function makeJobReference() {
    const today = new Date();

    const datePart =
      String(today.getDate()).padStart(2, "0") +
      String(today.getMonth() + 1).padStart(2, "0") +
      today.getFullYear();

    const todaysJobs = jobs.filter((job) =>
      job.reference?.startsWith(`CHR-${datePart}-`)
    );

    return `CHR-${datePart}-${String(
      todaysJobs.length + 1
    ).padStart(3, "0")}`;
  }

  async function handleCreateJob(job) {
    const jobToSave = {
      ...job,
      clientId: currentClient.id,
      reference: makeJobReference(),
      timeline: [
        createTimelineEvent(
          "created",
          "Job Created",
          `Reference ${makeJobReference()} created.`
        ),
      ],
    };

    setIsSaving(true);

    try {
      const savedJob = await createJob(jobToSave);
      setShowJobForm(false);
      setSelectedJobId(savedJob.id);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveJob(job) {
    const existing =
      jobs.find((item) => item.id === job.id) || job;

    const timeline = [...(job.timeline || [])];

    if (existing.status !== job.status) {
      timeline.push(
        createTimelineEvent(
          "status",
          "Status Changed",
          `${existing.status || "Unknown"} → ${job.status}`
        )
      );
    } else {
      timeline.push(
        createTimelineEvent(
          "note",
          "Job Updated",
          "Job information updated."
        )
      );
    }

    const updatedJob = {
      ...job,
      clientId: currentClient.id,
      updatedAt: new Date().toISOString(),
      collectedAt:
        job.status === "Collected"
          ? (existing.collectedAt ?? new Date().toISOString())
          : existing.collectedAt,
      timeline,
    };

    setIsSaving(true);

    try {
      await updateJob(updatedJob);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteJob(jobId) {
    if (
      !window.confirm(
        "Delete this job? This cannot be undone."
      )
    ) {
      return;
    }

    setIsSaving(true);

    try {
      await deleteJob(jobId);
      setSelectedJobId(null);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      {isSaving && (
        <div
          style={{
            marginBottom: 12,
            color: "#777",
            fontSize: 13,
          }}
        >
          Saving job…
        </div>
      )}

      <JobsSection
        jobs={jobs}
        onNewJob={() => setShowJobForm(true)}
        onOpenJob={(job) => setSelectedJobId(job.id)}
      />

      <SlidePanel
        open={showJobForm}
        onClose={() => setShowJobForm(false)}
      >
        <JobForm
          onSave={handleCreateJob}
          onCancel={() => setShowJobForm(false)}
        />
      </SlidePanel>

      <SlidePanel
        open={!!selectedJob}
        onClose={() => setSelectedJobId(null)}
      >
        {selectedJob && (
          <JobEditor
            job={selectedJob}
            onSave={handleSaveJob}
            onDelete={handleDeleteJob}
            onCancel={() => setSelectedJobId(null)}
          />
        )}
      </SlidePanel>
    </>
  );
}
