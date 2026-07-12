import { useState } from "react";

import SlidePanel from "../common/SlidePanel";

import JobForm from "../jobs/JobForm";
import JobsSection from "../jobs/JobsSection";
import JobEditor from "../jobs/JobEditor";

export default function ClientJobsPanel({
  client,
  clients,
  setClients,
}) {
  const currentClient =
    clients.find((c) => c.id === client.id) || client;

  const jobs = currentClient.jobs || [];

  const [showJobForm, setShowJobForm] =
    useState(false);

  const [selectedJobId, setSelectedJobId] =
    useState(null);

  const selectedJob =
    jobs.find((job) => job.id === selectedJobId) ||
    null;

  function updateClient(updatedJobs) {
    const updatedClient = {
      ...currentClient,
      jobs: updatedJobs,
    };

    setClients(
      clients.map((c) =>
        c.id === currentClient.id
          ? updatedClient
          : c
      )
    );
  }

  function handleCreateJob(job) {
    const updatedJobs = [...jobs, job];

    updateClient(updatedJobs);

    setShowJobForm(false);

    setSelectedJobId(job.id);
  }

  function handleOpenJob(job) {
    setSelectedJobId(job.id);
  }

  function handleSaveJob(job) {
    const updatedJobs = jobs.map((j) =>
      j.id === job.id ? job : j
    );

    updateClient(updatedJobs);

    setSelectedJobId(job.id);
  }

  function handleDeleteJob(jobId) {
    const updatedJobs = jobs.filter(
      (job) => job.id !== jobId
    );

    updateClient(updatedJobs);

    setSelectedJobId(null);
  }

  return (
    <>
      <JobsSection
        jobs={jobs}
        onNewJob={() =>
          setShowJobForm(true)
        }
        onOpenJob={handleOpenJob}
      />

      <SlidePanel
        open={showJobForm}
        onClose={() =>
          setShowJobForm(false)
        }
      >
        <JobForm
          onSave={handleCreateJob}
          onCancel={() =>
            setShowJobForm(false)
          }
        />
      </SlidePanel>

      <SlidePanel
        open={!!selectedJob}
        onClose={() =>
          setSelectedJobId(null)
        }
      >
        {selectedJob && (
          <JobEditor
            job={selectedJob}
            onSave={handleSaveJob}
            onDelete={handleDeleteJob}
            onCancel={() =>
              setSelectedJobId(null)
            }
          />
        )}
      </SlidePanel>
    </>
  );
}