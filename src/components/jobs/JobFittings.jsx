export default function JobFittings({
  job,
  onAddFitting,
  onEditFitting,
}) {
  const fittings = Array.isArray(
    job?.fittings
  )
    ? job.fittings
    : [];

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
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 22,
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
            Fittings
          </div>

          <div
            style={{
              fontSize: 14,
              color: "#777",
            }}
          >
            Fitting appointments and garment
            adjustments for this job.
          </div>
        </div>

        <div
          style={{
            padding: "5px 10px",
            borderRadius: 999,
            background:
              fittings.length > 0
                ? "#FEF3C7"
                : "#F3F4F6",
            color:
              fittings.length > 0
                ? "#92400E"
                : "#666",
            fontSize: 12,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {fittings.length}{" "}
          {fittings.length === 1
            ? "fitting"
            : "fittings"}
        </div>
      </div>

      {/* Fitting list */}
      {fittings.length === 0 ? (
        <EmptyState
          onAddFitting={
            onAddFitting
          }
        />
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {fittings.map(
            (fitting, index) => (
              <FittingCard
                key={
                  fitting.id ||
                  `fitting-${index}`
                }
                fitting={fitting}
                onEdit={() =>
                  onEditFitting?.(
                    fitting
                  )
                }
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

function FittingCard({
  fitting,
  onEdit,
}) {
  const title =
    fitting.title ||
    fitting.name ||
    fitting.type ||
    `Fitting ${1}`;

  const date =
    fitting.date ||
    fitting.fittingDate ||
    "";

  const time =
    fitting.time ||
    fitting.fittingTime ||
    "";

  const status =
    fitting.status ||
    "";

  const notes =
    fitting.notes ||
    fitting.description ||
    "";

  return (
    <div
      style={{
        background: "#F8F9FA",
        border:
          "1px solid #E8EAED",
        borderRadius: 12,
        padding: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "flex-start",
          gap: 14,
        }}
      >
        <div
          style={{
            minWidth: 0,
            flex: 1,
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#2F3A3F",
              marginBottom: 8,
            }}
          >
            ✂️ {title}
          </div>

          {(date || time) && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                fontSize: 13,
                color: "#666",
              }}
            >
              {date && (
                <span>
                  📅 {formatDate(date)}
                </span>
              )}

              {time && (
                <span>
                  🕐 {time}
                </span>
              )}
            </div>
          )}

          {status && (
            <div
              style={{
                marginTop: 10,
              }}
            >
              <StatusPill
                status={status}
              />
            </div>
          )}

          {notes && (
            <div
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop:
                  "1px solid #E5E7EB",
                fontSize: 13,
                lineHeight: 1.5,
                color: "#666",
              }}
            >
              {notes}
            </div>
          )}
        </div>

        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            style={{
              border:
                "1px solid #D9DDE1",
              background: "#FFFFFF",
              borderRadius: 8,
              padding: "7px 10px",
              fontSize: 12,
              fontWeight: 600,
              color: "#555",
              cursor: "pointer",
              whiteSpace:
                "nowrap",
            }}
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
}

function StatusPill({
  status,
}) {
  const styles =
    getStatusStyle(status);

  return (
    <span
      style={{
        display: "inline-block",
        padding: "5px 10px",
        borderRadius: 999,
        background:
          styles.background,
        color: styles.color,
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {status}
    </span>
  );
}

function EmptyState({
  onAddFitting,
}) {
  return (
    <div
      style={{
        padding: 24,
        borderRadius: 12,
        background: "#F8F9FA",
        border:
          "1px solid #E8EAED",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 30,
          marginBottom: 8,
        }}
      >
        ✂️
      </div>

      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "#555",
          marginBottom: 5,
        }}
      >
        No fittings scheduled
      </div>

      <div
        style={{
          fontSize: 13,
          color: "#888",
          marginBottom: 16,
        }}
      >
        Fitting appointments for this
        garment will appear here.
      </div>

      {onAddFitting && (
        <button
          type="button"
          onClick={onAddFitting}
          style={{
            border: "none",
            background: "#F4C542",
            color: "#2F3A3F",
            borderRadius: 9,
            padding:
              "9px 16px",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          + Add Fitting
        </button>
      )}
    </div>
  );
}

function getStatusStyle(
  status
) {
  switch (status) {
    case "Scheduled":
      return {
        background: "#DBEAFE",
        color: "#1D4ED8",
      };

    case "Completed":
      return {
        background: "#DCFCE7",
        color: "#166534",
      };

    case "Cancelled":
      return {
        background: "#FEE2E2",
        color: "#B91C1C",
      };

    case "Needs Alterations":
      return {
        background: "#FEF3C7",
        color: "#92400E",
      };

    default:
      return {
        background: "#F3F4F6",
        color: "#555",
      };
  }
}

function formatDate(
  value
) {
  if (!value) return "";

  if (
    /^\d{2}\/\d{2}\/\d{4}$/.test(
      value
    )
  ) {
    const [
      day,
      month,
      year,
    ] = value.split("/");

    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );

    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {
      return date.toLocaleDateString(
        "en-AU",
        {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        }
      );
    }
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-AU",
    {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}