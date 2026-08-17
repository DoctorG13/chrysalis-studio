import React from "react";

function money(value) {
  return Number(value || 0).toLocaleString("en-AU", { style: "currency", currency: "AUD" });
}

function displayDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-AU");
}

export default function InvoicePrintView({ invoice, client, job }) {
  if (!invoice) return null;

  const lineItems = Array.isArray(invoice.lineItems) ? invoice.lineItems : [];
  const subtotal = Number(invoice.subtotal ?? lineItems.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.rate || 0), 0));
  const gst = Number(invoice.gst ?? 0);
  const total = Number(invoice.total ?? invoice.amount ?? subtotal + gst);
  const paid = Number(invoice.amountPaid ?? 0);
  const balance = Number(invoice.balance ?? total - paid);
  const clientName = `${client?.firstName || ""} ${client?.lastName || ""}`.trim() || "Client";

  return (
    <div className="invoice-print-document">
      <div className="invoice-print-header">
        <div>
          <div className="invoice-brand">🦋 CHRYSALIS</div>
          <div className="invoice-subtitle">Professional Dressmaking Studio</div>
        </div>
        <div className="invoice-title-block">
          <h1>INVOICE</h1>
          <strong>{invoice.number || "Draft Invoice"}</strong>
        </div>
      </div>

      <div className="invoice-print-rule" />

      <div className="invoice-meta-grid">
        <div>
          <div className="invoice-label">BILL TO</div>
          <div className="invoice-client-name">{clientName}</div>
          {client?.phone && <div>{client.phone}</div>}
          {client?.email && <div>{client.email}</div>}
        </div>
        <div className="invoice-meta-right">
          <div><span>Issue Date</span><strong>{displayDate(invoice.issueDate)}</strong></div>
          <div><span>Due Date</span><strong>{displayDate(invoice.dueDate)}</strong></div>
          <div><span>Status</span><strong>{invoice.status || "Draft"}</strong></div>
          {job && <div><span>Job</span><strong>{job.reference || job.name}</strong></div>}
        </div>
      </div>

      <table className="invoice-print-table">
        <thead><tr><th>Description</th><th className="qty">Qty</th><th className="money">Rate</th><th className="money">Amount</th></tr></thead>
        <tbody>
          {lineItems.length ? lineItems.map((item, index) => {
            const lineTotal = Number(item.lineTotal ?? Number(item.quantity || 0) * Number(item.rate || 0));
            return <tr key={`${item.description}-${index}`}><td>{item.description || "Service"}</td><td className="qty">{item.quantity}</td><td className="money">{money(item.rate)}</td><td className="money">{money(lineTotal)}</td></tr>;
          }) : <tr><td colSpan="4">No line items</td></tr>}
        </tbody>
      </table>

      <div className="invoice-print-bottom">
        <div className="invoice-notes">
          {invoice.notes && <><div className="invoice-label">NOTES</div><p>{invoice.notes}</p></>}
          <div className="invoice-thanks">Thank you for choosing Chrysalis.</div>
        </div>
        <div className="invoice-totals">
          <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
          <div><span>GST</span><strong>{money(gst)}</strong></div>
          <div className="invoice-total"><span>Total</span><strong>{money(total)}</strong></div>
          <div><span>Paid</span><strong>{money(paid)}</strong></div>
          <div className="invoice-balance"><span>Balance Owing</span><strong>{money(balance)}</strong></div>
        </div>
      </div>

      <div className="invoice-print-footer">Chrysalis Studio · Professional Dressmaker Business System</div>
    </div>
  );
}
