import { useMemo } from "react";
import Button from "../common/Button";

export default function JobFittings({
  job,
  onAddFitting,
  onEditFitting,
}) {
  const fittings = useMemo(
    () => job.fittings || [],
    [job]
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
            }}
          >
            Fittings
          </h2>

          <div
            style={{
              color: "#777",
              marginTop: 4,
            }}
          >
            {fittings.length} fitting
            {fittings.length !== 1 && "s"} recorded
          </div>
        </div>

        <Button onClick={onAddFitting}>
          + New Fitting
        </Button>
      </div>

      {fittings.length === 0 ? (
        <div
          style={{
            border: "2px dashed #DDD",
            borderRadius: 12,
            padding: 60,
            textAlign: "center",
            background: "#FAFAFA",
          }}
        >
          <h3>No Fittings Recorded</h3>

          <p>
            Record every fitting appointment
            throughout the life of the garment.
          </p>

          <Button onClick={onAddFitting}>
            Create First Fitting
          </Button>
        </div>
      ) : (
        fittings.map((fitting, index) => (
          <div
            key={fitting.id}
            style={{
              background: "#FFF",
              border: "1px solid #DDD",
              borderRadius: 12,
              padding: 20,
              boxShadow:
                "0 2px 6px rgba(0,0,0,.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#888",
                    marginBottom: 4,
                  }}
                >
                  Fitting {index + 1}
                </div>

                <h3
                  style={{
                    margin: 0,
                  }}
                >
                  {fitting.stage ||
                    "Fitting"}
                </h3>

                <div
                  style={{
                    color: "#666",
                    marginTop: 6,
                  }}
                >
                  {fitting.date ||
                    "No appointment date"}
                </div>
              </div>

              <Button
                onClick={() =>
                  onEditFitting?.(
                    fitting
                  )
                }
              >
                Open
              </Button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(180px,1fr))",
                gap: 18,
                marginTop: 24,
              }}
            >
              <SummaryCard
                title="Measurements"
                value={Object.keys(
                  fitting.measurements ||
                    {}
                ).length}
              />

              <SummaryCard
                title="Photos"
                value={
                  fitting.photos
                    ?.length || 0
                }
              />

              <SummaryCard
                title="Next Appointment"
                value={
                  fitting.nextAppointment ||
                  "-"
                }
              />

              <SummaryCard
                title="Completion"
                value={`${Number(
                  fitting.completion ||
                    0
                )}%`}
              />
            </div>

            {fitting.alterations && (
              <Section
                title="Alterations"
              >
                {fitting.alterations}
              </Section>
            )}

            {fitting.fabricNotes && (
              <Section
                title="Fabric Notes"
              >
                {fitting.fabricNotes}
              </Section>
            )}

            {fitting.notes && (
              <Section title="Notes">
                {fitting.notes}
              </Section>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function SummaryCard({
  title,
  value,
}) {
  return (
    <div
      style={{
        background: "#F8F9FA",
        borderRadius: 10,
        padding: 16,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "#777",
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 24,
          fontWeight: 700,
          color: "#2F3A3F",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}) {
  return (
    <div
      style={{
        marginTop: 24,
      }}
    >
      <div
        style={{
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        {title}
      </div>

      <div
        style={{
          lineHeight: 1.6,
          color: "#555",
        }}
      >
        {children}
      </div>
    </div>
  );
}