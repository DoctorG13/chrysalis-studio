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

  useEffect(() => {
    setEditedJob(job);
    setActiveTab("Overview");
    setShowFittingForm(false);
    setEditingFitting(null);
    setShowPhotoForm(false);
    setSelectedPhoto(null);
    setEditingPhoto(null);
  }, [job]);

  if (!editedJob) return null;

  function handleSave() {
    onSave?.(editedJob);
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
            STICKY ACTION BAR
        ====================================================== */}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            zIndex: 20,
            display: "flex",
            gap: 14,
            width: "100%",
            padding: "14px 0",
            background:
              "rgba(255,255,255,0.98)",
            borderTop:
              "1px solid #E6E8EC",
            boxShadow:
              "0 -8px 20px rgba(0,0,0,0.07)",
            backdropFilter:
              "blur(8px)",
          }}
        >
          <div
            style={{
              flex: 1,
            }}
          >
            <Button
              onClick={
                handleSave
              }
            >
              💾 Save
            </Button>
          </div>

          <div
            style={{
              flex: 1,
            }}
          >
            <Button
              onClick={onCancel}
            >
              ✕ Close
            </Button>
          </div>

          <div
            style={{
              flex: 1,
            }}
          >
            <Button
              onClick={
                handleDelete
              }
            >
              🗑 Delete
            </Button>
          </div>
        </div>
      </div>

      {showFittingForm && (
        <FittingModal
          fitting={
            editingFitting
          }
          onSave={
            handleSaveFitting
          }
          onClose={() => {
            setShowFittingForm(
              false
            );
            setEditingFitting(
              null
            );
          }}
        />
      )}

      {showPhotoForm && (
        <PhotoModal
          onSave={
            handleSavePhoto
          }
          onClose={() =>
            setShowPhotoForm(
              false
            )
          }
        />
      )}

      {selectedPhoto && (
        <PhotoViewer
          photo={selectedPhoto}
          onClose={() =>
            setSelectedPhoto(null)
          }
        />
      )}

      {editingPhoto && (
        <PhotoEditModal
          photo={editingPhoto}
          onSave={
            handleSavePhotoEdit
          }
          onClose={() =>
            setEditingPhoto(null)
          }
        />
      )}

      <ThriveDialog {...dialogProps} />
    </>
  );
}

/* ============================================================
   JOB WORKSPACE OVERVIEW
============================================================ */

function JobWorkspaceOverview({
  job,
  onWorkflowStage,
  onChecklistToggle,
  onWorkflowNotesChange,
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
            ⚠️ This job is
            currently{" "}
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
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: 9,
            }}
          >
            <MoneySummary
              label="Quote"
              value={quote}
            />

            <MoneySummary
              label="Total Paid"
              value={totalPaid}
            />

            <MoneySummary
              label="Outstanding"
              value={
                outstanding
              }
              highlight
            />

            <MoneySummary
              label="Payments"
              valueText={`${
                (
                  job.payments ||
                  []
                ).length
              }`}
            />
          </div>
        </SummaryPanel>

        {/* Activity Summary */}
        <SummaryPanel title="Job Activity">
          <div
            style={{
              display: "grid",
              gap: 10,
            }}
          >
            <ActivityValue
              icon="📅"
              label="Fittings"
              value={
                (
                  job.fittings ||
                  []
                ).length
              }
            />

            <ActivityValue
              icon="📷"
              label="Photos"
              value={
                (
                  job.photos ||
                  []
                ).length
              }
            />

            <ActivityValue
              icon="📝"
              label="Timeline Events"
              value={
                (
                  job.timeline ||
                  []
                ).length
              }
            />
          </div>
        </SummaryPanel>
      </div>

      {/* =====================================================
          DESCRIPTION
      ====================================================== */}
      {job.description && (
        <section
          style={{
            background:
              "#FFFFFF",
            border:
              "1px solid #E5E7EB",
            borderRadius: 14,
            padding:
              "16px 18px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              textTransform:
                "uppercase",
              letterSpacing:
                0.8,
              color: "#777",
              marginBottom: 7,
            }}
          >
            Job Description
          </div>

          <div
            style={{
              fontSize: 14,
              lineHeight: 1.55,
              color: "#4F585E",
              whiteSpace:
                "pre-wrap",
            }}
          >
            {job.description}
          </div>
        </section>
      )}
    </div>
  );
}

