import { useMemo, useState } from "react";

const REPORT_TYPES = [
  {
    id: "income",
    title: "Income Summary",
    description:
      "Income and payments received during the selected period.",
    format: "CSV",
  },
  {
    id: "payments",
    title: "Payments Report",
    description:
      "Every recorded payment within the selected period.",
    format: "CSV",
  },
  {
    id: "outstanding",
    title: "Outstanding Payments",
    description:
      "Jobs with money still owing.",
    format: "CSV",
  },
  {
    id: "jobs",
    title: "Jobs Report",
    description:
      "Jobs within the selected reporting period.",
    format: "CSV",
  },
];

function asDate(value) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function dateKey(value) {
  const date = asDate(value);

  if (!date) return "";

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function firstDate(...values) {
  for (const value of values) {
    const date = asDate(value);

    if (date) return date;
  }

  return null;
}

function getJobDate(job) {
  return firstDate(
    job?.date,
    job?.jobDate,
    job?.createdAt,
    job?.createdDate,
    job?.startDate,
    job?.issueDate
  );
}

function getPaymentDate(payment, job) {
  return firstDate(
    payment?.date,
    payment?.paymentDate,
    payment?.paidAt,
    payment?.createdAt,
    job?.date,
    job?.createdAt
  );
}

function getPayments(job) {
  return Array.isArray(job?.payments)
    ? job.payments
    : [];
}

function getTotalPaid(job) {
  return getPayments(job).reduce(
    (sum, payment) =>
      sum + Number(payment?.amount || 0),
    0
  );
}

function getJobValue(job) {
  if (job?.price !== undefined) {
    return Number(job.price) || 0;
  }

  if (job?.total !== undefined) {
    return Number(job.total) || 0;
  }

  return 0;
}

function getOutstanding(job) {
  if (job?.balance !== undefined && job?.balance !== null) {
    return Math.max(Number(job.balance) || 0, 0);
  }

  if (
    job?.outstanding !== undefined &&
    job?.outstanding !== null
  ) {
    return Math.max(Number(job.outstanding) || 0, 0);
  }

  if (Array.isArray(job?.invoices) && job.invoices.length) {
    return Math.max(
      job.invoices.reduce(
        (sum, invoice) =>
          sum + Number(invoice?.balance || 0),
        0
      ),
      0
    );
  }

  return Math.max(
    getJobValue(job) - getTotalPaid(job),
    0
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  const date = asDate(value);

  if (!date) return "—";

  return date.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getFinancialYear(reference = new Date()) {
  const startYear =
    reference.getMonth() >= 6
      ? reference.getFullYear()
      : reference.getFullYear() - 1;

  return {
    from: `${startYear}-07-01`,
    to: `${startYear + 1}-06-30`,
    label: `FY ${startYear}–${String(
      startYear + 1
    ).slice(-2)}`,
  };
}

function getPreviousFinancialYear(reference = new Date()) {
  const current = getFinancialYear(reference);
  const startYear =
    Number(current.from.slice(0, 4)) - 1;

  return {
    from: `${startYear}-07-01`,
    to: `${startYear + 1}-06-30`,
    label: `FY ${startYear}–${String(
      startYear + 1
    ).slice(-2)}`,
  };
}

function csvEscape(value) {
  const text =
    value === null || value === undefined
      ? ""
      : String(value);

  return `"${text.replaceAll('"', '""')}"`;
}

function downloadCsv(filename, headers, rows) {
  const csv = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) =>
      row.map(csvEscape).join(",")
    ),
  ].join("\r\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

function findClientName(clients, job) {
  const client = clients.find(
    (item) =>
      String(item?.id) === String(job?.clientId) ||
      String(item?.id) === String(job?.client?.id)
  );

  return (
    client?.name ||
    job?.clientName ||
    job?.client?.name ||
    ""
  );
}

export default function ReportsPage({
  clients = [],
  jobs = [],
}) {
  const initialRange = getFinancialYear();

  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [activePreset, setActivePreset] =
    useState("financialYear");

  const allJobs = useMemo(() => {
    if (jobs.length) return jobs;

    return clients.flatMap(
      (client) => client.jobs || []
    );
  }, [clients, jobs]);

  const period = useMemo(() => ({
    fromDate: new Date(`${from}T00:00:00`),
    toDate: new Date(`${to}T23:59:59`),
  }), [from, to]);

  const periodJobs = useMemo(
    () =>
      allJobs.filter((job) => {
        const date = getJobDate(job);

        return (
          date &&
          date >= period.fromDate &&
          date <= period.toDate
        );
      }),
    [allJobs, period]
  );

  const periodPayments = useMemo(
    () =>
      allJobs.flatMap((job) =>
        getPayments(job)
          .filter((payment) => {
            const date = getPaymentDate(payment, job);

            return (
              date &&
              date >= period.fromDate &&
              date <= period.toDate
            );
          })
          .map((payment) => ({
            payment,
            job,
          }))
      ),
    [allJobs, period]
  );

  const summary = useMemo(() => {
    const income = periodPayments.reduce(
      (sum, item) =>
        sum + Number(item.payment?.amount || 0),
      0
    );

    const quoted = periodJobs.reduce(
      (sum, job) => sum + getJobValue(job),
      0
    );

    const outstanding = periodJobs.reduce(
      (sum, job) => sum + getOutstanding(job),
      0
    );

    const gst = periodPayments.reduce(
      (sum, item) => {
        const amount =
          Number(item.payment?.amount || 0);

        const gstRate =
          Number(
            item.payment?.gstRate ??
              item.job?.gstRate ??
              0
          );

        return sum + amount * (gstRate / 100);
      },
      0
    );

    return {
      income,
      quoted,
      outstanding,
      gst,
      jobs: periodJobs.length,
      payments: periodPayments.length,
    };
  }, [periodJobs, periodPayments]);

  function applyRange(nextFrom, nextTo, preset) {
    setFrom(nextFrom);
    setTo(nextTo);
    setActivePreset(preset);
  }

  function setFinancialYear() {
    const range = getFinancialYear();

    applyRange(
      range.from,
      range.to,
      "financialYear"
    );
  }

  function setPreviousFinancialYear() {
    const range = getPreviousFinancialYear();

    applyRange(
      range.from,
      range.to,
      "previousFinancialYear"
    );
  }

  function setThisMonth() {
    const now = new Date();

    applyRange(
      dateKey(
        new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        )
      ),
      dateKey(
        new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0
        )
      ),
      "month"
    );
  }

  function setThisCalendarYear() {
    const now = new Date();

    applyRange(
      `${now.getFullYear()}-01-01`,
      `${now.getFullYear()}-12-31`,
      "year"
    );
  }

  function markCustom() {
    setActivePreset("custom");
  }

  function exportIncome() {
    downloadCsv(
      `thrive-income-${from}-to-${to}.csv`,
      ["Date", "Job", "Client", "Amount"],
      periodPayments.map(({ payment, job }) => [
        dateKey(getPaymentDate(payment, job)),
        job?.reference ||
          job?.jobNumber ||
          job?.id ||
          "",
        findClientName(clients, job),
        Number(payment?.amount || 0).toFixed(2),
      ])
    );
  }

  function exportPayments() {
    downloadCsv(
      `thrive-payments-${from}-to-${to}.csv`,
      [
        "Date",
        "Job",
        "Client",
        "Payment Type",
        "Amount",
      ],
      periodPayments.map(({ payment, job }) => [
        dateKey(getPaymentDate(payment, job)),
        job?.reference ||
          job?.jobNumber ||
          job?.id ||
          "",
        findClientName(clients, job),
        payment?.type ||
          payment?.method ||
          payment?.description ||
          "",
        Number(payment?.amount || 0).toFixed(2),
      ])
    );
  }

  function exportOutstanding() {
    downloadCsv(
      `thrive-outstanding-${from}-to-${to}.csv`,
      [
        "Job",
        "Client",
        "Job Value",
        "Paid",
        "Outstanding",
        "Status",
      ],
      periodJobs
        .filter((job) => getOutstanding(job) > 0)
        .map((job) => [
          job?.reference ||
            job?.jobNumber ||
            job?.id ||
            "",
          findClientName(clients, job),
          getJobValue(job).toFixed(2),
          getTotalPaid(job).toFixed(2),
          getOutstanding(job).toFixed(2),
          job?.status || "",
        ])
    );
  }

  function exportJobs() {
    downloadCsv(
      `thrive-jobs-${from}-to-${to}.csv`,
      [
        "Date",
        "Job",
        "Client",
        "Status",
        "Value",
        "Paid",
        "Outstanding",
      ],
      periodJobs.map((job) => [
        dateKey(getJobDate(job)),
        job?.reference ||
          job?.jobNumber ||
          job?.id ||
          "",
        findClientName(clients, job),
        job?.status || "",
        getJobValue(job).toFixed(2),
        getTotalPaid(job).toFixed(2),
        getOutstanding(job).toFixed(2),
      ])
    );
  }

  function exportReport(id) {
    if (id === "income") exportIncome();
    if (id === "payments") exportPayments();
    if (id === "outstanding") exportOutstanding();
    if (id === "jobs") exportJobs();
  }

  function exportEofy() {
    downloadCsv(
      `thrive-eofy-${from}-to-${to}.csv`,
      [
        "Period Start",
        "Period End",
        "Payments Received",
        "Jobs",
        "Quoted Value",
        "Outstanding",
        "GST Recorded",
      ],
      [[
        from,
        to,
        summary.income.toFixed(2),
        summary.jobs,
        summary.quoted.toFixed(2),
        summary.outstanding.toFixed(2),
        summary.gst.toFixed(2),
      ]]
    );
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>THRIVE</div>

          <h1 style={titleStyle}>Reports</h1>

          <p style={subtitleStyle}>
            Choose exactly what period you want
            to report on, then download the
            information you need.
          </p>
        </div>
      </div>

      <section style={periodCardStyle}>
        <div style={sectionHeadingStyle}>
          Reporting Period
        </div>

        <div style={presetRowStyle}>
          <PresetButton
            active={activePreset === "financialYear"}
            onClick={setFinancialYear}
          >
            This Financial Year
          </PresetButton>

          <PresetButton
            active={
              activePreset === "previousFinancialYear"
            }
            onClick={setPreviousFinancialYear}
          >
            Last Financial Year
          </PresetButton>

          <PresetButton
            active={activePreset === "month"}
            onClick={setThisMonth}
          >
            This Month
          </PresetButton>

          <PresetButton
            active={activePreset === "year"}
            onClick={setThisCalendarYear}
          >
            This Calendar Year
          </PresetButton>

          <PresetButton
            active={activePreset === "custom"}
            onClick={markCustom}
          >
            Custom
          </PresetButton>
        </div>

        <div style={dateRowStyle}>
          <label style={fieldStyle}>
            <span style={labelStyle}>From</span>
            <input
              type="date"
              value={from}
              onChange={(event) => {
                setFrom(event.target.value);
                markCustom();
              }}
              style={inputStyle}
            />
          </label>

          <div style={arrowStyle}>→</div>

          <label style={fieldStyle}>
            <span style={labelStyle}>To</span>
            <input
              type="date"
              value={to}
              onChange={(event) => {
                setTo(event.target.value);
                markCustom();
              }}
              style={inputStyle}
            />
          </label>

          <div style={periodLabelStyle}>
            {formatDate(from)} → {formatDate(to)}
          </div>
        </div>
      </section>

      <section>
        <div style={sectionHeadingStyle}>
          Period Summary
        </div>

        <div style={summaryGridStyle}>
          <SummaryCard
            label="Payments Received"
            value={formatCurrency(summary.income)}
          />

          <SummaryCard
            label="Jobs"
            value={summary.jobs}
          />

          <SummaryCard
            label="Quoted Value"
            value={formatCurrency(summary.quoted)}
          />

          <SummaryCard
            label="Outstanding"
            value={formatCurrency(summary.outstanding)}
          />
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={sectionHeadingStyle}>
          Financial & Tax
        </div>

        <p style={sectionDescriptionStyle}>
          Prepare business information for your
          own records or your accountant. These
          exports are summaries and are not a
          completed tax return or tax advice.
        </p>

        <div style={eofyCardStyle}>
          <div>
            <div style={eofyEyebrowStyle}>
              END OF FINANCIAL YEAR
            </div>

            <h2 style={eofyTitleStyle}>
              {getFinancialYear(
                period.fromDate
              ).label}
            </h2>

            <p style={eofyTextStyle}>
              {formatDate(from)} → {formatDate(to)}
            </p>
          </div>

          <div style={eofyStatsStyle}>
            <div>
              <span>Payments</span>
              <strong>
                {formatCurrency(summary.income)}
              </strong>
            </div>

            <div>
              <span>GST recorded</span>
              <strong>
                {formatCurrency(summary.gst)}
              </strong>
            </div>

            <div>
              <span>Jobs</span>
              <strong>{summary.jobs}</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={exportEofy}
            style={primaryButtonStyle}
          >
            Download EOFY Summary
          </button>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={sectionHeadingStyle}>
          Business Reports
        </div>

        <div style={reportGridStyle}>
          {REPORT_TYPES.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onDownload={() =>
                exportReport(report.id)
              }
            />
          ))}
        </div>
      </section>

      <div style={noteStyle}>
        <strong>Download formats</strong>

        <span>
          CSV is available now for spreadsheet
          and accountant workflows. Existing
          THRIVE document printing/PDF remains
          separate from these data reports.
        </span>
      </div>
    </div>
  );
}

