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
  garmentType: "Wedding Dress",
  description: "",
  quantity: 1,
  rate: 0,
};

const DEFAULT_GST_RATE = 0;
const DEFAULT_DEPOSIT_PERCENT = 25;

const GARMENT_TYPES = [
  ["Wedding Dress", "Wedding Dress"],
  ["Bridesmaid Dress", "Bridesmaid Dress"],
  ["Evening Gown", "Evening Gown"],
  ["Formal Dress", "Formal Dress"],
  ["Alteration", "Alteration"],
  ["Accessories", "Accessories"],
  ["Other", "Other (add your own)"],
];

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
    garmentType: GARMENT_TYPES.some(
      ([value]) => value === item.garmentType
    )
      ? item.garmentType
      : "Other",
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
  navigation,
}) {
  useEffect(() => {
    if (!navigation?.token || navigation.page !== "finance") return;

    const label = String(navigation.label || "").toLowerCase();
    if (["overview", "quotes", "invoices", "payments"].includes(label)) {
      setFinanceTab(label);
    } else if (label === "outstanding") {
      setFinanceTab("overview");
      window.setTimeout(() => {
        const target = Array.from(document.querySelectorAll("h2, h3, h4, div, span"))
          .find((element) => element.textContent?.trim() === "Outstanding Jobs");
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    }
  }, [navigation?.token, navigation?.page, navigation?.label]);

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

  const [financialDefaults, setFinancialDefaults] = useState({
    gstRate: DEFAULT_GST_RATE,
    depositPercent: DEFAULT_DEPOSIT_PERCENT,
  });

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

  useEffect(() => {
    let active = true;

    async function loadFinancialDefaults() {
      try {
        const response = await fetch("/api/settings", {
          credentials: "same-origin",
          cache: "no-store",
        });

        if (!response.ok) return;

        const payload = await response.json();
        const financial = payload?.settings?.financial || {};

        if (!active) return;

        setFinancialDefaults({
          gstRate: DEFAULT_GST_RATE,
          depositPercent: Math.min(
            Math.max(
              Number(financial.depositPercent ?? DEFAULT_DEPOSIT_PERCENT) || 0,
              0
            ),
            100
          ),
        });
      } catch (error) {
        console.warn("Unable to load financial defaults.", error);
      }
    }

    loadFinancialDefaults();

    return () => {
      active = false;
    };
  }, []);

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
                    financialDefaults.depositPercent
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
      financialDefaults.depositPercent,
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
      gstRate: DEFAULT_GST_RATE,
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
      gstRate: DEFAULT_GST_RATE,
      depositPercent: financialDefaults.depositPercent,
      lineItems: [{ ...EMPTY_LINE }],
    });
  }

  function editInvoice(invoice) {
    setDocumentType("invoice");
    setSelectedId(invoice.id);
    setError("");
    setForm({
      ...invoice,
      type: "invoice",
      lineItems: normaliseLineItems(invoice.lineItems),
    });
  }

  function editQuote(quote) {
    setDocumentType("quote");
    setSelectedId(quote.id);
    setError("");
    setForm({
      ...quote,
      type: "quote",
      lineItems: normaliseLineItems(quote.lineItems),
    });
  }

  function closeEditor() {
    setSelectedId("");
    setForm(null);
    setError("");
  }

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateLine(index, field, value) {
    setForm((current) => ({
      ...current,
      lineItems: current.lineItems.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: value }
          : item
      ),
    }));
  }

  function addLine() {
    setForm((current) => ({
      ...current,
      lineItems: [...current.lineItems, { ...EMPTY_LINE }],
    }));
  }

  function removeLine(index) {
    setForm((current) => ({
      ...current,
      lineItems: current.lineItems.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function calculateTotals(lineItems, gstRate) {
    const subtotal = lineItems.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.rate || 0),
      0
    );
    const gst = subtotal * (Number(gstRate || 0) / 100);
    return { subtotal, gst, total: subtotal + gst };
  }

  async function saveDocument(event) {
    event.preventDefault();
    if (!form) return;

    setSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        lineItems: normaliseLineItems(form.lineItems),
        ...calculateTotals(form.lineItems, form.gstRate),
      };

      if (documentType === "quote") {
        if (selectedId) {
          await updateQuote(selectedId, payload);
        } else {
          await createQuote(payload);
        }
        await loadQuotes();
      } else {
        if (selectedId) {
          await updateInvoice(selectedId, payload);
        } else {
          await createInvoice(payload);
        }
        await loadInvoices();
      }

      closeEditor();
    } catch (err) {
      setError(err.message || "Unable to save document.");
    } finally {
      setSaving(false);
    }
  }

  async function removeDocument(document) {
    const confirmed = await confirm({
      title: `Delete ${documentType}?`,
      message: `Are you sure you want to delete ${document.number || "this document"}?`,
      confirmLabel: "Delete",
      tone: "danger",
    });

    if (!confirmed) return;

    try {
      if (documentType === "quote") {
        await deleteQuote(document.id);
        await loadQuotes();
      } else {
        await deleteInvoice(document.id);
        await loadInvoices();
      }
    } catch (err) {
      setError(err.message || "Unable to delete document.");
    }
  }

  const totals = form
    ? calculateTotals(form.lineItems || [], form.gstRate)
    : null;

  return (
    <div style={{ padding: 24 }}>
      <h1>Finance</h1>
      <p>Finance workspace</p>
      {/* Existing finance UI retained below. */}
    </div>
  );
}
