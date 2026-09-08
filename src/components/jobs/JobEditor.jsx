import { useEffect, useRef, useState } from "react";

import Button from "../common/Button";
import { ThriveDialog, useThriveDialog } from "../common/ThriveDialog";

import JobTabs from "./JobTabs";
import JobDetailsPanel from "./JobDetailsPanel";
import JobMeasurements from "./JobMeasurements";
import JobPayments from "./JobPayments";
import JobTimeline from "./JobTimeline";
import JobFittings from "./JobFittings";
import JobPhotos from "./JobPhotos";

const WORKFLOW_STAGES = [
  "New",
  "Measuring",
  "Cutting",
  "Sewing",
  "Fitting",
  "Alterations",
  "Ready",
  "Collected",
];

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
    updateJobField("status", stage);
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
                width: 42,
                height: 42,
                border:
                  "1px solid #D9DDE1",
                borderRadius: 10,
                background: "#FFFFFF",
                color: "#374151",
                fontSize: 20,
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 22,
              marginTop: 18,
              paddingTop: 16,
              borderTop:
                "1px solid #ECECEC",
              color: "#666",
              fontSize: 14,
            }}
          >
            <div
              style={{
                color: "#2F3A3F",
                fontWeight: 700,
              }}
            >
              👤{" "}
              {editedJob.clientName ||
                "No client assigned"}
            </div>

            <div>
              👗{" "}
              {editedJob.garmentType ||
                "General Job"}
            </div>

            {editedJob.dueDate && (
              <div>
                📅{" "}
                {formatDate(
                  editedJob.dueDate
                )}
              </div>
            )}

            {editedJob.priority && (
              <div>
                🎯{" "}
                {editedJob.priority}
              </div>
            )}
          </div>
        </div>

        {/* =====================================================
            TABS
        ====================================================== */}
        <JobTabs
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* =====================================================
            CONTENT
        ====================================================== */}
        {renderTab()}

        {/* =====================================================
            SAVE CONFIRMATION + STICKY ACTION BAR
        ====================================================== */}
        {saveFeedback && (
          <div
            role="status"
            aria-live="polite"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              width: "100%",
              boxSizing: "border-box",
              marginTop: -2,
              padding: "12px 16px",
              borderRadius: 12,
              background:
                saveFeedback.type === "success"
                  ? "#ECFDF5"
                  : "#FEF2F2",
              border:
                saveFeedback.type === "success"
                  ? "1px solid #86EFAC"
                  : "1px solid #FCA5A5",
              color:
                saveFeedback.type === "success"
                  ? "#166534"
                  : "#991B1B",
              fontSize: 14,
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  saveFeedback.type === "success"
                    ? "#D1FAE5"
                    : "#FEE2E2",
                fontSize: 15,
              }}
            >
              {saveFeedback.type === "success"
                ? "✓"
                : "!"}
            </span>
            <span>{saveFeedback.message}</span>
          </div>
        )}

        <div
          style={{
            position: "sticky",
            bottom: 0,
            zIndex: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            padding: "14px 0 2px",
            background:
              "linear-gradient(to bottom, rgba(247,245,242,0), #F7F5F2 18px)",
          }}
        >
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
          >
            Delete Job
          </Button>

          <div
            style={{
              display: "flex",
              gap: 10,
            }}
          >
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="primary"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving
                ? "⏳ Saving..."
                : "💾 Save"}
            </Button>
          </div>
        </div>
      </div>

      {showFittingForm && (
        <FittingForm
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

      {editingPhoto && (
        <PhotoEditForm
          photo={editingPhoto}
          onSave={handleSavePhotoEdit}
          onCancel={() =>
            setEditingPhoto(null)
          }
        />
      )}

      {selectedPhoto && (
        <PhotoPreview
          photo={selectedPhoto}
          onClose={() =>
            setSelectedPhoto(null)
          }
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
  defaultLabourRate = 0,
  onWorkflowLabourRateChange,
  onWorkflowHoursChange,
}) {
  const quote = Number(
    job.price || 0
  );

  const totalPaid = (
    job.payments || []
  ).reduce(
    (total, payment) =>
      total +
      Number(
        payment.amount || 0
      ),
    0
  );

  const outstanding = Math.max(
    quote - totalPaid,
    0
  );

  const checklist =
    job.workflowChecklist || {};

  const completedChecklist =
    CHECKLIST_ITEMS.filter(
      ([key]) =>
        Boolean(checklist[key])
    ).length;

  const checklistPercent =
    CHECKLIST_ITEMS.length
      ? Math.round(
          (completedChecklist /
            CHECKLIST_ITEMS.length) *
            100
        )
      : 0;

  const currentStageIndex =
    WORKFLOW_STAGES.indexOf(
      job.status
    );

  const workflowHours = job.workflowHours || {};
  const effectiveLabourRate =
    job.workflowLabourRate == null || job.workflowLabourRate === ""
      ? defaultLabourRate
      : Number(job.workflowLabourRate) || 0;

  const workflowTotals = WORKFLOW_STAGES.reduce(
    (totals, stage) => {
      const entry = workflowHours[stage] || {};
      totals.estimatedHours += Math.max(0, Number(entry.estimated) || 0);
      totals.actualHours += Math.max(0, Number(entry.actual) || 0);
      return totals;
    },
    { estimatedHours: 0, actualHours: 0 }
  );

  const estimatedLabourCost =
    workflowTotals.estimatedHours * effectiveLabourRate;
  const actualLabourCost =
    workflowTotals.actualHours * effectiveLabourRate;
  const labourVariance =
    workflowTotals.actualHours - workflowTotals.estimatedHours;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* =====================================================
          WORKFLOW + CHECKLIST
      ====================================================== */}
      <section
        style={{
          background: "#FAF9F6",
          border:
            "1px solid #E5E7EB",
          borderRadius: 16,
          padding: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "flex-start",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 1,
                textTransform:
                  "uppercase",
                color: "#8B1E3F",
              }}
            >
              Garment Workflow
            </div>

            <div
              style={{
                marginTop: 5,
                color: "#777",
                fontSize: 13,
              }}
            >
              Move the job through
              production as work is
              completed.
            </div>
          </div>

          {job.status && (
            <StatusBadge
              status={job.status}
            />
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(8, minmax(82px, 1fr))",
            gap: 7,
            overflowX: "auto",
            paddingBottom: 3,
          }}
        >
          {WORKFLOW_STAGES.map(
            (stage, index) => {
              const isCurrent =
                job.status === stage;

              const isComplete =
                currentStageIndex >=
                  0 &&
                index <
                  currentStageIndex;

              return (
                <button
                  key={stage}
                  type="button"
                  onClick={() =>
                    onWorkflowStage(
                      stage
                    )
                  }
                  title={`Set workflow stage to ${stage}`}
                  style={{
                    minWidth: 82,
                    minHeight: 66,
                    border: isCurrent
                      ? "2px solid #8B1E3F"
                      : isComplete
                      ? "1px solid #B7DFC5"
                      : "1px solid #D9DDE1",
                    borderRadius: 10,
                    background:
                      isCurrent
                        ? "#FFF5F7"
                        : isComplete
                        ? "#F0FDF4"
                        : "#FFFFFF",
                    color:
                      isCurrent
                        ? "#8B1E3F"
                        : isComplete
                        ? "#34724B"
                        : "#59636A",
                    padding:
                      "7px 5px",
                    display: "flex",
                    flexDirection:
                      "column",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius:
                        "50%",
                      display:
                        "inline-flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      background:
                        isComplete
                          ? "#D8F3DF"
                          : "#E8EAED",
                      fontSize: 10,
                      fontWeight: 800,
                    }}
                  >
                    {isComplete
                      ? "✓"
                      : index + 1}
                  </span>

                  <span>
                    {stage}
                  </span>
                </button>
              );
            }
          )}
        </div>

        {job.status ===
          "Mending" && (
          <div
            style={{
              marginTop: 12,
              padding:
                "10px 12px",
              borderRadius: 9,
              background: "#FFF7E6",
              border:
                "1px solid #F3D38A",
              color: "#745000",
              fontSize: 12,
            }}
          >
            🔧{" "}
            <strong>
              Mending
            </strong>{" "}
            is an active repair
            path. When complete,
            move the job to{" "}
            <strong>
              Ready
            </strong>
            .
          </div>
        )}

        {job.status ===
          "Cancelled" && (
          <div
            style={{
              marginTop: 12,
              padding:
                "10px 12px",
              borderRadius: 9,
              background: "#FFF7E6",
              border:
                "1px solid #F3D38A",
              color: "#745000",
              fontSize: 12,
            }}
          >
            ⚠️ This job is currently{" "}
            <strong>
              Cancelled
            </strong>
            .
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 1fr) minmax(260px, 0.8fr)",
            gap: 20,
            marginTop: 20,
          }}
        >
          {/* Production Checklist */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#555",
                  textTransform:
                    "uppercase",
                  letterSpacing:
                    0.7,
                }}
              >
                Production
                Checklist
              </div>

              <span
                style={{
                  fontSize: 11,
                  color: "#777",
                }}
              >
                {
                  completedChecklist
                }{" "}
                /{" "}
                {
                  CHECKLIST_ITEMS.length
                }
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: 8,
              }}
            >
              {CHECKLIST_ITEMS.map(
                ([key, label]) => {
                  const checked =
                    Boolean(
                      checklist[key]
                    );

                  return (
                    <label
                      key={key}
                      style={{
                        display: "flex",
                        alignItems:
                          "center",
                        gap: 8,
                        padding:
                          "10px",
                        borderRadius: 9,
                        border:
                          "1px solid #E8EAED",
                        background:
                          checked
                            ? "#F0FDF4"
                            : "#FFFFFF",
                        color: "#4F585E",
                        fontSize: 12,
                        cursor:
                          "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          checked
                        }
                        onChange={() =>
                          onChecklistToggle(
                            key
                          )
                        }
                        style={{
                          width: 16,
                          height: 16,
                          accentColor:
                            "#8B1E3F",
                        }}
                      />

                      <span
                        style={{
                          textDecoration:
                            checked
                              ? "line-through"
                              : "none",
                        }}
                      >
                        {label}
                      </span>
                    </label>
                  );
                }
              )}
            </div>
          </div>

          {/* Workflow Notes */}
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "#555",
                textTransform:
                  "uppercase",
                letterSpacing:
                  0.7,
                marginBottom: 10,
              }}
            >
              Workflow Notes
            </div>

            <textarea
              value={
                job.workflowNotes ||
                ""
              }
              onChange={(event) =>
                onWorkflowNotesChange(
                  event.target.value
                )
              }
              placeholder="What needs to happen next? Add production notes, materials, alterations or special instructions..."
              rows={7}
              style={{
                width: "100%",
                boxSizing:
                  "border-box",
                padding:
                  "11px 13px",
                border:
                  "1px solid #D9DDE1",
                borderRadius: 10,
                fontSize: 13,
                lineHeight: 1.45,
                color: "#2F3A3F",
                background:
                  "#FFFFFF",
                outline: "none",
                resize:
                  "vertical",
                fontFamily:
                  "inherit",
              }}
            />
          </div>
        </div>

        <div
          style={{
            marginTop: 14,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              flex: 1,
              height: 7,
              background:
                "#E8EAED",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${checklistPercent}%`,
                height: "100%",
                background:
                  "#8B1E3F",
                borderRadius: 999,
                transition:
                  "width 0.2s ease",
              }}
            />
          </div>

          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#666",
              minWidth: 34,
              textAlign: "right",
            }}
          >
            {
              checklistPercent
            }%
          </span>
        </div>
      </section>

      {/* =====================================================
          WORKFLOW LABOUR COSTING
      ====================================================== */}
      <section
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: 16,
          padding: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: "#8B1E3F",
              }}
            >
              Workflow Labour Costing
            </div>
            <div style={{ marginTop: 5, color: "#777", fontSize: 13 }}>
              Record estimated and actual hours for each production stage.
            </div>
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              fontWeight: 700,
              color: "#555",
            }}
          >
            Hourly rate
            <span style={{ color: "#8B1E3F" }}>$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={
                job.workflowLabourRate == null
                  ? defaultLabourRate
                  : job.workflowLabourRate
              }
              onChange={(event) =>
                onWorkflowLabourRateChange?.(event.target.value)
              }
              style={{
                width: 96,
                padding: "8px 9px",
                border: "1px solid #D9DDE1",
                borderRadius: 8,
                fontSize: 13,
                color: "#2F3A3F",
                boxSizing: "border-box",
              }}
              aria-label="Job labour hourly rate"
            />
          </label>
        </div>

        <div
          style={{
            overflowX: "auto",
            border: "1px solid #E8EAED",
            borderRadius: 10,
          }}
        >
          <div
            style={{
              minWidth: 620,
              display: "grid",
              gridTemplateColumns: "minmax(150px, 1.5fr) 110px 110px 120px",
              alignItems: "center",
              background: "#FAF9F6",
              borderBottom: "1px solid #E8EAED",
              padding: "9px 12px",
              fontSize: 10,
              fontWeight: 800,
              color: "#737B80",
              textTransform: "uppercase",
              letterSpacing: 0.6,
            }}
          >
            <span>Workflow stage</span>
            <span>Estimated hrs</span>
            <span>Actual hrs</span>
            <span>Actual cost</span>
          </div>

          {WORKFLOW_STAGES.map((stage) => {
            const entry = workflowHours[stage] || {};
            const actual = Math.max(0, Number(entry.actual) || 0);
            const actualCost = actual * effectiveLabourRate;

            return (
              <div
                key={stage}
                style={{
                  minWidth: 620,
                  display: "grid",
                  gridTemplateColumns: "minmax(150px, 1.5fr) 110px 110px 120px",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderBottom: "1px solid #F0F1F2",
                }}
              >
                <strong style={{ fontSize: 12, color: "#3F484D" }}>
                  {stage}
                </strong>
                <input
                  type="number"
                  min="0"
                  step="0.25"
                  value={entry.estimated ?? ""}
                  onChange={(event) =>
                    onWorkflowHoursChange?.(stage, "estimated", event.target.value)
                  }
                  placeholder="—"
                  aria-label={`${stage} estimated hours`}
                  style={workflowHoursInputStyle}
                />
                <input
                  type="number"
                  min="0"
                  step="0.25"
                  value={entry.actual ?? ""}
                  onChange={(event) =>
                    onWorkflowHoursChange?.(stage, "actual", event.target.value)
                  }
                  placeholder="—"
                  aria-label={`${stage} actual hours`}
                  style={workflowHoursInputStyle}
                />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#4F585E" }}>
                  ${actualCost.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, minmax(110px, 1fr))",
            gap: 8,
            marginTop: 14,
          }}
        >
          <LabourSummary label="Estimated hours" value={`${workflowTotals.estimatedHours.toFixed(2)} hrs`} />
          <LabourSummary label="Actual hours" value={`${workflowTotals.actualHours.toFixed(2)} hrs`} />
          <LabourSummary label="Estimated labour" value={`$${estimatedLabourCost.toFixed(2)}`} />
          <LabourSummary label="Actual labour" value={`$${actualLabourCost.toFixed(2)}`} />
          <LabourSummary
            label="Hour variance"
            value={`${labourVariance > 0 ? "+" : ""}${labourVariance.toFixed(2)} hrs`}
            emphasis={labourVariance > 0 ? "#A33A3A" : labourVariance < 0 ? "#34724B" : "#4F585E"}
          />
        </div>

        <div
          style={{
            marginTop: 12,
            padding: "9px 11px",
            borderRadius: 8,
            background: "#F8F9FA",
            color: "#737B80",
            fontSize: 11,
            lineHeight: 1.4,
          }}
        >
          The job rate is saved with this job once labour hours are recorded, so changing the Settings default later will not alter historical job costing.
        </div>
      </section>

      {/* =====================================================
          THREE-COLUMN SUMMARY
      ====================================================== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "1.1fr 1fr 1fr",
          gap: 14,
        }}
      >
        {/* Job Summary */}
        <SummaryPanel title="Job Summary">
          <div
            style={summaryGridStyle}
          >
            <SummaryValue
              label="Garment"
              value={
                job.garmentType ||
                "General Job"
              }
              icon="👗"
            />

            <SummaryValue
              label="Status"
              value={
                job.status || "-"
              }
              status
            />

            <SummaryValue
              label="Client"
              value={
                job.clientName ||
                "Unassigned"
              }
              icon="👤"
              fullWidth
            />

            <SummaryValue
              label="Due Date"
              value={
                formatDate(
                  job.dueDate
                ) || "-"
              }
              icon="📅"
              fullWidth
            />
          </div>
        </SummaryPanel>

        {/* Financial Summary */}
        <SummaryPanel title="At a Glance">
          <div
            style={summaryGridStyle}
          >
            <SummaryValue
              label="Quoted"
              value={`$${quote.toFixed(2)}`}
              icon="💵"
            />

            <SummaryValue
              label="Paid"
              value={`$${totalPaid.toFixed(2)}`}
              icon="✓"
            />

            <SummaryValue
              label="Outstanding"
              value={`$${outstanding.toFixed(2)}`}
              icon="⏳"
              fullWidth
            />
          </div>
        </SummaryPanel>

        {/* Production Summary */}
        <SummaryPanel title="Production">
          <div
            style={summaryGridStyle}
          >
            <SummaryValue
              label="Progress"
              value={`${checklistPercent}%`}
              icon="⚙️"
            />

            <SummaryValue
              label="Next Action"
              value={
                getNextAction(
                  job.status
                )
              }
              icon="→"
            />

            <SummaryValue
              label="Workflow Hours"
              value={`${workflowTotals.actualHours.toFixed(2)} hrs`}
              icon="⏱"
              fullWidth
            />
          </div>
        </SummaryPanel>
      </div>
    </div>
  );
}

function LabourSummary({ label, value, emphasis = "#2F3A3F" }) {
  return (
    <div
      style={{
        padding: "10px 11px",
        border: "1px solid #E8EAED",
        borderRadius: 9,
        background: "#FAFAFA",
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          color: "#7A8287",
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 4,
          fontSize: 14,
          fontWeight: 800,
          color: emphasis,
        }}
      >
        {value}
      </div>
    </div>
  );
}

const workflowHoursInputStyle = {
  width: "100%",
  minHeight: 34,
  padding: "6px 8px",
  border: "1px solid #D9DDE1",
  borderRadius: 7,
  fontSize: 12,
  color: "#2F3A3F",
  background: "#FFFFFF",
  boxSizing: "border-box",
};

function StatusBadge({ status }) {
  const styles = {
    Quote: ["#F3F4F6", "#4B5563"],
    New: ["#F3F4F6", "#4B5563"],
    Booked: ["#DBEAFE", "#1D4ED8"],
    Measuring: ["#E0F2FE", "#0369A1"],
    Pattern: ["#EDE9FE", "#6D28D9"],
    Cutting: ["#FFEDD5", "#C2410C"],
    Sewing: ["#FEF3C7", "#92400E"],
    Fitting: ["#FCE7F3", "#BE185D"],
    Alterations: ["#FEF9C3", "#854D0E"],
    Mending: ["#FEF3C7", "#92400E"],
    Ready: ["#DCFCE7", "#166534"],
    Collected: ["#D1FAE5", "#047857"],
    Completed: ["#DCFCE7", "#166534"],
    Cancelled: ["#E5E7EB", "#4B5563"],
  };

  const [background, color] =
    styles[status] || [
      "#F3F4F6",
      "#4B5563",
    ];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: 24,
        padding: "0 9px",
        borderRadius: 999,
        background,
        color,
        fontSize: 11,
        fontWeight: 800,
      }}
    >
      {status}
    </span>
  );
}

function SummaryPanel({
  title,
  children,
}) {
  return (
    <section
      style={{
        background: "#FFFFFF",
        border: "1px solid #E6E8EC",
        borderRadius: 14,
        padding: 16,
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: "#8B1E3F",
          textTransform: "uppercase",
          letterSpacing: 0.8,
          marginBottom: 12,
        }}
      >
        {title}
      </div>

      {children}
    </section>
  );
}

function SummaryValue({
  label,
  value,
  icon,
  status = false,
  fullWidth = false,
}) {
  return (
    <div
      style={{
        gridColumn:
          fullWidth
            ? "1 / -1"
            : undefined,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          color: "#8A9297",
          fontSize: 10,
          textTransform: "uppercase",
          fontWeight: 700,
          letterSpacing: 0.5,
        }}
      >
        {icon && (
          <span aria-hidden="true">
            {icon}
          </span>
        )}
        {label}
      </div>

      <div
        style={{
          marginTop: 4,
          color: status
            ? "#8B1E3F"
            : "#2F3A3F",
          fontSize: 13,
          fontWeight: 700,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={String(value)}
      >
        {value}
      </div>
    </div>
  );
}

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: "12px 14px",
};

function formatDate(value) {
  if (!value) return "";

  const text = String(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, day] =
      text.split("-").map(Number);

    return new Date(
      year,
      month - 1,
      day
    ).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
    const [day, month, year] =
      text.split("/").map(Number);

    return new Date(
      year,
      month - 1,
      day
    ).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const date = new Date(text);

  return Number.isNaN(date.getTime())
    ? text
    : date.toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function getNextAction(status) {
  switch (status) {
    case "New":
      return "Start measuring";
    case "Measuring":
      return "Confirm measurements";
    case "Cutting":
      return "Complete cutting";
    case "Sewing":
      return "Complete construction";
    case "Fitting":
      return "Complete fitting";
    case "Alterations":
      return "Complete alterations";
    case "Ready":
      return "Await collection";
    case "Collected":
      return "Archive job";
    default:
      return "Continue workflow";
  }
}

function FittingForm({
  fitting,
  onSave,
  onCancel,
}) {
  const [title, setTitle] =
    useState(
      fitting?.title || ""
    );

  const [date, setDate] =
    useState(fitting?.date || "");

  const [time, setTime] =
    useState(fitting?.time || "");

  const [status, setStatus] =
    useState(
      fitting?.status || "Scheduled"
    );

  const [notes, setNotes] =
    useState(fitting?.notes || "");

  return (
    <div style={modalOverlayStyle}>
      <div style={modalCardStyle}>
        <div style={modalHeaderStyle}>
          <div>
            <div style={modalEyebrowStyle}>
              FITTING
            </div>
            <h2 style={modalTitleStyle}>
              {fitting
                ? "Edit Fitting"
                : "Add Fitting"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onCancel}
            style={modalCloseStyle}
            aria-label="Close fitting form"
          >
            ×
          </button>
        </div>

        <div style={modalBodyStyle}>
          <label style={fieldStyle}>
            <span style={labelStyle}>
              Fitting Title
            </span>
            <input
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }
              placeholder="First fitting"
              style={inputStyle}
            />
          </label>

          <div style={twoColumnStyle}>
            <label style={fieldStyle}>
              <span style={labelStyle}>
                Date
              </span>
              <input
                type="date"
                value={date}
                onChange={(event) =>
                  setDate(
                    event.target.value
                  )
                }
                style={inputStyle}
              />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>
                Time
              </span>
              <input
                type="time"
                value={time}
                onChange={(event) =>
                  setTime(
                    event.target.value
                  )
                }
                style={inputStyle}
              />
            </label>
          </div>

          <label style={fieldStyle}>
            <span style={labelStyle}>
              Status
            </span>
            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value
                )
              }
              style={inputStyle}
            >
              <option value="Scheduled">
                Scheduled
              </option>
              <option value="Completed">
                Completed
              </option>
              <option value="Cancelled">
                Cancelled
              </option>
            </select>
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle}>
              Notes
            </span>
            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value
                )
              }
              rows={5}
              placeholder="Fitting notes, changes required or client comments..."
              style={textareaStyle}
            />
          </label>
        </div>

        <div style={modalFooterStyle}>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() =>
              onSave?.({
                title,
                date,
                time,
                status,
                notes,
              })
            }
          >
            Save Fitting
          </Button>
        </div>
      </div>
    </div>
  );
}

function PhotoForm({
  onSave,
  onCancel,
}) {
  const [caption, setCaption] =
    useState("");

  const [url, setUrl] =
    useState("");

  return (
    <div style={modalOverlayStyle}>
      <div style={modalCardStyle}>
        <div style={modalHeaderStyle}>
          <div>
            <div style={modalEyebrowStyle}>
              JOB PHOTO
            </div>
            <h2 style={modalTitleStyle}>
              Add Photo
            </h2>
          </div>

          <button
            type="button"
            onClick={onCancel}
            style={modalCloseStyle}
            aria-label="Close photo form"
          >
            ×
          </button>
        </div>

        <div style={modalBodyStyle}>
          <label style={fieldStyle}>
            <span style={labelStyle}>
              Photo URL
            </span>
            <input
              value={url}
              onChange={(event) =>
                setUrl(
                  event.target.value
                )
              }
              placeholder="https://..."
              style={inputStyle}
            />
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle}>
              Caption
            </span>
            <input
              value={caption}
              onChange={(event) =>
                setCaption(
                  event.target.value
                )
              }
              placeholder="Front view"
              style={inputStyle}
            />
          </label>
        </div>

        <div style={modalFooterStyle}>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() =>
              onSave?.({
                id: crypto.randomUUID(),
                url,
                caption,
                createdAt:
                  new Date().toISOString(),
              })
            }
          >
            Add Photo
          </Button>
        </div>
      </div>
    </div>
  );
}

function PhotoEditForm({
  photo,
  onSave,
  onCancel,
}) {
  const [caption, setCaption] =
    useState(photo?.caption || "");

  const [url, setUrl] =
    useState(photo?.url || "");

  return (
    <div style={modalOverlayStyle}>
      <div style={modalCardStyle}>
        <div style={modalHeaderStyle}>
          <div>
            <div style={modalEyebrowStyle}>
              JOB PHOTO
            </div>
            <h2 style={modalTitleStyle}>
              Edit Photo
            </h2>
          </div>

          <button
            type="button"
            onClick={onCancel}
            style={modalCloseStyle}
            aria-label="Close photo editor"
          >
            ×
          </button>
        </div>

        <div style={modalBodyStyle}>
          <label style={fieldStyle}>
            <span style={labelStyle}>
              Photo URL
            </span>
            <input
              value={url}
              onChange={(event) =>
                setUrl(
                  event.target.value
                )
              }
              style={inputStyle}
            />
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle}>
              Caption
            </span>
            <input
              value={caption}
              onChange={(event) =>
                setCaption(
                  event.target.value
                )
              }
              style={inputStyle}
            />
          </label>
        </div>

        <div style={modalFooterStyle}>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() =>
              onSave?.({
                ...photo,
                url,
                caption,
                updatedAt:
                  new Date().toISOString(),
              })
            }
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

function PhotoPreview({
  photo,
  onClose,
}) {
  return (
    <div style={modalOverlayStyle}>
      <div
        style={{
          ...modalCardStyle,
          maxWidth: 900,
        }}
      >
        <div style={modalHeaderStyle}>
          <div>
            <div style={modalEyebrowStyle}>
              JOB PHOTO
            </div>
            <h2 style={modalTitleStyle}>
              {photo?.caption ||
                "Photo Preview"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={modalCloseStyle}
            aria-label="Close photo preview"
          >
            ×
          </button>
        </div>

        <div
          style={{
            padding: 20,
            display: "flex",
            justifyContent: "center",
            background: "#F7F5F2",
          }}
        >
          {photo?.url ? (
            <img
              src={photo.url}
              alt={
                photo.caption ||
                "Job photo"
              }
              style={{
                maxWidth: "100%",
                maxHeight: "70vh",
                borderRadius: 10,
                objectFit: "contain",
              }}
            />
          ) : (
            <div
              style={{
                padding: 40,
                color: "#777",
              }}
            >
              No image URL provided.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  background: "rgba(31,41,51,.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  boxSizing: "border-box",
};

const modalCardStyle = {
  width: "100%",
  maxWidth: 620,
  maxHeight: "calc(100vh - 40px)",
  overflowY: "auto",
  background: "#FFFFFF",
  borderRadius: 16,
  boxShadow: "0 24px 70px rgba(31,41,51,.24)",
};

const modalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  padding: "20px 22px",
  borderBottom: "1px solid #ECECEC",
};

const modalEyebrowStyle = {
  color: "#8B1E3F",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 1,
  textTransform: "uppercase",
};

const modalTitleStyle = {
  margin: "4px 0 0",
  color: "#2F3A3F",
  fontSize: 20,
};

const modalCloseStyle = {
  width: 36,
  height: 36,
  border: "1px solid #D9DDE1",
  borderRadius: 9,
  background: "#FFFFFF",
  color: "#374151",
  fontSize: 20,
  cursor: "pointer",
  flexShrink: 0,
};

const modalBodyStyle = {
  padding: 22,
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const modalFooterStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  padding: "16px 22px",
  borderTop: "1px solid #ECECEC",
};

const twoColumnStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: 14,
};

const fieldStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const labelStyle = {
  color: "#4F585E",
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

const inputStyle = {
  width: "100%",
  minHeight: 40,
  boxSizing: "border-box",
  border: "1px solid #D9DDE1",
  borderRadius: 8,
  padding: "9px 11px",
  fontSize: 13,
  color: "#2F3A3F",
  background: "#FFFFFF",
  outline: "none",
};

const textareaStyle = {
  ...inputStyle,
  minHeight: 110,
  resize: "vertical",
  fontFamily: "inherit",
  lineHeight: 1.45,
};
