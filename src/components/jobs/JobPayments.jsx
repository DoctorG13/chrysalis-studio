import { useEffect, useMemo, useState } from "react";

import {
  deletePayment,
  getPayments,
  savePayment,
} from "../../services/paymentApi";

export default function JobPayments({ job, onChange }) {
  const [payments, setPayments] = useState(job?.payments || []);
  const [editingPayment, setEditingPayment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPayments() {
      if (!job?.id) return;

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
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load payments."
        );
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

  const quote = Number(job?.price || 0);

  const totalPaid = useMemo(
    () =>
      payments.reduce(
        (total, payment) =>
          total + Number(payment.amount || 0),
        0
      ),
    [payments]
  );

  const outstanding = Math.max(quote - totalPaid, 0);

  const paymentPercent =
    quote > 0
      ? Math.min(Math.max((totalPaid / quote) * 100, 0), 100)
      : 0;

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

  async function handleSavePayment(paymentData) {
    if (!job?.id || !job?.clientId) {
      setError("This job must have a client before payments can be saved.");
      return;
    }

    setError("");
    setSavedMessage("");

    try {
      const savedPayment = await savePayment({
        ...paymentData,
        id: editingPayment?.id,
        clientId: job.clientId,
        jobId: job.id,
      });

      const nextPayments = editingPayment?.id
        ? payments.map((payment) =>
            payment.id === editingPayment.id
              ? savedPayment
              : payment
          )
        : [...payments, savedPayment];

      const event = createTimelineEvent(
        "payment",
        editingPayment?.id ? "Payment Updated" : "Payment Added",
        `$${Number(savedPayment.amount || 0).toFixed(2)} payment ${
          editingPayment?.id ? "updated" : "recorded"
        }${savedPayment.method ? ` via ${savedPayment.method}` : ""}.`
      );

      notifyChange(nextPayments, event);
      setEditingPayment(null);
      setSavedMessage("Payment saved to SQLite.");
    } catch (saveError) {
      console.error("Unable to save payment to SQLite.", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save payment."
      );
    }
  }

  async function handleDeletePayment(payment) {
    if (
      !window.confirm(
        `Delete this payment of $${Number(payment.amount || 0).toFixed(2)}?`
      )
    ) {
      return;
    }

    setError("");
    setSavedMessage("");

    try {
      await deletePayment(payment.id);

      const nextPayments = payments.filter(
        (item) => item.id !== payment.id
      );

      const event = createTimelineEvent(
        "payment",
        "Payment Deleted",
        `$${Number(payment.amount || 0).toFixed(2)} payment removed.`
      );

      notifyChange(nextPayments, event);
      setSavedMessage("Payment deleted from SQLite.");
    } catch (deleteError) {
      console.error("Unable to delete payment from SQLite.", deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete payment."
      );
    }
  }

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 18,
        padding: 24,
        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
      }}
    >
      <div style={{ marginBottom: 22 }}>
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

        <div style={{ fontSize: 14, color: "#777" }}>
          Payment summary and transaction history.
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 10,
        }}
      >
        <MoneyCard label="Quoted Price" value={quote} />
        <MoneyCard label="Total Paid" value={totalPaid} />
        <MoneyCard
          label="Outstanding"
          value={outstanding}
          highlight={outstanding > 0}
        />
      </div>

      <div
        style={{
          marginTop: 20,
          padding: 16,
          background: "#F8F9FA",
          borderRadius: 12,
          border: "1px solid #E8EAED",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
            fontSize: 13,
            color: "#666",
          }}
        >
          <span>Payment progress</span>
          <strong style={{ color: "#2F3A3F" }}>
            {Math.round(paymentPercent)}%
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
              transition: "width 0.3s ease",
            }}
          />
        </div>

        <div style={{ marginTop: 8, fontSize: 12, color: "#888" }}>
          {outstanding === 0 && quote > 0
            ? "Fully paid"
            : `$${outstanding.toFixed(2)} outstanding`}
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid #ECECEC",
          margin: "24px 0",
        }}
      />

      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
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

          <div style={{ fontSize: 12, color: "#888" }}>
            {payments.length} {payments.length === 1 ? "payment" : "payments"}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setEditingPayment({})}
          style={primaryButtonStyle}
        >
          + Record Payment
        </button>

        {isLoading ? (
          <div style={emptyStateStyle}>Loading payments…</div>
        ) : payments.length === 0 ? (
          <div style={emptyStateStyle}>
            No payments recorded for this job yet.
          </div>
        ) : (
          <div
            style={{
              marginTop: 12,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {payments.map((payment) => (
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

      {error && (
        <div style={errorStyle}>{error}</div>
      )}

      {savedMessage && (
        <div style={successStyle}>✓ {savedMessage}</div>
      )}

      {editingPayment !== null && (
        <PaymentModal
          payment={editingPayment.id ? editingPayment : null}
          onSave={handleSavePayment}
          onClose={() => setEditingPayment(null)}
        />
      )}
    </div>
  );
}

function MoneyCard({ label, value, highlight = false }) {
  return (
    <div
      style={{
        padding: "13px 11px",
        borderRadius: 11,
        background: highlight ? "#FFF7E6" : "#F8F9FA",
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
          color: highlight ? "#8A5A00" : "#2F3A3F",
          whiteSpace: "nowrap",
        }}
      >
        ${value.toFixed(2)}
      </div>
    </div>
  );
}

function PaymentRow({ payment, onEdit, onDelete }) {
  const amount = Number(payment.amount || 0);

  return (
    <div
      style={{
        padding: "13px 14px",
        background: "#F8F9FA",
        border: "1px solid #E8EAED",
        borderRadius: 11,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#2F3A3F",
              marginBottom: 4,
            }}
          >
            {payment.description || "Payment"}
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
            {payment.date && <span>📅 {payment.date}</span>}
            {payment.method && <span>• {payment.method}</span>}
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

      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 10,
          paddingTop: 10,
          borderTop: "1px solid #E8EAED",
        }}
      >
        <button type="button" onClick={onEdit} style={secondaryButtonStyle}>
          ✎ Edit
        </button>
        <button type="button" onClick={onDelete} style={deleteButtonStyle}>
          🗑 Delete
        </button>
      </div>
    </div>
  );
}

function PaymentModal({ payment, onSave, onClose }) {
  const [amount, setAmount] = useState(
    payment?.amount != null ? String(payment.amount) : ""
  );
  const [date, setDate] = useState(formatDateForInput(payment?.date || ""));
  const [method, setMethod] = useState(payment?.method || "");
  const [description, setDescription] = useState(payment?.description || "");
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
      description: description.trim() || "Payment",
    });
  }

  return (
    <Modal
      title={payment ? "Edit Payment" : "Record Payment"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <FormField label="Amount">
          <input
            autoFocus
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0.00"
            style={inputStyle}
          />
        </FormField>

        <FormField label="Payment Date">
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            style={inputStyle}
          />
        </FormField>

        <FormField label="Payment Method">
          <select
            value={method}
            onChange={(event) => setMethod(event.target.value)}
            style={inputStyle}
          >
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
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="e.g. Deposit"
            style={inputStyle}
          />
        </FormField>

        {error && <div style={errorStyle}>{error}</div>}

        <div style={modalActionsStyle}>
          <button type="button" onClick={onClose} style={secondaryButtonStyle}>
            Cancel
          </button>
          <button type="submit" style={primaryButtonStyle}>
            💾 Save Payment
          </button>
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
          <button type="button" onClick={onClose} style={closeButtonStyle}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <label
      style={{
        display: "block",
        marginBottom: 14,
        fontSize: 13,
        fontWeight: 700,
        color: "#555",
      }}
    >
      <span style={{ display: "block", marginBottom: 6 }}>{label}</span>
      {children}
    </label>
  );
}

function formatDateForInput(value) {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  const parts = String(value).split("/");

  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return String(value).slice(0, 10);
}

function formatDateForJob(value) {
  const parts = String(value).split("-");

  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${Number(day)}/${Number(month)}/${year}`;
  }

  return String(value);
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #D9DDE1",
  borderRadius: 9,
  background: "#FFFFFF",
  padding: "10px 11px",
  fontSize: 14,
  color: "#2F3A3F",
  outline: "none",
};

const primaryButtonStyle = {
  border: "none",
  background: "#F4C33F",
  color: "#24344A",
  borderRadius: 10,
  padding: "11px 16px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  border: "1px solid #D9DDE1",
  background: "#FFFFFF",
  color: "#2F3A3F",
  borderRadius: 8,
  padding: "7px 11px",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};

const deleteButtonStyle = {
  ...secondaryButtonStyle,
  color: "#8B1E3F",
};

const emptyStateStyle = {
  marginTop: 12,
  padding: 20,
  borderRadius: 12,
  background: "#F8F9FA",
  border: "1px solid #E8EAED",
  textAlign: "center",
  color: "#888",
  fontSize: 13,
};

const errorStyle = {
  marginTop: 16,
  padding: 12,
  borderRadius: 10,
  background: "#FEE2E2",
  color: "#991B1B",
  fontSize: 13,
};

const successStyle = {
  marginTop: 16,
  padding: 12,
  borderRadius: 10,
  background: "#DCFCE7",
  color: "#166534",
  fontSize: 13,
  fontWeight: 600,
};

const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  background: "rgba(20, 25, 30, 0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
};

const modalStyle = {
  width: "min(520px, 100%)",
  maxHeight: "90vh",
  overflowY: "auto",
  background: "#FFFFFF",
  borderRadius: 18,
  padding: 24,
  boxShadow: "0 18px 60px rgba(0,0,0,0.2)",
};

const modalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20,
};

const closeButtonStyle = {
  border: "none",
  background: "#F3F4F6",
  color: "#555",
  borderRadius: 999,
  width: 34,
  height: 34,
  cursor: "pointer",
  fontSize: 15,
};

const modalActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  marginTop: 20,
};
