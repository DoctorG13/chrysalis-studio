export default function RecentActivity({ clients = [], jobs = [] }) {
  const activities = buildRecentActivity(clients, jobs).slice(0, 3);

  return (
    <section style={sectionStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>Recent Activity</h2>
      </div>

      {activities.length === 0 ? (
        <div style={emptyStyle}>No recent activity</div>
      ) : (
        <div style={listStyle}>
          {activities.map((activity, index) => (
            <ActivityRow
              key={activity.id}
              activity={activity}
              last={index === activities.length - 1}
            />
          ))}
        </div>
      )}

      <div style={footerStyle}>
        View all activity <span aria-hidden="true">→</span>
      </div>
    </section>
  );
}

function buildRecentActivity(clients, jobs) {
  const activities = [];
  const seen = new Set();

  const push = (activity) => {
    if (!activity.timestamp) return;

    const timestamp = new Date(activity.timestamp);
    if (Number.isNaN(timestamp.getTime())) return;

    const id =
      activity.id ||
      `${activity.type}-${activity.timestamp}-${activity.description}`;

    if (seen.has(id)) return;
    seen.add(id);

    activities.push({
      ...activity,
      id,
      timestamp: timestamp.toISOString(),
    });
  };

  for (const client of clients) {
    const clientName = getClientName(client);

    for (const appointment of client.appointments || []) {
      const timestamp =
        appointment.updatedAt ||
        appointment.updated_at ||
        appointment.createdAt ||
        appointment.created_at ||
        appointment.date;

      push({
        id: `appointment-${appointment.id || timestamp}`,
        timestamp,
        icon: "📅",
        type: "appointment",
        title: appointment.type || "Appointment",
        description: clientName,
      });
    }

    for (const fitting of client.fittings || []) {
      const timestamp =
        fitting.updatedAt ||
        fitting.updated_at ||
        fitting.createdAt ||
        fitting.created_at ||
        fitting.date;

      push({
        id: `fitting-${fitting.id || timestamp}`,
        timestamp,
        icon: "✂️",
        type: "fitting",
        title: fitting.title || "Fitting",
        description: clientName,
      });
    }

    for (const payment of client.payments || []) {
      pushPayment(push, payment, null, clientName);
    }

    for (const invoice of client.invoices || []) {
      pushInvoice(push, invoice, null, clientName);
    }
  }

  for (const job of jobs) {
    const client = clients.find(
      (candidate) => String(candidate.id) === String(job.clientId)
    );

    const clientName =
      getClientName(client) || job.clientName || job.client || "";
    const jobName = job.name || job.title || job.reference || "Job";

    for (const event of job.timeline || []) {
      const timestamp =
        event.date ||
        event.timestamp ||
        event.createdAt ||
        event.updatedAt;

      push({
        id: `timeline-${job.id || job.reference}-${event.id || timestamp}-${event.title || event.type || "event"}`,
        timestamp,
        icon: iconForType(event.type || event.title),
        type: event.type || "job",
        title: shortActivityTitle(event.title || event.label || event.name || event.type),
        description: jobName || clientName,
      });
    }

    const timestamp =
      job.modifiedAt ||
      job.updatedAt ||
      job.modified_at ||
      job.createdAt ||
      job.created_at;

    if (timestamp && !(job.timeline || []).length) {
      push({
        id: `job-${job.id || job.reference}-${timestamp}`,
        timestamp,
        icon: "💼",
        type: "job",
        title: shortActivityTitle(job.status ? `Job ${job.status}` : "Job updated"),
        description: jobName || clientName,
      });
    }

    for (const payment of job.payments || []) {
      pushPayment(push, payment, job, clientName);
    }

    for (const invoice of job.invoices || []) {
      pushInvoice(push, invoice, job, clientName);
    }
  }

  return activities.sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );
}

function shortActivityTitle(value = "Activity") {
  const text = String(value).trim();
  if (!text) return "Activity";

  return text
    .replace(/^job\s+/i, "")
    .replace(/\s+appointment$/i, "")
    .replace(/^fitting:\s*/i, "");
}

function pushPayment(push, payment, job, clientName) {
  const timestamp =
    payment.date ||
    payment.paymentDate ||
    payment.paidAt ||
    payment.updatedAt ||
    payment.updated_at ||
    payment.createdAt ||
    payment.created_at;

  if (!timestamp) return;

  const jobName = job?.name || job?.title || job?.reference;

  push({
    id: `payment-${payment.id || timestamp}-${job?.id || clientName}`,
    timestamp,
    icon: "💰",
    type: "payment",
    title: "Payment recorded",
    description: [formatCurrency(payment.amount), clientName || jobName]
      .filter(Boolean)
      .join(" · "),
  });
}

