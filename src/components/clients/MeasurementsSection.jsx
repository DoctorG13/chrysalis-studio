import TextInput from "../common/TextInput";

export default function MeasurementsSection({
  measurements,
  setMeasurements,
}) {
  const updateMeasurement = (field, value) => {
    setMeasurements((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const leftColumn = [
    ["Bust", "bust"],
    ["Waist", "waist"],
    ["Hips", "hips"],
    ["Shoulder Width", "shoulderWidth"],
    ["Back Width", "backWidth"],
    ["Sleeve Length", "sleeveLength"],
    ["Upper Arm", "upperArm"],
    ["Wrist", "wrist"],
  ];

  const rightColumn = [
    ["Neck", "neck"],
    ["Height", "height"],
    ["Inseam", "inseam"],
    ["Outseam", "outseam"],
    ["Across Bust", "acrossBust"],
    ["Across Back", "acrossBack"],
    ["Hem Length", "hemLength"],
  ];

  const renderField = ([label, field]) => (
    <TextInput
      key={field}
      label={label}
      value={measurements[field]}
      onChange={(value) => updateMeasurement(field, value)}
    />
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 30,
      }}
    >
      <div>
        <h4
          style={{
            marginTop: 0,
            marginBottom: 20,
            color: "#2F3A3F",
          }}
        >
          Upper Body
        </h4>

        {leftColumn.map(renderField)}
      </div>

      <div>
        <h4
          style={{
            marginTop: 0,
            marginBottom: 20,
            color: "#2F3A3F",
          }}
        >
          Lower Body & General
        </h4>

        {rightColumn.map(renderField)}
      </div>
    </div>
  );
}