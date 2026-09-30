import { useMemo } from "react";

function normalise(value) {
  return String(value || "").trim().toLowerCase();
}

function getJobDate(job) {
  return job?.dueDate || job?.completionDate || job?.date || job?.fittingDate || "";
}

function getJobLabel(job) {
  return job?.name || job?.title || job?.garmentType || job?.description || "Untitled job";
}

function getClientName(client) {
  return client?.name || [client?.firstName, client?.lastName].filter(Boolean).join(" ") || "Client";
}

function isClosedJob(job) {
  return ["completed", "cancelled", "archived"].includes(normalise(job?.status));
}

function isOverdue(job) {
  if (job?.overdue === true) return true;
  const value = getJobDate(job);
  if (!value || isClosedJob(job)) return false;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return date < today;
}

function isDueSoon(job) {
  if (isOverdue(job) || isClosedJob(job)) return false;
  const value = getJobDate(job);
  if (!value) return false;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  const days = Math.ceil((date - today) / 86400000);
  return days >= 0 && days <= 7;
}

function getOutstanding(job) {
  const value = Number(job?.balance ?? job?.outstanding ?? job?.balanceDue ?? 0);
  return Number.isFinite(value) ? Math.max(value, 0) : 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);
}

function getNextFocus({ overdueJobs, dueSoonJobs, unpaidJobs, todaysAppointments }) {
  if (overdueJobs.length) {
    return {
      tone: "urgent",
      icon: "!",
      title: overdueJobs.length === 1 ? "One job needs attention" : `${overdueJobs.length} jobs need attention`,
      detail: `${getJobLabel(overdueJobs[0])} is overdue.`,
      action: { page: "jobs", label: "Open jobs" },
    };
  }

  if (unpaidJobs.length) {
    return {
      tone: "finance",
      icon: "$",
      title: "Money is waiting",
      detail: `${formatCurrency(unpaidJobs.reduce((sum, job) => sum + getOutstanding(job), 0))} remains outstanding.`,
      action: { page: "finance", label: "Open finance" },
    };
  }

  if (dueSoonJobs.length) {
    return {
      tone: "warning",
      icon: "→",
      title: `${dueSoonJobs.length} jobs are due within 7 days`,
      detail: `${getClientName(dueSoonJobs[0]?.client)} — ${getJobLabel(dueSoonJobs[0])} is next.`,
      action: { page: "garments", label: "Open garments" },
    };
  }

  if (todaysAppointments.length) {
    return {
      tone: "calendar",
      icon: "◷",
      title: `${todaysAppointments.length} appointment${todaysAppointments.length === 1 ? "" : "s"} today`,
      detail: "Your calendar is the next place to check.",
      action: { page: "calendar", label: "Open calendar" },
    };
  }

  return {
    tone: "calm",
    icon: "✓",
    title: "Nothing urgent is showing",
    detail: "Your current workspace looks clear. You can keep working or ask Buddi about a specific area.",
    action: null,
  };
}

export default function BuddiFocusCard({
  clients = [],
  jobs = [],
  currentPage = "",
  onNavigate,
}) {
  const focus = useMemo(() => {
    const activeJobs = jobs.filter((job) => !isClosedJob(job));
    const overdueJobs = activeJobs.filter(isOverdue);
    const dueSoonJobs = activeJobs.filter(isDueSoon);
    const unpaidJobs = activeJobs.filter((job) => getOutstanding(job) > 0);
    const todayKey = new Date().toDateString();
    const todaysAppointments = clients.flatMap((client) => client?.appointments || []).filter(
      (appointment) => appointment?.date && new Date(appointment.date).toDateString() === todayKey
    );

    const next = getNextFocus({
      overdueJobs,
      dueSoonJobs,
      unpaidJobs,
      todaysAppointments,
    });

    return {
      next,
      counts: {
        overdue: overdueJobs.length,
        dueSoon: dueSoonJobs.length,
        unpaid: unpaidJobs.length,
        appointments: todaysAppointments.length,
      },
    };
  }, [clients, jobs]);

  return (
    <section aria-label="Buddi focus" style={cardStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>BUDDI FOCUS</div>
          <h3 style={titleStyle}>What deserves your attention?</h3>
        </div>
        <span style={pageBadgeStyle}>{currentPage || "Today"}</span>
      </div>

      <div style={focusRowStyle}>
        <span style={{ ...iconStyle, ...toneStyles[focus.next.tone] }} aria-hidden="true">
          {focus.next.icon}
        </span>
        <div style={contentStyle}>
          <strong style={focusTitleStyle}>{focus.next.title}</strong>
          <span style={detailStyle}>{focus.next.detail}</span>
        </div>
        {focus.next.action && onNavigate && (
          <button
            type="button"
            style={buttonStyle}
            onClick={() => onNavigate(focus.next.action.page, focus.next.action.label)}
          >
            {focus.next.action.label} →
          </button>
        )}
      </div>

      <div style={summaryStyle}>
        <SummaryItem label="Overdue" value={focus.counts.overdue} />
        <SummaryItem label="Due this week" value={focus.counts.dueSoon} />
        <SummaryItem label="Unpaid jobs" value={focus.counts.unpaid} />
        <SummaryItem label="Today" value={focus.counts.appointments} />
      </div>
    </section>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div style={summaryItemStyle}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

const cardStyle = {
  marginBottom: 16,
  padding: 16,
  border: "1px solid #D7E4EE",
  borderRadius: 16,
  background: "linear-gradient(145deg, #FFFFFF 0%, #F5FAFD 100%)",
  boxShadow: "0 5px 18px rgba(65,45,52,.05)",
};

const headerStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 14,
};

const eyebrowStyle = {
  color: "#2563EB",
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: ".12em",
};

const titleStyle = {
  margin: "4px 0 0",
  color: "#0F2D4A",
  fontSize: 16,
  lineHeight: 1.25,
};

const pageBadgeStyle = {
  flexShrink: 0,
  padding: "5px 8px",
  borderRadius: 999,
  background: "#E8F4FB",
  color: "#2563EB",
  fontSize: 10,
  fontWeight: 800,
  textTransform: "capitalize",
};

const focusRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  minWidth: 0,
};

const iconStyle = {
  width: 34,
  height: 34,
  flex: "0 0 auto",
  display: "grid",
  placeItems: "center",
  borderRadius: 11,
  fontSize: 16,
  fontWeight: 900,
};

const toneStyles = {
  urgent: { background: "#FFF0F3", color: "#A12745" },
  finance: { background: "#EEF7F1", color: "#26734D" },
  warning: { background: "#FFF8E8", color: "#996C00" },
  calendar: { background: "#EEF4FF", color: "#315EAA" },
  calm: { background: "#EEF7F1", color: "#26734D" },
};

const contentStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 3,
  minWidth: 0,
  flex: 1,
};

const focusTitleStyle = {
  color: "#0F2D4A",
  fontSize: 12,
  lineHeight: 1.35,
};

const detailStyle = {
  color: "#64748B",
  fontSize: 11,
  lineHeight: 1.4,
};

const buttonStyle = {
  flexShrink: 0,
  border: "1px solid #2563EB",
  borderRadius: 999,
  padding: "7px 10px",
  background: "#2563EB",
  color: "#FFFFFF",
  fontSize: 10,
  fontWeight: 800,
  cursor: "pointer",
};

const summaryStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 6,
  marginTop: 14,
  paddingTop: 12,
  borderTop: "1px solid #D7E4EE",
};

const summaryItemStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  minWidth: 0,
};