/* ============================================================
   SUMMARY COMPONENTS
============================================================ */

function SummaryPanel({
  title,
  children,
}) {
  return (
    <section
      style={{
        background: "#FFFFFF",
        border:
          "1px solid #E5E7EB",
        borderRadius: 14,
        padding: 16,
        boxShadow:
          "0 2px 8px rgba(0,0,0,0.025)",
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          textTransform:
            "uppercase",
          letterSpacing:
            0.8,
          color: "#8B1E3F",
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
        gridColumn: fullWidth
          ? "1 / -1"
          : undefined,
        padding:
          "9px 10px",
        background:
          "#F8F9FA",
        border:
          "1px solid #E8EAED",
        borderRadius: 9,
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "#888",
          marginBottom: 4,
        }}
      >
        {label}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          fontWeight: 700,
          color: "#2F3A3F",
        }}
      >
        {icon && (
          <span>
            {icon}
          </span>
        )}

        {status ? (
          <StatusBadge
            status={value}
          />
        ) : (
          value
        )}
      </div>
    </div>
  );
}

function MoneySummary({
  label,
  value,
  valueText,
  highlight = false,
}) {
  return (
    <div
      style={{
        padding:
          "10px",
        borderRadius: 9,
        background:
          highlight
            ? "#FFF7E6"
            : "#F8F9FA",
        border:
          highlight
            ? "1px solid #F3D38A"
            : "1px solid #E8EAED",
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "#888",
          marginBottom: 4,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          color:
            highlight
              ? "#8A5A00"
              : "#2F3A3F",
          whiteSpace:
            "nowrap",
        }}
      >
        {valueText !==
        undefined
          ? valueText
          : `$${Number(
              value || 0
            ).toFixed(2)}`}
      </div>
    </div>
  );
}

function ActivityValue({
  icon,
  label,
  value,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent:
          "space-between",
        padding:
          "10px 11px",
        borderRadius: 9,
        background:
          "#F8F9FA",
        border:
          "1px solid #E8EAED",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems:
            "center",
          gap: 8,
          fontSize: 12,
          color: "#555",
        }}
      >
        <span>
          {icon}
        </span>

        <span>
          {label}
        </span>
      </div>

      <strong
        style={{
          color: "#2F3A3F",
          fontSize: 14,
        }}
      >
        {value}
      </strong>
    </div>
  );
}

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: 9,
};

/* ============================================================
   STATUS
============================================================ */

function StatusBadge({
  status,
}) {
  const styles =
    getStatusStyle(status);

  return (
    <span
      style={{
        display:
          "inline-flex",
        alignItems:
          "center",
        padding:
          "4px 9px",
        borderRadius: 999,
        background:
          styles.background,
        color:
          styles.color,
        fontSize: 11,
        fontWeight: 700,
        whiteSpace:
          "nowrap",
      }}
    >
      {status}
    </span>
  );
}

/* ============================================================
   FITTING MODAL
============================================================ */

