import { useEffect, useMemo, useState } from "react";
import { ThriveDialog, useThriveDialog } from "../components/common/ThriveDialog";

import {
  createInvoice,
  deleteInvoice,
  getInvoices,
  updateInvoice,
} from "../services/invoiceApi";

import {
  getPayments,
} from "../services/paymentApi";

import {
  createQuote,
  deleteQuote,
  getQuotes,
  updateQuote,
} from "../services/quoteApi";

import InvoicePrintView from "../components/invoices/InvoicePrintView";
import QuotePrintView from "../components/quotes/QuotePrintView";
import "../components/invoices/invoicePrint.css";
import "../components/quotes/quotePrint.css";

const EMPTY_LINE = {
  description: "",
  quantity: 1,
  rate: 0,
};

const DEFAULT_DEPOSIT_PERCENT = 25;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nextInvoiceNumber(invoices) {
  const year = new Date().getFullYear();

  const numbers = invoices
    .map((invoice) =>
      String(invoice.number || "").match(
        /^INV-(\d{4})-(\d+)$/
      )
    )
    .filter(Boolean)
    .filter(
      (match) =>
        Number(match[1]) === year
    )
    .map((match) => Number(match[2]));

  const next = numbers.length
    ? Math.max(...numbers) + 1
    : 1;

  return `INV-${year}-${String(
    next
  ).padStart(4, "0")}`;
}

function addDays(dateValue, days) {
  const date = new Date(
    `${dateValue}T00:00:00`
  );

  date.setDate(
    date.getDate() + days
  );

  return date.toISOString().slice(0, 10);
}

function nextQuoteNumber(quotes) {
  const year = new Date().getFullYear();

  const numbers = quotes
    .map((quote) =>
      String(quote.number || "").match(
        /^QUO-(\d{4})-(\d+)$/
      )
    )
    .filter(Boolean)
    .filter(
      (match) =>
        Number(match[1]) === year
    )
    .map((match) => Number(match[2]));

  const next = numbers.length
    ? Math.max(...numbers) + 1
    : 1;

  return `QUO-${year}-${String(
    next
  ).padStart(4, "0")}`;
}

function money(value) {
  return Number(value || 0).toLocaleString(
    "en-AU",
    {
      style: "currency",
      currency: "AUD",
    }
  );
}

function normaliseLineItems(items) {
  return (Array.isArray(items)
    ? items
    : []
  ).map((item) => ({
    description: String(
      item.description || ""
    ),
    quantity: Number(
      item.quantity || 0
    ),
    rate: Number(
      item.rate || 0
    ),
  }));
}

function clientName(clients, id) {
  const client = clients.find(
    (item) =>
      String(item.id) === String(id)
  );

  if (!client) {
    return "Unknown client";
  }

  return (
    client.name ||
    `${client.firstName || ""} ${
      client.lastName || ""
    }`.trim() ||
    "Unknown client"
  );
}

function jobClient(jobs, clients, job) {
  if (!job) return null;

  return (
    clients.find(
      (client) =>
        String(client.id) ===
        String(job.clientId)
    ) || null
  );
}

function paymentDate(payment) {
  const value =
    payment?.date ||
    payment?.createdAt ||
    payment?.created_at;

  if (!value) {
    return 0;
  }

  const time = new Date(value).getTime();

  return Number.isNaN(time)
    ? 0
    : time;
}

