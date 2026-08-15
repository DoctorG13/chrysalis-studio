import { useState } from "react";

export default function JobPayments({
  job,
  onChange,
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

  function createTimelineEvent(
    type,
    title,
    description = ""
  ) {
    return {
      id: crypto.randomUUID(),
      type,
      title,
      description,
      date: new Date().toISOString(),
    };
  }

  function notifyChange(
    nextPayments,
    event
  ) {
    onChange?.(
      nextPayments,
      event
    );
  }

  function handleAddPayment(
    paymentData
  ) {
    const payment = {
      ...paymentData,
      id: crypto.randomUUID(),
    };

    const nextPayments = [
      ...payments,
      payment,
    ];

    notifyChange(
      nextPayments,
      createTimelineEvent(
        "payment",
        "Payment Added",
        `$${Number(
          payment.amount || 0
        ).toFixed(2)} payment recorded${
          payment.method
            ? ` via ${payment.method}`
            : ""
        }.`
      )
    );
  }

  function handleEditPayment(
    payment
  ) {
    setEditingPayment(payment);
  }

  function handleSavePayment(
    paymentData
  ) {
    if (!editingPayment?.id) {
      handleAddPayment(paymentData);
      setEditingPayment(null);
      return;
    }

    const updatedPayment = {
      ...editingPayment,
      ...paymentData,
    };

    const nextPayments =
      payments.map(
        (item) =>
          item.id ===
          editingPayment.id
            ? updatedPayment
            : item
      );

    notifyChange(
      nextPayments,
      createTimelineEvent(
        "payment",
        "Payment Updated",
        `$${Number(
          updatedPayment.amount || 0
        ).toFixed(2)} payment updated.`
      )
    );

    setEditingPayment(null);
  }

  function handleDeletePayment(
    payment
  ) {
    if (
      !window.confirm(
        `Delete this payment of $${Number(
          payment.amount || 0
        ).toFixed(2)}?`
      )
    ) {
      return;
    }

    const nextPayments =
      payments.filter(
        (item) =>
          item.id !== payment.id
      );

    notifyChange(
      nextPayments,
      createTimelineEvent(
        "payment",
        "Payment Deleted",
        `$${Number(
          payment.amount || 0
        ).toFixed(2)} payment removed.`
      )
    );
  }

  const [editingPayment, setEditingPayment] =
    useState(null);

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

      <div
        style={{
          borderTop:
            "1px solid #ECECEC",
          margin: "24px 0",
        }}
      />

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

        <button
          type="button"
          onClick={() =>
            setEditingPayment({})
          }
          style={primaryButtonStyle}
        >
          + Record Payment
        </button>

        {payments.length === 0 ? (
          <div
            style={{
              marginTop: 12,
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
              marginTop: 12,
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
                  onEdit={() =>
                    handleEditPayment(
                      payment
                    )
                  }
                  onDelete={() =>
                    handleDeletePayment(
                      payment
                    )
                  }
                />
              )
            )}
          </div>
        )}
      </div>

      {editingPayment !== null && (
        <PaymentModal
          payment={
            editingPayment.id
              ? editingPayment
              : null
          }
          onSave={
            handleSavePayment
          }
          onClose={() =>
            setEditingPayment(null)
          }
        />
      )}
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
        ${value.toFixed(2)}
      </div>
    </div>
  );
}

function PaymentRow({
  payment,
  onEdit,
  onDelete,
}) {
  const amount = Number(
    payment.amount || 0
  );

  return (
    <div
      style={{
        padding: "13px 14px",
        background: "#F8F9FA",
        border:
          "1px solid #E8EAED",
        borderRadius: 11,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          gap: 12,
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

      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 10,
          paddingTop: 10,
          borderTop:
            "1px solid #E8EAED",
        }}
      >
        <button
          type="button"
          onClick={onEdit}
          style={secondaryButtonStyle}
        >
          ✎ Edit
        </button>

        <button
          type="button"
          onClick={onDelete}
          style={deleteButtonStyle}
        >
          🗑 Delete
        </button>
      </div>
    </div>
  );
}

