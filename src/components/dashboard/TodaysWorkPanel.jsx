import Card from "../common/Card";

export default function TodaysWorkPanel({
  clients = [],
  jobs = [],
  onSelectJob,
}) {
  const today = new Date();
  const todayKey = toDateKey(today);

  const appointments = clients.flatMap((client) =>
    (client.appointments || [])
      .filter((appointment) => toDateKey(appointment.date) === todayKey)
      .map((appointment) => ({
        ...appointment,
        client,
        type: "appointment",
      }))
  );

  const fittings = [
    ...clients.flatMap((client) =>
      (client.fittings || [])
        .filter((fitting) => toDateKey(fitting.date) === todayKey)
        .map((fitting) => ({ ...fitting, client, type: "fitting" }))
    ),
    ...jobs.flatMap((job) =>
      (job.fittings || [])
        .filter((fitting) => toDateKey(fitting.date) === todayKey)
        .map((fitting) => ({
          ...fitting,
          client: clients.find((candidate) => String(candidate.id) === String(job.clientId)),
          job,
          type: "fitting",
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

  const priorities = [...jobs]
    .filter((job) => job.overdue || job.dueToday || job.needsAttention)
    .sort((a, b) => priorityScore(a) - priorityScore(b));

  const totalOutstanding = outstanding.reduce((total, item) => total + item.amount, 0);
  const totalActive = activeJobs.length;

  return (
    <Card title="🌅 This Morning's View">
      <div style={summaryGridStyle}>
        <SummaryItem icon="📅" label="Appointments" value={appointments.length} />
        <SummaryItem icon="👗" label="Fittings" value={fittings.length} />
        <SummaryItem icon="💼" label="Active Jobs" value={totalActive} />
        <SummaryItem icon="💰" label="Outstanding" value={formatCurrency(totalOutstanding)} />
      </div>

      <div style={sectionGridStyle}>
        <MorningSection
          title="📅 Today's Appointments"
          empty="No appointments today."
        >
          {appointments.map((appointment, index) => (
            <div key={appointment.id || index} style={itemStyle}>
              <div style={iconStyle}>📅</div>
              <div style={contentStyle}>
                <strong>{appointment.title || appointment.type || "Appointment"}</strong>
                <span>{getClientName(appointment.client)}</span>
                {appointment.time && <span>{appointment.time}</span>}
              </div>
            </div>
          ))}
        </MorningSection>

        <MorningSection
          title="👗 Today's Fittings"
          empty="No fittings today."
        >
          {fittings.map((fitting, index) => (
            <div key={fitting.id || index} style={itemStyle}>
              <div style={iconStyle}>👗</div>
              <div style={contentStyle}>
                <strong>{fitting.title || "Fitting"}</strong>
                <span>{getClientName(fitting.client)}</span>
                {fitting.time && <span>{fitting.time}</span>}
                {fitting.status && <small>{fitting.status}</small>}
              </div>
            </div>
          ))}
        </MorningSection>

        <MorningSection
          title="💼 Active Jobs"
          empty="No active jobs."
        >
          {activeJobs.map((job) => (
            <button
              key={job.id}
              type="button"
              onClick={() => onSelectJob?.(job)}
              style={buttonItemStyle}
            >
              <div style={iconStyle}>💼</div>
              <div style={contentStyle}>
                <strong>{job.reference || job.name || job.title || "Job"}</strong>
                <span>{job.name || job.garmentType || "Active job"}</span>
                <span>{getClientName(clients.find((client) => String(client.id) === String(job.clientId)))}</span>
              </div>
              <StatusBadge value={job.status || "Active"} />
            </button>
          ))}
        </MorningSection>

        <MorningSection
          title="💰 Outstanding Payments"
          empty="No outstanding payments."
          footer={
            totalOutstanding > 0
              ? `Total outstanding: ${formatCurrency(totalOutstanding)}`
              : null
          }
        >
          {outstanding.map(({ job, amount }) => (
            <button
              key={job.id}
              type="button"
              onClick={() => onSelectJob?.(job)}
              style={buttonItemStyle}
            >
              <div style={iconStyle}>💰</div>
              <div style={contentStyle}>
                <strong>{job.reference || job.name || job.title || "Job"}</strong>
                <span>{getClientName(clients.find((client) => String(client.id) === String(job.clientId)))}</span>
              </div>
              <strong style={{ color: "#8A5A00", whiteSpace: "nowrap" }}>
                {formatCurrency(amount)}
              </strong>
            </button>
          ))}
        </MorningSection>
      </div>

      <div style={priorityBlockStyle}>
        <div style={priorityHeaderStyle}>
          <div>
            <h3 style={priorityTitleStyle}>🎯 What Needs Attention</h3>
            <p style={prioritySubtitleStyle}>
              The jobs that should get Donna's attention first today.
            </p>
          </div>
          <div style={priorityCountStyle}>
            {priorities.length}
          </div>
        </div>

        {priorities.length === 0 ? (
          <div style={priorityEmptyStyle}>
            🎉 You're all caught up — no urgent job priorities today.
          </div>
        ) : (
          <div style={priorityListStyle}>
            {priorities.map((job) => (
              <PriorityRow
                key={job.id ?? job.reference ?? job.name}
                job={job}
                clients={clients}
                onSelectJob={onSelectJob}
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function MorningSection({ title, empty, children, footer }) {
  const hasItems = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <section style={sectionStyle}>
      <h3 style={sectionTitleStyle}>{title}</h3>
      {!hasItems ? (
        <p style={emptyStyle}>{empty}</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>{children}</div>
      )}
      {footer && <div style={footerStyle}>{footer}</div>}
    </section>
  );
}

function PriorityRow({ job, clients, onSelectJob }) {
  const priority = getPriority(job);
  const client = clients.find(
    (candidate) => String(candidate.id) === String(job.clientId)
  );

  return (
    <button
      type="button"
      onClick={() => onSelectJob?.(job)}
      style={{
        ...priorityRowStyle,
        borderLeft: `5px solid ${priority.border}`,
        background: priority.background,
      }}
    >
      <div style={priorityIconStyle}>{priority.icon}</div>
      <div style={contentStyle}>
        <strong>{job.reference || job.name || job.title || "Job"}</strong>
        <span>{getClientName(client)}</span>
        <span>{job.status || "Active"}</span>
        {job.nextAction && <small>Next: {job.nextAction}</small>}
        {job.dueDate && <small>Due: {job.dueDate}</small>}
      </div>
      <span style={{ ...priorityBadgeStyle, color: priority.color }}>
        {priority.label}
      </span>
    </button>
  );
}

function SummaryItem({ icon, label, value }) {
  return (
    <div style={summaryItemStyle}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <div>
        <strong style={{ display: "block", fontSize: 18 }}>{value}</strong>
        <span style={{ color: "#777", fontSize: 12 }}>{label}</span>
      </div>
    </div>
  );
}

function StatusBadge({ value }) {
  return (
    <span
      style={{
        alignSelf: "flex-start",
        padding: "4px 8px",
        borderRadius: 999,
        background: "#F1F4F6",
        color: "#42515A",
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {value}
    </span>
  );
}

function getClientName(client) {
  if (!client) return "Unknown client";
  if (client.name) return client.name;
  return [client.firstName, client.lastName].filter(Boolean).join(" ") || "Unknown client";
}

function getOutstanding(job) {
  if (job.balance !== undefined && job.balance !== null) {
    return Math.max(Number(job.balance) || 0, 0);
  }

  if (job.outstanding !== undefined && job.outstanding !== null) {
    return Math.max(Number(job.outstanding) || 0, 0);
  }

  if (Array.isArray(job.invoices) && job.invoices.length > 0) {
    return Math.max(
      job.invoices.reduce(
        (total, invoice) => total + Number(invoice.balance ?? 0),
        0
      ),
      0
    );
  }

  const quote = Number(job.price || 0);
  const paid = (job.payments || []).reduce(
    (total, payment) => total + Number(payment.amount || 0),
    0
  );

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
  if (job.overdue) {
    return {
      label: "Overdue",
      icon: "🔴",
      border: "#DC2626",
      background: "#FEF2F2",
      color: "#B91C1C",
    };
  }

  if (job.dueToday) {
    return {
      label: "Due Today",
      icon: "🟠",
      border: "#EA580C",
      background: "#FFF7ED",
      color: "#C2410C",
    };
  }

  return {
    label: "Needs Attention",
    icon: "🟡",
    border: "#CA8A04",
    background: "#FEFCE8",
    color: "#A16207",
  };
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
  }).format(value);
}

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 10,
  marginBottom: 18,
};

const summaryItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "11px 12px",
  background: "#FAF9F6",
  border: "1px solid #E5E7EB",
  borderRadius: 9,
};

const sectionGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 14,
};

const sectionStyle = {
  border: "1px solid #E5E7EB",
  borderRadius: 10,
  padding: 14,
  background: "#FFFFFF",
  minWidth: 0,
};

const sectionTitleStyle = {
  margin: "0 0 10px",
  fontSize: 15,
  color: "#2F3A3F",
};

const itemStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  padding: "9px 10px",
  borderRadius: 8,
  background: "#FAFAFA",
};

const buttonItemStyle = {
  ...itemStyle,
  width: "100%",
  border: "1px solid transparent",
  textAlign: "left",
  cursor: "pointer",
  font: "inherit",
};

const iconStyle = {
  flexShrink: 0,
  fontSize: 18,
};

const contentStyle = {
  minWidth: 0,
  flex: 1,
  display: "grid",
  gap: 2,
};

const emptyStyle = {
  margin: 0,
  color: "#999",
  fontStyle: "italic",
  fontSize: 13,
};

const footerStyle = {
  marginTop: 10,
  paddingTop: 9,
  borderTop: "1px solid #E5E7EB",
  fontWeight: 700,
  fontSize: 13,
  color: "#8A5A00",
};

const priorityBlockStyle = {
  marginTop: 18,
  paddingTop: 18,
  borderTop: "1px solid #E5E7EB",
};

const priorityHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 12,
};

const priorityTitleStyle = {
  margin: 0,
  fontSize: 16,
  color: "#2F3A3F",
};

const prioritySubtitleStyle = {
  margin: "4px 0 0",
  color: "#777",
  fontSize: 12,
};

const priorityCountStyle = {
  minWidth: 30,
  height: 30,
  padding: "0 9px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 999,
  background: "#F1F4F6",
  color: "#42515A",
  fontSize: 13,
  fontWeight: 800,
};

const priorityListStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: 10,
};

const priorityRowStyle = {
  width: "100%",
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  padding: "11px 12px",
  borderTop: "none",
  borderRight: "none",
  borderBottom: "none",
  borderRadius: 8,
  textAlign: "left",
  cursor: "pointer",
  font: "inherit",
};

const priorityIconStyle = {
  flexShrink: 0,
  fontSize: 17,
};

const priorityBadgeStyle = {
  alignSelf: "flex-start",
  padding: "4px 8px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.7)",
  fontSize: 10,
  fontWeight: 800,
  whiteSpace: "nowrap",
};

const priorityEmptyStyle = {
  padding: "12px 14px",
  borderRadius: 9,
  background: "#F0FDF4",
  color: "#166534",
  fontSize: 13,
  fontWeight: 600,
};
