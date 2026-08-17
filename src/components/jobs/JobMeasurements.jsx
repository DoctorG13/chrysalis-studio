import { useEffect, useMemo, useState } from "react";

import {
  getMeasurement,
  saveMeasurement,
} from "../../services/measurementApi";

const FIELDS = [
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

export default function JobMeasurements({ job }) {
  const [measurements, setMeasurements] = useState(
    job?.measurements || {}
  );
  const [measurementId, setMeasurementId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadMeasurements() {
      if (!job?.id) return;

      setIsLoading(true);
      setError("");
      setSavedMessage("");

      try {
        const record = await getMeasurement(job.id);

        if (!active) return;

        setMeasurementId(record?.id || null);
        setMeasurements(record?.measurements || job.measurements || {});
      } catch (loadError) {
        if (!active) return;

        console.error("Unable to load measurements from SQLite.", loadError);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load measurements."
        );
        setMeasurements(job.measurements || {});
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadMeasurements();

    return () => {
      active = false;
    };
  }, [job]);

  const populatedCount = useMemo(
    () =>
      FIELDS.filter(
        (field) =>
          measurements[field] !== undefined &&
          measurements[field] !== null &&
          measurements[field] !== ""
      ).length,
    [measurements]
  );

  function updateMeasurement(field, value) {
    setMeasurements((current) => ({
      ...current,
      [field]: value,
    }));
    setSavedMessage("");
  }

  async function handleSave() {
    if (!job?.id || !job?.clientId) {
      setError("This job must have a client before measurements can be saved.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSavedMessage("");

    try {
      const saved = await saveMeasurement({
        id: measurementId || undefined,
        clientId: job.clientId,
        jobId: job.id,
        measurements,
      });

      setMeasurementId(saved.id);
      setMeasurements(saved.measurements || {});
      setSavedMessage("Measurements saved to SQLite.");
    } catch (saveError) {
      console.error("Unable to save measurements to SQLite.", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save measurements."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 18,
        padding: 24,
        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
      }}
    >
      <div
        style={{
          marginBottom: 22,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
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
              fontSize: 14,
              color: "#777",
            }}
          >
            Garment measurements recorded for this job.
          </div>
        </div>

        <div
          style={{
            padding: "5px 10px",
            borderRadius: 999,
            background:
              populatedCount === FIELDS.length ? "#DCFCE7" : "#F3F4F6",
            color:
              populatedCount === FIELDS.length ? "#166534" : "#666",
            fontSize: 12,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {populatedCount} / {FIELDS.length} recorded
        </div>
      </div>

      {isLoading ? (
        <div
          style={{
            padding: 24,
            borderRadius: 12,
            background: "#F8F9FA",
            color: "#777",
            textAlign: "center",
            fontSize: 13,
          }}
        >
          Loading measurements…
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            {FIELDS.map((field) => (
              <MeasurementCard
                key={field}
                label={field}
                value={measurements[field]}
                onChange={(value) => updateMeasurement(field, value)}
              />
            ))}
          </div>

          {error && (
            <div
              style={{
                marginTop: 18,
                padding: 12,
                borderRadius: 10,
                background: "#FEE2E2",
                color: "#991B1B",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          {savedMessage && (
            <div
              style={{
                marginTop: 18,
                padding: 12,
                borderRadius: 10,
                background: "#DCFCE7",
                color: "#166534",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              ✓ {savedMessage}
            </div>
          )}

          <div
            style={{
              marginTop: 18,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              style={{
                border: "none",
                background: "#8B1E3F",
                color: "#FFFFFF",
                borderRadius: 9,
                padding: "10px 18px",
                fontSize: 13,
                fontWeight: 700,
                cursor: isSaving ? "wait" : "pointer",
                opacity: isSaving ? 0.7 : 1,
              }}
            >
              {isSaving ? "Saving…" : "💾 Save Measurements"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function MeasurementCard({ label, value, onChange }) {
  return (
    <label
      style={{
        background: "#F8F9FA",
        border: "1px solid #E8EAED",
        borderRadius: 12,
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 7,
      }}
    >
      <span
        style={{
          fontSize: 12,
          color: "#888",
        }}
      >
        {label}
      </span>

      <input
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Not recorded"
        inputMode="decimal"
        style={{
          width: "100%",
          boxSizing: "border-box",
          border: "1px solid #D9DDE1",
          borderRadius: 8,
          background: "#FFFFFF",
          padding: "9px 10px",
          fontSize: 15,
          fontWeight: 600,
          color: "#2F3A3F",
          outline: "none",
        }}
      />
    </label>
  );
}