function formatPaymentDate(payment) {
  const value =
    payment?.date ||
    payment?.createdAt ||
    payment?.created_at;

  if (!value) {
    return "";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return parsed.toLocaleDateString(
    "en-AU",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function isDepositPayment(payment) {
  return (
    String(
      payment?.paymentType || ""
    ).toLowerCase() === "deposit"
  );
}

export default function FinancePage({
  clients = [],
  jobs = [],
}) {
  const [financeTab, setFinanceTab] = useState("overview");
  const { confirm, dialogProps } = useThriveDialog();
  const [invoices, setInvoices] =
    useState([]);

  const [quotes, setQuotes] =
    useState([]);

  const [
    selectedId,
    setSelectedId,
  ] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [quotesLoading, setQuotesLoading] =
    useState(true);

  const [documentType, setDocumentType] =
    useState("invoice");

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [form, setForm] =
    useState(null);

  const [
    jobPayments,
    setJobPayments,
  ] = useState({});

  const [
    paymentsLoading,
    setPaymentsLoading,
  ] = useState(true);

  async function loadInvoices() {
    setLoading(true);
    setError("");

    try {
      setInvoices(
        await getInvoices()
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to load invoices."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadQuotes() {
    setQuotesLoading(true);

    try {
      setQuotes(await getQuotes());
    } catch (err) {
      setError(
        err.message ||
          "Unable to load quotes."
      );
    } finally {
      setQuotesLoading(false);
    }
  }

  async function loadFinancePayments() {
    if (!jobs.length) {
      setJobPayments({});
      setPaymentsLoading(false);
      return;
    }

    setPaymentsLoading(true);

    try {
      const results =
        await Promise.all(
          jobs
            .filter((job) => job?.id)
            .map(async (job) => {
              try {
                const payments =
                  await getPayments(
                    job.id
                  );

                return [
                  String(job.id),
                  payments,
                ];
              } catch (err) {
                console.error(
                  `Unable to load payments for job ${job.id}.`,
                  err
                );

                return [
                  String(job.id),
                  Array.isArray(
                    job.payments
                  )
                    ? job.payments
                    : [],
                ];
              }
            })
        );

      setJobPayments(
        Object.fromEntries(results)
      );
    } finally {
      setPaymentsLoading(false);
    }
  }

  useEffect(() => {
    loadInvoices();
    loadQuotes();
  }, []);

  useEffect(() => {
    loadFinancePayments();
  }, [jobs]);

  const financeJobs =
    useMemo(() => {
      return jobs
        .filter((job) => job?.id)
        .map((job) => {
          const payments =
            jobPayments[
              String(job.id)
            ] ||
            job.payments ||
            [];

          const quote = Number(
            job.price || 0
          );

          const totalPaid =
            payments.reduce(
              (sum, payment) =>
                sum +
                Number(
                  payment.amount || 0
                ),
              0
            );

          const depositPercent =
            Math.min(
              Math.max(
                Number(
                  job.depositPercent ??
                    DEFAULT_DEPOSIT_PERCENT
                ) || 0,
                0
              ),
              100
            );

          const depositRequired =
            quote *
            (depositPercent / 100);

          const depositPaid =
            payments
              .filter(
                isDepositPayment
              )
              .reduce(
                (sum, payment) =>
                  sum +
                  Number(
                    payment.amount || 0
                  ),
                0
              );

          const outstanding =
            Math.max(
              quote - totalPaid,
              0
            );

          const depositOutstanding =
            Math.max(
              depositRequired -
                depositPaid,
              0
            );

          const client =
            jobClient(
              jobs,
              clients,
              job
            );

          return {
            job,
            client,
            payments,
            quote,
            totalPaid,
            depositRequired,
            depositPaid,
            depositOutstanding,
            outstanding,
          };
        });
    }, [
      jobs,
      clients,
      jobPayments,
    ]);

  const financeSummary =
    useMemo(() => {
      const totalQuoted =
        financeJobs.reduce(
          (sum, item) =>
            sum + item.quote,
          0
        );

      const totalPaid =
        financeJobs.reduce(
          (sum, item) =>
            sum + item.totalPaid,
          0
        );

      const totalOutstanding =
        financeJobs.reduce(
          (sum, item) =>
            sum + item.outstanding,
          0
        );

      const totalDeposits =
        financeJobs.reduce(
          (sum, item) =>
            sum + item.depositPaid,
          0
        );

      const jobsOutstanding =
        financeJobs.filter(
          (item) =>
            item.outstanding > 0
        );

      const jobsAwaitingDeposit =
        financeJobs.filter(
          (item) =>
            item.depositRequired >
              0 &&
            item.depositOutstanding >
              0
        );

      return {
        totalQuoted,
        totalPaid,
        totalOutstanding,
        totalDeposits,
        jobsOutstanding,
        jobsAwaitingDeposit,
      };
    }, [financeJobs]);

  const recentPayments =
    useMemo(() => {
      return financeJobs
        .flatMap((item) =>
          item.payments.map(
            (payment) => ({
              ...payment,
              job:
                item.job,
              client:
                item.client,
            })
          )
        )
        .sort(
          (a, b) =>
            paymentDate(b) -
            paymentDate(a)
        )
        .slice(0, 8);
    }, [financeJobs]);

  function startNew() {
    setSelectedId("");
    setError("");

    setForm({
      number:
        nextInvoiceNumber(
          invoices
        ),
      clientId:
        clients[0]?.id || "",
      jobId: "",
      issueDate: today(),
      dueDate: "",
      status: "Draft",
      notes: "",
      gstRate: 10,
      lineItems: [
        { ...EMPTY_LINE },
      ],
    });
  }

  function startNewQuote() {
    setSelectedId("");
    setError("");
    setDocumentType("quote");

    const issueDate = today();

    setForm({
      type: "quote",
      number: nextQuoteNumber(quotes),
      clientId: clients[0]?.id || "",
      jobId: "",
      issueDate,
      validUntil: addDays(issueDate, 30),
      status: "Draft",
      notes: "",
      gstRate: 10,
      depositPercent: DEFAULT_DEPOSIT_PERCENT,
      lineItems: [
        { ...EMPTY_LINE },
      ],
    });
  }

  function editQuote(quote) {
    setSelectedId(quote.id);
    setError("");
    setDocumentType("quote");

    setForm({
      ...quote,
      type: "quote",
      gstRate: Number(
        quote.gstRate ?? 10
      ),
      depositPercent: Number(
        quote.depositPercent ??
          DEFAULT_DEPOSIT_PERCENT
      ),
      lineItems:
        normaliseLineItems(
          quote.lineItems
        ),
    });
  }

  function editInvoice(invoice) {
    setSelectedId(invoice.id);
    setDocumentType("invoice");
    setError("");

    setForm({
      ...invoice,
      gstRate: Number(
        invoice.gstRate ?? 10
      ),
      lineItems:
        normaliseLineItems(
          invoice.lineItems
        ),
    });
  }

  function updateField(
    field,
    value
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateLine(
    index,
    field,
    value
  ) {
    setForm((current) => ({
      ...current,
      lineItems:
        current.lineItems.map(
          (
            item,
            itemIndex
          ) =>
            itemIndex === index
              ? {
                  ...item,
                  [field]: value,
                }
              : item
        ),
    }));
  }

  function addLine() {
    setForm((current) => ({
      ...current,
      lineItems: [
        ...current.lineItems,
        { ...EMPTY_LINE },
      ],
    }));
  }

  function removeLine(index) {
    setForm((current) => ({
      ...current,
      lineItems:
        current.lineItems.length ===
        1
          ? [{ ...EMPTY_LINE }]
          : current.lineItems.filter(
              (
                _,
                itemIndex
              ) =>
                itemIndex !== index
            ),
    }));
  }

  const subtotal =
    useMemo(
      () =>
        (
          form?.lineItems || []
        ).reduce(
          (sum, item) =>
            sum +
            Number(
              item.quantity || 0
            ) *
              Number(
                item.rate || 0
              ),
          0
        ),
      [form]
    );

  const gst =
    subtotal *
    (Number(
      form?.gstRate || 0
    ) /
      100);

  const total =
    subtotal + gst;

  const selectedJob =
    jobs.find(
      (job) =>
        String(job.id) ===
        String(form?.jobId)
    );

  const paid =
    useMemo(() => {
      if (!selectedJob) {
        return 0;
      }

      const payments =
        jobPayments[
          String(selectedJob.id)
        ] ||
        selectedJob.payments ||
        [];

      return payments.reduce(
        (sum, payment) =>
          sum +
          Number(
            payment.amount || 0
          ),
        0
      );
    }, [
      selectedJob,
      jobPayments,
    ]);

  const balance =
    total - paid;

  const depositRequired =
    total *
    (Number(
      form?.depositPercent ??
        DEFAULT_DEPOSIT_PERCENT
    ) / 100);

  async function save() {
    if (!form?.clientId) {
      setError(
        "Please select a client."
      );
      return;
    }

    if (!String(form.number || "").trim()) {
      setError(
        `Please enter a ${
          documentType === "quote"
            ? "quote"
            : "invoice"
        } number.`
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        amount: total,
        subtotal,
        gst,
        total,
        lineItems:
          form.lineItems.map(
            (item) => ({
              ...item,
              quantity:
                Number(
                  item.quantity || 0
                ),
              rate:
                Number(
                  item.rate || 0
                ),
              lineTotal:
                Number(
                  item.quantity || 0
                ) *
                Number(
                  item.rate || 0
                ),
            })
          ),
      };

      if (documentType === "quote") {
        payload.depositRequired =
          depositRequired;

        const saved = form.id
          ? await updateQuote(payload)
          : await createQuote(payload);

        await loadQuotes();

        setSelectedId(saved.id);
        editQuote(saved);
      } else {
        payload.amountPaid = paid;
        payload.balance = balance;

        const saved = form.id
          ? await updateInvoice(payload)
          : await createInvoice(payload);

        await loadInvoices();

        setSelectedId(saved.id);
        editInvoice(saved);
      }
    } catch (err) {
      setError(
        err.message ||
          `Unable to save ${documentType}.`
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeDocument() {
    if (!form?.id) return;

    const documentLabel =
      documentType === "quote" ? "Quote" : "Invoice";

    const confirmed = await confirm({
      title: `Delete ${documentLabel}`,
      message: `Delete ${form.number}? This cannot be undone.`,
      confirmLabel: `Delete ${documentLabel}`,
      danger: true,
    });

    if (!confirmed) return;

    setSaving(true);

    try {
      if (documentType === "quote") {
        await deleteQuote(form.id);
        await loadQuotes();
      } else {
        await deleteInvoice(form.id);
        await loadInvoices();
      }

      setForm(null);
      setSelectedId("");
    } catch (err) {
      setError(
        err.message ||
          `Unable to delete ${documentType}.`
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        padding: 30,
        maxWidth: 1400,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 22,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: "#8B1E3F",
            }}
          >
            Finance
          </div>

          <h1
            style={{
              margin: "6px 0 8px",
              color: "#2F3A3F",
            }}
          >
            {financeTab === "overview"
              ? "Finance Overview"
              : financeTab === "quotes"
                ? "Quotes"
                : financeTab === "invoices"
                  ? "Invoices"
                  : "Payments"}
          </h1>

          <p
            style={{
              margin: 0,
              color: "#777",
            }}
          >
            {financeTab === "overview"
              ? "Track payments, deposits, balances and invoices across the studio."
              : financeTab === "quotes"
                ? "Create, manage and print client quotes."
                : financeTab === "invoices"
                  ? "Create, manage and print client invoices."
                  : "Review outstanding balances and recent payment activity."}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
          }}
        >
          {financeTab === "quotes" && (
            <button
              onClick={startNewQuote}
              style={secondaryButton}
            >
              + New Quote
            </button>
          )}

          {financeTab === "invoices" && (
            <button
              onClick={startNew}
              style={primaryButton}
            >
              + New Invoice
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={errorBox}>
          {error}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: 4,
          padding: 5,
          marginBottom: 24,
          background: "#F3F4F6",
          borderRadius: 12,
          border: "1px solid #E5E7EB",
          overflowX: "auto",
        }}
      >
        {[
          ["overview", "Overview"],
          ["quotes", "Quotes"],
          ["invoices", "Invoices"],
          ["payments", "Payments"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFinanceTab(id)}
            style={{
              border: "none",
              borderRadius: 9,
              padding: "12px 14px",
              background:
                financeTab === id ? "#FFFFFF" : "transparent",
              color:
                financeTab === id ? "#8B1E3F" : "#555",
              fontWeight:
                financeTab === id ? 800 : 700,
              flex: "1 1 0",
              minWidth: 120,
              whiteSpace: "nowrap",
              fontSize: 14,
              cursor: "pointer",
              boxShadow:
                financeTab === id
                  ? "0 2px 8px rgba(0,0,0,.08)"
                  : "none",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* FINANCE SUMMARY */}

      {financeTab === "overview" && (
        <>

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
          gap: 14,
          marginBottom: 22,
        }}
      >
        <FinanceMetric
          label="Total Received"
          value={
            financeSummary.totalPaid
          }
          detail="Payments received"
        />

        <FinanceMetric
          label="Total Outstanding"
          value={
            financeSummary.totalOutstanding
          }
          detail={`${financeSummary.jobsOutstanding.length} job${
            financeSummary.jobsOutstanding
              .length === 1
              ? ""
              : "s"
          } owing`}
          highlight={
            financeSummary.totalOutstanding >
            0
          }
        />

        <FinanceMetric
          label="Deposits Received"
          value={
            financeSummary.totalDeposits
          }
          detail="Recorded deposits"
        />

        <FinanceMetric
          label="Awaiting Deposit"
          value={
            financeSummary.jobsAwaitingDeposit
              .length
          }
          detail="Jobs requiring deposit"
          count
          highlight={
            financeSummary.jobsAwaitingDeposit
              .length > 0
          }
        />
      </section>

        </>
      )}

            {/* FINANCE DETAIL */}

      {financeTab === "payments" && (
        <>

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "1.15fr 0.85fr",
          gap: 22,
          marginBottom: 26,
        }}
      >
        <section style={panel}>
          <div style={sectionTitle}>
            Outstanding Jobs
          </div>

          {paymentsLoading ? (
            <div style={muted}>
              Loading payment
              information…
            </div>
          ) : financeSummary
              .jobsOutstanding
              .length === 0 ? (
            <div
              style={{
                padding: 30,
                textAlign:
                  "center",
                color: "#777",
              }}
            >
              <div
                style={{
                  fontSize: 34,
                  marginBottom: 8,
                }}
              >
                ✓
              </div>

              <strong>
                No outstanding
                balances
              </strong>

              <div
                style={{
                  marginTop: 5,
                  fontSize: 13,
                }}
              >
                All jobs are
                currently paid.
              </div>
            </div>
          ) : (
            <div>
              {financeSummary.jobsOutstanding
                .slice(0, 8)
                .map((item) => (
                  <div
                    key={item.job.id}
                    style={
                      financeJobRow
                    }
                  >
                    <div
                      style={{
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 800,
                          color:
                            "#2F3A3F",
                        }}
                      >
                        {item.client
                          ? clientName(
                              clients,
                              item.client
                                .id
                            )
                          : "Unknown client"}
                      </div>

                      <div
                        style={{
                          marginTop: 3,
                          color: "#777",
                          fontSize: 12,
                        }}
                      >
                        {item.job.title ||
                          item.job.name ||
                          item.job.reference ||
                          "Job"}
                      </div>
                    </div>

                    <div
                      style={{
                        textAlign:
                          "right",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 800,
                          color:
                            "#8B1E3F",
                        }}
                      >
                        {money(
                          item.outstanding
                        )}
                      </div>

                      <div
                        style={{
                          marginTop: 3,
                          fontSize: 11,
                          color: "#888",
                        }}
                      >
                        {money(
                          item.totalPaid
                        )}{" "}
                        paid of{" "}
                        {money(
                          item.quote
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>

        <section style={panel}>
          <div style={sectionTitle}>
            Recent Payments
          </div>

          {paymentsLoading ? (
            <div style={muted}>
              Loading payments…
            </div>
          ) : recentPayments.length ===
            0 ? (
            <div style={empty}>
              No payments recorded
              yet.
            </div>
          ) : (
            <div>
              {recentPayments.map(
                (
                  payment,
                  index
                ) => (
                  <div
                    key={
                      payment.id ||
                      `${payment.job?.id}-${index}`
                    }
                    style={
                      recentPaymentRow
                    }
                  >
                    <div
                      style={{
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 800,
                          color:
                            "#2F3A3F",
                        }}
                      >
                        {payment.client
                          ? clientName(
                              clients,
                              payment.client
                                .id
                            )
                          : "Unknown client"}
                      </div>

                      <div
                        style={{
                          marginTop: 3,
                          fontSize: 12,
                          color: "#777",
                        }}
                      >
                        {payment.job?.title ||
                          payment.job?.name ||
                          payment.job?.reference ||
                          "Job"}
                        {" • "}
                        {isDepositPayment(
                          payment
                        )
                          ? "Deposit"
                          : "Payment"}
                      </div>

                      {formatPaymentDate(
                        payment
                      ) && (
                        <div
                          style={{
                            marginTop: 2,
                            fontSize: 11,
                            color: "#999",
                          }}
                        >
                          {formatPaymentDate(
                            payment
                          )}
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        fontWeight: 800,
                        color:
                          "#2F3A3F",
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      {money(
                        payment.amount
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </section>

        </>
      )}

            {/* QUOTE MANAGEMENT */}

      {financeTab === "quotes" && (
        <>

      <section
        style={{
          marginBottom: 30,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <div>
            <div style={eyebrow}>
              Finance
            </div>

            <h2
              style={{
                margin: "4px 0 0",
                color: "#2F3A3F",
              }}
            >
              Quote Management
            </h2>
          </div>

          <button
            onClick={startNewQuote}
            style={secondaryButton}
          >
            + New Quote
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "340px 1fr",
            gap: 22,
            alignItems: "start",
          }}
        >
          <section style={panel}>
            <div style={sectionTitle}>
              Quotes ({quotes.length})
            </div>

            {quotesLoading ? (
              <div style={muted}>
                Loading quotes…
              </div>
            ) : quotes.length === 0 ? (
              <div style={empty}>
                No quotes yet.
                <br />
                <span>
                  Create the first quote above.
                </span>
              </div>
            ) : (
              quotes.map((quote) => (
                <button
                  key={quote.id}
                  onClick={() =>
                    editQuote(quote)
                  }
                  style={{
                    ...invoiceRow,
                    background:
                      selectedId === quote.id &&
                      documentType === "quote"
                        ? "#FFF7E0"
                        : "white",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      gap: 10,
                    }}
                  >
                    <strong>
                      {quote.number ||
                        "Draft Quote"}
                    </strong>

                    <span
                      style={statusBadge(
                        quote.status
                      )}
                    >
                      {quote.status ||
                        "Draft"}
                    </span>
                  </div>

                  <div
                    style={{
                      marginTop: 6,
                      color: "#555",
                    }}
                  >
                    {clientName(
                      clients,
                      quote.clientId
                    )}
                  </div>

                  <div
                    style={{
                      marginTop: 4,
                      fontWeight: 700,
                    }}
                  >
                    {money(
                      quote.total ??
                        quote.amount ??
                        0
                    )}
                  </div>

                  {quote.validUntil && (
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 11,
                        color: "#888",
                      }}
                    >
                      Valid until{" "}
                      {quote.validUntil}
                    </div>
                  )}
                </button>
              ))
            )}
          </section>

          <section style={panel}>
            {!form ||
            documentType !== "quote" ? (
              <div
                style={{
                  padding: 50,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 48,
                  }}
                >
                  Quote
                </div>

                <h2
                  style={{
                    color: "#2F3A3F",
                  }}
                >
                  Quote Management
                </h2>

                <p
                  style={{
                    color: "#777",
                  }}
                >
                  Select a quote or create
                  a new one.
                </p>
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    marginBottom: 22,
                  }}
                >
                  <div>
                    <div style={eyebrow}>
                      Quote
                    </div>

                    <h2
                      style={{
                        margin: "4px 0",
                        color: "#2F3A3F",
                      }}
                    >
                      {form.number}
                    </h2>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                    }}
                  >
                    <button
                      onClick={() =>
                        window.print()
                      }
                      style={secondaryButton}
                      disabled={saving}
                    >
                      Print / PDF
                    </button>

                    {form.id && (
                      <button
                        onClick={
                          removeDocument
                        }
                        style={dangerButton}
                        disabled={saving}
                      >
                        Delete
                      </button>
                    )}

                    <button
                      onClick={save}
                      style={primaryButton}
                      disabled={saving}
                    >
                      {saving
                        ? "Saving…"
                        : "Save Quote"}
                    </button>
                  </div>
                </div>

                <div style={grid2}>
                  <Field label="Quote Number">
                    <input
                      value={
                        form.number || ""
                      }
                      onChange={(e) =>
                        updateField(
                          "number",
                          e.target.value
                        )
                      }
                      style={input}
                    />
                  </Field>

                  <Field label="Status">
                    <select
                      value={
                        form.status ||
                        "Draft"
                      }
                      onChange={(e) =>
                        updateField(
                          "status",
                          e.target.value
                        )
                      }
                      style={input}
                    >
                      <option>
                        Draft
                      </option>
                      <option>
                        Sent
                      </option>
                      <option>
                        Accepted
                      </option>
                      <option>
                        Declined
                      </option>
                      <option>
                        Expired
                      </option>
                    </select>
                  </Field>

                  <Field label="Client">
                    <select
                      value={
                        form.clientId ||
                        ""
                      }
                      onChange={(e) =>
                        updateField(
                          "clientId",
                          e.target.value
                        )
                      }
                      style={input}
                    >
                      <option value="">
                        Select client…
                      </option>

                      {clients.map(
                        (client) => (
                          <option
                            key={
                              client.id
                            }
                            value={
                              client.id
                            }
                          >
                            {client.name ||
                              `${client.firstName || ""} ${
                                client.lastName || ""
                              }`.trim()}
                          </option>
                        )
                      )}
                    </select>
                  </Field>

                  <Field label="Job">
                    <select
                      value={
                        form.jobId ||
                        ""
                      }
                      onChange={(e) =>
                        updateField(
                          "jobId",
                          e.target.value
                        )
                      }
                      style={input}
                    >
                      <option value="">
                        No job linked
                      </option>

                      {jobs
                        .filter(
                          (job) =>
                            !form.clientId ||
                            String(
                              job.clientId
                            ) ===
                              String(
                                form.clientId
                              )
                        )
                        .map((job) => (
                          <option
                            key={job.id}
                            value={job.id}
                          >
                            {job.reference
                              ? `${job.reference} — `
                              : ""}
                            {job.name ||
                              job.title ||
                              "Job"}
                          </option>
                        ))}
                    </select>
                  </Field>

                  <Field label="Issue Date">
                    <input
                      type="date"
                      value={
                        form.issueDate ||
                        ""
                      }
                      onChange={(e) =>
                        updateField(
                          "issueDate",
                          e.target.value
                        )
                      }
                      style={input}
                    />
                  </Field>

                  <Field label="Valid Until">
                    <input
                      type="date"
                      value={
                        form.validUntil ||
                        ""
                      }
                      onChange={(e) =>
                        updateField(
                          "validUntil",
                          e.target.value
                        )
                      }
                      style={input}
                    />
                  </Field>
                </div>

                <div
                  style={{
                    marginTop: 28,
                  }}
                >
                  <div
                    style={sectionTitle}
                  >
                    Line Items
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "1fr 100px 130px 120px 40px",
                      gap: 8,
                      padding:
                        "0 0 8px",
                      color: "#888",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    <span>
                      Description
                    </span>
                    <span>Qty</span>
                    <span>Rate</span>
                    <span>Total</span>
                    <span />
                  </div>

                  {form.lineItems.map(
                    (item, index) => (
                      <div
                        key={index}
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "1fr 100px 130px 120px 40px",
                          gap: 8,
                          marginBottom: 8,
                        }}
                      >
                        <input
                          value={
                            item.description
                          }
                          placeholder="Service or garment"
                          onChange={(e) =>
                            updateLine(
                              index,
                              "description",
                              e.target
                                .value
                            )
                          }
                          style={input}
                        />

                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={
                            item.quantity
                          }
                          onChange={(e) =>
                            updateLine(
                              index,
                              "quantity",
                              e.target
                                .value
                            )
                          }
                          style={input}
                        />

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) =>
                            updateLine(
                              index,
                              "rate",
                              e.target
                                .value
                            )
                          }
                          style={input}
                        />

                        <div
                          style={
                            totalCell
                          }
                        >
                          {money(
                            Number(
                              item.quantity ||
                                0
                            ) *
                              Number(
                                item.rate ||
                                  0
                              )
                          )}
                        </div>

                        <button
                          onClick={() =>
                            removeLine(
                              index
                            )
                          }
                          style={
                            iconButton
                          }
                          title="Remove line"
                        >
                          ×
                        </button>
                      </div>
                    )
                  )}

                  <button
                    onClick={addLine}
                    style={
                      secondaryButton
                    }
                  >
                    + Add Line Item
                  </button>
                </div>

                <div
                  style={{
                    marginTop: 28,
                    display: "grid",
                    gridTemplateColumns:
                      "1fr 340px",
                    gap: 30,
                  }}
                >
                  <Field label="Notes">
                    <textarea
                      value={
                        form.notes || ""
                      }
                      onChange={(e) =>
                        updateField(
                          "notes",
                          e.target.value
                        )
                      }
                      rows={6}
                      style={{
                        ...input,
                        resize:
                          "vertical",
                      }}
                      placeholder="Scope, inclusions, exclusions or client notes"
                    />
                  </Field>

                  <div style={summary}>
                    <SummaryRow
                      label="Subtotal"
                      value={money(
                        subtotal
                      )}
                    />

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                        padding:
                          "10px 0",
                      }}
                    >
                      <span>
                        GST
                      </span>

                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: 5,
                        }}
                      >
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={
                            form.gstRate
                          }
                          onChange={(e) =>
                            updateField(
                              "gstRate",
                              e.target
                                .value
                            )
                          }
                          style={{
                            ...input,
                            width: 75,
                            textAlign:
                              "right",
                          }}
                        />
                        <span>%</span>
                      </div>
                    </div>

                    <SummaryRow
                      label="GST Amount"
                      value={money(gst)}
                    />

                    <div
                      style={{
                        borderTop:
                          "1px solid #ddd",
                        marginTop: 6,
                        paddingTop: 12,
                      }}
                    >
                      <SummaryRow
                        label="Total"
                        value={money(
                          total
                        )}
                        strong
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                        padding:
                          "10px 0",
                      }}
                    >
                      <span>
                        Deposit
                      </span>

                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: 5,
                        }}
                      >
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={
                            form.depositPercent ??
                            DEFAULT_DEPOSIT_PERCENT
                          }
                          onChange={(e) =>
                            updateField(
                              "depositPercent",
                              e.target
                                .value
                            )
                          }
                          style={{
                            ...input,
                            width: 75,
                            textAlign:
                              "right",
                          }}
                        />
                        <span>%</span>
                      </div>
                    </div>

                    <SummaryRow
                      label="Deposit Required"
                      value={money(
                        depositRequired
                      )}
                      strong
                    />
                  </div>
                </div>

                <QuotePrintView
                  quote={{
                    ...form,
                    subtotal,
                    gst,
                    total,
                    depositRequired,
                  }}
                  client={clients.find(
                    (client) =>
                      String(
                        client.id
                      ) ===
                      String(
                        form.clientId
                      )
                  )}
                  job={
                    jobs.find(
                      (job) =>
                        String(job.id) ===
                        String(form.jobId)
                    )
                  }
                />
              </>
            )}
          </section>
        </div>
      </section>

        </>
      )}

            {/* INVOICE MANAGEMENT */}

      {financeTab === "invoices" && (
        <>

      <section
        style={{
          display: "flex",
          alignItems:
            "center",
          justifyContent:
            "space-between",
          marginBottom: 14,
        }}
      >
        <div>
          <div
            style={eyebrow}
          >
            Finance
          </div>

          <h2
            style={{
              margin:
                "4px 0 0",
              color: "#2F3A3F",
            }}
          >
            Invoice Management
          </h2>
        </div>
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "340px 1fr",
          gap: 22,
          alignItems:
            "start",
        }}
      >
        <section style={panel}>
          <div style={sectionTitle}>
            Invoices ({invoices.length})
          </div>

          {loading ? (
            <div style={muted}>
              Loading invoices…
            </div>
          ) : invoices.length ===
            0 ? (
            <div style={empty}>
              No invoices yet.
              <br />
              <span>
                Create the first
                invoice above.
              </span>
            </div>
          ) : (
            invoices.map(
              (invoice) => (
                <button
                  key={invoice.id}
                  onClick={() =>
                    editInvoice(
                      invoice
                    )
                  }
                  style={{
                    ...invoiceRow,
                    background:
                      selectedId ===
                      invoice.id
                        ? "#FFF7E0"
                        : "white",
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      gap: 10,
                    }}
                  >
                    <strong>
                      {invoice.number ||
                        "Draft Invoice"}
                    </strong>

                    <span
                      style={statusBadge(
                        invoice.status
                      )}
                    >
                      {invoice.status}
                    </span>
                  </div>

                  <div
                    style={{
                      marginTop: 6,
                      color: "#555",
                    }}
                  >
                    {clientName(
                      clients,
                      invoice.clientId
                    )}
                  </div>

                  <div
                    style={{
                      marginTop: 4,
                      fontWeight: 700,
                    }}
                  >
                    {money(
                      invoice.amount
                    )}
                  </div>
                </button>
              )
            )
          )}
        </section>

        <section style={panel}>
          {!form ? (
            <div
              style={{
                padding: 50,
                textAlign:
                  "center",
              }}
            >
              <div
                style={{
                  fontSize: 48,
                }}
              >
                Invoice
              </div>

              <h2
                style={{
                  color:
                    "#2F3A3F",
                }}
              >
                Invoice Management
              </h2>

              <p
                style={{
                  color: "#777",
                }}
              >
                Select an invoice
                or create a new
                one.
              </p>
            </div>
          ) : (
            <>
              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  marginBottom: 22,
                }}
              >
                <div>
                  <div
                    style={eyebrow}
                  >
                    Invoice
                  </div>

                  <h2
                    style={{
                      margin:
                        "4px 0",
                      color:
                        "#2F3A3F",
                    }}
                  >
                    {form.number}
                  </h2>
                </div>

                <div
                  style={{
                    display:
                      "flex",
                    gap: 8,
                  }}
                >
                  <button
                    onClick={() =>
                      window.print()
                    }
                    style={
                      secondaryButton
                    }
                    disabled={
                      saving
                    }
                  >
                    Print / PDF
                  </button>

                  {form.id && (
                    <button
                      onClick={
                        removeDocument
                      }
                      style={
                        dangerButton
                      }
                      disabled={
                        saving
                      }
                    >
                      Delete
                    </button>
                  )}

                  <button
                    onClick={save}
                    style={
                      primaryButton
                    }
                    disabled={
                      saving
                    }
                  >
                    {saving
                      ? "Saving…"
                      : "Save Invoice"}
                  </button>
                </div>
              </div>

              <div
                style={grid2}
              >
                <Field label="Invoice Number">
                  <input
                    value={
                      form.number
                    }
                    onChange={(e) =>
                      updateField(
                        "number",
                        e.target.value
                      )
                    }
                    style={input}
                  />
                </Field>

                <Field label="Status">
                  <select
                    value={
                      form.status
                    }
                    onChange={(e) =>
                      updateField(
                        "status",
                        e.target.value
                      )
                    }
                    style={input}
                  >
                    <option>
                      Draft
                    </option>
                    <option>
                      Issued
                    </option>
                    <option>
                      Paid
                    </option>
                    <option>
                      Overdue
                    </option>
                  </select>
                </Field>

                <Field label="Client">
                  <select
                    value={
                      form.clientId
                    }
                    onChange={(e) =>
                      updateField(
                        "clientId",
                        e.target.value
                      )
                    }
                    style={input}
                  >
                    <option value="">
                      Select client…
                    </option>

                    {clients.map(
                      (client) => (
                        <option
                          key={
                            client.id
                          }
                          value={
                            client.id
                          }
                        >
                          {client.name ||
                            `${client.firstName || ""} ${
                              client.lastName || ""
                            }`.trim()}
                        </option>
                      )
                    )}
                  </select>
                </Field>

                <Field label="Job">
                  <select
                    value={
                      form.jobId ||
                      ""
                    }
                    onChange={(e) =>
                      updateField(
                        "jobId",
                        e.target.value
                      )
                    }
                    style={input}
                  >
                    <option value="">
                      No job linked
                    </option>

                    {jobs
                      .filter(
                        (job) =>
                          !form.clientId ||
                          String(
                            job.clientId
                          ) ===
                            String(
                              form.clientId
                            )
                      )
                      .map(
                        (job) => (
                          <option
                            key={
                              job.id
                            }
                            value={
                              job.id
                            }
                          >
                            {job.reference
                              ? `${job.reference} — `
                              : ""}
                            {job.name ||
                              job.title ||
                              "Job"}
                          </option>
                        )
                      )}
                  </select>
                </Field>

                <Field label="Issue Date">
                  <input
                    type="date"
                    value={
                      form.issueDate ||
                      ""
                    }
                    onChange={(e) =>
                      updateField(
                        "issueDate",
                        e.target.value
                      )
                    }
                    style={input}
                  />
                </Field>

                <Field label="Due Date">
                  <input
                    type="date"
                    value={
                      form.dueDate ||
                      ""
                    }
                    onChange={(e) =>
                      updateField(
                        "dueDate",
                        e.target.value
                      )
                    }
                    style={input}
                  />
                </Field>
              </div>

              <div
                style={{
                  marginTop: 28,
                }}
              >
                <div
                  style={
                    sectionTitle
                  }
                >
                  Line Items
                </div>

                <div
                  style={{
                    display:
                      "grid",
                    gridTemplateColumns:
                      "1fr 100px 130px 120px 40px",
                    gap: 8,
                    padding:
                      "0 0 8px",
                    color: "#888",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <span>
                    Description
                  </span>
                  <span>
                    Qty
                  </span>
                  <span>
                    Rate
                  </span>
                  <span>
                    Total
                  </span>
                  <span />
                </div>

                {form.lineItems.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={index}
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "1fr 100px 130px 120px 40px",
                        gap: 8,
                        marginBottom:
                          8,
                      }}
                    >
                      <input
                        value={
                          item.description
                        }
                        placeholder="Service or garment"
                        onChange={(e) =>
                          updateLine(
                            index,
                            "description",
                            e.target
                              .value
                          )
                        }
                        style={input}
                      />

                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={
                          item.quantity
                        }
                        onChange={(e) =>
                          updateLine(
                            index,
                            "quantity",
                            e.target
                              .value
                          )
                        }
                        style={input}
                      />

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          item.rate
                        }
                        onChange={(e) =>
                          updateLine(
                            index,
                            "rate",
                            e.target
                              .value
                          )
                        }
                        style={input}
                      />

                      <div
                        style={
                          totalCell
                        }
                      >
                        {money(
                          Number(
                            item.quantity ||
                              0
                          ) *
                            Number(
                              item.rate ||
                                0
                            )
                        )}
                      </div>

                      <button
                        onClick={() =>
                          removeLine(
                            index
                          )
                        }
                        style={
                          iconButton
                        }
                        title="Remove line"
                      >
                        ×
                      </button>
                    </div>
                  )
                )}

                <button
                  onClick={addLine}
                  style={
                    secondaryButton
                  }
                >
                  + Add Line Item
                </button>
              </div>

              <div
                style={{
                  marginTop: 28,
                  display:
                    "grid",
                  gridTemplateColumns:
                    "1fr 340px",
                  gap: 30,
                }}
              >
                <Field label="Notes">
                  <textarea
                    value={
                      form.notes ||
                      ""
                    }
                    onChange={(e) =>
                      updateField(
                        "notes",
                        e.target.value
                      )
                    }
                    rows={5}
                    style={{
                      ...input,
                      resize:
                        "vertical",
                    }}
                    placeholder="Payment instructions or notes"
                  />
                </Field>

                <div
                  style={
                    summary
                  }
                >
                  <SummaryRow
                    label="Subtotal"
                    value={money(
                      subtotal
                    )}
                  />

                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "center",
                      padding:
                        "10px 0",
                    }}
                  >
                    <span>
                      GST
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={
                        form.gstRate
                      }
                      onChange={(e) =>
                        updateField(
                          "gstRate",
                          e.target
                            .value
                        )
                      }
                      style={{
                        ...input,
                        width: 90,
                        textAlign:
                          "right",
                      }}
                    />

                    <span>
                      %
                    </span>
                  </div>

                  <SummaryRow
                    label="GST Amount"
                    value={money(
                      gst
                    )}
                  />

                  <div
                    style={{
                      borderTop:
                        "1px solid #ddd",
                      marginTop: 6,
                      paddingTop: 12,
                    }}
                  >
                    <SummaryRow
                      label="Total"
                      value={money(
                        total
                      )}
                      strong
                    />
                  </div>

                  <SummaryRow
                    label="Paid"
                    value={money(
                      paid
                    )}
                  />

                  <SummaryRow
                    label="Balance Owing"
                    value={money(
                      balance
                    )}
                    strong
                  />
                </div>
              </div>

              <InvoicePrintView
                invoice={{
                  ...form,
                  subtotal,
                  gst,
                  total,
                  amountPaid:
                    paid,
                  balance,
                }}
                client={clients.find(
                  (client) =>
                    String(
                      client.id
                    ) ===
                    String(
                      form.clientId
                    )
                )}
                job={
                  selectedJob
                }
              />
            </>
          )}
        </section>
      </div>
        </>
      )}

      <ThriveDialog {...dialogProps} />
          </div>
  );
}

