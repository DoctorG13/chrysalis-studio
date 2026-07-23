import { useEffect, useState } from "react";

import SlidePanel from "../common/SlidePanel";

import JobForm from "../jobs/JobForm";
import JobsSection from "../jobs/JobsSection";
import JobEditor from "../jobs/JobEditor";

export default function ClientJobsPanel({
  client,
  clients,
  setClients,
  initialJobId,
}) {
  const currentClient =
    clients.find((c) => c.id === client.id) || client;

  const jobs = currentClient.jobs || [];

  const [showJobForm, setShowJobForm] =
    useState(false);

  const [selectedJobId, setSelectedJobId] =
    useState(null);

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

  function updateClient(updatedJobs) {
  console.group("updateClient");

  console.log("Current Client:", currentClient);
  console.log("Jobs BEFORE:", jobs);
  console.log("Jobs AFTER :", updatedJobs);

  const updatedClient = {
    ...currentClient,
    jobs: updatedJobs,
  };

  const updatedClients = clients.map((c) =>
    c.id === currentClient.id ? updatedClient : c
  );

  console.log("Updated Client:", updatedClient);
  console.log("Updated Clients:", updatedClients);

  console.groupEnd();

  setClients(updatedClients);
}

function createTimelineEvent(type, title, description = "") {
  return {
    id: crypto.randomUUID(),
    type,
    title,
    description,
    date: new Date().toISOString(),
  };
}

  function handleCreateJob(job) {

      const today = new Date();

  const datePart =
    String(today.getDate()).padStart(2, "0") +
    String(today.getMonth() + 1).padStart(2, "0") +
    today.getFullYear();

  const todaysJobs = jobs.filter((j) =>
    j.reference?.startsWith(`CHR-${datePart}-`)
  );

  const nextNumber = String(
    todaysJobs.length + 1
  ).padStart(3, "0");

  job.reference = `CHR-${datePart}-${nextNumber}`;

  job.timeline = [
  createTimelineEvent(
    "created",
    "Job Created",
    `Reference ${job.reference} created.`
  ),
];

  console.group("CREATE JOB");

  console.log("Jobs before create:", jobs);
  console.log("New Job:", job);

  const updatedJobs = [...jobs, job];

  console.log("Jobs after create:", updatedJobs);

  updateClient(updatedJobs);

  setShowJobForm(false);
  setSelectedJobId(job.id);

  console.groupEnd();
}

function handleOpenJob(job) {
  setSelectedJobId(job.id);
}


  function handleSaveJob(job) {
  console.group("SAVE JOB");

  console.log("Jobs before save:", jobs);
  console.log("Saving:", job);

  const updatedJobs = jobs.map((j) => {
  if (j.id !== job.id) {
    return j;
  }

  const timeline = [...(job.timeline || [])];

  if (j.status !== job.status) {
    timeline.push(
      createTimelineEvent(
        "status",
        "Status Changed",
        `${j.status || "Unknown"} → ${job.status}`
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

  return {
    ...job,
    timeline,
  };
});

  console.log("Jobs after save:", updatedJobs);

  updateClient(updatedJobs);

  setSelectedJobId(job.id);

  console.groupEnd();
}

  function handleDeleteJob(jobId) {
  console.group("DELETE JOB");

  console.log("Jobs before delete:", jobs);
  console.log("Deleting:", jobId);

  const updatedJobs = jobs.filter(
    (job) => job.id !== jobId
  );

  console.log("Jobs after delete:", updatedJobs);

  updateClient(updatedJobs);

  setSelectedJobId(null);

  console.groupEnd();
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