function PaymentModal({
  payment,
  onSave,
  onClose,
}) {
  const [amount, setAmount] =
    useState(
      payment?.amount != null
        ? String(payment.amount)
        : ""
    );

  const [date, setDate] =
    useState(
      formatDateForInput(
        payment?.date || ""
      )
    );

  const [method, setMethod] =
    useState(
      payment?.method || ""
    );

  const [description, setDescription] =
    useState(
      payment?.description || ""
    );

  const [error, setError] =
    useState("");

  function handleSubmit(
    event
  ) {
    event.preventDefault();

    const numericAmount =
      Number(amount);

    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {
      setError(
        "Please enter a payment amount greater than $0."
      );
      return;
    }

    if (
      !date
    ) {
      setError(
        "Please enter the payment date."
      );
      return;
    }

    onSave({
      amount:
        Math.round(
          numericAmount * 100
        ) / 100,
      date:
        formatDateForJob(date),
      method:
        method.trim(),
      description:
        description.trim() ||
        "Payment",
    });
  }

  return (
    <Modal
      title={
        payment
          ? "Edit Payment"
          : "Record Payment"
      }
      onClose={onClose}
    >
      <form
        onSubmit={
          handleSubmit
        }
      >
        <FormField label="Amount">
          <input
            autoFocus
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) =>
              setAmount(
                event.target.value
              )
            }
            placeholder="0.00"
            style={inputStyle}
          />
        </FormField>

        <FormField label="Payment Date">
          <input
            type="date"
            value={date}
            onChange={(event) =>
              setDate(
                event.target.value
              )
            }
            style={inputStyle}
          />
        </FormField>

        <FormField label="Payment Method">
          <select
            value={method}
            onChange={(event) =>
              setMethod(
                event.target.value
              )
            }
            style={inputStyle}
          >
            <option value="">
              Select method
            </option>
            <option value="Cash">
              Cash
            </option>
            <option value="Card">
              Card
            </option>
            <option value="Bank Transfer">
              Bank Transfer
            </option>
            <option value="EFTPOS">
              EFTPOS
            </option>
            <option value="PayPal">
              PayPal
            </option>
            <option value="Other">
              Other
            </option>
          </select>
        </FormField>

        <FormField label="Description">
          <input
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value
              )
            }
            placeholder="e.g. Deposit"
            style={inputStyle}
          />
        </FormField>

        {error && (
          <div
            style={errorStyle}
          >
            {error}
          </div>
        )}

        <ModalActions
          onClose={onClose}
          submitLabel={
            payment
              ? "Save Changes"
              : "Record Payment"
          }
        />
      </form>
    </Modal>
  );
}

function Modal({
  title,
  children,
  onClose,
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          "rgba(0,0,0,0.45)",
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={(event) =>
          event.stopPropagation()
        }
        style={{
          width: "min(520px, 100%)",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#FFFFFF",
          borderRadius: 18,
          padding: 24,
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            marginBottom: 22,
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#2F3A3F",
              fontSize: 22,
            }}
          >
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            style={closeButtonStyle}
          >
            ✕
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
}) {
  return (
    <div
      style={{
        marginBottom: 16,
      }}
    >
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 700,
          color: "#555",
          marginBottom: 7,
        }}
      >
        {label}
      </label>

      {children}
    </div>
  );
}

function ModalActions({
  onClose,
  submitLabel,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 22,
      }}
    >
      <button
        type="button"
        onClick={onClose}
        style={secondaryButtonStyle}
      >
        Cancel
      </button>

      <button
        type="submit"
        style={primaryButtonStyle}
      >
        {submitLabel}
      </button>
    </div>
  );
}

function formatDateForInput(
  value
) {
  if (!value) return "";

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
    return value;
  }

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

    return `${year}-${month}-${day}`;
  }

  return "";
}

function formatDateForJob(
  value
) {
  if (!value) return "";

  const [
    year,
    month,
    day,
  ] = value.split("-");

  if (
    !year ||
    !month ||
    !day
  ) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  height: 44,
  padding: "0 13px",
  border:
    "1px solid #D9DDE1",
  borderRadius: 10,
  fontSize: 15,
  color: "#2F3A3F",
  background: "#FFFFFF",
  outline: "none",
  fontFamily: "inherit",
};

const primaryButtonStyle = {
  border: "none",
  background: "#F4C542",
  color: "#2F3A3F",
  borderRadius: 9,
  padding: "10px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  border:
    "1px solid #D9DDE1",
  background: "#FFFFFF",
  color: "#2F3A3F",
  borderRadius: 9,
  padding: "9px 13px",
  fontWeight: 600,
  cursor: "pointer",
};

const deleteButtonStyle = {
  ...secondaryButtonStyle,
  color: "#B91C1C",
  border:
    "1px solid #F0B7B7",
};

const closeButtonStyle = {
  border:
    "1px solid #D9DDE1",
  background: "#FFFFFF",
  borderRadius: 8,
  width: 36,
  height: 36,
  cursor: "pointer",
  fontSize: 16,
};

const errorStyle = {
  marginTop: 4,
  padding: 10,
  borderRadius: 8,
  background: "#FEE2E2",
  color: "#B91C1C",
  fontSize: 13,
};