function pushInvoice(push, invoice, job, clientName) {
  const timestamp =
    invoice.updatedAt ||
    invoice.updated_at ||
    invoice.createdAt ||
    invoice.created_at ||
    invoice.issueDate ||
    invoice.issue_date;

  if (!timestamp) return;

  push({
    id: `invoice-${invoice.id || invoice.number || timestamp}-${job?.id || clientName}`,
    timestamp,
    icon: "📄",
    type: "invoice",
    title: "Invoice",
    description: [invoice.number, clientName || job?.name || job?.title]
      .filter(Boolean)
      .join(" · "),
  });
}

function iconForType(type = "") {
  const text = String(type).toLowerCase();

  if (text.includes("payment")) return "💰";
  if (text.includes("invoice")) return "📄";
  if (text.includes("appointment")) return "📅";
  if (text.includes("fitting")) return "✂️";

  return "💼";
}

function ActivityRow({ activity, last }) {
  return (
    <div
      style={{
        ...rowStyle,
        borderBottom: last ? 0 : "1px solid #E5E8EA",
      }}
    >
      <div
        style={{
          ...iconStyle,
          background:
            activityBackgrounds[activity.type] || "#F3F4F5",
        }}
      >
        {activity.icon}
      </div>

      <div style={contentStyle}>
        <strong style={activityTitleStyle}>{activity.title}</strong>
        {activity.description && (
          <span style={activityDescriptionStyle}>
            {activity.description}
          </span>
        )}
      </div>

      <span style={timeStyle}>
        {formatActivityTime(activity.timestamp)}
      </span>
    </div>
  );
}

function getClientName(client) {
  if (!client) return "";

  return (
    client.name ||
    [client.firstName, client.lastName].filter(Boolean).join(" ") ||
    ""
  );
}

function formatActivityTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("en-AU", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const startToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const startDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const daysAgo = Math.floor(
    (startToday - startDate) / 86400000
  );

  if (daysAgo === 1) return "Yesterday";
  if (daysAgo > 1 && daysAgo < 7) {
    return date.toLocaleDateString("en-AU", { weekday: "short" });
  }

  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
  });
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

const sectionStyle = {
  background: "#FFFFFF",
  border: "1px solid #D9DEE2",
  borderRadius: 9,
  overflow: "hidden",
  boxShadow: "0 1px 4px rgba(31,41,51,.025)",
  minWidth: 0,
};

const headerStyle = {
  minHeight: 44,
  display: "flex",
  alignItems: "center",
  padding: "0 14px",
  borderBottom: "1px solid #D9DEE2",
};

const titleStyle = {
  margin: 0,
  color: "#20262B",
  fontSize: 17,
  lineHeight: 1.2,
};

const listStyle = {
  padding: "0 10px",
};

const rowStyle = {
  display: "grid",
  gridTemplateColumns: "28px minmax(0, 1fr) auto",
  alignItems: "center",
  gap: 8,
  minHeight: 48,
  padding: "0 2px",
};

const iconStyle = {
  width: 28,
  height: 28,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 7,
  fontSize: 14,
  flexShrink: 0,
};

const contentStyle = {
  minWidth: 0,
};

const activityTitleStyle = {
  display: "block",
  color: "#20262B",
  fontSize: 11,
  lineHeight: 1.2,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const activityDescriptionStyle = {
  display: "block",
  marginTop: 1,
  color: "#687178",
  fontSize: 9,
  lineHeight: 1.15,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const timeStyle = {
  color: "#687178",
  fontSize: 9,
  whiteSpace: "nowrap",
  textAlign: "right",
};

const footerStyle = {
  minHeight: 32,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 5,
  borderTop: "1px solid #E5E8EA",
  color: "#8B1E3F",
  fontSize: 9,
  fontWeight: 800,
};

const emptyStyle = {
  minHeight: 90,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 14,
  color: "#687178",
  fontSize: 10,
};

const activityBackgrounds = {
  client: "#F3E8EE",
  job: "#EEF2F3",
  payment: "#EAF5EF",
  appointment: "#EAF2F8",
  fitting: "#F0EDF7",
  invoice: "#F0EDF7",
};
