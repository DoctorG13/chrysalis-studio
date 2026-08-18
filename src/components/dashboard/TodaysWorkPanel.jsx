import Card from "../common/Card";

export default function TodaysWorkPanel({ clients = [], jobs = [], onSelectJob }) {
  const todayKey = toDateKey(new Date());

  const appointments = clients.flatMap((client) =>
    (client.appointments || [])
      .filter((appointment) => toDateKey(appointment.date) === todayKey)
      .map((appointment) => ({
        ...appointment,
        client,
        job: findJobForAppointment(appointment, jobs),
      }))
  );

  const fittings = [
    ...clients.flatMap((client) =>
      (client.fittings || [])
        .filter((fitting) => toDateKey(fitting.date) === todayKey)
        .map((fitting) => ({ ...fitting, client, job: findJobForFitting(fitting, jobs) }))
    ),
    ...jobs.flatMap((job) =>
      (job.fittings || [])
        .filter((fitting) => toDateKey(fitting.date) === todayKey)
        .map((fitting) => ({
          ...fitting,
          job,
          client: clients.find((client) => String(client.id) === String(job.clientId)),
        }))
    ),
  ].filter((fitting, index, list) => {
    const key = fitting.id || `${fitting.client?.id}-${fitting.title}-${fitting.time}`;
    return list.findIndex((item) => (item.id || `${item.client?.id}-${item.title}-${item.time}`) === key) === index;
  });

  const activeJobs = jobs
    .filter((job) => !["Completed", "Cancelled", "Archived"].includes(String(job.status || "").trim()))
    .sort((a, b) => {
      const aDate = toDateValue(a.dueDate);
      const bDate = toDateValue(b.dueDate);
      if (!aDate && !bDate) return 0;
      if (!aDate) return 1;
      if (!bDate) return -1;
      return aDate - bDate;
    })
    .slice(0, 6);

  const outstanding = jobs
    .map((job) => ({ job, amount: getOutstanding(job) }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  const priorities = jobs
    .filter((job) => job.overdue || job.dueToday || job.needsAttention)
    .sort((a, b) => priorityScore(a) - priorityScore(b));

  const totalOutstanding = outstanding.reduce((total, item) => total + item.amount, 0);

  return (
    <Card title="🌅 This Morning's View">
      <div style={summaryGridStyle}>
        <SummaryItem icon="📅" label="Appointments" value={appointments.length} />
        <SummaryItem icon="👗" label="Fittings" value={fittings.length} />
        <SummaryItem icon="💼" label="Active Jobs" value={activeJobs.length} />
        <SummaryItem icon="💰" label="Outstanding" value={formatCurrency(totalOutstanding)} />
      </div>

      <div style={sectionGridStyle}>
        <MorningSection title="📅 Today's Appointments" empty="No appointments today.">
          {appointments
            .sort((a, b) => timeSortValue(a.time) - timeSortValue(b.time))
            .map((appointment, index) => (
              <ScheduleRow
                key={appointment.id || index}
                icon="📅"
                time={appointment.time}
                title={appointment.title || appointment.type || "Appointment"}
                client={getClientName(appointment.client)}
                reference={appointment.job?.reference}
                onClick={appointment.job ? () => onSelectJob?.(appointment.job) : undefined}
              />
            ))}
        </MorningSection>

        <MorningSection title="👗 Today's Fittings" empty="No fittings today.">
          {fittings
            .sort((a, b) => timeSortValue(a.time) - timeSortValue(b.time))
            .map((fitting, index) => (
              <ScheduleRow
                key={fitting.id || index}
                icon="👗"
                time={fitting.time}
                title={fitting.title || "Fitting"}
                client={getClientName(fitting.client)}
                reference={fitting.job?.reference}
                onClick={fitting.job ? () => onSelectJob?.(fitting.job) : undefined}
              />
            ))}
        </MorningSection>

        <MorningSection title="💼 Active Jobs" empty="No active jobs.">
          {activeJobs.map((job) => (
            <ActionRow
              key={job.id}
              icon="💼"
              title={job.reference || job.name || job.title || "Job"}
              subtitle={getClientName(clients.find((client) => String(client.id) === String(job.clientId)))}
              meta={job.status || "Active"}
              onClick={() => onSelectJob?.(job)}
            />
          ))}
        </MorningSection>

        <MorningSection
          title="💰 Outstanding Payments"
          empty="No outstanding payments."
          footer={totalOutstanding > 0 ? `Total outstanding: ${formatCurrency(totalOutstanding)}` : null}
        >
          {outstanding.map(({ job, amount }) => (
            <ActionRow
              key={job.id}
              icon="💰"
              title={job.reference || job.name || job.title || "Job"}
              subtitle={getClientName(clients.find((client) => String(client.id) === String(job.clientId)))}
              meta={formatCurrency(amount)}
              onClick={() => onSelectJob?.(job)}
              metaStyle={{ color: "#8A5A00", fontWeight: 700 }}
            />
          ))}
        </MorningSection>
      </div>

      <AttentionSection priorities={priorities} clients={clients} onSelectJob={onSelectJob} />
    </Card>
  );
}

function AttentionSection({ priorities, clients, onSelectJob }) {
  return (
    <section style={attentionStyle}>
      <div style={attentionHeaderStyle}>
        <h3 style={attentionTitleStyle}>🔔 Needs Your Attention</h3>
        {priorities.length > 0 && <span style={attentionCountStyle}>{priorities.length}</span>}
      </div>

      {priorities.length === 0 ? (
        <div style={attentionEmptyStyle}>🎉 Nothing urgent today.</div>
      ) : (
        <div style={{ display: "grid", gap: 7 }}>
          {priorities.map((job) => {
            const priority = getPriority(job);
            const client = clients.find((candidate) => String(candidate.id) === String(job.clientId));

            return (
              <button key={job.id ?? job.reference ?? job.name} type="button" onClick={() => onSelectJob?.(job)} style={attentionRowStyle}>
                <span style={{ fontSize: 15 }}>{priority.icon}</span>
                <strong style={attentionJobStyle}>{job.reference || job.name || job.title || "Job"}</strong>
                <span style={attentionClientStyle}>{getClientName(client)}</span>
                <span style={attentionActionStyle}>{job.nextAction || priority.label}</span>
                <span style={{ ...attentionOpenStyle, color: priority.color, borderColor: priority.color }}>Open →</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function MorningSection({ title, empty, children, footer }) {
  const hasItems = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <section style={sectionStyle}>
      <h3 style={sectionTitleStyle}>{title}</h3>
      {!hasItems ? <p style={emptyStyle}>{empty}</p> : <div style={{ display: "grid", gap: 7 }}>{children}</div>}
      {footer && <div style={footerStyle}>{footer}</div>}
    </section>
  );
}

function ScheduleRow({ icon, time, title, client, reference, onClick }) {
  const content = (
    <>
      <span style={scheduleTimeStyle}>{formatTime(time)}</span>
      <span style={scheduleIconStyle}>{icon}</span>
      <span style={scheduleContentStyle}>
        <strong>{title}</strong>
        <span>{client}</span>
      </span>
      {reference ? <span style={scheduleReferenceStyle}>{reference}</span> : <span style={scheduleReferenceSpacer} />}
      {onClick ? <span style={scheduleOpenStyle}>Open →</span> : null}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} style={scheduleRowButtonStyle}>
        {content}
      </button>
    );
  }

  return <div style={scheduleRowStyle}>{content}</div>;
}

function ActionRow({ icon, title, subtitle, meta, onClick, metaStyle }) {
  return (
    <button type="button" onClick={onClick} style={actionRowStyle}>
      <span style={iconStyle}>{icon}</span>
      <span style={contentStyle}>
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </span>
      <span style={{ ...actionMetaStyle, ...metaStyle }}>{meta}</span>
    </button>
  );
}

function SummaryItem({ icon, label, value }) {
  return (
    <div style={summaryItemStyle}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <div>
        <strong style={{ display: "block", fontSize: 17 }}>{value}</strong>
        <span style={{ color: "#777", fontSize: 11 }}>{label}</span>
      </div>
    </div>
  );
}

function getClientName(client) {
  if (!client) return "Unknown client";
  if (client.name) return client.name;
  return [client.firstName, client.lastName].filter(Boolean).join(" ") || "Unknown client";
}

function findJobForAppointment(appointment, jobs) {
  if (!appointment.jobId) return null;
  return jobs.find((job) => String(job.id) === String(appointment.jobId)) || null;
}

function findJobForFitting(fitting, jobs) {
  if (!fitting.jobId) return null;
  return jobs.find((job) => String(job.id) === String(fitting.jobId)) || null;
}

function formatTime(value) {
  if (!value) return "—";
  const match = String(value).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return value;
  const hour = Number(match[1]);
  const minute = match[2];
  const suffix = hour >= 12 ? "pm" : "am";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${suffix}`;
}

function timeSortValue(value) {
  if (!value) return 9999;
  const match = String(value).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return 9999;
  return Number(match[1]) * 60 + Number(match[2]);
}

function getOutstanding(job) {
  if (job.balance !== undefined && job.balance !== null) return Math.max(Number(job.balance) || 0, 0);
  if (job.outstanding !== undefined && job.outstanding !== null) return Math.max(Number(job.outstanding) || 0, 0);
  if (Array.isArray(job.invoices) && job.invoices.length > 0) {
    return Math.max(job.invoices.reduce((total, invoice) => total + Number(invoice.balance ?? 0), 0), 0);
  }
  const quote = Number(job.price || 0);
  const paid = (job.payments || []).reduce((total, payment) => total + Number(payment.amount || 0), 0);
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

function priorityScore(job) {
  if (job.overdue) return 1;
  if (job.dueToday) return 2;
  if (job.needsAttention) return 3;
  return 99;
}

function getPriority(job) {
  if (job.overdue) return { label: "Overdue", icon: "🔴", color: "#B91C1C" };
  if (job.dueToday) return { label: "Due today", icon: "🟠", color: "#C2410C" };
  return { label: "Needs attention", icon: "🟡", color: "#A16207" };
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 2 }).format(value);
}

const summaryGridStyle = { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8, marginBottom: 12 };
const summaryItemStyle = { display: "flex", alignItems: "center", gap: 8, padding: "9px 11px", background: "#FAF9F6", border: "1px solid #E5E7EB", borderRadius: 8 };
const sectionGridStyle = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 };
const sectionStyle = { border: "1px solid #E5E7EB", borderRadius: 9, padding: 11, background: "#FFFFFF", minWidth: 0 };
const sectionTitleStyle = { margin: "0 0 7px", fontSize: 14, color: "#2F3A3F" };
const scheduleRowStyle = { display: "grid", gridTemplateColumns: "58px 22px minmax(0, 1fr) auto 1px", alignItems: "center", gap: 7, minHeight: 44, padding: "7px 9px", borderRadius: 7, background: "#FAFAFA" };
const scheduleRowButtonStyle = { ...scheduleRowStyle, width: "100%", border: "1px solid #E5E7EB", textAlign: "left", cursor: "pointer", font: "inherit", background: "#FAFAFA" };
const scheduleTimeStyle = { fontSize: 12, fontWeight: 700, color: "#8A5A00", whiteSpace: "nowrap" };
const scheduleIconStyle = { fontSize: 16, flexShrink: 0 };
const scheduleContentStyle = { minWidth: 0, display: "grid", gap: 1 };
const scheduleReferenceStyle = { color: "#8A1C3A", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" };
const scheduleReferenceSpacer = { width: 1 };
const scheduleOpenStyle = { minHeight: 32, padding: "6px 11px", display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid #8A1C3A", borderRadius: 999, color: "#8A1C3A", background: "#FFFFFF", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" };
const actionRowStyle = { display: "flex", alignItems: "center", gap: 8, width: "100%", minHeight: 42, padding: "8px 9px", border: "1px solid #E5E7EB", borderRadius: 7, textAlign: "left", cursor: "pointer", font: "inherit", background: "#FAFAFA" };
const iconStyle = { flexShrink: 0, fontSize: 16 };
const contentStyle = { minWidth: 0, flex: 1, display: "grid", gap: 1 };
const actionMetaStyle = { whiteSpace: "nowrap", fontSize: 13, color: "#66727A" };
const emptyStyle = { margin: 0, color: "#999", fontStyle: "italic", fontSize: 12 };
const footerStyle = { marginTop: 8, paddingTop: 7, borderTop: "1px solid #E5E7EB", fontWeight: 700, fontSize: 12, color: "#8A5A00" };
const attentionStyle = { marginTop: 12, paddingTop: 12, borderTop: "1px solid #E5E7EB" };
const attentionHeaderStyle = { display: "flex", alignItems: "center", gap: 8, marginBottom: 7 };
const attentionTitleStyle = { margin: 0, fontSize: 14, color: "#2F3A3F" };
const attentionCountStyle = { minWidth: 20, padding: "3px 7px", borderRadius: 999, background: "#F3F4F6", color: "#555", fontSize: 11, fontWeight: 700, textAlign: "center" };
const attentionEmptyStyle = { padding: "7px 0", color: "#777", fontSize: 12 };
const attentionRowStyle = { display: "grid", gridTemplateColumns: "18px minmax(110px, 1.2fr) minmax(100px, 1fr) minmax(110px, 1fr) auto", alignItems: "center", gap: 8, width: "100%", minHeight: 48, padding: "9px 11px", border: "1px solid #E5E7EB", borderRadius: 7, background: "#FAFAFA", textAlign: "left", cursor: "pointer", font: "inherit" };
const attentionJobStyle = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13 };
const attentionClientStyle = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#66727A", fontSize: 12 };
const attentionActionStyle = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#555", fontSize: 12 };
const attentionOpenStyle = { display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 36, padding: "8px 15px", border: "1px solid currentColor", borderRadius: 999, background: "#FFFFFF", whiteSpace: "nowrap", fontSize: 13, fontWeight: 700 };