function FinanceMetric({
  label,
  value,
  detail,
  count = false,
  highlight = false,
}) {
  return (
    <div
      style={{
        background:
          highlight
            ? "#FFF7E6"
            : "#FFFFFF",
        border:
          highlight
            ? "1px solid #F3D38A"
            : "1px solid #E5E7EB",
        borderRadius: 14,
        padding:
          "18px 18px 16px",
        boxShadow:
          "0 2px 8px rgba(0,0,0,0.03)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 0.6,
          textTransform:
            "uppercase",
          color: "#888",
          marginBottom: 8,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 24,
          fontWeight: 800,
          color:
            highlight
              ? "#8A5A00"
              : "#2F3A3F",
        }}
      >
        {count
          ? value
          : money(value)}
      </div>

      <div
        style={{
          marginTop: 5,
          fontSize: 12,
          color: "#888",
        }}
      >
        {detail}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}) {
  return (
    <label
      style={{
        display: "flex",
        flexDirection:
          "column",
        gap: 7,
        fontSize: 12,
        fontWeight: 700,
        color: "#666",
      }}
    >
      {label}
      {children}
    </label>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent:
          "space-between",
        padding: "7px 0",
        color: strong
          ? "#2F3A3F"
          : "#666",
        fontWeight:
          strong ? 800 : 500,
      }}
    >
      <span>
        {label}
      </span>

      <span>
        {value}
      </span>
    </div>
  );
}

