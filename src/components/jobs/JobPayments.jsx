export default function JobPayments({ job }) {
  const payments = job.payments || [];

  const totalPaid = payments.reduce(
    (total, payment) => total + Number(payment.amount || 0),
    0
  );

  const quote = Number(job.price || 0);
  const balance = quote - totalPaid;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: 20,
        }}
      >
        <SummaryCard
          title="Quoted Price"
          value={`$${quote.toFixed(2)}`}
        />

        <SummaryCard
          title="Total Paid"
          value={`$${totalPaid.toFixed(2)}`}
        />

        <SummaryCard
          title="Outstanding"
          value={`$${balance.toFixed(2)}`}
        />
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #ddd",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr
              style={{
                background: "#f5f5f5",
              }}
            >
              <th style={headerStyle}>Date</th>
              <th style={headerStyle}>Description</th>
              <th style={headerStyle}>Method</th>
              <th
                style={{
                  ...headerStyle,
                  textAlign: "right",
                }}
              >
                Amount
              </th>
            </tr>
          </thead>

          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: 30,
                    textAlign: "center",
                    color: "#888",
                  }}
                >
                  No payments recorded.
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id}>
                  <td style={cellStyle}>
                    {payment.date}
                  </td>

                  <td style={cellStyle}>
                    {payment.description}
                  </td>

                  <td style={cellStyle}>
                    {payment.method}
                  </td>

                  <td
                    style={{
                      ...cellStyle,
                      textAlign: "right",
                      fontWeight: 600,
                    }}
                  >
                    $
                    {Number(payment.amount).toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
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
        background: "#fff",
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: 18,
      }}
    >
      <div
        style={{
          color: "#777",
          fontSize: 13,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 26,
          fontWeight: 700,
          color: "#2F3A3F",
        }}
      >
        {value}
      </div>
    </div>
  );
}

const headerStyle = {
  padding: 14,
  textAlign: "left",
  borderBottom: "1px solid #ddd",
};

const cellStyle = {
  padding: 14,
  borderBottom: "1px solid #eee",
};