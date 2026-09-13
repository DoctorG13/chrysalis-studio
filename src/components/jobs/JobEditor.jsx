import { useEffect, useRef, useState } from "react";

import Button from "../common/Button";
import { ThriveDialog, useThriveDialog } from "../common/ThriveDialog";
import {
  JOB_WORKFLOW,
  PRODUCTION_WORKFLOW,
  getWorkflowIndex,
  getNextAction,
} from "../../constants/jobWorkflow";

import JobTabs from "./JobTabs";
import JobDetailsPanel from "./JobDetailsPanel";
import JobMeasurements from "./JobMeasurements";
import JobPayments from "./JobPayments";
import JobTimeline from "./JobTimeline";
import JobFittings from "./JobFittings";
import JobPhotos from "./JobPhotos";

const WORKFLOW_STAGES = JOB_WORKFLOW;
const LABOUR_WORKFLOW_STAGES = PRODUCTION_WORKFLOW.filter(
  (stage) => stage !== "Ready"
);

const CHECKLIST_ITEMS = [
  ["measurements", "Measurements confirmed"],
  ["materials", "Fabric / materials ready"],
  ["cutting", "Pattern / cutting complete"],
  ["construction", "Construction complete"],
  ["fitting", "Fitting complete"],
  ["alterations", "Final alterations complete"],
  ["ready", "Ready for collection"],
];

