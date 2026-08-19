export default function TodaysWorkPanel({ clients = [], jobs = [], onSelectJob }) {
  const todayKey = toDateKey(new Date());
  const appointments = clients
    .flatMap((client) => (client.appointments || [])
      .filter((item) => toDateKey(item.date) === todayKey)
      .map((item) => ({ ...item, client, job: findRelatedJob(item, jobs, client) })))
    .sort(compareScheduleItems);

  const fittings = [
    ...clients.flatMap((client) => (client.fittings || [])
      .filter((item) => toDateKey(item.date) === todayKey)
      .map((item) => ({ ...item, client, job: findRelatedJob(item, jobs, client) }))),
    ...jobs.flatMap((job) => (job.fittings || [])
      .filter((item) => toDateKey(item.date) === todayKey)
      .map((item) => ({
        ...item,
        job,
        client: clients.find((client) => String(client.id) === String(job.clientId)),
      }))),
  ].filter(uniqueById).sort(compareScheduleItems);

  const activeJobs = jobs
    .filter((job) => !["Completed", "Cancelled", "Archived"].includes(String(job.status || "").trim()))
    .sort((a, b) => compareDates(a.dueDate, b.dueDate));

  const outstanding = jobs
    .map((job) => ({ job, amount: getOutstanding(job) }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  return (
    <div style={panelStyle}>
      <div style={todayListStyle}>
        <TodayRow
          icon="📅"
          title="Appointments"
          subtitle={appointments.length ? `Next: ${formatTime(appointments[0].time)} — ${getClientName(appointments[0].client)}` : "No appointments today"}
          onClick={appointments[0]?.job ? () => onSelectJob?.(appointments[0].job) : undefined}
        />
        <TodayRow
          icon="👗"
          title="Fittings"
          subtitle={fittings.length ? `Next: ${formatTime(fittings[0].time)} — ${getClientName(fittings[0].client)}` : "No fittings today"}
          onClick={fittings[0]?.job ? () => onSelectJob?.(fittings[0].job) : undefined}
        />
        <TodayRow
          icon="💼"
          title="Active Jobs"
          subtitle={`${activeJobs.length} ${activeJobs.length === 1 ? "job" : "jobs"} in progress`}
          onClick={activeJobs[0] ? () => onSelectJob?.(activeJobs[0]) : undefined}
        />
        <TodayRow
          icon="💰"
          title="Outstanding Payments"
          subtitle={`${formatCurrency(outstanding.reduce((sum, item) => sum + item.amount, 0))} across ${outstanding.length} ${outstanding.length === 1 ? "job" : "jobs"}`}
          onClick={outstanding[0] ? () => onSelectJob?.(outstanding[0].job) : undefined}
        />
      </div>
    </div>
  );
}

function TodayRow({ icon, title, subtitle, onClick }) {
  return (
    <div style={todayRowStyle}>
      <span style={todayIconStyle}>{icon}</span>
      <div style={rowContentStyle}>
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </div>
      {onClick && <OpenButton onClick={onClick} />}
    </div>
  );
}

function OpenButton({ onClick }) {
  return (
    <button
      type="button"
      aria-label="Open"
      onClick={onClick}
      style={openButtonStyle}
      onMouseEnter={(event) => {
        event.currentTarget.style.background = "#8B1E3F";
        event.currentTarget.style.color = "#FFFFFF";
        event.currentTarget.style.boxShadow = "0 3px 8px rgba(139,30,63,.18)";
        event.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = "#FFFFFF";
        event.currentTarget.style.color = "#8B1E3F";
        event.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,.04)";
        event.currentTarget.style.transform = "translateY(0)";
      }}
    >
      Open <span aria-hidden="true">→</span>
    </button>
  );
}

function findRelatedJob(item, jobs, client) {
  if (item?.jobId) {
    const match = jobs.find((job) => String(job.id) === String(item.jobId));
    if (match) return match;
  }
  if (item?.jobReference) {
    const match = jobs.find((job) => String(job.reference) === String(item.jobReference));
    if (match) return match;
  }
  if (client?.id) {
    const matches = jobs.filter((job) => String(job.clientId) === String(client.id));
    if (matches.length === 1) return matches[0];
  }
  return null;
}

function getClientName(client) {
  if (!client) return "Unknown client";
  return client.name || [client.firstName, client.lastName].filter(Boolean).join(" ") || "Unknown client";
}

function getOutstanding(job) {
  if (job.balance !== undefined && job.balance !== null) return Math.max(Number(job.balance) || 0, 0);
  if (job.outstanding !== undefined && job.outstanding !== null) return Math.max(Number(job.outstanding) || 0, 0);
  if (Array.isArray(job.invoices) && job.invoices.length) {
    return Math.max(job.invoices.reduce((sum, invoice) => sum + Number(invoice.balance ?? 0), 0), 0);
  }
  const quote = Number(job.price || 0);
  const paid = (job.payments || []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  return Math.max(quote - paid, 0);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function toDateValue(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string" && /^\d{2}\/\d{2}\/\d{4}/.test(value)) {
    const [day, month, year] = value.slice(0, 10).split("/").map(Number);
    return new Date(year, month - 1, day);
  }
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [year, month, day] = value.slice(0, 10).split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDateKey(value) {
  const date = toDateValue(value);
  if (!date) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function compareDates(a, b) {
  const da = toDateValue(a);
  const db = toDateValue(b);
  if (!da && !db) return 0;
  if (!da) return 1;
  if (!db) return -1;
  return da - db;
}

function compareScheduleItems(a, b) {
  const am = timeToMinutes(a.time);
  const bm = timeToMinutes(b.time);
  if (am === null && bm === null) return 0;
  if (am === null) return 1;
  if (bm === null) return -1;
  return am - bm;
}

function timeToMinutes(value) {
  if (!value) return null;
  const match = String(value).trim().match(/^(\d{1,2}):(\d{2})(?:\s*([ap]m))?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3]?.toLowerCase();
  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  return hour * 60 + minute;
}

function formatTime(value) {
  const minutes = timeToMinutes(value);
  if (minutes === null) return value || "Time TBC";
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "pm" : "am"}`;
}

function uniqueById(item, index, list) {
  const key = item.id || `${item.client?.id}-${item.title}-${item.time}`;
  return list.findIndex((candidate) => (candidate.id || `${candidate.client?.id}-${candidate.title}-${candidate.time}`) === key) === index;
}

const panelStyle = { padding: "0 20px 2px" };
const todayListStyle = { display: "flex", flexDirection: "column" };
const todayRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 17,
  minHeight: 78,
  padding: "12px 0",
  borderBottom: "1px solid #E8EAED",
};
const todayIconStyle = { width: 36, textAlign: "center", fontSize: 25, lineHeight: 1, flexShrink: 0 };
const rowContentStyle = { display: "flex", flexDirection: "column", gap: 4, minWidth: 0, flex: 1 };
const openButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  flexShrink: 0,
  minWidth: 100,
  height: 42,
  padding: "0 18px",
  border: "1px solid #C96A83",
  borderRadius: 999,
  background: "#FFFFFF",
  color: "#8B1E3F",
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1,
  cursor: "pointer",
  boxShadow: "0 1px 2px rgba(31,41,51,.04)",
  transition: "background 160ms ease, color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
};
