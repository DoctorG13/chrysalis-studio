import { useEffect, useMemo, useState } from "react";
import { createInvoice, deleteInvoice, getInvoices, updateInvoice } from "../services/invoiceApi";
import InvoicePrintView from "../components/invoices/InvoicePrintView";
import "../components/invoices/invoicePrint.css";

const EMPTY_LINE = { description: "", quantity: 1, rate: 0 };

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nextInvoiceNumber(invoices) {
  const year = new Date().getFullYear();
  const numbers = invoices
    .map((invoice) => String(invoice.number || "").match(/^INV-(\d{4})-(\d+)$/))
    .filter(Boolean)
    .filter((match) => Number(match[1]) === year)
    .map((match) => Number(match[2]));
  const next = numbers.length ? Math.max(...numbers) + 1 : 1;
  return `INV-${year}-${String(next).padStart(4, "0")}`;
}

function money(value) {
  return Number(value || 0).toLocaleString("en-AU", { style: "currency", currency: "AUD" });
}

function normaliseLineItems(items) {
  return (Array.isArray(items) ? items : []).map((item) => ({
    description: String(item.description || ""),
    quantity: Number(item.quantity || 0),
    rate: Number(item.rate || 0),
  }));
}

export default function FinancePage({ clients = [], jobs = [] }) {
  const [invoices, setInvoices] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null);

  async function loadInvoices() {
    setLoading(true);
    setError("");
    try {
      setInvoices(await getInvoices());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadInvoices(); }, []);

  function startNew() {
    setSelectedId("");
    setError("");
    setForm({
      number: nextInvoiceNumber(invoices),
      clientId: clients[0]?.id || "",
      jobId: "",
      issueDate: today(),
      dueDate: "",
      status: "Draft",
      notes: "",
      gstRate: 10,
      lineItems: [{ ...EMPTY_LINE }],
    });
  }

  function editInvoice(invoice) {
    setSelectedId(invoice.id);
    setError("");
    setForm({
      ...invoice,
      gstRate: Number(invoice.gstRate ?? 10),
      lineItems: normaliseLineItems(invoice.lineItems),
    });
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateLine(index, field, value) {
    setForm((current) => ({
      ...current,
      lineItems: current.lineItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  }

  function addLine() {
    setForm((current) => ({ ...current, lineItems: [...current.lineItems, { ...EMPTY_LINE }] }));
  }

  function removeLine(index) {
    setForm((current) => ({
      ...current,
      lineItems: current.lineItems.length === 1
        ? [{ ...EMPTY_LINE }]
        : current.lineItems.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  const subtotal = useMemo(
    () => (form?.lineItems || []).reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.rate || 0), 0),
    [form]
  );
  const gst = subtotal * (Number(form?.gstRate || 0) / 100);
  const total = subtotal + gst;
  const selectedJob = jobs.find((job) => job.id === form?.jobId);
  const paid = useMemo(() => {
    if (!selectedJob) return 0;
    return (selectedJob.payments || []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  }, [selectedJob]);
  const balance = total - paid;

  async function save() {
    if (!form?.clientId) return setError("Please select a client.");
    if (!form.number.trim()) return setError("Please enter an invoice number.");
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        amount: total,
        subtotal,
        gst,
        total,
        amountPaid: paid,
        balance,
        lineItems: form.lineItems.map((item) => ({
          ...item,
          quantity: Number(item.quantity || 0),
          rate: Number(item.rate || 0),
          lineTotal: Number(item.quantity || 0) * Number(item.rate || 0),
        })),
      };
      const saved = form.id ? await updateInvoice(payload) : await createInvoice(payload);
      await loadInvoices();
      setSelectedId(saved.id);
      editInvoice(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeInvoice() {
    if (!form?.id || !window.confirm(`Delete ${form.number}?`)) return;
    setSaving(true);
    try {
      await deleteInvoice(form.id);
      setForm(null);
      setSelectedId("");
      await loadInvoices();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 30, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#8B1E3F" }}>Finance</div>
          <h1 style={{ margin: "6px 0 8px", color: "#2F3A3F" }}>Invoices</h1>
          <p style={{ margin: 0, color: "#777" }}>Create, manage and track client invoices.</p>
        </div>
        <button onClick={startNew} style={primaryButton}>+ New Invoice</button>
      </div>

      {error && <div style={errorBox}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 22, alignItems: "start" }}>
        <section style={panel}>
          <div style={sectionTitle}>Invoices ({invoices.length})</div>
          {loading ? <div style={muted}>Loading invoices…</div> : invoices.length === 0 ? (
            <div style={empty}>No invoices yet.<br /><span>Create the first invoice above.</span></div>
          ) : invoices.map((invoice) => (
            <button key={invoice.id} onClick={() => editInvoice(invoice)} style={{ ...invoiceRow, background: selectedId === invoice.id ? "#FFF7E0" : "white" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <strong>{invoice.number || "Draft Invoice"}</strong>
                <span style={statusBadge(invoice.status)}>{invoice.status}</span>
              </div>
              <div style={{ marginTop: 6, color: "#555" }}>{clientName(clients, invoice.clientId)}</div>
              <div style={{ marginTop: 4, fontWeight: 700 }}>{money(invoice.amount)}</div>
            </button>
          ))}
        </section>

        <section style={panel}>
          {!form ? (
            <div style={{ padding: 50, textAlign: "center" }}>
              <div style={{ fontSize: 48 }}>🧾</div>
              <h2 style={{ color: "#2F3A3F" }}>Invoice Management</h2>
              <p style={{ color: "#777" }}>Select an invoice or create a new one.</p>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                <div>
                  <div style={eyebrow}>Invoice</div>
                  <h2 style={{ margin: "4px 0", color: "#2F3A3F" }}>{form.number}</h2>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => window.print()} style={secondaryButton} disabled={saving}>Print / PDF</button>
                  {form.id && <button onClick={removeInvoice} style={dangerButton} disabled={saving}>Delete</button>}
                  <button onClick={save} style={primaryButton} disabled={saving}>{saving ? "Saving…" : "Save Invoice"}</button>
                </div>
              </div>

              <div style={grid2}>
                <Field label="Invoice Number"><input value={form.number} onChange={(e) => updateField("number", e.target.value)} style={input} /></Field>
                <Field label="Status"><select value={form.status} onChange={(e) => updateField("status", e.target.value)} style={input}><option>Draft</option><option>Issued</option><option>Paid</option><option>Overdue</option></select></Field>
                <Field label="Client"><select value={form.clientId} onChange={(e) => updateField("clientId", e.target.value)} style={input}><option value="">Select client…</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.firstName} {client.lastName}</option>)}</select></Field>
                <Field label="Job"><select value={form.jobId || ""} onChange={(e) => updateField("jobId", e.target.value)} style={input}><option value="">No job linked</option>{jobs.filter((job) => !form.clientId || job.clientId === form.clientId).map((job) => <option key={job.id} value={job.id}>{job.reference} — {job.name}</option>)}</select></Field>
                <Field label="Issue Date"><input type="date" value={form.issueDate || ""} onChange={(e) => updateField("issueDate", e.target.value)} style={input} /></Field>
                <Field label="Due Date"><input type="date" value={form.dueDate || ""} onChange={(e) => updateField("dueDate", e.target.value)} style={input} /></Field>
              </div>

              <div style={{ marginTop: 28 }}>
                <div style={sectionTitle}>Line Items</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 130px 120px 40px", gap: 8, padding: "0 0 8px", color: "#888", fontSize: 12, fontWeight: 700 }}><span>Description</span><span>Qty</span><span>Rate</span><span>Total</span><span /></div>
                {form.lineItems.map((item, index) => <div key={index} style={{ display: "grid", gridTemplateColumns: "1fr 100px 130px 120px 40px", gap: 8, marginBottom: 8 }}><input value={item.description} placeholder="Service or garment" onChange={(e) => updateLine(index, "description", e.target.value)} style={input} /><input type="number" min="0" step="1" value={item.quantity} onChange={(e) => updateLine(index, "quantity", e.target.value)} style={input} /><input type="number" min="0" step="0.01" value={item.rate} onChange={(e) => updateLine(index, "rate", e.target.value)} style={input} /><div style={totalCell}>{money(Number(item.quantity || 0) * Number(item.rate || 0))}</div><button onClick={() => removeLine(index)} style={iconButton} title="Remove line">×</button></div>)}
                <button onClick={addLine} style={secondaryButton}>+ Add Line Item</button>
              </div>

              <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "1fr 340px", gap: 30 }}>
                <Field label="Notes"><textarea value={form.notes || ""} onChange={(e) => updateField("notes", e.target.value)} rows={5} style={{ ...input, resize: "vertical" }} placeholder="Payment instructions or notes" /></Field>
                <div style={summary}>
                  <SummaryRow label="Subtotal" value={money(subtotal)} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0" }}><span>GST</span><input type="number" min="0" step="0.1" value={form.gstRate} onChange={(e) => updateField("gstRate", e.target.value)} style={{ ...input, width: 90, textAlign: "right" }} />%</div>
                  <SummaryRow label="GST Amount" value={money(gst)} />
                  <div style={{ borderTop: "1px solid #ddd", marginTop: 6, paddingTop: 12 }}><SummaryRow label="Total" value={money(total)} strong /></div>
                  <SummaryRow label="Paid" value={money(paid)} />
                  <SummaryRow label="Balance Owing" value={money(balance)} strong />
                </div>
              </div>

              <InvoicePrintView
                invoice={{ ...form, subtotal, gst, total, amountPaid: paid, balance }}
                client={clients.find((client) => client.id === form.clientId)}
                job={selectedJob}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function clientName(clients, id) {
  const client = clients.find((item) => item.id === id);
  return client ? `${client.firstName || ""} ${client.lastName || ""}`.trim() : "Unknown client";
}

function Field({ label, children }) { return <label style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: 12, fontWeight: 700, color: "#666" }}>{label}{children}</label>; }
function SummaryRow({ label, value, strong = false }) { return <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", color: strong ? "#2F3A3F" : "#666", fontWeight: strong ? 800 : 500 }}><span>{label}</span><span>{value}</span></div>; }

const panel = { background: "#fff", border: "1px solid #E5E7EB", borderRadius: 18, padding: 22, boxShadow: "0 2px 10px rgba(0,0,0,0.03)" };
const sectionTitle = { fontSize: 13, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", color: "#8B1E3F", marginBottom: 14 };
const eyebrow = { fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: "#8B1E3F" };
const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 };
const input = { width: "100%", boxSizing: "border-box", border: "1px solid #D9DEE2", borderRadius: 8, padding: "10px 11px", fontSize: 14, background: "#fff", color: "#2F3A3F" };
const totalCell = { display: "flex", alignItems: "center", justifyContent: "flex-end", fontWeight: 700, color: "#2F3A3F" };
const summary = { background: "#F8F9FA", border: "1px solid #E8EAED", borderRadius: 12, padding: 16 };
const muted = { color: "#888", fontSize: 13 };
const empty = { padding: "35px 10px", textAlign: "center", color: "#777", lineHeight: 1.7 };
const invoiceRow = { width: "100%", border: "1px solid #E8EAED", borderRadius: 10, padding: 13, marginBottom: 9, textAlign: "left", cursor: "pointer", color: "#2F3A3F" };
const primaryButton = { border: "none", borderRadius: 9, padding: "11px 16px", background: "#8B1E3F", color: "white", fontWeight: 800, cursor: "pointer" };
const secondaryButton = { border: "1px solid #D9DEE2", borderRadius: 8, padding: "8px 12px", background: "white", color: "#2F3A3F", fontWeight: 700, cursor: "pointer" };
const dangerButton = { border: "1px solid #F0B4B4", borderRadius: 9, padding: "10px 14px", background: "#FFF5F5", color: "#B42318", fontWeight: 800, cursor: "pointer" };
const iconButton = { border: "1px solid #ddd", borderRadius: 8, background: "white", fontSize: 20, cursor: "pointer", color: "#888" };
const errorBox = { marginBottom: 18, padding: 12, borderRadius: 9, background: "#FFF1F1", border: "1px solid #F2B8B8", color: "#A21D1D", fontSize: 13 };
function statusBadge(status) { return { fontSize: 10, fontWeight: 800, textTransform: "uppercase", padding: "4px 7px", borderRadius: 999, background: status === "Paid" ? "#DCFCE7" : status === "Overdue" ? "#FEE2E2" : "#F3F4F6", color: status === "Paid" ? "#166534" : status === "Overdue" ? "#991B1B" : "#555" }; }
