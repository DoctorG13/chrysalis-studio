import { useMemo } from "react";

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

export default function JobDetailsPanel({
  job,
  onChange,
}) {
  function update(field, value) {
    onChange({
      ...job,
      [field]: value,
    });
  }

  function formatDateForInput(value) {
    if (!value) return "";

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    const parts = value.split("/");

    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    return "";
  }

  function formatDateForJob(value) {
    if (!value) return "";

    const [year, month, day] = value.split("-");

    if (!year || !month || !day) {
      return value;
    }

    return `${day}/${month}/${year}`;
  }

  function setWorkflowStage(stage) {
    update("status", stage);
  }

  function toggleChecklistItem(key) {
    const checklist = {
      ...(job.workflowChecklist || {}),
      [key]: !(job.workflowChecklist?.[key] || false),
    };

    update("workflowChecklist", checklist);
  }

  const dueDateValue = useMemo(
    () => formatDateForInput(job.dueDate),
    [job.dueDate]
  );

  const currentStageIndex = WORKFLOW_STAGES.indexOf(job.status);

  const checklistItems = [
    ["measurements", "Measurements confirmed"],
    ["materials", "Fabric / materials ready"],
    ["cutting", "Pattern / cutting complete"],
    ["construction", "Construction complete"],
    ["fitting", "Fitting complete"],
    ["alterations", "Final alterations complete"],
    ["ready", "Ready for collection"],
  ];

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={eyebrowStyle}>Job Details</div>
        <div style={introStyle}>
          Update the job information and track its production progress.
        </div>
      </div>

      <section style={workflowSectionStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <div style={sectionLabelStyle}>Garment Workflow</div>
            <div style={sectionDescriptionStyle}>
              Move the job through each production stage as work is completed.
            </div>
          </div>

          {job.status && (
            <span style={currentStageBadgeStyle}>
              {job.status}
            </span>
          )}
        </div>

        <div style={workflowTrackStyle}>
          {WORKFLOW_STAGES.map((stage, index) => {
            const isCurrent = job.status === stage;
            const isComplete =
              currentStageIndex >= 0 &&
              index < currentStageIndex;

            return (
              <button
                key={stage}
                type="button"
                onClick={() => setWorkflowStage(stage)}
                style={{
                  ...workflowStageButtonStyle,
                  ...(isCurrent ? workflowCurrentStyle : {}),
                  ...(isComplete ? workflowCompleteStyle : {}),
                }}
                title={`Set workflow stage to ${stage}`}
              >
                <span style={workflowDotStyle}>
                  {isComplete ? "✓" : index + 1}
                </span>

                <span style={workflowStageLabelStyle}>
                  {stage}
                </span>

                <span style={workflowStageHintStyle}>
                  {isCurrent
                    ? "Current"
                    : isComplete
                      ? "Complete"
                      : "Set stage"}
                </span>
              </button>
            );
          })}
        </div>

        {job.status === "Mending" && (
          <div style={branchNoticeStyle}>
            🔧 <strong>Mending</strong> is an active repair path. When
            complete, move the job to <strong>Ready</strong>.
          </div>
        )}

        {job.status === "Cancelled" && (
          <div style={branchNoticeStyle}>
            ⚠️ This job is currently <strong>Cancelled</strong>. Select
            a workflow stage above to return it to production.
          </div>
        )}

        <div style={checklistHeaderStyle}>
          Production Checklist
        </div>

        <div style={checklistGridStyle}>
          {checklistItems.map(([key, label]) => (
            <label key={key} style={checklistItemStyle}>
              <input
                type="checkbox"
                checked={Boolean(job.workflowChecklist?.[key])}
                onChange={() => toggleChecklistItem(key)}
                style={checklistInputStyle}
              />

              <span
                style={{
                  textDecoration: job.workflowChecklist?.[key]
                    ? "line-through"
                    : "none",
                }}
              >
                {label}
              </span>
            </label>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={fieldLabelStyle}>
            Workflow Notes
          </label>

          <textarea
            value={job.workflowNotes || ""}
            onChange={(event) =>
              update("workflowNotes", event.target.value)
            }
            placeholder="What needs to happen next? Add production notes, materials, alterations or special instructions..."
            rows={3}
            style={{
              ...textareaStyle,
              resize: "vertical",
            }}
          />
        </div>
      </section>

      <div style={basicSectionStyle}>
        <div style={subsectionLabelStyle}>
          Basic Details
        </div>

        <div style={fieldsStyle}>
          <Field
            label="Job Name"
            value={job.name || ""}
            onChange={(value) => update("name", value)}
            placeholder="Enter job name"
          />

          <SelectField
            label="Garment Type"
            value={job.garmentType || ""}
            onChange={(value) =>
              update("garmentType", value)
            }
            options={[
              "Wedding Dress",
              "Formal Dress",
              "Bridesmaid Dress",
              "Suit",
              "Jacket",
              "Pants",
              "Skirt",
              "Shirt",
              "Costume",
              "Alteration",
              "Repair",
              "Other",
            ]}
            placeholder="Select garment type"
          />

          <SelectField
            label="Status"
            value={job.status || ""}
            onChange={(value) => update("status", value)}
            options={[
              "New",
              "Measuring",
              "Cutting",
              "Sewing",
              "Fitting",
              "Alterations",
              "Mending",
              "Ready",
              "Collected",
              "Cancelled",
            ]}
            placeholder="Select status"
          />

          <SelectField
            label="Priority"
            value={job.priority || "Normal"}
            onChange={(value) =>
              update("priority", value)
            }
            options={[
              "Low",
              "Normal",
              "High",
              "Urgent",
            ]}
          />

          <div style={twoColumnStyle}>
            <DateField
              label="Due Date"
              value={dueDateValue}
              onChange={(value) =>
                update(
                  "dueDate",
                  formatDateForJob(value)
                )
              }
            />

            <MoneyField
              label="Quoted Price"
              value={job.price ?? ""}
              onChange={(value) =>
                update("price", value)
              }
            />
          </div>
        </div>
      </div>

      <div style={descriptionSectionStyle}>
        <label style={fieldLabelStyle}>
          Description
        </label>

        <textarea
          value={job.description || ""}
          onChange={(event) =>
            update(
              "description",
              event.target.value
            )
          }
          placeholder="Add notes about this job..."
          rows={5}
          style={textareaStyle}
        />
      </div>

      <div style={saveReminderStyle}>
        Changes are applied to the job when you press{" "}
        <strong>Save</strong> below.
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder = "",
}) {
  return (
    <div>
      <label style={fieldLabelStyle}>
        {label}
      </label>

      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
        style={inputStyle}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}) {
  return (
    <div>
      <label style={fieldLabelStyle}>
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        style={inputStyle}
      >
        {placeholder && (
          <option value="">
            {placeholder}
          </option>
        )}

        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
}) {
  return (
    <div>
      <label style={fieldLabelStyle}>
        {label}
      </label>

      <input
        type="date"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        style={inputStyle}
      />
    </div>
  );
}

function MoneyField({
  label,
  value,
  onChange,
}) {
  return (
    <div>
      <label style={fieldLabelStyle}>
        {label}
      </label>

      <div style={{ position: "relative" }}>
        <span style={currencyPrefixStyle}>
          $
        </span>

        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          style={{
            ...inputStyle,
            paddingLeft: 30,
          }}
        />
      </div>
    </div>
  );
}

const containerStyle = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: 18,
  padding: 24,
  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
};

const headerStyle = {
  marginBottom: 20,
};

const eyebrowStyle = {
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: 1,
  textTransform: "uppercase",
  color: "#8B1E3F",
  marginBottom: 5,
};

const introStyle = {
  fontSize: 14,
  color: "#777",
};

const workflowSectionStyle = {
  padding: 18,
  borderRadius: 14,
  background: "#FAF9F6",
  border: "1px solid #E5E7EB",
  marginBottom: 22,
};

const sectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 18,
};

const sectionLabelStyle = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: 0.8,
  textTransform: "uppercase",
  color: "#8B1E3F",
};

