import { useEffect, useRef, useState } from "react";

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
  onDelete,
  onCancel,
}) {
  const [activeTab, setActiveTab] =
    useState("Overview");

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

  function handleDelete() {
    if (
      window.confirm(
        `Delete "${editedJob.name}"?`
      )
    ) {
      onDelete?.(editedJob.id);
    }
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
    job,
    event
  ) {
    return {
      ...job,
      timeline: [
        event,
        ...(job.timeline || []),
      ],
    };
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

    const event = createTimelineEvent(
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

  function handleEditPhoto(photo) {
    setEditingPhoto(photo);
  }

  function handleSavePhotoEdit(updatedPhoto) {
    const photos = (editedJob.photos || []).map(
      (photo) =>
        photo.id === updatedPhoto.id
          ? { ...photo, ...updatedPhoto }
          : photo
    );

    const event = createTimelineEvent(
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

  function handleDeletePhoto(photo) {
    if (
      !window.confirm(
        `Delete "${photo.caption || "this photo"}"?`
      )
    ) {
      return;
    }

    const photos = (editedJob.photos || []).filter(
      (item) => item.id !== photo.id
    );

    const event = createTimelineEvent(
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
          <JobOverview
            job={editedJob}
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
          gap: 24,
        }}
      >
        {/* Job Header */}
        <div
          style={{
            background: "#FFFFFF",
            border:
              "1px solid #E6E8EC",
            borderRadius: 18,
            padding: 28,
            marginBottom: 8,
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.04)",
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
              gap: 12,
              flexWrap: "wrap",
              marginTop: 14,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                color: "#8B1E3F",
                fontWeight: 700,
                letterSpacing: 1,
              }}
            >
              {editedJob.reference ||
                "CHR-NEW"}
            </div>

            {editedJob.status && (
              <StatusBadge
                status={
                  editedJob.status
                }
              />
            )}
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 20,
              color: "#666",
              fontSize: 15,
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
          </div>
        </div>

        <JobTabs
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {renderTab()}

        {/* Sticky Job Actions */}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            zIndex: 20,
            display: "flex",
            gap: 10,
            width: "100%",
            padding: "14px 0",
            marginTop: 4,
            background: "rgba(255,255,255,0.98)",
            borderTop: "1px solid #E6E8EC",
            boxShadow: "0 -6px 18px rgba(0,0,0,0.06)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div style={{ flex: 1 }}>
            <Button onClick={handleSave}>
              💾 Save
            </Button>
          </div>

          <div style={{ flex: 1 }}>
            <Button onClick={onCancel}>
              ✕ Close
            </Button>
          </div>

          <div style={{ flex: 1 }}>
            <Button onClick={handleDelete}>
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
          onSave={handleSavePhotoEdit}
          onClose={() =>
            setEditingPhoto(null)
          }
        />
      )}
    </>
  );
}

function StatusBadge({
  status,
}) {
  const styles =
    getStatusStyle(status);

  return (
    <span
      style={{
        padding:
          "5px 11px",
        borderRadius: 999,
        background:
          styles.background,
        color: styles.color,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {status}
    </span>
  );
}

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
              resize: "vertical",
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
            textAlign: "center",
            background: "#F8F9FA",
          }}
        >
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              style={{
                width: "100%",
                maxHeight: 280,
                objectFit: "contain",
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
                image format up to 5 MB.
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
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
              background: "#F4C542",
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
              background: "#FEE2E2",
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

function PhotoEditModal({
  photo,
  onSave,
  onClose,
}) {
  const [caption, setCaption] =
    useState(photo?.caption || "");

  function handleSubmit(event) {
    event.preventDefault();

    onSave({
      ...photo,
      caption:
        caption.trim() || "Untitled photo",
    });
  }

  return (
    <Modal
      title="Edit Photo"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <div
          style={{
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: 18,
            background: "#F8F9FA",
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
                objectFit: "contain",
                display: "block",
              }}
            />
          ) : (
            <div
              style={{
                height: 180,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
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
              setCaption(event.target.value)
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
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(event) =>
          event.stopPropagation()
        }
        style={{
          width: "min(900px, 100%)",
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
            alignItems: "center",
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
              background: "#FFFFFF",
              borderRadius: 8,
              padding:
                "7px 11px",
              cursor: "pointer",
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
            objectFit: "contain",
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
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={(event) =>
          event.stopPropagation()
        }
        style={{
          width: "min(520px, 100%)",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#FFFFFF",
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
            alignItems: "center",
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
              background: "#FFFFFF",
              borderRadius: 8,
              width: 36,
              height: 36,
              cursor: "pointer",
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
        justifyContent: "flex-end",
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
          background: "#FFFFFF",
          borderRadius: 9,
          padding:
            "10px 16px",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Cancel
      </button>

      <button
        type="submit"
        style={{
          border: "none",
          background: "#F4C542",
          color: "#2F3A3F",
          borderRadius: 9,
          padding:
            "10px 18px",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {submitLabel}
      </button>
    </div>
  );
}

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

function getStatusStyle(
  status
) {
  switch (status) {
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

    case "Construction":
      return {
        background: "#FFE4E6",
        color: "#BE123C",
      };

    case "Mending":
      return {
        background: "#E0F2FE",
        color: "#0369A1",
      };

    case "Fitting":
      return {
        background: "#FEF3C7",
        color: "#92400E",
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
  fontFamily: "inherit",
};