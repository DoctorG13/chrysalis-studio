import { useMemo } from "react";

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

      return `${year}-${month.padStart(
        2,
        "0"
      )}-${day.padStart(2, "0")}`;
    }

    return "";
  }

  function formatDateForJob(value) {
    if (!value) return "";

    const [year, month, day] =
      value.split("-");

    if (!year || !month || !day) {
      return value;
    }

    return `${day}/${month}/${year}`;
  }

  const dueDateValue = useMemo(
    () =>
      formatDateForInput(
        job.dueDate
      ),
    [job.dueDate]
  );

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 18,
        padding: 24,
        boxShadow:
          "0 2px 10px rgba(0,0,0,0.03)",
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: "#8B1E3F",
            marginBottom: 5,
          }}
        >
          Job Details
        </div>

        <div
          style={{
            fontSize: 14,
            color: "#777",
          }}
        >
          Update the job information below.
        </div>
      </div>

      {/* Basic details */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <Field
          label="Job Name"
          value={job.name || ""}
          onChange={(value) =>
            update("name", value)
          }
          placeholder="Enter job name"
        />

        <SelectField
          label="Garment Type"
          value={
            job.garmentType || ""
          }
          onChange={(value) =>
            update(
              "garmentType",
              value
            )
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
          onChange={(value) =>
            update("status", value)
          }
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
          value={
            job.priority || "Normal"
          }
          onChange={(value) =>
            update(
              "priority",
              value
            )
          }
          options={[
            "Low",
            "Normal",
            "High",
            "Urgent",
          ]}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr 1fr",
            gap: 14,
          }}
        >
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

      {/* Description */}
      <div
        style={{
          marginTop: 24,
          paddingTop: 24,
          borderTop:
            "1px solid #ECECEC",
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
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "12px 14px",
            border:
              "1px solid #D9DDE1",
            borderRadius: 10,
            fontSize: 15,
            lineHeight: 1.5,
            color: "#2F3A3F",
            background: "#FFFFFF",
            outline: "none",
            resize: "vertical",
            fontFamily:
              "inherit",
          }}
        />
      </div>

      {/* Save reminder */}
      <div
        style={{
          marginTop: 20,
          padding: "12px 14px",
          background: "#F8F9FA",
          borderRadius: 10,
          color: "#777",
          fontSize: 12,
        }}
      >
        Changes are applied to the job when
        you press <strong>Save</strong> above.
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

      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            event.target.value
          )
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

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
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

      <input
        type="date"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
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

      <div
        style={{
          position: "relative",
        }}
      >
        <span
          style={{
            position: "absolute",
            left: 13,
            top: "50%",
            transform:
              "translateY(-50%)",
            color: "#888",
            fontSize: 15,
            pointerEvents: "none",
          }}
        >
          $
        </span>

        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          style={{
            ...inputStyle,
            width: "100%",
            boxSizing: "border-box",
            paddingLeft: 30,
          }}
        />
      </div>
    </div>
  );
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
};