const panel = {
  background: "#fff",
  border:
    "1px solid #E5E7EB",
  borderRadius: 18,
  padding: 22,
  boxShadow:
    "0 2px 10px rgba(0,0,0,0.03)",
};

const sectionTitle = {
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: 0.8,
  textTransform:
    "uppercase",
  color: "#8B1E3F",
  marginBottom: 14,
};

const eyebrow = {
  fontSize: 12,
  fontWeight: 800,
  textTransform:
    "uppercase",
  letterSpacing: 1,
  color: "#8B1E3F",
};

const grid2 = {
  display: "grid",
  gridTemplateColumns:
    "1fr 1fr",
  gap: 16,
};

const input = {
  width: "100%",
  boxSizing: "border-box",
  border:
    "1px solid #D9DEE2",
  borderRadius: 8,
  padding:
    "10px 11px",
  fontSize: 14,
  background: "#fff",
  color: "#2F3A3F",
};

const totalCell = {
  display: "flex",
  alignItems: "center",
  justifyContent:
    "flex-end",
  fontWeight: 700,
  color: "#2F3A3F",
};

const summary = {
  background: "#F8F9FA",
  border:
    "1px solid #E8EAED",
  borderRadius: 12,
  padding: 16,
};

const muted = {
  color: "#888",
  fontSize: 13,
};

