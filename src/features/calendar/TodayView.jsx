import { useMemo } from "react";

import { JOB_STATUS_COLOURS, parseJobDate } from "../../constants/jobWorkflow";

function parseCalendarDate(value) {
  if (!value) return null;

  if (typeof value === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [day, month, year] = value.split("/").map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
      ? date
      : null;
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [year, month, day] = value.slice(0, 10).split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sameDay(a, b) {
  return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function clientName(client) {
  if (!client) return "";
  if (client.name) return client.name;
  return [client.firstName, client.lastName].filter(Boolean).join(" ");
}

function isFittingAppointment(appointment) {
  const type = String(appointment?.type || appointment?.title || "").toLowerCase();
  return type.includes("fitting");
}

function formatTime(value) {
  if (!value) return "Time not set";
  const text = String(value).trim();
  const match = text.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return text;
  const hours = Number(match[1]);
  const minutes = match[2];
  if (hours < 0 || hours > 23) return text;
  return `${hours % 12 || 12}:${minutes} ${hours >= 12 ? "PM" : "AM"}`;
}

function getOutstanding(job) {
  if (job?.balance !== undefined && job?.balance !== null) return Number(job.balance) || 0;
  if (job?.outstanding !== undefined && job?.outstanding !== null) return Number(job.outstanding) || 0;
  const quote = Number(job?.price || 0);
  const paid = (job?.payments || []).reduce((total, payment) => total + Number(payment.amount || 0), 0);
  return Math.max(quote - paid, 0);
}

function jobTitle(job) {
  return job?.name || job?.title || job?.garmentType || job?.garment || "Job";
}

function jobReference(job) {
  return job?.reference || "No reference";
}

function getJobClient(job, clients) {
  return clients.find((client) => client.id === job?.clientId);
}

function collectFittings(clients, today) {
  const fittings = [];

  clients.forEach((client) => {
    (client.fittings || []).forEach((fitting) => {
      const date = parseCalendarDate(fitting.date);
      if (!date || !sameDay(date, today)) return;

      fittings.push({
        ...fitting,
        client,
        clientName: clientName(client),
      });
    });
  });

  fittings.sort((a, b) => String(a.time || "99:99").localeCompare(String(b.time || "99:99")));
  return fittings;
}

function isActiveJob(job) {
  const status = String(job?.status || "").trim().toLowerCase();
  return !["collected", "cancelled", "completed"].includes(status);
}

function compareActiveJobs(a, b) {
  if (Boolean(a.job.overdue) !== Boolean(b.job.overdue)) {
    return a.job.overdue ? -1 : 1;
  }

  const aDate = parseJobDate(a.job.dueDate)?.getTime() ?? Number.POSITIVE_INFINITY;
  const bDate = parseJobDate(b.job.dueDate)?.getTime() ?? Number.POSITIVE_INFINITY;

  if (aDate !== bDate) return aDate - bDate;

  return String(a.job.reference || a.job.name || a.job.title || "").localeCompare(
    String(b.job.reference || b.job.name || b.job.title || "")
  );
}

export default function TodayView({ clients = [], jobs = [], today = new Date(), onOpenClient, onOpenJob }) {
  const todayData = useMemo(() => {
    const appointments = [];

    clients.forEach((client) => {
      (client.appointments || []).forEach((appointment) => {
        const date = parseCalendarDate(appointment.date);
        if (!date || !sameDay(date, today)) return;
        appointments.push({ ...appointment, client, clientName: clientName(client) });
      });
    });

    appointments.sort((a, b) => String(a.time || "99:99").localeCompare(String(b.time || "99:99")));

    const fittings = collectFittings(clients, today);

    const dueJobs = jobs
      .filter((job) => {
        const dueDate = parseCalendarDate(job.dueDate);
        return dueDate && sameDay(dueDate, today);
      })
      .map((job) => ({ job, client: getJobClient(job, clients) }));

    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const overdueJobs = jobs
      .filter((job) => {
        const dueDate = parseCalendarDate(job.dueDate);
        return dueDate && dueDate < startOfToday;
      })
      .map((job) => ({ job, client: getJobClient(job, clients) }))
      .filter(({ job }) => isActiveJob(job));

    const activeJobs = jobs
      .filter(isActiveJob)
      .map((job) => ({ job, client: getJobClient(job, clients) }))
      .sort(compareActiveJobs);

    return { appointments, fittings, dueJobs, overdueJobs, activeJobs };
  }, [clients, jobs, today]);

  const dateLabel = today.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <section style={{ marginBottom: 24, padding: 20, border: "1px solid #DDDDDD", borderRadius: 12, background: "#FFFFFF" }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ color: "#8B1E3F", fontSize: 12, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase" }}>
          Today View
        </div>
        <h2 style={{ margin: "4px 0 3px", fontSize: 21, color: "#2F3A3F" }}>{dateLabel}</h2>
        <p style={{ margin: 0, color: "#777", fontSize: 13 }}>What needs attention in the studio today.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10, marginBottom: 18 }}>
        <SummaryCard icon="📅" label="Appointments" value={todayData.appointments.length} />
        <SummaryCard icon="👗" label="Fittings" value={todayData.fittings.length} accent={todayData.fittings.length > 0} />
        <SummaryCard icon="💼" label="Active Jobs" value={todayData.activeJobs.length} accent={todayData.activeJobs.length > 0} />
        <SummaryCard icon="⚠️" label="Overdue" value={todayData.overdueJobs.length} warning={todayData.overdueJobs.length > 0} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
        <TodayPanel title="Today's Schedule" icon="📅">
          {todayData.appointments.length === 0 ? (
            <EmptyState text="No appointments scheduled for today." />
          ) : (
            todayData.appointments.map((appointment) => (
              <button key={appointment.id} type="button" onClick={() => onOpenClient?.(appointment.client)} style={itemButtonStyle}>
                <div style={itemIconStyle}>{isFittingAppointment(appointment) ? "👗" : "👤"}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={itemTitleStyle}>{appointment.title || appointment.type || "Appointment"}</div>
                  <div style={itemMetaStyle}>{formatTime(appointment.time)}{appointment.clientName ? ` • ${appointment.clientName}` : ""}</div>
                </div>
                <span style={arrowStyle}>›</span>
              </button>
            ))
          )}
        </TodayPanel>

        <TodayPanel title="Today's Fittings" icon="👗">
          {todayData.fittings.length === 0 ? (
            <EmptyState text="No fittings recorded for today." />
          ) : (
            todayData.fittings.map((fitting) => (
              <button key={fitting.id} type="button" onClick={() => onOpenClient?.(fitting.client)} style={itemButtonStyle}>
                <div style={itemIconStyle}>👗</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={itemTitleStyle}>{fitting.title || "Fitting"}</div>
                  <div style={itemMetaStyle}>{formatTime(fitting.time)}{fitting.clientName ? ` • ${fitting.clientName}` : ""}</div>
                </div>
                <span style={arrowStyle}>›</span>
              </button>
            ))
          )}
        </TodayPanel>

        <TodayPanel title="Production Attention" icon="💼">
          {todayData.dueJobs.length === 0 && todayData.overdueJobs.length === 0 ? (
            <EmptyState text="No jobs due or overdue today." />
          ) : (
            <>
              {todayData.overdueJobs.map(({ job, client }) => (
                <JobItem key={`overdue-${job.id}`} job={job} client={client} overdue onClick={() => client && onOpenJob?.(client, job.id)} />
              ))}
              {todayData.dueJobs.map(({ job, client }) => (
                <JobItem key={`due-${job.id}`} job={job} client={client} onClick={() => client && onOpenJob?.(client, job.id)} />
              ))}
            </>
          )}
        </TodayPanel>

        <TodayPanel title="Today at a Glance" icon="🦋">
          <div style={{ display: "grid", gap: 8 }}>
            <GlanceRow label="Appointments" value={todayData.appointments.length} />
            <GlanceRow label="Fittings" value={todayData.fittings.length} />
            <GlanceRow label="Active jobs" value={todayData.activeJobs.length} />
            <GlanceRow label="Overdue jobs" value={todayData.overdueJobs.length} warning={todayData.overdueJobs.length > 0} />
          </div>
        </TodayPanel>
      </div>

      <div style={{ marginTop: 14 }}>
        <TodayPanel title="Active Jobs" icon="💼">
          {todayData.activeJobs.length === 0 ? (
            <EmptyState text="No active jobs at the moment." />
          ) : (
            <div style={{ display: "grid", gap: 7 }}>
              {todayData.activeJobs.map(({ job, client }) => (
                <ActiveJobItem
                  key={job.id}
                  job={job}
                  client={client}
                  onClick={() => client && onOpenJob?.(client, job.id)}
                />
              ))}
            </div>
          )}
        </TodayPanel>
      </div>
    </section>
  );
}

function SummaryCard({ icon, label, value, accent = false, warning = false }) {
  return (
    <div style={{ padding: 13, border: warning ? "1px solid #E7B5B5" : accent ? "1px solid #E6C9D4" : "1px solid #E8EAED", borderRadius: 9, background: warning ? "#FFF7F7" : accent ? "#FFF9FB" : "#FAFAFA" }}>
      <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 22, lineHeight: 1, fontWeight: 800, color: warning ? "#A62B2B" : "#2F3A3F" }}>{value}</div>
      <div style={{ marginTop: 5, fontSize: 11, fontWeight: 700, color: "#777" }}>{label}</div>
    </div>
  );
}

