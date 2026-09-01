function displayDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function money(value) {
  return Number(value || 0).toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
  });
}

export default function QuotePrintView({ quote, client, job }) {
  if (!quote) return null;

  const lineItems = Array.isArray(quote.lineItems)
    ? quote.lineItems
    : [];

  const subtotal = Number(
    quote.subtotal ??
      lineItems.reduce(
        (sum, item) =>
          sum +
          Number(item.quantity || 0) * Number(item.rate || 0),
        0
      )
  );

  const gst = Number(quote.gst ?? 0);
  const total = Number(quote.total ?? subtotal + gst);
  const depositPercent = Number(quote.depositPercent ?? 25);
  const depositRequired = Number(
    quote.depositRequired ??
      total * (depositPercent / 100)
  );

  const clientName =
    client?.name ||
    `${client?.firstName || ""} ${client?.lastName || ""}`.trim() ||
    "Client";

  return (
    <div className="quote-print-document">
      <div className="quote-print-header">
        <div>
          <div className="quote-brand">🦋 CHRYSALIS</div>
          <div className="quote-subtitle">
            Professional Dressmaking Studio
          </div>
        </div>

        <div className="quote-title-block">
          <h1>QUOTE</h1>
          <strong>{quote.number || "Draft Quote"}</strong>
        </div>
      </div>

      <div className="quote-print-rule" />

      <div className="quote-meta-grid">
        <div>
          <div className="quote-label">PREPARED FOR</div>
          <div className="quote-client-name">{clientName}</div>
          {client?.phone && <div>{client.phone}</div>}
          {client?.email && <div>{client.email}</div>}
        </div>

        <div className="quote-meta-right">
          <div>
            <span>Issue Date</span>
            <strong>{displayDate(quote.issueDate)}</strong>
          </div>
          <div>
            <span>Valid Until</span>
            <strong>{displayDate(quote.validUntil)}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{quote.status || "Draft"}</strong>
          </div>
        </div>
      </div>

      {job && (
        <div className="quote-job-reference">
          <span>JOB</span>
          <strong>
            {job.reference || "Job"}
            {job.name ? ` — ${job.name}` : ""}
          </strong>
        </div>
      )}

      <table className="quote-print-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item, index) => (
            <tr key={index}>
              <td>{item.description || "Item"}</td>
              <td>{Number(item.quantity || 0)}</td>
              <td>{money(item.rate)}</td>
              <td>
                {money(
                  Number(item.quantity || 0) *
                    Number(item.rate || 0)
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="quote-print-bottom">
        <div className="quote-notes">
          {quote.notes && (
            <>
              <div className="quote-label">NOTES</div>
              <p>{quote.notes}</p>
            </>
          )}

          <div className="quote-terms">
            This quotation is valid until{" "}
            {displayDate(quote.validUntil) || "the date shown above"}.
            Work will proceed once the quotation is accepted and
            the required deposit has been received.
          </div>

          <div className="quote-thanks">
            Thank you for choosing Chrysalis.
          </div>
        </div>

        <div className="quote-totals">
          <div>
            <span>Subtotal</span>
            <strong>{money(subtotal)}</strong>
          </div>
          <div>
            <span>GST</span>
            <strong>{money(gst)}</strong>
          </div>
          <div className="quote-total">
            <span>Total</span>
            <strong>{money(total)}</strong>
          </div>
          <div className="quote-deposit">
            <span>Deposit Required ({depositPercent}%)</span>
            <strong>{money(depositRequired)}</strong>
          </div>
        </div>
      </div>

      <div className="quote-print-footer">
        Chrysalis Studio · Professional Dressmaker Business System
      </div>
    </div>
  );
}