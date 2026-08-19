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
    .sort((a, b) => compareDates(a.dueDate, b.dueDate))
    .slice(0, 4);

  const outstanding = jobs
    .map((job) => ({ job, amount: getOutstanding(job) }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);

  const priorities = jobs
    .filter((job) => job.overdue || job.dueToday || job.needsAttention)
    .sort((a, b) => priorityScore(a) - priorityScore(b));

  const totalOutstanding = outstanding.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div style={panelStyle}>
      <div style={metricsStyle}>
        <Metric icon="📅" value={appointments.length} label="Appointments" />
        <Metric icon="👗" value={fittings.length} label="Fittings" />
        <Metric icon="💼" value={activeJobs.length} label="Active jobs" />
        <Metric icon="💰" value={formatCurrency(totalOutstanding)} label="Outstanding" />
      </div>

      {priorities.length > 0 && (
        <section style={attentionStyle}>
          <div style={attentionHeadingStyle}>
            <span>🔔 Needs attention</span>
            <strong>{priorities.length}</strong>
          </div>
          {priorities.map((job) => {
            const priority = getPriority(job);
            const client = clients.find((item) => String(item.id) === String(job.clientId));
            return (
              <button key={job.id ?? job.reference ?? job.name} type="button" onClick={() => onSelectJob?.(job)} style={attentionRowStyle}>
                <span style={{ color: priority.color, fontSize: 13 }}>●</span>
                <strong>{job.reference || job.name || job.title || "Job"}</strong>
                <span>{getClientName(client)}</span>
                <span style={{ marginLeft: "auto", color: priority.color, fontWeight: 700 }}>
                  {job.nextAction || priority.label} →
                </span>
              </button>
            );
          })}
        </section>
      )}

      <div style={contentGridStyle}>
        <CompactSection title="📅 Today's Appointments" empty="No appointments today.">
          {appointments.map((item, index) => (
            <ScheduleRow key={item.id || index} time={item.time} title={item.title || item.type || "Appointment"} client={getClientName(item.client)} onClick={item.job ? () => onSelectJob?.(item.job) : undefined} />
          ))}
        </CompactSection>

        <CompactSection title="👗 Today's Fittings" empty="No fittings today.">
          {fittings.map((item, index) => (
            <ScheduleRow key={item.id || index} time={item.time} title={item.title || "Fitting"} client={getClientName(item.client)} onClick={item.job ? () => onSelectJob?.(item.job) : undefined} />
          ))}
        </CompactSection>

        <CompactSection title="💼 Active Jobs" empty="No active jobs.">
          {activeJobs.map((job) => (
            <ActionRow key={job.id} title={job.reference || job.name || job.title || "Job"} subtitle={getClientName(clients.find((client) => String(client.id) === String(job.clientId)))} meta={job.status || "Active"} onClick={() => onSelectJob?.(job)} />
          ))}
        </CompactSection>

        <CompactSection title="💰 Outstanding Payments" empty="No outstanding payments.">
          {outstanding.map(({ job, amount }) => (
            <ActionRow key={job.id} title={job.reference || job.name || job.title || "Job"} subtitle={getClientName(clients.find((client) => String(client.id) === String(job.clientId)))} meta={formatCurrency(amount)} metaStyle={{ color: "#8A5A00" }} onClick={() => onSelectJob?.(job)} />
          ))}
        </CompactSection>
      </div>
    </div>
  );
}

function Metric({ icon, value, label }) {
  return <div style={metricStyle}><span style={{ fontSize: 17 }}>{icon}</span><div><strong>{value}</strong><span>{label}</span></div></div>;
}

function CompactSection({ title, empty, children }) {
  const hasItems = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return <section style={sectionStyle}><h3 style={sectionTitleStyle}>{title}</h3>{hasItems ? <div style={rowsStyle}>{children}</div> : <span style={emptyStyle}>{empty}</span>}</section>;
}

function ScheduleRow({ time, title, client, onClick }) {
  const content = <><span style={timeStyle}>{formatTime(time)}</span><span style={rowContentStyle}><strong>{title}</strong><small>{client}</small></span>{onClick && <span style={arrowStyle}>→</span>}</>;
  return onClick ? <button type="button" onClick={onClick} style={rowButtonStyle}>{content}</button> : <div style={rowStyle}>{content}</div>;
}

function ActionRow({ title, subtitle, meta, metaStyle, onClick }) {
  return <button type="button" onClick={onClick} style={rowButtonStyle}><span style={rowContentStyle}><strong>{title}</strong><small>{subtitle}</small></span><span style={{ ...metaStyleBase, ...metaStyle }}>{meta}</span></button>;
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
  const quote = Number(job.price || 0);
  const paid = (job.payments || []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  return Math.max(quote - paid, 0);
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

function priorityScore(job) {
  if (job.overdue) return 1;
  if (job.dueToday) return 2;
  if (job.needsAttention) return 3;
  return 99;
}

function getPriority(job) {
  if (job.overdue) return { label: "Overdue", color: "#B91C1C" };
  if (job.dueToday) return { label: "Due today", color: "#C2410C" };
  return { label: "Needs attention", color: "#A16207" };
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 2 }).format(value);
}

function uniqueById(item, index, list) {
  const key = item.id || `${item.client?.id}-${item.title}-${item.time}`;
  return list.findIndex((candidate) => (candidate.id || `${candidate.client?.id}-${candidate.title}-${candidate.time}`) === key) === index;
}

const panelStyle = { padding: "14px 18px 18px" };
const metricsStyle = { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8, marginBottom: 12 };
const metricStyle = { display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", border: "1px solid #E5E7EB", borderRadius: 8, background: "#FAF9F6" };
const sectionStyle = { minWidth: 0 };
const sectionTitleStyle = { margin: "0 0 7px", color: "#2F3A3F", fontSize: 13, fontWeight: 800 };
const rowsStyle = { display: "grid", gap: 6 };
const emptyStyle = { color: "#8A9094", fontSize: 12 };
const contentGridStyle = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 };
const rowStyle = { display: "flex", alignItems: "center", gap: 9, minHeight: 38, padding: "6px 9px", border: "1px solid #E8EAED", borderRadius: 7, background: "#FAFAFA" };
const rowButtonStyle = { ...rowStyle, width: "100%", textAlign: "left", font: "inherit", cursor: "pointer" };
const timeStyle = { minWidth: 58, color: "#8B1E3F", fontSize: 11, fontWeight: 800 };
const rowContentStyle = { display: "flex", flexDirection: "column", gap: 1, minWidth: 0, flex: 1 };
const metaStyleBase = { color: "#687178", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" };
const arrowStyle = { color: "#8B1E3F", fontWeight: 800 };
const attentionStyle = { marginBottom: 12, border: "1px solid #F0D3D8", borderRadius: 8, overflow: "hidden", background: "#FFF9FA" };
const attentionHeadingStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 10px", color: "#8B1E3F", fontSize: 12, fontWeight: 800 };
const attentionRowStyle = { width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", border: 0, borderTop: "1px solid #F0D3D8", background: "transparent", color: "#3D454A", textAlign: "left", font: "inherit", cursor: "pointer", fontSize: 12 };