function TodayPanel({ title, icon, children }) {
  return (
    <div style={{ border: "1px solid #E8EAED", borderRadius: 10, padding: 14, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontWeight: 800, color: "#2F3A3F" }}>
        <span>{icon}</span><span>{title}</span>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ text }) {
  return <div style={{ padding: "14px 10px", color: "#999", fontSize: 13, fontStyle: "italic" }}>{text}</div>;
}

function JobItem({ job, client, overdue = false, onClick }) {
  const outstanding = getOutstanding(job);
  return (
    <button type="button" onClick={onClick} disabled={!client} style={{ ...itemButtonStyle, borderLeft: overdue ? "4px solid #C62828" : "4px solid #8B1E3F", cursor: client ? "pointer" : "default", opacity: client ? 1 : 0.75 }}>
      <div style={itemIconStyle}>💼</div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={itemTitleStyle}>{jobReference(job)}</div>
        <div style={itemMetaStyle}>{clientName(client) || "Client unavailable"}{overdue ? " • OVERDUE" : " • Due today"}</div>
      </div>
      {outstanding > 0 && <span style={{ color: "#8A5A00", fontSize: 12, fontWeight: 800, whiteSpace: "nowrap" }}>${outstanding.toFixed(2)}</span>}
      {client && <span style={arrowStyle}>›</span>}
    </button>
  );
}

