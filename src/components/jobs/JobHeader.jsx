import Button from "../common/Button";

export default function JobHeader({
  job,
  onSave,
  onDelete,
  onClose,
}) {
  if (!job) return null;

  function formatDate(dateString) {
    if (!dateString) return "";

    const [day, month, year] =
      dateString.split("/");

    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );

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

  function getStatusStyle(status) {
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

  const statusStyle =
    getStatusStyle(job.status);

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 18,
        padding: 28,
        marginBottom: 8,
        boxShadow:
          "0 2px 10px rgba(0,0,0,0.03)",
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
        {job.name}
      </h1>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginTop: 14,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            color: "#8B1E3F",
            fontWeight: 700,
            letterSpacing: 1,
            whiteSpace: "nowrap",
          }}
        >
          {job.reference || "CHR-NEW"}
        </div>

        {job.status && (
          <div
            style={{
              background:
                statusStyle.background,
              color: statusStyle.color,
              padding: "5px 11px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}
          >
            {job.status}
          </div>
        )}
      </div>

      <div
        style={{
          color: "#2F3A3F",
          fontSize: 15,
          marginBottom: 10,
        }}
      >
        👤{" "}
        <strong>
          {job.clientName ||
            "No client assigned"}
        </strong>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 20,
          color: "#666666",
          fontSize: 15,
        }}
      >
        <div>
          👗{" "}
          {job.garmentType ||
            "General Job"}
        </div>

        {job.dueDate && (
          <div
            style={{
              whiteSpace: "nowrap",
            }}
          >
            📅 {formatDate(job.dueDate)}
          </div>
        )}
      </div>

      <hr
        style={{
          border: "none",
          borderTop:
            "1px solid #ECECEC",
          margin: "24px 0 20px",
        }}
      />

      <div
        style={{
          display: "flex",
          gap: 10,
          width: "100%",
        }}
      >
        <div style={{ flex: 1 }}>
          <Button
            onClick={onSave}
          >
            💾 Save
          </Button>
        </div>

        <div style={{ flex: 1 }}>
          <Button
            onClick={onClose}
          >
            ✕ Close
          </Button>
        </div>

        <div style={{ flex: 1 }}>
          <Button
            onClick={onDelete}
          >
            🗑 Delete
          </Button>
        </div>
      </div>
    </div>
  );
}