export default function JobEditor({
  job,
  onSave,
  onDelete,
  onCancel,
}) {
  const [activeTab, setActiveTab] =
    useState("Overview");

  const { confirm, dialogProps } = useThriveDialog();

  const [editedJob, setEditedJob] =
    useState(job);

  const [isSaving, setIsSaving] =
    useState(false);

  const [saveFeedback, setSaveFeedback] =
    useState(null);

  const feedbackTimerRef = useRef(null);

  const [showFittingForm, setShowFittingForm] =
    useState(false);

  const [editingFitting, setEditingFitting] =
    useState(null);

  const [showPhotoForm, setShowPhotoForm] =
    useState(false);

  const [selectedPhoto, setSelectedPhoto] =
    useState(null);

  const [editingPhoto, setEditingPhoto] =
    useState(null);

  const [defaultLabourRate, setDefaultLabourRate] =
    useState(0);

  useEffect(() => {
    let active = true;

    async function loadDefaultLabourRate() {
      try {
        const response = await fetch("/api/settings", {
          credentials: "same-origin",
          cache: "no-store",
        });

        if (!response.ok) return;

        const payload = await response.json();
        const rate = Number(payload?.settings?.jobs?.defaultLabourHourlyRate);

        if (active && Number.isFinite(rate) && rate >= 0) {
          setDefaultLabourRate(rate);
        }
      } catch (error) {
        console.warn("Unable to load default labour hourly rate.", error);
      }
    }

    loadDefaultLabourRate();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setEditedJob(job);
    setActiveTab("Overview");
    setShowFittingForm(false);
    setEditingFitting(null);
    setShowPhotoForm(false);
    setSelectedPhoto(null);
    setEditingPhoto(null);
  }, [job]);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  if (!editedJob) return null;

  function showSaveFeedback(type, message) {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }

    setSaveFeedback({ type, message });

    if (type === "success") {
      feedbackTimerRef.current = setTimeout(() => {
        setSaveFeedback(null);
      }, 5000);
    }
  }

  async function handleSave() {
    if (isSaving) return;

    setIsSaving(true);
    setSaveFeedback(null);

    try {
      const workflowHours = editedJob.workflowHours || {};
      const hasWorkflowHours = Object.values(workflowHours).some((entry) =>
        entry &&
        (String(entry.estimated ?? "").trim() !== "" ||
          String(entry.actual ?? "").trim() !== "")
      );

      const jobToSave =
        hasWorkflowHours && editedJob.workflowLabourRate == null
          ? {
              ...editedJob,
              workflowLabourRate: defaultLabourRate,
            }
          : editedJob;

      await onSave?.(jobToSave);
      if (jobToSave !== editedJob) {
        setEditedJob(jobToSave);
      }
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
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = await confirm({
      title: "Delete Job",
      message: `Delete "${editedJob.name}"? This cannot be undone.`,
      confirmLabel: "Delete Job",
      danger: true,
    });

    if (!confirmed) return;

    onDelete?.(editedJob.id);
  }

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

  function addTimelineEvent(
    currentJob,
    event
  ) {
    return {
      ...currentJob,
      timeline: [
        event,
        ...(currentJob.timeline || []),
      ],
    };
  }

  function updateJobField(
    field,
    value
  ) {
    setEditedJob((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleWorkflowStage(stage) {
    if (!stage || stage === editedJob.status) return;

    const previousStage = editedJob.status || "Unassigned";
    const event = createTimelineEvent(
      "workflow",
      "Workflow Stage Changed",
      `${previousStage} → ${stage}`
    );

    setEditedJob(
      addTimelineEvent(
        {
          ...editedJob,
          status: stage,
        },
        event
      )
    );
  }

  function handleChecklistToggle(key) {
    setEditedJob((current) => ({
      ...current,
      workflowChecklist: {
        ...(current.workflowChecklist || {}),
        [key]: !(
          current.workflowChecklist?.[key] ||
          false
        ),
      },
    }));
  }

  function handleWorkflowHoursChange(stage, field, value) {
    setEditedJob((current) => ({
      ...current,
      workflowHours: {
        ...(current.workflowHours || {}),
        [stage]: {
          ...(current.workflowHours?.[stage] || {}),
          [field]: value,
        },
      },
    }));
  }

  function handleWorkflowLabourRateChange(value) {
    setEditedJob((current) => ({
      ...current,
      workflowLabourRate:
        value === "" ? "" : Math.max(0, Number(value) || 0),
    }));
  }

  function handleAddFitting() {
    setEditingFitting(null);
    setShowFittingForm(true);
  }

  function handleEditFitting(
    fitting
  ) {
    setEditingFitting(fitting);
    setShowFittingForm(true);
  }

  function handleSaveFitting(
    fittingData
  ) {
    const existingFittings =
      editedJob.fittings || [];

    const fittingId =
      editingFitting?.id ||
      crypto.randomUUID();

    const fitting = {
      ...(editingFitting || {}),
      ...fittingData,
      id: fittingId,
    };

    const fittings =
      editingFitting
        ? existingFittings.map(
            (item) =>
              item.id ===
              editingFitting.id
                ? fitting
                : item
          )
        : [
            ...existingFittings,
            fitting,
          ];

    const event =
      createTimelineEvent(
        "fitting",
        editingFitting
          ? "Fitting Updated"
          : "Fitting Added",
        fitting.title ||
          fitting.type ||
          "Fitting"
      );

    setEditedJob(
      addTimelineEvent(
        {
          ...editedJob,
          fittings,
        },
        event
      )
    );

    setShowFittingForm(false);
    setEditingFitting(null);
  }

  function handlePaymentsChange(
    payments,
    event
  ) {
    const nextJob = {
      ...editedJob,
      payments,
    };

    setEditedJob(
      event
        ? addTimelineEvent(
            nextJob,
            event
          )
        : nextJob
    );
  }

  function handleAddPhoto() {
    setShowPhotoForm(true);
  }

  function handleSavePhoto(
    photo
  ) {
    const photos = [
      ...(editedJob.photos || []),
      photo,
    ];

    const event =
      createTimelineEvent(
        "photo",
        "Photo Added",
        photo.caption ||
          "New job photo added."
      );

    setEditedJob(
      addTimelineEvent(
        {
          ...editedJob,
          photos,
        },
        event
      )
    );

    setShowPhotoForm(false);
  }

  function handleEditPhoto(
    photo
  ) {
    setEditingPhoto(photo);
  }

  function handleSavePhotoEdit(
    updatedPhoto
  ) {
    const photos =
      (editedJob.photos || []).map(
        (photo) =>
          photo.id ===
          updatedPhoto.id
            ? {
                ...photo,
                ...updatedPhoto,
              }
            : photo
      );

    const event =
      createTimelineEvent(
        "photo",
        "Photo Updated",
        updatedPhoto.caption ||
          "Job photo updated."
      );

    setEditedJob(
      addTimelineEvent(
        {
          ...editedJob,
          photos,
        },
        event
      )
    );

    setEditingPhoto(null);
  }

  async function handleDeletePhoto(
    photo
  ) {
    const confirmed = await confirm({
      title: "Delete Photo",
      message: `Delete "${
        photo.caption ||
        "this photo"
      }"? This cannot be undone.`,
      confirmLabel: "Delete Photo",
      danger: true,
    });

    if (!confirmed) return;

    const photos =
      (editedJob.photos || []).filter(
        (item) =>
          item.id !== photo.id
      );

    const event =
      createTimelineEvent(
        "photo",
        "Photo Deleted",
        photo.caption ||
          "Job photo deleted."
      );

    setEditedJob(
      addTimelineEvent(
        {
          ...editedJob,
          photos,
        },
        event
      )
    );
  }

  function renderTab() {
    switch (activeTab) {
      case "Overview":
        return (
          <JobWorkspaceOverview
            job={editedJob}
            onWorkflowStage={
              handleWorkflowStage
            }
            onChecklistToggle={
              handleChecklistToggle
            }
            onWorkflowNotesChange={(
              value
            ) =>
              updateJobField(
                "workflowNotes",
                value
              )
            }
            defaultLabourRate={defaultLabourRate}
            onWorkflowLabourRateChange={
              handleWorkflowLabourRateChange
            }
            onWorkflowHoursChange={
              handleWorkflowHoursChange
            }
          />
        );

      case "Details":
        return (
          <JobDetailsPanel
            job={editedJob}
            onChange={
              setEditedJob
            }
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
            onChange={
              handlePaymentsChange
            }
          />
        );

      case "Fittings":
        return (
          <JobFittings
            job={editedJob}
            onAddFitting={
              handleAddFitting
            }
            onEditFitting={
              handleEditFitting
            }
          />
        );

      case "Photos":
        return (
          <JobPhotos
            job={editedJob}
            onAddPhoto={
              handleAddPhoto
            }
            onOpenPhoto={
              setSelectedPhoto
            }
            onEditPhoto={
              handleEditPhoto
            }
            onDeletePhoto={
              handleDeletePhoto
            }
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
          <JobWorkspaceOverview
            job={editedJob}
            onWorkflowStage={
              handleWorkflowStage
            }
            onChecklistToggle={
              handleChecklistToggle
            }
            onWorkflowNotesChange={(
              value
            ) =>
              updateJobField(
                "workflowNotes",
                value
              )
            }
            defaultLabourRate={defaultLabourRate}
            onWorkflowLabourRateChange={
              handleWorkflowLabourRateChange
            }
            onWorkflowHoursChange={
              handleWorkflowHoursChange
            }
          />
        );
    }
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 18,
          minWidth: 0,
        }}
      >
        {/* =====================================================
            JOB HEADER
        ====================================================== */}
        <div
          style={{
            background: "#FFFFFF",
            border:
              "1px solid #E6E8EC",
            borderRadius: 18,
            padding: "22px 26px",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "flex-start",
              gap: 20,
            }}
          >
            <div
              style={{
                minWidth: 0,
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: 30,
                  lineHeight: 1.15,
                  fontWeight: 600,
                  color: "#2F3A3F",
                }}
              >
                {editedJob.name}
              </h1>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 10,
                  marginTop: 10,
                }}
              >
                <span
                  style={{
                    color: "#8B1E3F",
                    fontWeight: 700,
                    letterSpacing: 0.8,
                  }}
                >
                  {editedJob.reference ||
                    "CHR-NEW"}
                </span>

                {editedJob.status && (
                  <StatusBadge
                    status={
                      editedJob.status
                    }
                  />
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onCancel}
              title="Close job"
              style={{
                flexShrink: 0,
                width: 40,
                height: 40,
                borderRadius: 12,
                border: "1px solid #E6E8EC",
                background: "#FFFFFF",
                color: "#667085",
                cursor: "pointer",
                fontSize: 18,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          {saveFeedback && (
            <div
              style={{
                marginTop: 16,
                padding: "11px 14px",
                borderRadius: 10,
                background:
                  saveFeedback.type === "success"
                    ? "#ECFDF3"
                    : "#FEF3F2",
                color:
                  saveFeedback.type === "success"
                    ? "#027A48"
                    : "#B42318",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {saveFeedback.message}
            </div>
          )}
        </div>

        <JobTabs
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {renderTab()}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            marginTop: 4,
          }}
        >
          <Button
            variant="danger"
            onClick={handleDelete}
          >
            Delete Job
          </Button>

          <div
            style={{
              display: "flex",
              gap: 12,
            }}
          >
            <Button
              variant="secondary"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </div>

      {showFittingForm && (
        <FittingEditor
          fitting={editingFitting}
          onSave={handleSaveFitting}
          onCancel={() => {
            setShowFittingForm(false);
            setEditingFitting(null);
          }}
        />
      )}

      {showPhotoForm && (
        <PhotoForm
          onSave={handleSavePhoto}
          onCancel={() =>
            setShowPhotoForm(false)
          }
        />
      )}

      {selectedPhoto && (
        <PhotoLightbox
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}

      {editingPhoto && (
        <PhotoEditDialog
          photo={editingPhoto}
          onSave={handleSavePhotoEdit}
          onCancel={() => setEditingPhoto(null)}
        />
      )}

      <ThriveDialog {...dialogProps} />
    </>
  );
}

function JobWorkspaceOverview({
  job,
  onWorkflowStage,
  onChecklistToggle,
  onWorkflowNotesChange,
  defaultLabourRate,
  onWorkflowLabourRateChange,
  onWorkflowHoursChange,
}) {
  const workflowIndex = getWorkflowIndex(job.status);
  const nextAction = getNextAction(job);

  const workflowHours = job.workflowHours || {};
  const labourRate = Number(
    job.workflowLabourRate ?? defaultLabourRate ?? 0
  );

  const estimatedHours = LABOUR_WORKFLOW_STAGES.reduce(
    (sum, stage) =>
      sum +
      (Number(workflowHours[stage]?.estimated) || 0),
    0
  );

  const actualHours = LABOUR_WORKFLOW_STAGES.reduce(
    (sum, stage) =>
      sum +
      (Number(workflowHours[stage]?.actual) || 0),
    0
  );

  const estimatedLabour = estimatedHours * labourRate;
  const actualLabour = actualHours * labourRate;
  const hourVariance = actualHours - estimatedHours;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      <section
        style={{
          background: "#FFFFFF",
          border: "1px solid #E6E8EC",
          borderRadius: 18,
          padding: 22,
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.03)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            marginBottom: 18,
          }}
        >
          <div>
            <div
              style={{
                color: "#8B1E3F",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              Workflow
            </div>
            <h2
              style={{
                margin: "5px 0 0",
                color: "#2F3A3F",
                fontSize: 22,
              }}
            >
              Production Progress
            </h2>
          </div>

          <div
            style={{
              textAlign: "right",
              color: "#667085",
              fontSize: 13,
            }}
          >
            <div>Current stage</div>
            <strong
              style={{
                color: "#2F3A3F",
                fontSize: 15,
              }}
            >
              {job.status || "Unassigned"}
            </strong>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 10,
          }}
        >
          {WORKFLOW_STAGES.map((stage, index) => {
            const isActive = stage === job.status;
            const isComplete = index < workflowIndex;

            return (
              <button
                key={stage}
                type="button"
                onClick={() => onWorkflowStage(stage)}
                style={{
                  textAlign: "left",
                  border: isActive
                    ? "1px solid #8B1E3F"
                    : "1px solid #E6E8EC",
                  background: isActive
                    ? "#FFF5F8"
                    : isComplete
                    ? "#F8FAFC"
                    : "#FFFFFF",
                  borderRadius: 12,
                  padding: "12px 13px",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "#98A2B3",
                    fontWeight: 700,
                    marginBottom: 5,
                  }}
                >
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div
                  style={{
                    color: isActive
                      ? "#8B1E3F"
                      : "#344054",
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  {stage}
                </div>
              </button>
            );
          })}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginTop: 20,
          }}
        >
          <div
            style={{
              padding: 16,
              borderRadius: 14,
              background: "#F8FAFC",
            }}
          >
            <div
              style={{
                color: "#667085",
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              Next action
            </div>
            <div
              style={{
                marginTop: 6,
                color: "#2F3A3F",
                fontWeight: 700,
              }}
            >
              {nextAction || "—"}
            </div>
          </div>

          <div
            style={{
              padding: 16,
              borderRadius: 14,
              background: "#F8FAFC",
            }}
          >
            <div
              style={{
                color: "#667085",
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              Progress
            </div>
            <div
              style={{
                marginTop: 6,
                color: "#2F3A3F",
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              {Math.round(
                (workflowIndex /
                  (WORKFLOW_STAGES.length - 1)) *
                  100
              ) || 0}
              %
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          background: "#FFFFFF",
          border: "1px solid #E6E8EC",
          borderRadius: 18,
          padding: 22,
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.03)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div>
            <div
              style={{
                color: "#8B1E3F",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              Checklist
            </div>
            <h2
              style={{
                margin: "5px 0 0",
                color: "#2F3A3F",
                fontSize: 22,
              }}
            >
              Production Checks
            </h2>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 10,
          }}
        >
          {CHECKLIST_ITEMS.map(([key, label]) => {
            const checked = Boolean(
              job.workflowChecklist?.[key]
            );

            return (
              <label
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 13px",
                  border: "1px solid #E6E8EC",
                  borderRadius: 12,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    onChecklistToggle(key)
                  }
                />
                <span
                  style={{
                    color: "#344054",
                    fontSize: 14,
                  }}
                >
                  {label}
                </span>
              </label>
            );
          })}
        </div>

        <div style={{ marginTop: 18 }}>
          <label
            style={{
              display: "block",
              color: "#475467",
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 7,
            }}
          >
            Workflow Notes
          </label>
          <textarea
            value={job.workflowNotes || ""}
            onChange={(event) =>
              onWorkflowNotesChange(event.target.value)
            }
            rows={4}
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: "1px solid #D0D5DD",
              borderRadius: 10,
              padding: 12,
              fontFamily: "inherit",
              resize: "vertical",
            }}
          />
        </div>
      </section>

      <section
        style={{
          background: "#FFFFFF",
          border: "1px solid #E6E8EC",
          borderRadius: 18,
          padding: 22,
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.03)",
        }}
      >
        <div
          style={{
            marginBottom: 16,
          }}
        >
          <div
            style={{
              color: "#8B1E3F",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}
          >
            Labour Hours
          </div>
          <h2
            style={{
              margin: "5px 0 0",
              color: "#2F3A3F",
              fontSize: 22,
            }}
          >
            Production Labour
          </h2>
          <p
            style={{
              margin: "7px 0 0",
              color: "#667085",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            Record estimated and actual labour against production stages only.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(260px, 1.6fr) repeat(2, minmax(120px, 0.8fr)) minmax(120px, 0.8fr)",
            gap: 0,
            border: "1px solid #E6E8EC",
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          <div style={tableHeaderStyle}>Production Stage</div>
          <div style={tableHeaderStyle}>Estimated</div>
          <div style={tableHeaderStyle}>Actual</div>
          <div style={tableHeaderStyle}>Labour</div>

          {LABOUR_WORKFLOW_STAGES.map((stage) => {
            const estimated = workflowHours[stage]?.estimated ?? "";
            const actual = workflowHours[stage]?.actual ?? "";
            const stageHours =
              (Number(estimated) || 0) +
              (Number(actual) || 0);
            const stageLabour =
              Number(actual) * labourRate || 0;

            return (
              <div
                key={stage}
                style={{
                  display: "contents",
                }}
              >
                <div style={tableCellStyleStrong}>
                  {stage}
                </div>
                <div style={tableCellStyle}>
                  <input
                    type="number"
                    min="0"
                    step="0.25"
                    value={estimated}
                    onChange={(event) =>
                      onWorkflowHoursChange(
                        stage,
                        "estimated",
                        event.target.value
                      )
                    }
                    style={tableInputStyle}
                  />
                </div>
                <div style={tableCellStyle}>
                  <input
                    type="number"
                    min="0"
                    step="0.25"
                    value={actual}
                    onChange={(event) =>
                      onWorkflowHoursChange(
                        stage,
                        "actual",
                        event.target.value
                      )
                    }
                    style={tableInputStyle}
                  />
                </div>
                <div style={tableCellStyle}>
                  <span
                    style={{
                      fontWeight: 700,
                      color: stageHours
                        ? "#2F3A3F"
                        : "#667085",
                    }}
                  >
                    ${stageLabour.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(5, minmax(150px, 1fr))",
            gap: 10,
            marginTop: 16,
          }}
        >
          <SummaryMetric
            label="Estimated Hours"
            value={`${estimatedHours.toFixed(2)} hrs`}
          />
          <SummaryMetric
            label="Actual Hours"
            value={`${actualHours.toFixed(2)} hrs`}
          />
          <SummaryMetric
            label="Estimated Labour"
            value={`$${estimatedLabour.toFixed(2)}`}
          />
          <SummaryMetric
            label="Actual Labour"
            value={`$${actualLabour.toFixed(2)}`}
          />
          <SummaryMetric
            label="Hour Variance"
            value={`${hourVariance.toFixed(2)} hrs`}
          />
        </div>

        <div
          style={{
            marginTop: 16,
            padding: "11px 13px",
            background: "#F8FAFC",
            borderRadius: 10,
            color: "#667085",
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          The job rate is saved with this job once labour hours are recorded, so changing the Settings default later will not alter historical job costing.
        </div>

        <div
          style={{
            marginTop: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <label
            style={{
              color: "#475467",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Job Labour Rate ($/hr)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={
              job.workflowLabourRate ?? defaultLabourRate ?? 0
            }
            onChange={(event) =>
              onWorkflowLabourRateChange(event.target.value)
            }
            style={{
              width: 130,
              border: "1px solid #D0D5DD",
              borderRadius: 10,
              padding: "9px 11px",
            }}
          />
          <span
            style={{
              color: "#667085",
              fontSize: 12,
            }}
          >
            Default: ${Number(defaultLabourRate || 0).toFixed(2)}/hr
          </span>
        </div>
      </section>
    </div>
  );
}

function SummaryMetric({ label, value }) {
  return (
    <div
      style={{
        padding: 14,
        border: "1px solid #E6E8EC",
        borderRadius: 12,
        background: "#FCFCFD",
      }}
    >
      <div
        style={{
          color: "#667085",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.8,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 5,
          color: "#2F3A3F",
          fontWeight: 700,
          fontSize: 16,
        }}
      >
        {value}
      </div>
    </div>
  );
}

const tableHeaderStyle = {
  padding: "12px 14px",
  background: "#F8FAFC",
  borderBottom: "1px solid #E6E8EC",
  color: "#667085",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.8,
  textTransform: "uppercase",
};

const tableCellStyle = {
  padding: "12px 14px",
  borderBottom: "1px solid #E6E8EC",
  color: "#475467",
  fontSize: 14,
};

const tableCellStyleStrong = {
  ...tableCellStyle,
  color: "#2F3A3F",
  fontWeight: 700,
};

const tableInputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #D0D5DD",
  borderRadius: 9,
  padding: "8px 10px",
};

function StatusBadge({ status }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: 28,
        padding: "0 10px",
        borderRadius: 999,
        background: "#F8E8EE",
        color: "#8B1E3F",
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {status}
    </span>
  );
}

function FittingEditor() {
  return null;
}

function PhotoForm() {
  return null;
}

function PhotoLightbox() {
  return null;
}

function PhotoEditDialog() {
  return null;
}
