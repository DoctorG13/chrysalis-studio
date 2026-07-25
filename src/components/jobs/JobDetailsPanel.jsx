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

      <div>
  <label
    style={{
      display: "block",
      marginBottom: 6,
      fontWeight: 600,
    }}
  >
    Garment Type
  </label>

  <select
    value={job.garmentType || "Alteration"}
    onChange={(e) =>
      update("garmentType", e.target.value)
    }
    style={{
      width: "100%",
      height: 42,
      border: "1px solid #D9D9D9",
      borderRadius: 8,
      padding: "0 12px",
      fontSize: 15,
      background: "#fff",
    }}
  >
    <option>Wedding Dress</option>
    <option>Formal Dress</option>
    <option>Bridesmaid Dress</option>
    <option>Suit</option>
    <option>Jacket</option>
    <option>Pants</option>
    <option>Skirt</option>
    <option>Shirt</option>
    <option>Costume</option>
    <option>Alteration</option>
    <option>Repair</option>
    <option>Other</option>
  </select>
</div>

      <div>
  <label
    style={{
      display: "block",
      marginBottom: 6,
      fontWeight: 600,
    }}
  >
    Status
  </label>

  <select
    value={job.status || "New"}
    onChange={(e) =>
      update("status", e.target.value)
    }
    style={{
      width: "100%",
      height: 42,
      border: "1px solid #D9D9D9",
      borderRadius: 8,
      padding: "0 12px",
      fontSize: 15,
      background: "#fff",
    }}
  >
    <option>New</option>
    <option>Measuring</option>
    <option>Cutting</option>
    <option>Sewing</option>
    <option>Fitting</option>
    <option>Alterations</option>
    <option>Mending</option>
    <option>Ready</option>
    <option>Collected</option>
    <option>Cancelled</option>
  </select>
</div>

      <TextInput
        label="Priority"
        value={job.priority || ""}
        onChange={(value) =>
          update("priority", value)
        }
      />

      <div>
  <label
    style={{
      display: "block",
      marginBottom: 6,
      fontWeight: 600,
    }}
  >
    Priority
  </label>

  <select
    value={job.priority || "Normal"}
    onChange={(e) =>
      update("priority", e.target.value)
    }
    style={{
      width: "100%",
      height: 42,
      border: "1px solid #D9D9D9",
      borderRadius: 8,
      padding: "0 12px",
      fontSize: 15,
      background: "#fff",
    }}
  >
    <option>Low</option>
    <option>Normal</option>
    <option>High</option>
    <option>Urgent</option>
  </select>
</div>

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