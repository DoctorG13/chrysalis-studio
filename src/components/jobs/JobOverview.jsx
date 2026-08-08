export default function JobOverview({ job }) {
  const quote = Number(job.price || 0);
  const deposit = Number(job.deposit || 0);
  const balance = Math.max(quote - deposit, 0);

  const paymentPercent =
    quote > 0
      ? Math.min(
          Math.max((deposit / quote) * 100, 0),
          100
        )
      : 0;

  function formatDate(dateString) {
    if (!dateString) return "-";

    const parts = dateString.split("/");

    if (parts.length !== 3) {
      return dateString;
    }

    const [day, month, year] = parts;

    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );

    if (Number.isNaN(date.getTime())) {
      return dateString;
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
        padding: 24,
        boxShadow:
          "0 2px 10px rgba(0,0,0,0.03)",
      }}
    >
      {/* Overview heading */}
      <div
        style={{
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: "#8B1E3F",
            marginBottom: 4,
          }}
        >
          Job Overview
        </div>

        <div
          style={{
            fontSize: 14,
            color: "#777",
          }}
        >
          Garment, schedule and payment summary
        </div>
      </div>

      {/* Job information */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        <SummaryItem
          label="Garment"
          value={
            job.garmentType ||
            "General Job"
          }
          icon="👗"
        />

        <SummaryItem
          label="Status"
          value={job.status || "-"}
          statusStyle={statusStyle}
        />

        <SummaryItem
          label="Due Date"
          value={formatDate(job.dueDate)}
          icon="📅"
          fullWidth
        />
      </div>

      {/* Divider */}
      <div
        style={{
          borderTop:
            "1px solid #ECECEC",
          margin: "24px 0",
        }}
      />

      {/* Financial summary */}
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: "#666",
            marginBottom: 14,
          }}
        >
          Financial Summary
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          <MoneyItem
            label="Quote"
            value={quote}
          />

          <MoneyItem
            label="Deposit"
            value={deposit}
          />

          <MoneyItem
            label="Outstanding"
            value={balance}
            highlight
          />
        </div>

        {/* Payment progress */}
        <div
          style={{
            marginTop: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              marginBottom: 8,
              fontSize: 13,
              color: "#666",
            }}
          >
            <span>
              Deposit received
            </span>

            <strong
              style={{
                color: "#2F3A3F",
              }}
            >
              {Math.round(
                paymentPercent
              )}
              %
            </strong>
          </div>

          <div
            style={{
              height: 8,
              background: "#ECEFF1",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${paymentPercent}%`,
                height: "100%",
                background: "#8B1E3F",
                borderRadius: 999,
                transition:
                  "width 0.3s ease",
              }}
            />
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              color: "#888",
            }}
          >
            {balance <= 0
              ? "Fully paid"
              : `$${balance.toFixed(
                  2
                )} remaining`}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryItem({
  label,
  value,
  icon,
  statusStyle,
  fullWidth = false,
}) {
  return (
    <div
      style={{
        gridColumn: fullWidth
          ? "1 / -1"
          : undefined,
        background: "#F8F9FA",
        border:
          "1px solid #E8EAED",
        borderRadius: 12,
        padding: 14,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "#888",
          marginBottom: 7,
        }}
      >
        {label}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          fontSize: 15,
          fontWeight: 700,
          color: "#2F3A3F",
        }}
      >
        {icon && <span>{icon}</span>}

        {statusStyle ? (
          <span
            style={{
              background:
                statusStyle.background,
              color: statusStyle.color,
              padding: "5px 10px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {value}
          </span>
        ) : (
          value
        )}
      </div>
    </div>
  );
}

function MoneyItem({
  label,
  value,
  highlight = false,
}) {
  return (
    <div
      style={{
        padding: "12px 10px",
        borderRadius: 10,
        background: highlight
          ? "#FFF7E6"
          : "#F8F9FA",
        border: highlight
          ? "1px solid #F3D38A"
          : "1px solid #E8EAED",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#888",
          marginBottom: 5,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: highlight
            ? "#8A5A00"
            : "#2F3A3F",
          whiteSpace: "nowrap",
        }}
      >
        ${value.toFixed(2)}
      </div>
    </div>
  );
}