function PresetButton({
  active,
  onClick,
  children,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...presetButtonStyle,
        ...(active
          ? presetButtonActiveStyle
          : {}),
      }}
    >
      {children}
    </button>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div style={summaryCardStyle}>
      <div style={summaryLabelStyle}>
        {label}
      </div>

      <div style={summaryValueStyle}>
        {value}
      </div>
    </div>
  );
}

function ReportCard({ report, onDownload }) {
  return (
    <div style={reportCardStyle}>
      <div>
        <div style={reportFormatStyle}>
          {report.format}
        </div>

        <h3 style={reportTitleStyle}>
          {report.title}
        </h3>

        <p style={reportDescriptionStyle}>
          {report.description}
        </p>
      </div>

      <button
        type="button"
        onClick={onDownload}
        style={secondaryButtonStyle}
      >
        Download
      </button>
    </div>
  );
}

const pageStyle = {
  paddingBottom: 48,
  maxWidth: 1180,
};

const headerStyle = {
  marginBottom: 26,
};

const eyebrowStyle = {
  color: "#8B1E3F",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  marginBottom: 6,
};

const titleStyle = {
  margin: 0,
  color: "#2F3A3F",
  fontSize: 32,
  lineHeight: 1.15,
};

const subtitleStyle = {
  margin: "9px 0 0",
  color: "#687178",
  fontSize: 15,
  lineHeight: 1.55,
  maxWidth: 720,
};