function FittingModal({
  fitting,
  onSave,
  onClose,
}) {
  const [title, setTitle] =
    useState(
      fitting?.title ||
        fitting?.name ||
        fitting?.type ||
        ""
    );

  const [date, setDate] =
    useState(
      formatDateForInput(
        fitting?.date ||
          fitting?.fittingDate ||
          ""
      )
    );

  const [time, setTime] =
    useState(
      fitting?.time ||
        fitting?.fittingTime ||
        ""
    );

  const [status, setStatus] =
    useState(
      fitting?.status ||
        "Scheduled"
    );

  const [notes, setNotes] =
    useState(
      fitting?.notes ||
        fitting?.description ||
        ""
    );

  function handleSubmit(
    event
  ) {
    event.preventDefault();

    if (!title.trim()) {
      return;
    }

    onSave({
      title: title.trim(),
      date:
        formatDateForJob(
          date
        ),
      time,
      status,
      notes: notes.trim(),
    });
  }

  return (
    <Modal
      title={
        fitting
          ? "Edit Fitting"
          : "Add Fitting"
      }
      onClose={onClose}
    >
      <form
        onSubmit={
          handleSubmit
        }
      >
        <FormField label="Fitting Name">
          <input
            autoFocus
            value={title}
            onChange={(event) =>
              setTitle(
                event.target.value
              )
            }
            placeholder="e.g. First Fitting"
            style={inputStyle}
          />
        </FormField>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr 1fr",
            gap: 12,
          }}
        >
          <FormField label="Date">
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
          </FormField>

          <FormField label="Time">
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
          </FormField>
        </div>

        <FormField label="Status">
          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value
              )
            }
            style={inputStyle}
          >
            <option>
              Scheduled
            </option>
            <option>
              Completed
            </option>
            <option>
              Needs Alterations
            </option>
            <option>
              Cancelled
            </option>
          </select>
        </FormField>

        <FormField label="Notes">
          <textarea
            value={notes}
            onChange={(event) =>
              setNotes(
                event.target.value
              )
            }
            placeholder="Add fitting notes..."
            rows={4}
            style={{
              ...inputStyle,
              height: "auto",
              padding: 12,
              resize:
                "vertical",
            }}
          />
        </FormField>

        <ModalActions
          onClose={onClose}
          submitLabel={
            fitting
              ? "Save Changes"
              : "Add Fitting"
          }
        />
      </form>
    </Modal>
  );
}

/* ============================================================
   PHOTO MODAL
============================================================ */