const empty = {
  padding: "35px 10px",
  textAlign: "center",
  color: "#777",
  lineHeight: 1.7,
};

const invoiceRow = {
  width: "100%",
  border:
    "1px solid #E8EAED",
  borderRadius: 10,
  padding: 13,
  marginBottom: 9,
  textAlign: "left",
  cursor: "pointer",
  color: "#2F3A3F",
};

const financeJobRow = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  padding:
    "13px 0",
  borderBottom:
    "1px solid #ECEEEF",
};

const recentPaymentRow = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  padding:
    "11px 0",
  borderBottom:
    "1px solid #ECEEEF",
};

const primaryButton = {
  border: "none",
  borderRadius: 9,
  padding:
    "11px 16px",
  background: "#8B1E3F",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
};

const secondaryButton = {
  border:
    "1px solid #D9DEE2",
  borderRadius: 8,
  padding:
    "8px 12px",
  background: "white",
  color: "#2F3A3F",
  fontWeight: 700,
  cursor: "pointer",
};

const dangerButton = {
  border:
    "1px solid #F0B4B4",
  borderRadius: 9,
  padding:
    "10px 14px",
  background: "#FFF5F5",
  color: "#B42318",
  fontWeight: 800,
  cursor: "pointer",
};

const iconButton = {
  border:
    "1px solid #ddd",
  borderRadius: 8,
  background: "white",
  fontSize: 20,
  cursor: "pointer",
  color: "#888",
};

const errorBox = {
  marginBottom: 18,
  padding: 12,
  borderRadius: 9,
  background: "#FFF1F1",
  border:
    "1px solid #F2B8B8",
  color: "#A21D1D",
  fontSize: 13,
};

function statusBadge(status) {
  return {
    fontSize: 10,
    fontWeight: 800,
    textTransform:
      "uppercase",
    padding:
      "4px 7px",
    borderRadius: 999,
    background:
      status === "Paid"
        ? "#DCFCE7"
        : status === "Overdue"
        ? "#FEE2E2"
        : "#F3F4F6",
    color:
      status === "Paid"
        ? "#166534"
        : status === "Overdue"
        ? "#991B1B"
        : "#555",
  };
}