const sectionHeadingStyle = {
  color: "#2F3A3F",
  fontSize: 18,
  fontWeight: 800,
  marginBottom: 12,
};

const sectionDescriptionStyle = {
  color: "#687178",
  fontSize: 13,
  lineHeight: 1.55,
  margin: "-3px 0 14px",
  maxWidth: 760,
};

const periodCardStyle = {
  background: "#FFFFFF",
  border: "1px solid #E1E5E7",
  borderRadius: 14,
  padding: 20,
  marginBottom: 28,
  boxShadow:
    "0 2px 8px rgba(31,41,51,.04)",
};

const presetRowStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginBottom: 18,
};

const presetButtonStyle = {
  border: "1px solid #D5DADD",
  background: "#FFFFFF",
  color: "#4E575C",
  borderRadius: 999,
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};

const presetButtonActiveStyle = {
  background: "#8B1E3F",
  borderColor: "#8B1E3F",
  color: "#FFFFFF",
};

const dateRowStyle = {
  display: "flex",
  alignItems: "flex-end",
  gap: 12,
  flexWrap: "wrap",
};

const fieldStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const labelStyle = {
  color: "#687178",
  fontSize: 11,
  fontWeight: 700,
};

const inputStyle = {
  height: 40,
  border: "1px solid #CDD3D7",
  borderRadius: 8,
  padding: "0 10px",
  color: "#2F3A3F",
  background: "#FFFFFF",
  fontSize: 13,
};

