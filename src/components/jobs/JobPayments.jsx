import { useEffect, useMemo, useState } from "react";

import { deletePayment, getPayments, savePayment } from "../../services/paymentApi";

const DEFAULT_DEPOSIT_PERCENT = 25;

export default function JobPayments({ job, onChange }) {
  const [payments, setPayments] = useState(job?.payments || []);
  const [editingPayment, setEditingPayment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [depositPercent, setDepositPercent] = useState(Number(job?.depositPercent ?? DEFAULT_DEPOSIT_PERCENT));

  useEffect(() => {
    let active = true;

    async function loadPayments() {
      if (!job?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");
      setSavedMessage("");

      try {
        const storedPayments = await getPayments(job.id);
        if (!active) return;
        setPayments(storedPayments);
        onChange?.(storedPayments);
      } catch (loadError) {
        if (!active) return;
        console.error("Unable to load payments from SQLite.", loadError);
        setError(loadError instanceof Error ? loadError.message : "Unable to load payments.");
        setPayments(job.payments || []);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadPayments();
    return () => {
      active = false;
    };
  }, [job?.id]);

  useEffect(() => {
    setDepositPercent(Number(job?.depositPercent ?? DEFAULT_DEPOSIT_PERCENT));
  }, [job?.id, job?.depositPercent]);

  const quote = Number(job?.price || 0);
  const safeDepositPercent = Math.min(Math.max(Number(depositPercent) || 0, 0), 100);
  const depositRequired = quote * (safeDepositPercent / 100);

  const totalPaid = useMemo(
    () => payments.reduce((total, payment) => total + Number(payment.amount || 0), 0),
    [payments]
  );

  const depositPaid = useMemo(
    () => payments.filter(isDepositPayment).reduce((total, payment) => total + Number(payment.amount || 0), 0),
    [payments]
  );

  const depositBalance = Math.max(depositRequired - depositPaid, 0);
  const outstanding = Math.max(quote - totalPaid, 0);
  const paymentPercent = quote > 0 ? Math.min(Math.max((totalPaid / quote) * 100, 0), 100) : 0;
  const depositProgress = depositRequired > 0 ? Math.min(Math.max((depositPaid / depositRequired) * 100, 0), 100) : 0;

  function createTimelineEvent(type, title, description = "") {
    return {
      id: crypto.randomUUID(),
      type,
      title,
      description,
      date: new Date().toISOString(),
    };
  }

  function notifyChange(nextPayments, event) {
    setPayments(nextPayments);
    onChange?.(nextPayments, event);
  }

  function openNewPayment(type = "Payment", presetAmount = "") {
    setError("");
    setSavedMessage("");
    setEditingPayment({
      amount: presetAmount === "" ? "" : String(presetAmount.toFixed(2)),
      date: formatDateForInput(""),
      method: "",
      description: type === "Deposit" ? "Deposit" : "",
      paymentType: type,
    });
  }

  function getEditableOutstanding() {
    const editingAmount = editingPayment?.id ? Number(editingPayment.amount || 0) : 0;
    return Math.max(quote - (totalPaid - editingAmount), 0);
  }

  async function handleSavePayment(paymentData) {
    if (!job?.id || !job?.clientId) {
      setError("This job must have a client before payments can be saved.");
      return;
    }

    const numericAmount = Number(paymentData.amount);
    const allowedOutstanding = getEditableOutstanding();

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Please enter a payment amount greater than $0.");
      return;
    }

    if (quote > 0 && numericAmount > allowedOutstanding + 0.005) {
      setError(
        `That amount is too much. The maximum payment for this job is ${formatCurrency(allowedOutstanding)}.`
      );
      return;
    }

    setError("");
    setSavedMessage("");

    try {
      const savedPayment = await savePayment({
        ...paymentData,
        amount: Math.round(numericAmount * 100) / 100,
        id: editingPayment?.id,
        clientId: job.clientId,
        jobId: job.id,
        paymentType: paymentData.paymentType || "Payment",
      });

      const nextPayments = editingPayment?.id
        ? payments.map((payment) => (payment.id === editingPayment.id ? savedPayment : payment))
        : [...payments, savedPayment];

      const label = savedPayment.paymentType === "Deposit" ? "Deposit" : "Payment";
      const event = createTimelineEvent(
        "payment",
        editingPayment?.id ? `${label} Updated` : `${label} Added`,
        `${formatCurrency(Number(savedPayment.amount || 0))} ${label.toLowerCase()} ${editingPayment?.id ? "updated" : "recorded"}${savedPayment.method ? ` via ${savedPayment.method}` : ""}.`
      );

      notifyChange(nextPayments, event);
      setEditingPayment(null);
      setSavedMessage(`${label} saved to SQLite.`);
    } catch (saveError) {
      console.error("Unable to save payment to SQLite.", saveError);
      setError(saveError instanceof Error ? saveError.message : "Unable to save payment.");
    }
  }

  async function handleDeletePayment(payment) {
    if (!window.confirm(`Delete this payment of ${formatCurrency(Number(payment.amount || 0))}?`)) return;

    setError("");
    setSavedMessage("");

    try {
      await deletePayment(payment.id);

      const nextPayments = payments.filter((item) => item.id !== payment.id);
      const label = isDepositPayment(payment) ? "Deposit" : "Payment";
      const event = createTimelineEvent(
        "payment",
        `${label} Deleted`,
        `${formatCurrency(Number(payment.amount || 0))} ${label.toLowerCase()} removed.`
      );

      notifyChange(nextPayments, event);
      setSavedMessage(`${label} deleted from SQLite.`);
    } catch (deleteError) {
      console.error("Unable to delete payment from SQLite.", deleteError);
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete payment.");
    }
  }

  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: 22 }}>
        <div style={eyebrowStyle}>Payments & Deposits</div>
        <div style={introStyle}>Track the deposit, payments received and remaining balance for this job.</div>
      </div>

      <div style={summaryGridStyle}>
        <MoneyCard label="Quoted Price" value={quote} />
        <MoneyCard label="Total Paid" value={totalPaid} />
        <MoneyCard label="Outstanding" value={outstanding} highlight={outstanding > 0} />
      </div>

      <section style={depositPanelStyle}>
        <div style={depositHeaderStyle}>
          <div>
            <div style={sectionLabelStyle}>Deposit</div>
            <div style={depositTitleStyle}>Initial deposit requirement</div>
          </div>
          <div style={depositControlsStyle}>
            <label style={percentLabelStyle}>
              <span>Deposit %</span>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={depositPercent}
                onChange={(event) => setDepositPercent(Math.min(Math.max(Number(event.target.value) || 0, 0), 100))}
                style={percentInputStyle}
                aria-label="Deposit percentage"
              />
              <span>%</span>
            </label>
            <button type="button" onClick={() => openNewPayment("Deposit")} style={primaryButtonStyle}>
              + Record Deposit
            </button>
          </div>
        </div>

        <div style={depositGridStyle}>
          <DepositMetric label="Required" value={depositRequired} />
          <DepositMetric label="Paid" value={depositPaid} />
          <DepositMetric label={depositBalance > 0 ? "Deposit Owing" : "Deposit Complete"} value={depositBalance} highlight={depositBalance > 0} />
        </div>

        <ProgressBar label="Deposit progress" percent={depositProgress} complete={depositBalance === 0 && depositRequired > 0} />
        <div style={depositNoteStyle}>
          {quote <= 0
            ? "Add a quoted price to calculate the deposit automatically."
            : depositRequired <= 0
              ? "No deposit is currently required."
              : depositBalance <= 0
                ? "✓ Deposit requirement has been met."
                : `${formatCurrency(depositBalance)} remains to satisfy the ${safeDepositPercent}% deposit.`}
        </div>
      </section>

      <section style={progressPanelStyle}>
        <ProgressBar label="Overall payment progress" percent={paymentPercent} complete={outstanding === 0 && quote > 0} />
        <div style={progressFooterStyle}>
          {outstanding === 0 && quote > 0 ? "✓ Job fully paid" : `${formatCurrency(outstanding)} outstanding`}
        </div>
      </section>

      <div style={dividerStyle} />

      <div>
        <div style={historyHeaderStyle}>
          <div>
            <div style={sectionLabelStyle}>Transaction History</div>
            <div style={historyCountStyle}>{payments.length} {payments.length === 1 ? "transaction" : "transactions"}</div>
          </div>
          <div style={historyActionsStyle}>
            {outstanding > 0 && (
              <button type="button" onClick={() => openNewPayment("Payment", outstanding)} style={payBalanceButtonStyle}>
                💳 Pay Outstanding {formatCurrency(outstanding)}
              </button>
            )}
            <button type="button" onClick={() => openNewPayment("Payment")} style={secondaryButtonStyle}>
              + Record Payment
            </button>
          </div>
        </div>

        {isLoading ? (
          <div style={emptyStateStyle}>Loading payments…</div>
        ) : payments.length === 0 ? (
          <div style={emptyStateStyle}>No payments recorded for this job yet.</div>
        ) : (
          <div style={historyListStyle}>
            {payments.slice().sort(comparePayments).map((payment) => (
              <PaymentRow
                key={payment.id}
                payment={payment}
                onEdit={() => setEditingPayment(payment)}
                onDelete={() => handleDeletePayment(payment)}
              />
            ))}
          </div>
        )}
      </div>

      {error && <div style={errorStyle}>{error}</div>}
      {savedMessage && <div style={successStyle}>✓ {savedMessage}</div>}

      {editingPayment !== null && (
        <PaymentModal
          payment={editingPayment.id ? editingPayment : null}
          initialPaymentType={editingPayment.paymentType || "Payment"}
          initialAmount={editingPayment.amount || ""}
          onSave={handleSavePayment}
          onClose={() => setEditingPayment(null)}
        />
      )}
    </div>
  );
}

