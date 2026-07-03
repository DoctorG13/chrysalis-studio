import { useState } from "react";

import Button from "../common/Button";

import JobTabs from "../jobs/JobTabs";
import JobOverview from "../jobs/JobOverview";
import JobMeasurements from "../jobs/JobMeasurements";
import JobPayments from "../jobs/JobPayments";
import JobTimeline from "../jobs/JobTimeline";
import JobFittings from "../jobs/JobFittings";
import JobPhotos from "../jobs/JobPhotos";

export default function JobEditor({
  job,
  onSave,
  onCancel,
}) {
  const [activeTab, setActiveTab] =
    useState("Overview");

  if (!job) return null;

  function renderTab() {
    switch (activeTab) {
      case "Overview":
        return (
          <JobOverview job={job} />
        );

      case "Measurements":
        return (
          <JobMeasurements
            job={job}
          />
        );

      case "Payments":
        return (
          <JobPayments job={job} />
        );

      case "Fittings":
        return (
          <JobFittings
            job={job}
            onAddFitting={() => {}}
            onEditFitting={() => {}}
          />
        );

      case "Photos":
        return (
          <JobPhotos
            job={job}
            onAddPhoto={() => {}}
            onOpenPhoto={() => {}}
          />
        );

      case "Timeline":
        return (
          <JobTimeline job={job} />
        );

      default:
        return (
          <JobOverview job={job} />
        );
    }
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
            {job.name}
          </h2>

          <div
            style={{
              marginTop: 6,
              color: "#777",
            }}
          >
            {job.garmentType ||
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
            onClick={() =>
              onSave?.(job)
            }
          >
            Save
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