const sectionDescriptionStyle = {
  marginTop: 4,
  fontSize: 13,
  color: "#777",
};

const currentStageBadgeStyle = {
  padding: "6px 10px",
  borderRadius: 999,
  background: "#F4C33F",
  color: "#24344A",
  fontSize: 11,
  fontWeight: 800,
};

const workflowTrackStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 9,
  width: "100%",
};

const workflowStageButtonStyle = {
  minWidth: 0,
  minHeight: 78,
  border: "1px solid #D9DDE1",
  borderRadius: 12,
  background: "#FFFFFF",
  color: "#59636A",
  padding: "10px 8px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 5,
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  boxSizing: "border-box",
};

const workflowCurrentStyle = {
  border: "2px solid #8B1E3F",
  background: "#FFF5F7",
  color: "#8B1E3F",
};

const workflowCompleteStyle = {
  background: "#F0FDF4",
  border: "1px solid #B7DFC5",
  color: "#34724B",
};

const workflowDotStyle = {
  width: 24,
  height: 24,
  borderRadius: "50%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#E8EAED",
  fontSize: 11,
  fontWeight: 800,
};

const workflowStageLabelStyle = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "100%",
};

const workflowStageHintStyle = {
  fontSize: 9,
  fontWeight: 600,
  color: "#8A9298",
};