const arrowStyle = {
  color: "#8B1E3F",
  fontWeight: 800,
  paddingBottom: 10,
};

const periodLabelStyle = {
  color: "#687178",
  fontSize: 12,
  paddingBottom: 11,
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(4, minmax(0, 1fr))",
  gap: 12,
  marginBottom: 28,
};

const summaryCardStyle = {
  background: "#FFFFFF",
  border: "1px solid #E1E5E7",
  borderRadius: 12,
  padding: 18,
};

const summaryLabelStyle = {
  color: "#687178",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 0.4,
};

const summaryValueStyle = {
  color: "#171D22",
  fontSize: 24,
  fontWeight: 800,
  marginTop: 8,
};

const sectionStyle = {
  marginTop: 28,
};

const eofyCardStyle = {
  background:
    "linear-gradient(135deg, #2F3A3F 0%, #39464C 100%)",
  color: "#FFFFFF",
  borderRadius: 16,
  padding: 22,
  display: "grid",
  gridTemplateColumns:
    "minmax(180px, 1fr) minmax(300px, 1.5fr) auto",
  gap: 24,
  alignItems: "center",
};

const eofyEyebrowStyle = {
  color: "#D8A1B1",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 1.2,
};

const eofyTitleStyle = {
  margin: "6px 0 2px",
  fontSize: 24,
};