function DepositMetric({ label, value, highlight = false }) {
  return (
    <div style={{ padding: "12px 13px", borderRadius: 10, background: highlight ? "#FFF7E6" : "#FFFFFF", border: highlight ? "1px solid #F3D38A" : "1px solid #E8EAED" }}>
      <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 800, color: highlight ? "#8A5A00" : "#2F3A3F" }}>{formatCurrency(value)}</div>
    </div>
  );
}

function MoneyCard({ label, value, highlight = false }) {
  return (
    <div style={{ padding: "13px 11px", borderRadius: 11, background: highlight ? "#FFF7E6" : "#F8F9FA", border: highlight ? "1px solid #F3D38A" : "1px solid #E8EAED" }}>
      <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: highlight ? "#8A5A00" : "#2F3A3F", whiteSpace: "nowrap" }}>{formatCurrency(value)}</div>
    </div>
  );
}

function ProgressBar({ label, percent, complete = false }) {
  const safePercent = Math.min(Math.max(Number(percent) || 0, 0), 100);
  return (
    <div>
      <div style={progressHeaderStyle}><span>{label}</span><strong>{Math.round(safePercent)}%</strong></div>
      <div style={progressTrackStyle}>
        <div style={{ width: `${safePercent}%`, height: "100%", background: complete ? "#3D7A5A" : "#8B1E3F", borderRadius: 999, transition: "width 0.3s ease" }} />
      </div>
    </div>
  );
}

