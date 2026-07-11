import { useEffect, useState } from "react";

import Button from "../common/Button";

import JobTabs from "./JobTabs";
import JobOverview from "./JobOverview";
import JobDetailsPanel from "./JobDetailsPanel";
import JobMeasurements from "./JobMeasurements";
import JobPayments from "./JobPayments";
import JobTimeline from "./JobTimeline";
import JobFittings from "./JobFittings";
import JobPhotos from "./JobPhotos";

export default function JobEditor({
  job,
  onSave,
  onCancel,
}) {
  const [activeTab, setActiveTab] =
    useState("Overview");

  const [editedJob, setEditedJob] =
    useState(job);

  useEffect(() => {
    setEditedJob(job);
    setActiveTab("Overview");
  }, [job]);

  if (!editedJob) return null;

  function renderTab() {
    switch (activeTab) {
      case "Overview":
        return (
          <JobOverview
            job={editedJob}
          />
        );

      case "Details":
        return (
          <JobDetailsPanel
            job={editedJob}
            onChange={setEditedJob}
          />
        );

      case "Measurements":
        return (
          <JobMeasurements
            job={editedJob}
          />
        );

      case "Payments":
        return (
          <JobPayments
            job={editedJob}
          />
        );

      case "Fittings":
        return (
          <JobFittings
            job={editedJob}
            onAddFitting={() => {}}
            onEditFitting={() => {}}
          />
        );

      case "Photos":
        return (
          <JobPhotos
            job={editedJob}
            onAddPhoto={() => {}}
            onOpenPhoto={() => {}}
          />
        );

      case "Timeline":
        return (
          <JobTimeline
            job={editedJob}
          />
        );

      default:
        return (
          <JobOverview
            job={editedJob}
          />
        );
    }
  }

  function handleSave() {
    onSave?.(editedJob);
  }

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
          justifyContent:
            "space-between",
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
            {editedJob.name}
          </h2>

          <div
            style={{
              marginTop: 6,
              color: "#777",
            }}
          >
            {editedJob.garmentType ||
              "General Job"}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
          }}
        >
          <Button
            onClick={handleSave}
          >
            💾 Save
          </Button>

          <Button
            onClick={onCancel}
          >
            Close
          </Button>
        </div>
      </div>

      <JobTabs
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {renderTab()}
    </div>
  );
}