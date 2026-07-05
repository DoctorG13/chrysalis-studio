import { useState } from "react";

import SlidePanel from "../common/SlidePanel";

import JobsSection from "../workspace/JobsSection";
import JobForm from "../jobs/JobForm";
import JobEditor from "../workspace/JobEditor";

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

  const [selectedJob, setSelectedJob] =
    useState(null);

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

    // Automatically open the newly created job
    setSelectedJob(job);
  }

  function handleOpenJob(job) {
    setSelectedJob(job);
  }

  function handleSaveJob(job) {
    const updatedJobs = jobs.map((j) =>
      j.id === job.id ? job : j
    );

    updateClient(updatedJobs);

    // Keep the editor open using the latest data
    setSelectedJob(job);
  }

  return (
    <>
      <JobsSection
        jobs={jobs}
        onNewJob={() => setShowJobForm(true)}
        onOpenJob={handleOpenJob}
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
        onClose={() => setSelectedJob(null)}
      >
        {selectedJob && (
          <JobEditor
            job={selectedJob}
            onSave={handleSaveJob}
            onCancel={() => setSelectedJob(null)}
          />
        )}
      </SlidePanel>
    </>
  );
}