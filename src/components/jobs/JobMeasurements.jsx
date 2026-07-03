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

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit,minmax(220px,1fr))",
        gap: 20,
      }}
    >
      {fields.map((field) => (
        <MeasurementCard
          key={field}
          label={field}
          value={
            measurements[field] || ""
          }
        />
      ))}
    </div>
  );
}

function MeasurementCard({
  label,
  value,
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: 18,
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: "#777",
          marginBottom: 8,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#2F3A3F",
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}