function PhotoModal({
  onSave,
  onClose,
}) {
  const fileInputRef =
    useRef(null);

  const [file, setFile] =
    useState(null);

  const [preview, setPreview] =
    useState("");

  const [caption, setCaption] =
    useState("");

  const [error, setError] =
    useState("");

  function handleFile(
    event
  ) {
    const selectedFile =
      event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    setError("");

    if (
      selectedFile.size >
      5 * 1024 * 1024
    ) {
      setError(
        "Please choose an image smaller than 5 MB."
      );
      return;
    }

    if (
      !selectedFile.type.startsWith(
        "image/"
      )
    ) {
      setError(
        "Please choose an image file."
      );
      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      setFile(
        selectedFile
      );
      setPreview(
        reader.result
      );
    };

    reader.readAsDataURL(
      selectedFile
    );
  }

  function handleSubmit(
    event
  ) {
    event.preventDefault();

    if (!preview) {
      setError(
        "Please select a photo first."
      );
      return;
    }

    onSave({
      id: crypto.randomUUID(),
      url: preview,
      caption:
        caption.trim() ||
        "Untitled photo",
      date: formatDateForJob(
        new Date()
          .toISOString()
          .slice(0, 10)
      ),
      fileName:
        file?.name || "",
    });
  }

  return (
    <Modal
      title="Add Photo"
      onClose={onClose}
    >
      <form
        onSubmit={
          handleSubmit
        }
      >
        <div
          style={{
            border:
              "2px dashed #D9DDE1",
            borderRadius: 14,
            padding: 20,
            textAlign:
              "center",
            background:
              "#F8F9FA",
          }}
        >
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              style={{
                width: "100%",
                maxHeight: 280,
                objectFit:
                  "contain",
                borderRadius: 10,
                background:
                  "#FFFFFF",
              }}
            />
          ) : (
            <div
              style={{
                padding: 28,
                color: "#888",
              }}
            >
              <div
                style={{
                  fontSize: 36,
                  marginBottom: 8,
                }}
              >
                📷
              </div>

              <div
                style={{
                  fontWeight: 700,
                  color: "#555",
                  marginBottom: 5,
                }}
              >
                Choose a photo
              </div>

              <div
                style={{
                  fontSize: 12,
                }}
              >
                JPG, PNG or another
                image format up to
                5 MB.
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={
              handleFile
            }
            style={{
              display: "none",
            }}
          />

          <button
            type="button"
            onClick={() =>
              fileInputRef.current?.click()
            }
            style={{
              marginTop: 14,
              border: "none",
              background:
                "#F4C542",
              color: "#2F3A3F",
              borderRadius: 9,
              padding:
                "10px 16px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {preview
              ? "Choose Different Photo"
              : "Choose Photo"}
          </button>
        </div>

        {error && (
          <div
            style={{
              marginTop: 10,
              padding: 10,
              borderRadius: 8,
              background:
                "#FEE2E2",
              color: "#B91C1C",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <FormField label="Caption">
          <input
            value={caption}
            onChange={(event) =>
              setCaption(
                event.target.value
              )
            }
            placeholder="e.g. Front of garment"
            style={inputStyle}
          />
        </FormField>

        <ModalActions
          onClose={onClose}
          submitLabel="Add Photo"
        />
      </form>
    </Modal>
  );
}

/* ============================================================
   PHOTO EDIT MODAL
============================================================ */

function PhotoEditModal({
  photo,
  onSave,
  onClose,
}) {
  const [caption, setCaption] =
    useState(
      photo?.caption || ""
    );

  function handleSubmit(
    event
  ) {
    event.preventDefault();

    onSave({
      ...photo,
      caption:
        caption.trim() ||
        "Untitled photo",
    });
  }

  return (
    <Modal
      title="Edit Photo"
      onClose={onClose}
    >
      <form
        onSubmit={
          handleSubmit
        }
      >
        <div
          style={{
            border:
              "1px solid #E5E7EB",
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: 18,
            background:
              "#F8F9FA",
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
                width: "100%",
                maxHeight: 300,
                objectFit:
                  "contain",
                display: "block",
              }}
            />
          ) : (
            <div
              style={{
                height: 180,
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                fontSize: 42,
              }}
            >
              📷
            </div>
          )}
        </div>

        <FormField label="Caption">
          <input
            autoFocus
            value={caption}
            onChange={(event) =>
              setCaption(
                event.target.value
              )
            }
            placeholder="e.g. Front of garment"
            style={inputStyle}
          />
        </FormField>

        <ModalActions
          onClose={onClose}
          submitLabel="Save Changes"
        />
      </form>
    </Modal>
  );
}

/* ============================================================
   PHOTO VIEWER
============================================================ */

function PhotoViewer({
  photo,
  onClose,
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background:
          "rgba(0,0,0,0.72)",
        zIndex: 1001,
        display: "flex",
        alignItems:
          "center",
        justifyContent:
          "center",
        padding: 24,
      }}
    >
      <div
        onClick={(event) =>
          event.stopPropagation()
        }
        style={{
          width:
            "min(900px, 100%)",
          maxHeight: "90vh",
          background: "#FFFFFF",
          borderRadius: 16,
          padding: 18,
          overflow: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            marginBottom: 12,
          }}
        >
          <div>
            <div
              style={{
                fontWeight: 700,
                color: "#2F3A3F",
              }}
            >
              {photo.caption ||
                "Untitled photo"}
            </div>

            {photo.date && (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: "#888",
                }}
              >
                {photo.date}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              border:
                "1px solid #D9DDE1",
              background:
                "#FFFFFF",
              borderRadius: 8,
              padding:
                "7px 11px",
              cursor:
                "pointer",
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>

        <img
          src={photo.url}
          alt={
            photo.caption ||
            "Job photo"
          }
          style={{
            width: "100%",
            maxHeight:
              "calc(90vh - 120px)",
            objectFit:
              "contain",
            display: "block",
            borderRadius: 10,
            background:
              "#F3F4F6",
          }}
        />
      </div>
    </div>
  );
}

/* ============================================================
   GENERIC MODAL
============================================================ */

function Modal({
  title,
  children,
  onClose,
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          "rgba(0,0,0,0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems:
          "center",
        justifyContent:
          "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={(event) =>
          event.stopPropagation()
        }
        style={{
          width:
            "min(520px, 100%)",
          maxHeight: "90vh",
          overflowY:
            "auto",
          background:
            "#FFFFFF",
          borderRadius: 18,
          padding: 24,
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            marginBottom: 22,
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#2F3A3F",
              fontSize: 22,
            }}
          >
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            style={{
              border:
                "1px solid #D9DDE1",
              background:
                "#FFFFFF",
              borderRadius: 8,
              width: 36,
              height: 36,
              cursor:
                "pointer",
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

/* ============================================================
   FORM HELPERS
============================================================ */

function FormField({
  label,
  children,
}) {
  return (
    <div
      style={{
        marginBottom: 16,
      }}
    >
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 700,
          color: "#555",
          marginBottom: 7,
        }}
      >
        {label}
      </label>

      {children}
    </div>
  );
}

function ModalActions({
  onClose,
  submitLabel,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent:
          "flex-end",
        gap: 10,
        marginTop: 22,
      }}
    >
      <button
        type="button"
        onClick={onClose}
        style={{
          border:
            "1px solid #D9DDE1",
          background:
            "#FFFFFF",
          borderRadius: 9,
          padding:
            "10px 16px",
          fontWeight: 600,
          cursor:
            "pointer",
        }}
      >
        Cancel
      </button>

      <button
        type="submit"
        style={{
          border: "none",
          background:
            "#F4C542",
          color: "#2F3A3F",
          borderRadius: 9,
          padding:
            "10px 18px",
          fontWeight: 700,
          cursor:
            "pointer",
        }}
      >
        {submitLabel}
      </button>
    </div>
  );
}