function PaymentRow({ payment, onEdit, onDelete }) {
  const amount = Number(payment.amount || 0);
  const isDeposit = isDepositPayment(payment);

  return (
    <div style={paymentRowStyle}>
      <div style={paymentRowTopStyle}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={paymentTitleStyle}>
            {isDeposit ? "Deposit" : payment.description || "Payment"}
            {isDeposit && <span style={depositBadgeStyle}>DEPOSIT</span>}
          </div>
          <div style={paymentMetaStyle}>
            {payment.date && <span>📅 {formatDisplayDate(payment.date)}</span>}
            {payment.method && <span>• {payment.method}</span>}
          </div>
        </div>
        <div style={paymentAmountStyle}>{formatCurrency(amount)}</div>
      </div>

      <div style={paymentActionsStyle}>
        <button type="button" onClick={onEdit} style={secondaryButtonStyle}>✎ Edit</button>
        <button type="button" onClick={onDelete} style={deleteButtonStyle}>🗑 Delete</button>
      </div>
    </div>
  );
}

function PaymentModal({ payment, initialPaymentType, initialAmount, onSave, onClose }) {
  const [amount, setAmount] = useState(payment?.amount != null ? String(payment.amount) : String(initialAmount || ""));
  const [date, setDate] = useState(formatDateForInput(payment?.date || ""));
  const [method, setMethod] = useState(payment?.method || "");
  const [description, setDescription] = useState(payment?.description || "");
  const [paymentType, setPaymentType] = useState(payment?.paymentType || initialPaymentType || "Payment");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Please enter a payment amount greater than $0.");
      return;
    }

    if (!date) {
      setError("Please enter the payment date.");
      return;
    }

    onSave({
      amount: Math.round(numericAmount * 100) / 100,
      date: formatDateForJob(date),
      method: method.trim(),
      description: description.trim() || (paymentType === "Deposit" ? "Deposit" : "Payment"),
      paymentType,
    });
  }

  return (
    <Modal title={payment ? "Edit Payment" : paymentType === "Deposit" ? "Record Deposit" : "Record Payment"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label="Transaction Type">
          <select value={paymentType} onChange={(event) => setPaymentType(event.target.value)} style={inputStyle}>
            <option value="Deposit">Deposit</option>
            <option value="Payment">Payment</option>
          </select>
        </FormField>

        <FormField label="Amount">
          <input autoFocus type="number" min="0.01" step="0.01" value={amount} onChange={(event) => { setAmount(event.target.value); setError(""); }} placeholder="0.00" style={inputStyle} />
        </FormField>

        <FormField label="Payment Date">
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} style={inputStyle} />
        </FormField>

        <FormField label="Payment Method">
          <select value={method} onChange={(event) => setMethod(event.target.value)} style={inputStyle}>
            <option value="">Select method</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="EFTPOS">EFTPOS</option>
            <option value="PayPal">PayPal</option>
            <option value="Other">Other</option>
          </select>
        </FormField>

        <FormField label="Description">
          <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder={paymentType === "Deposit" ? "e.g. Initial deposit" : "e.g. Final payment"} style={inputStyle} />
        </FormField>

        {error && <div style={errorStyle}>{error}</div>}

        <div style={modalActionsStyle}>
          <button type="button" onClick={onClose} style={secondaryButtonStyle}>Cancel</button>
          <button type="submit" style={primaryButtonStyle}>💾 Save {paymentType}</button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={modalOverlayStyle}>
      <div style={modalStyle}>
        <div style={modalHeaderStyle}>
          <h3 style={{ margin: 0, color: "#2F3A3F" }}>{title}</h3>
          <button type="button" onClick={onClose} style={closeButtonStyle}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <label style={{ display: "block", marginBottom: 14, fontSize: 13, fontWeight: 700, color: "#555" }}>
      <span style={{ display: "block", marginBottom: 6 }}>{label}</span>
      {children}
    </label>
  );
}