const branchNoticeStyle = {
  marginTop: 12,
  padding: "10px 12px",
  borderRadius: 9,
  background: "#FFF7E6",
  border: "1px solid #F3D38A",
  color: "#745000",
  fontSize: 12,
};

const checklistHeaderStyle = {
  marginTop: 18,
  marginBottom: 9,
  fontSize: 12,
  fontWeight: 800,
  color: "#555",
  textTransform: "uppercase",
  letterSpacing: 0.6,
};

const checklistGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 8,
};

const checklistItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "9px 10px",
  borderRadius: 9,
  border: "1px solid #E8EAED",
  background: "#FFFFFF",
  color: "#4F585E",
  fontSize: 12,
  cursor: "pointer",
};

const checklistInputStyle = {
  width: 16,
  height: 16,
  accentColor: "#8B1E3F",
  cursor: "pointer",
};

const basicSectionStyle = {
  paddingTop: 2,
};

const subsectionLabelStyle = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: 0.7,
  textTransform: "uppercase",
  color: "#666",
  marginBottom: 14,
};

const fieldsStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

const twoColumnStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 14,
};

const descriptionSectionStyle = {
  marginTop: 24,
  paddingTop: 24,
  borderTop: "1px solid #ECECEC",
};

const fieldLabelStyle = {
  display: "block",
  fontSize: 13,
  fontWeight: 700,
  color: "#555",
  marginBottom: 7,
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  height: 44,
  padding: "0 13px",
  border: "1px solid #D9DDE1",
  borderRadius: 10,
  fontSize: 15,
  color: "#2F3A3F",
  background: "#FFFFFF",
  outline: "none",
};

const textareaStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  border: "1px solid #D9DDE1",
  borderRadius: 10,
  fontSize: 15,
  lineHeight: 1.5,
  color: "#2F3A3F",
  background: "#FFFFFF",
  outline: "none",
  resize: "vertical",
  fontFamily: "inherit",
};

const currencyPrefixStyle = {
  position: "absolute",
  left: 13,
  top: "50%",
  transform: "translateY(-50%)",
  color: "#888",
  fontSize: 15,
  pointerEvents: "none",
};

const saveReminderStyle = {
  marginTop: 20,
  padding: "12px 14px",
  background: "#F8F9FA",
  borderRadius: 10,
  color: "#777",
  fontSize: 12,
};