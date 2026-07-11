import TextInput from "../common/TextInput";

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

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      <TextInput
        label="Job Name"
        value={job.name || ""}
        onChange={(value) =>
          update("name", value)
        }
      />

      <TextInput
        label="Garment Type"
        value={job.garmentType || ""}
        onChange={(value) =>
          update("garmentType", value)
        }
      />

      <TextInput
        label="Status"
        value={job.status || ""}
        onChange={(value) =>
          update("status", value)
        }
      />

      <TextInput
        label="Priority"
        value={job.priority || ""}
        onChange={(value) =>
          update("priority", value)
        }
      />

      <TextInput
        label="Due Date"
        type="date"
        value={job.dueDate || ""}
        onChange={(value) =>
          update("dueDate", value)
        }
      />

      <TextInput
        label="Quoted Price"
        type="number"
        value={job.price || ""}
        onChange={(value) =>
          update("price", value)
        }
      />

      <TextInput
        label="Deposit"
        type="number"
        value={job.deposit || ""}
        onChange={(value) =>
          update("deposit", value)
        }
      />

      <TextInput
        label="Description"
        value={job.description || ""}
        onChange={(value) =>
          update("description", value)
        }
      />
    </div>
  );
}