/* ============================================================
   DATE HELPERS
============================================================ */

function formatDate(value) {
  if (!value) return "";

  if (
    /^\d{2}\/\d{2}\/\d{4}$/.test(
      value
    )
  ) {
    const [
      day,
      month,
      year,
    ] = value.split("/");

    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );

    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {
      return date.toLocaleDateString(
        "en-AU",
        {
          weekday: "short",
          day: "numeric",
          month: "long",
          year: "numeric",
        }
      );
    }
  }

  return value;
}

function formatDateForInput(
  value
) {
  if (!value) return "";

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
    return value;
  }

  if (
    /^\d{2}\/\d{2}\/\d{4}$/.test(
      value
    )
  ) {
    const [
      day,
      month,
      year,
    ] = value.split("/");

    return `${year}-${month}-${day}`;
  }

  return "";
}

function formatDateForJob(
  value
) {
  if (!value) return "";

  const [
    year,
    month,
    day,
  ] = value.split("-");

  if (
    !year ||
    !month ||
    !day
  ) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

/* ============================================================
   STATUS STYLES
============================================================ */

function getStatusStyle(
  status
) {
  switch (status) {
    case "New":
      return {
        background: "#F3F4F6",
        color: "#374151",
      };

    case "Measuring":
      return {
        background: "#DBEAFE",
        color: "#1D4ED8",
      };

    case "Cutting":
      return {
        background: "#EDE9FE",
        color: "#6D28D9",
      };

    case "Sewing":
      return {
        background: "#FFE4E6",
        color: "#BE123C",
      };

    case "Construction":
      return {
        background: "#FFE4E6",
        color: "#BE123C",
      };

    case "Fitting":
      return {
        background: "#FEF3C7",
        color: "#92400E",
      };

    case "Alterations":
      return {
        background: "#FCE7F3",
        color: "#9D174D",
      };

    case "Mending":
      return {
        background: "#E0F2FE",
        color: "#0369A1",
      };

    case "Ready":
      return {
        background: "#DCFCE7",
        color: "#166534",
      };

    case "Collected":
      return {
        background: "#E5E7EB",
        color: "#374151",
      };

    case "Cancelled":
      return {
        background: "#FEE2E2",
        color: "#991B1B",
      };

    default:
      return {
        background: "#F3F4F6",
        color: "#374151",
      };
  }
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  height: 44,
  padding: "0 13px",
  border:
    "1px solid #D9DDE1",
  borderRadius: 10,
  fontSize: 15,
  color: "#2F3A3F",
  background: "#FFFFFF",
  outline: "none",
  fontFamily:
    "inherit",
};