function isDepositPayment(payment) {
  return String(payment?.paymentType || payment?.type || "").toLowerCase() === "deposit" || String(payment?.description || "").trim().toLowerCase() === "deposit";
}

function comparePayments(a, b) {
  return (parseDate(b?.date)?.getTime() || 0) - (parseDate(a?.date)?.getTime() || 0);
}

function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const text = String(value);
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(text)) {
    const [day, month, year] = text.split("/").map(Number);
    return new Date(year, month - 1, day);
  }
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateForInput(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const text = String(value);
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(text)) {
    const [day, month, year] = text.split("/");
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return text.slice(0, 10);
}

function formatDateForJob(value) {
  const parts = String(value).split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${Number(day)}/${Number(month)}/${year}`;
  }
  return String(value);
}

function formatDisplayDate(value) {
  const date = parseDate(value);
  return date ? date.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : value;
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("en-AU", { style: "currency", currency: "AUD" });
}

const containerStyle = { background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 18, padding: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.03)" };
const eyebrowStyle = { fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#8B1E3F", marginBottom: 5 };
const introStyle = { fontSize: 14, color: "#777" };
const summaryGridStyle = { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 };
const sectionLabelStyle = { fontSize: 12, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", color: "#8B1E3F" };
const depositPanelStyle = { marginTop: 18, padding: 18, borderRadius: 14, background: "#FAF9F6", border: "1px solid #E5E7EB" };
const depositHeaderStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 16 };
const depositTitleStyle = { marginTop: 4, fontSize: 16, fontWeight: 700, color: "#2F3A3F" };
const depositControlsStyle = { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" };
const percentLabelStyle = { display: "flex", alignItems: "center", gap: 5, color: "#666", fontSize: 12, fontWeight: 700 };
const percentInputStyle = { width: 62, border: "1px solid #D9DDE1", borderRadius: 8, padding: "9px 8px", fontSize: 13, textAlign: "right", background: "#FFFFFF" };
const depositGridStyle = { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10, marginBottom: 16 };
const depositNoteStyle = { marginTop: 9, fontSize: 12, color: "#777" };
const progressPanelStyle = { marginTop: 12, padding: 16, borderRadius: 12, background: "#F8F9FA", border: "1px solid #E8EAED" };
const progressHeaderStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7, fontSize: 12, color: "#666" };
const progressTrackStyle = { height: 8, background: "#E5E7EB", borderRadius: 999, overflow: "hidden" };
const progressFooterStyle = { marginTop: 8, fontSize: 12, color: "#777" };
const dividerStyle = { borderTop: "1px solid #ECECEC", margin: "24px 0" };
const historyHeaderStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" };
const historyActionsStyle = { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" };
const historyCountStyle = { marginTop: 4, fontSize: 12, color: "#888" };
const historyListStyle = { display: "flex", flexDirection: "column", gap: 10 };
const paymentRowStyle = { padding: "13px 14px", background: "#F8F9FA", border: "1px solid #E8EAED", borderRadius: 11 };
const paymentRowTopStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 };
const paymentTitleStyle = { display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, color: "#2F3A3F", marginBottom: 4 };
const paymentMetaStyle = { display: "flex", gap: 8, flexWrap: "wrap", fontSize: 12, color: "#888" };
const paymentAmountStyle = { fontSize: 16, fontWeight: 700, color: "#2F3A3F", whiteSpace: "nowrap" };
const paymentActionsStyle = { display: "flex", gap: 8, marginTop: 10, paddingTop: 10, borderTop: "1px solid #E8EAED" };
const depositBadgeStyle = { padding: "3px 7px", borderRadius: 999, background: "#F4C33F", color: "#24344A", fontSize: 9, fontWeight: 800, letterSpacing: 0.5 };
const emptyStateStyle = { marginTop: 12, padding: 20, borderRadius: 12, background: "#F8F9FA", border: "1px solid #E8EAED", textAlign: "center", color: "#888", fontSize: 13 };
const errorStyle = { marginTop: 16, padding: 12, borderRadius: 10, background: "#FEE2E2", color: "#991B1B", fontSize: 13, fontWeight: 600 };
const successStyle = { marginTop: 16, padding: 12, borderRadius: 10, background: "#DCFCE7", color: "#166534", fontSize: 13, fontWeight: 600 };
const inputStyle = { width: "100%", boxSizing: "border-box", border: "1px solid #D9DDE1", borderRadius: 9, background: "#FFFFFF", padding: "10px 11px", fontSize: 14, color: "#2F3A3F", outline: "none" };
const primaryButtonStyle = { border: "none", background: "#F4C33F", color: "#24344A", borderRadius: 10, padding: "11px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer" };
const payBalanceButtonStyle = { border: "1px solid #8B1E3F", background: "#8B1E3F", color: "#FFFFFF", borderRadius: 10, padding: "11px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer" };
const secondaryButtonStyle = { border: "1px solid #D9DDE1", background: "#FFFFFF", color: "#2F3A3F", borderRadius: 8, padding: "7px 11px", fontSize: 12, fontWeight: 700, cursor: "pointer" };
const deleteButtonStyle = { ...secondaryButtonStyle, color: "#8B1E3F" };
const modalOverlayStyle = { position: "fixed", inset: 0, zIndex: 1000, background: "rgba(20, 25, 30, 0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 };
const modalStyle = { width: "min(520px, 100%)", maxHeight: "90vh", overflowY: "auto", background: "#FFFFFF", borderRadius: 18, padding: 24, boxShadow: "0 18px 60px rgba(0,0,0,0.2)" };
const modalHeaderStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 };
const closeButtonStyle = { border: "none", background: "#F3F4F6", color: "#555", borderRadius: 999, width: 34, height: 34, cursor: "pointer", fontSize: 15 };
const modalActionsStyle = { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 };
