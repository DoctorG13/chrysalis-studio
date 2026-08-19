import EmptyState from "../common/EmptyState";

export default function JobsDueThisWeek({ jobs = [], onSelectJob }) {
  const dueJobs = [...jobs]
    .filter((job) => job.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 7);

  return (
    <section style={sectionStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>Jobs Due This Week</h2>
        {dueJobs.length > 0 && (
          <button type="button" style={viewAllStyle} onClick={() => onSelectJob?.(dueJobs[0])}>
            View all
          </button>
        )}
      </div>

      {dueJobs.length === 0 ? (
        <div style={emptyStyle}>
          <EmptyState icon="🧵" title="Nothing Due" message="No garments are due this week." />
        </div>
      ) : (
        <div style={listStyle}>
          {dueJobs.map((job) => (
            <button
              type="button"
              key={job.id ?? job.reference ?? `${job.name}-${job.dueDate}`}
              style={rowStyle}
              onClick={() => onSelectJob?.(job)}
              onMouseEnter={(event) => {
                event.currentTarget.style.background = "#FFF8FA";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.background = "#FFFFFF";
              }}
            >
              <strong style={referenceStyle}>{job.reference || job.name || job.title || "Job"}</strong>
              <span style={clientStyle}>{job.clientName || job.client || ""}</span>
              <span style={dateStyle}>{formatDate(job.dueDate)}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "—";
  return date.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

const sectionStyle = {
  background: "#FFFFFF",
  border: "1px solid #DEE2E6",
  borderRadius: 10,
  overflow: "hidden",
  boxShadow: "0 2px 8px rgba(31,41,51,.035)",
};

const headerStyle = {
  minHeight: 61,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "0 20px",
  borderBottom: "1px solid #E4E7EA",
};

const titleStyle = {
  margin: 0,
  color: "#20262B",
  fontSize: 19,
  lineHeight: 1.2,
};

const viewAllStyle = {
  border: 0,
  background: "transparent",
  color: "#9A2348",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  padding: 0,
};

const listStyle = { padding: "0 16px" };

const rowStyle = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "minmax(145px, 1fr) minmax(100px, .85fr) 64px",
  alignItems: "center",
  gap: 12,
  minHeight: 54,
  padding: "0 10px",
  border: 0,
  borderBottom: "1px solid #ECEEEF",
  background: "#FFFFFF",
  textAlign: "left",
  cursor: "pointer",
  transition: "background 140ms ease",
};

const referenceStyle = { color: "#20262B", fontSize: 12, whiteSpace: "nowrap" };
const clientStyle = { color: "#707980", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const dateStyle = { color: "#9A2348", fontSize: 12, fontWeight: 700, textAlign: "right", whiteSpace: "nowrap" };
const emptyStyle = { padding: 18 };
