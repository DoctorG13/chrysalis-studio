export default function JobMeasurements({
  job,
}) {
  const measurements =
    job.measurements || {};

  const fields = [
    "Bust",
    "Waist",
    "Hips",
    "Shoulder",
    "Neck",
    "Sleeve",
    "Bicep",
    "Wrist",
    "Front Length",
    "Back Length",
    "Inside Leg",
    "Outside Leg",
  ];

  const populatedCount =
    fields.filter(
      (field) =>
        measurements[field] !== undefined &&
        measurements[field] !== null &&
        measurements[field] !== ""
    ).length;

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
          marginBottom: 22,
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
          Measurements
        </div>

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              fontSize: 14,
              color: "#777",
            }}
          >
            Garment measurements recorded
            for this job.
          </div>

          <div
            style={{
              padding: "5px 10px",
              borderRadius: 999,
              background:
                populatedCount ===
                fields.length
                  ? "#DCFCE7"
                  : "#F3F4F6",
              color:
                populatedCount ===
                fields.length
                  ? "#166534"
                  : "#666",
              fontSize: 12,
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            {populatedCount} /{" "}
            {fields.length} recorded
          </div>
        </div>
      </div>

      {/* Measurements */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        {fields.map((field) => (
          <MeasurementCard
            key={field}
            label={field}
            value={measurements[field]}
          />
        ))}
      </div>

      {/* Empty-state message */}
      {populatedCount === 0 && (
        <div
          style={{
            marginTop: 18,
            padding: 14,
            borderRadius: 10,
            background: "#F8F9FA",
            border:
              "1px solid #E8EAED",
            color: "#777",
            fontSize: 13,
            textAlign: "center",
          }}
        >
          No measurements have been
          recorded for this job yet.
        </div>
      )}
    </div>
  );
}

function MeasurementCard({
  label,
  value,
}) {
  const hasValue =
    value !== undefined &&
    value !== null &&
    value !== "";

  return (
    <div
      style={{
        background: hasValue
          ? "#F8F9FA"
          : "#FBFBFB",
        border:
          "1px solid #E8EAED",
        borderRadius: 12,
        padding: "14px 15px",
        minHeight: 58,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "#888",
          marginBottom: 6,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: hasValue
            ? "#2F3A3F"
            : "#AAA",
        }}
      >
        {hasValue
          ? value
          : "Not recorded"}
      </div>
    </div>
  );
}