const eofyTextStyle = {
  margin: 0,
  color: "#D4D9DB",
  fontSize: 12,
};

const eofyStatsStyle = {
  display: "flex",
  gap: 24,
  flexWrap: "wrap",
};

const primaryButtonStyle = {
  border: "none",
  borderRadius: 9,
  padding: "11px 15px",
  background: "#C96A83",
  color: "#FFFFFF",
  fontWeight: 800,
  fontSize: 12,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const reportGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: 14,
};

const reportCardStyle = {
  background: "#FFFFFF",
  border: "1px solid #E1E5E7",
  borderRadius: 13,
  padding: 18,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  minHeight: 150,
  boxSizing: "border-box",
};

const reportFormatStyle = {
  display: "inline-flex",
  color: "#8B1E3F",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 0.8,
  marginBottom: 8,
};

const reportTitleStyle = {
  margin: 0,
  color: "#2F3A3F",
  fontSize: 17,
};

const reportDescriptionStyle = {
  margin: "7px 0 18px",
  color: "#687178",
  fontSize: 13,
  lineHeight: 1.5,
};

const secondaryButtonStyle = {
  alignSelf: "flex-start",
  border: "1px solid #C96A83",
  borderRadius: 8,
  padding: "8px 12px",
  background: "#FFFFFF",
  color: "#8B1E3F",
  fontWeight: 700,
  fontSize: 12,
  cursor: "pointer",
};

const noteStyle = {
  marginTop: 20,
  padding: 14,
  borderRadius: 10,
  background: "#F6F7F8",
  color: "#687178",
  fontSize: 12,
  lineHeight: 1.55,
  display: "flex",
  gap: 7,
  flexWrap: "wrap",
};