function ActiveJobItem({ job, client, onClick }) {
  const outstanding = getOutstanding(job);
  const statusColour = JOB_STATUS_COLOURS[job.status] || "#64748B";
  const dueDate = parseJobDate(job.dueDate);
  const dueLabel = dueDate
    ? dueDate.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
    : "No due date";
  const overdue = Boolean(job.overdue) || (
    dueDate && dueDate < new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
  );

  return (
    <button type="button" onClick={onClick} disabled={!client} style={{ ...activeJobButtonStyle, cursor: client ? "pointer" : "default", opacity: client ? 1 : 0.75 }}>
      <div style={{ ...statusDotStyle, background: statusColour }} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span style={referenceStyle}>{jobReference(job)}</span>
          <span style={jobNameStyle}>{jobTitle(job)}</span>
        </div>
        <div style={activeJobMetaStyle}>
          {clientName(client) || "Client unavailable"} • Due {dueLabel}
          {overdue && <span style={overdueStyle}> • OVERDUE</span>}
        </div>
      </div>
      <span style={{ ...statusStyle, borderColor: statusColour, color: statusColour }}>{job.status || "Active"}</span>
      {outstanding > 0 && <span style={balanceStyle}>${outstanding.toFixed(2)}</span>}
      {client && <span style={arrowStyle}>›</span>}
    </button>
  );
}

function GlanceRow({ label, value, warning = false }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 10px", borderRadius: 7, background: warning ? "#FFF7F7" : "#F8F8F8" }}>
      <span style={{ fontSize: 12, color: "#666" }}>{label}</span>
      <strong style={{ color: warning ? "#A62B2B" : "#2F3A3F" }}>{value}</strong>
    </div>
  );
}

const itemButtonStyle = {
  display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 8px", marginBottom: 6,
  border: "1px solid #ECEEEF", borderRadius: 8, background: "#FFFFFF", textAlign: "left", fontFamily: "inherit",
  color: "inherit", cursor: "pointer", boxSizing: "border-box",
};

const activeJobButtonStyle = {
  display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 10px",
  border: "1px solid #ECEEEF", borderRadius: 8, background: "#FFFFFF", textAlign: "left", fontFamily: "inherit",
  color: "inherit", boxSizing: "border-box", cursor: "pointer",
};

const statusDotStyle = { width: 9, height: 9, borderRadius: "50%", flexShrink: 0 };
const referenceStyle = { fontSize: 13, fontWeight: 800, color: "#2F3A3F", whiteSpace: "nowrap" };
const jobNameStyle = { minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#666", fontSize: 12 };
const activeJobMetaStyle = { marginTop: 4, color: "#777", fontSize: 11 };
const statusStyle = { padding: "4px 8px", border: "1px solid", borderRadius: 999, fontSize: 10, fontWeight: 800, whiteSpace: "nowrap" };
const balanceStyle = { color: "#8A5A00", fontSize: 12, fontWeight: 800, whiteSpace: "nowrap" };
const overdueStyle = { color: "#A62B2B", fontWeight: 800 };
const itemIconStyle = { width: 28, height: 28, display: "grid", placeItems: "center", flexShrink: 0, borderRadius: 7, background: "#F4F5F6", fontSize: 15 };
const itemTitleStyle = { fontSize: 13, fontWeight: 800, color: "#2F3A3F", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const itemMetaStyle = { marginTop: 3, color: "#777", fontSize: 11 };
const arrowStyle = { color: "#999", fontSize: 20, lineHeight: 1, flexShrink: 0 };
