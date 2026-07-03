export default function JobOverview({ job }) {
  const quote = Number(job.price || 0);
  const deposit = Number(job.deposit || 0);
  const balance = Math.max(0, quote - deposit);

  const fittings = job.fittings || [];
  const payments = job.payments || [];
  const photos = job.photos || [];
  const timeline = job.timeline || [];

  const latestActivity =
    timeline.length > 0 ? timeline[0] : null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      {/* Summary Cards */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: 20,
        }}
      >
        <InfoCard
          title="Garment"
          value={job.garmentType || "-"}
        />

        <InfoCard
          title="Status"
          value={job.status || "-"}
        />

        <InfoCard
          title="Due Date"
          value={job.dueDate || "-"}
        />

        <InfoCard
          title="Outstanding"
          value={`$${balance.toFixed(2)}`}
        />
      </div>

      {/* Statistics */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(180px,1fr))",
          gap: 20,
        }}
      >
        <StatCard
          title="Fittings"
          value={fittings.length}
        />

        <StatCard
          title="Payments"
          value={payments.length}
        />

        <StatCard
          title="Photos"
          value={photos.length}
        />

        <StatCard
          title="Timeline Events"
          value={timeline.length}
        />
      </div>

      {/* Financial Summary */}

      <div
        style={{
          background: "#FFF",
          border: "1px solid #DDD",
          borderRadius: 12,
          padding: 20,
        }}
      >
        <h3
          style={{
            marginTop: 0,
            marginBottom: 18,
          }}
        >
          Financial Summary
        </h3>

        <SummaryRow
          label="Quoted Price"
          value={`$${quote.toFixed(2)}`}
        />

        <SummaryRow
          label="Deposit Paid"
          value={`$${deposit.toFixed(2)}`}
        />

        <SummaryRow
          label="Outstanding"
          value={`$${balance.toFixed(2)}`}
          bold
        />
      </div>

      {/* Latest Activity */}

      <div
        style={{
          background: "#FFF",
          border: "1px solid #DDD",
          borderRadius: 12,
          padding: 20,
        }}
      >
        <h3
          style={{
            marginTop: 0,
            marginBottom: 18,
          }}
        >
          Latest Activity
        </h3>

        {latestActivity ? (
          <>
            <strong>
              {latestActivity.title}
            </strong>

            <div
              style={{
                marginTop: 8,
                color: "#666",
              }}
            >
              {new Date(
                latestActivity.date
              ).toLocaleString("en-AU")}
            </div>
          </>
        ) : (
          <div
            style={{
              color: "#777",
            }}
          >
            No activity yet.
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({
  title,
  value,
}) {
  return (
    <div
      style={{
        background: "#FFF",
        border: "1px solid #DDD",
        borderRadius: 12,
        padding: 18,
      }}
    >
      <div
        style={{
          color: "#777",
          fontSize: 13,
          marginBottom: 8,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#2F3A3F",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
}) {
  return (
    <div
      style={{
        background: "#FFF",
        border: "1px solid #DDD",
        borderRadius: 12,
        padding: 18,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: "#7B3FF2",
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: 8,
          color: "#666",
        }}
      >
        {title}
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  bold = false,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "8px 0",
        fontWeight: bold ? 700 : 400,
      }}
    >
      <span>{label}</span>

      <span>{value}</span>
    </div>
  );
}