import { useEffect, useState } from "react";

export default function LabourSettingsPanel() {
  const [rate, setRate] = useState(0);
  const [savedRate, setSavedRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch("/api/settings", {
          credentials: "same-origin",
          cache: "no-store",
        });

        if (!response.ok) return;

        const payload = await response.json();
        const value = Number(payload?.settings?.jobs?.defaultLabourHourlyRate) || 0;

        if (active) {
          setRate(value);
          setSavedRate(value);
        }
      } catch (error) {
        console.warn("Unable to load labour settings.", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  async function save() {
    setSaving(true);
    setMessage("");

    try {
      const currentResponse = await fetch("/api/settings", {
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!currentResponse.ok) {
        throw new Error("Unable to load current settings.");
      }

      const currentPayload = await currentResponse.json();
      const currentSettings = currentPayload?.settings || {};

      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          settings: {
            ...currentSettings,
            jobs: {
              ...(currentSettings.jobs || {}),
              defaultLabourHourlyRate: Math.max(0, Number(rate) || 0),
            },
          },
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to save labour rate.");
      }

      const nextRate =
        Number(payload?.settings?.jobs?.defaultLabourHourlyRate) ||
        Math.max(0, Number(rate) || 0);

      setRate(nextRate);
      setSavedRate(nextRate);
      setMessage("Labour rate saved.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save labour rate."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <section
      style={{
        marginBottom: 18,
        padding: 20,
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 18,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              color: "#8B1E3F",
              fontSize: 12,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 0.8,
            }}
          >
            Workflow Labour Rate
          </div>
          <div style={{ marginTop: 5, color: "#6F777C", fontSize: 13 }}>
            Default hourly rate used when a job has no saved workflow-specific rate.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "#4F585E",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            $
            <input
              type="number"
              min="0"
              step="0.01"
              value={rate}
              onChange={(event) => {
                setRate(event.target.value);
                setMessage("");
              }}
              style={{
                width: 110,
                minHeight: 38,
                padding: "8px 10px",
                border: "1px solid #D9DDE1",
                borderRadius: 8,
                boxSizing: "border-box",
                fontSize: 13,
              }}
              aria-label="Default workflow labour hourly rate"
            />
            / hour
          </label>

          <button
            type="button"
            onClick={save}
            disabled={saving || Number(rate) === Number(savedRate)}
            style={{
              minHeight: 38,
              padding: "0 14px",
              border: "none",
              borderRadius: 8,
              background: "#8B1E3F",
              color: "#FFFFFF",
              fontSize: 12,
              fontWeight: 800,
              cursor:
                saving || Number(rate) === Number(savedRate)
                  ? "default"
                  : "pointer",
              opacity:
                saving || Number(rate) === Number(savedRate)
                  ? 0.55
                  : 1,
            }}
          >
            {saving ? "Saving..." : "Save Rate"}
          </button>
        </div>
      </div>

      {message && (
        <div
          role="status"
          style={{
            marginTop: 12,
            color: message === "Labour rate saved." ? "#166534" : "#991B1B",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {message}
        </div>
      )}
    </section>
  );
}
