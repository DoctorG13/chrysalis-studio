export default function JobPayments({
  job,
}) {
  const payments = job.payments || [];

  const quote = Number(job.price || 0);

  const totalPaid = payments.reduce(
    (total, payment) =>
      total +
      Number(payment.amount || 0),
    0
  );

  const outstanding = Math.max(
    quote - totalPaid,
    0
  );

  const paymentPercent =
    quote > 0
      ? Math.min(
          Math.max(
            (totalPaid / quote) * 100,
            0
          ),
          100
        )
      : 0;

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
          Payments
        </div>

        <div
          style={{
            fontSize: 14,
            color: "#777",
          }}
        >
          Payment summary and transaction history.
        </div>
      </div>

      {/* Financial summary */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap: 10,
        }}
      >
        <MoneyCard
          label="Quoted Price"
          value={quote}
        />

        <MoneyCard
          label="Total Paid"
          value={totalPaid}
        />

        <MoneyCard
          label="Outstanding"
          value={outstanding}
          highlight={outstanding > 0}
        />
      </div>

      {/* Payment progress */}
      <div
        style={{
          marginTop: 20,
          padding: 16,
          background: "#F8F9FA",
          borderRadius: 12,
          border:
            "1px solid #E8EAED",
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
            Payment progress
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
            background: "#E5E7EB",
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
          {outstanding === 0 &&
          quote > 0
            ? "Fully paid"
            : `$${outstanding.toFixed(
                2
              )} outstanding`}
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          borderTop:
            "1px solid #ECECEC",
          margin: "24px 0",
        }}
      />

      {/* Payment history */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: "#666",
            }}
          >
            Payment History
          </div>

          <div
            style={{
              fontSize: 12,
              color: "#888",
            }}
          >
            {payments.length}{" "}
            {payments.length === 1
              ? "payment"
              : "payments"}
          </div>
        </div>

        {payments.length === 0 ? (
          <div
            style={{
              padding: 20,
              borderRadius: 12,
              background: "#F8F9FA",
              border:
                "1px solid #E8EAED",
              textAlign: "center",
              color: "#888",
              fontSize: 13,
            }}
          >
            No payments recorded
            for this job yet.
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {payments.map(
              (payment) => (
                <PaymentRow
                  key={payment.id}
                  payment={payment}
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MoneyCard({
  label,
  value,
  highlight = false,
}) {
  return (
    <div
      style={{
        padding: "13px 11px",
        borderRadius: 11,
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
          marginBottom: 6,
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
        $
        {value.toFixed(2)}
      </div>
    </div>
  );
}

function PaymentRow({
  payment,
}) {
  const amount = Number(
    payment.amount || 0
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent:
          "space-between",
        gap: 12,
        padding: "13px 14px",
        background: "#F8F9FA",
        border:
          "1px solid #E8EAED",
        borderRadius: 11,
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
            fontSize: 14,
            fontWeight: 700,
            color: "#2F3A3F",
            marginBottom: 4,
          }}
        >
          {payment.description ||
            "Payment"}
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            fontSize: 12,
            color: "#888",
          }}
        >
          {payment.date && (
            <span>
              📅 {payment.date}
            </span>
          )}

          {payment.method && (
            <span>
              • {payment.method}
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: "#2F3A3F",
          whiteSpace: "nowrap",
        }}
      >
        ${amount.toFixed(2)}
      </div>
    </div>
  );
}