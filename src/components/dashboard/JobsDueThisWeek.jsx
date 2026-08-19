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
          <button
            type="button"
            style={viewAllStyle}
            onClick={() => onSelectJob?.(dueJobs[0])}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = "#8B1E3F";
              event.currentTarget.style.color = "#FFFFFF";
              event.currentTarget.style.borderColor = "#8B1E3F";
              event.currentTarget.style.transform = "translateY(-1px)";
              event.currentTarget.style.boxShadow = "0 3px 8px rgba(139,30,63,.14)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = "#FFFFFF";
              event.currentTarget.style.color = "#8B1E3F";
              event.currentTarget.style.borderColor = "#C96A83";
              event.currentTarget.style.transform = "translateY(0)";
              event.currentTarget.style.boxShadow = "0 1px 2px rgba(31,41,51,.035)";
            }}
          >
            View all <span aria-hidden="true">→</span>
          </button>
        )}
      </div>

      {dueJobs.length === 0 ? (
        <div style={emptyStyle}>
          <EmptyState icon="🧵" title="Nothing Due" message="No garments are due this week." />
        </div>
      ) : (
        <div style={listStyle}>
          {dueJobs.map((job, index) => (
            <button
              type="button"
              key={job.id ?? job.reference ?? `${job.name}-${job.dueDate}`}
              style={{ ...rowStyle, borderBottom: index === dueJobs.length - 1 ? 0 : "1px solid #D9DEE2" }}
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
  return date.toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const sectionStyle = { background: "#FFFFFF", border: "1px solid #D9DEE2", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 4px rgba(31,41,51,.025)" };
const headerStyle = { minHeight: 50, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "0 20px", borderBottom: "1px solid #D9DEE2" };
const titleStyle = { margin: 0, color: "#20262B", fontSize: 18, lineHeight: 1.2 };
const viewAllStyle = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, minHeight: 29, padding: "0 10px", border: "1px solid #C96A83", borderRadius: 999, background: "#FFFFFF", color: "#8B1E3F", fontSize: 11, fontWeight: 700, cursor: "pointer", boxShadow: "0 1px 2px rgba(31,41,51,.035)", transition: "background 160ms ease, color 160ms ease, border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease" };
const listStyle = { padding: "0 12px" };
const rowStyle = { width: "100%", display: "grid", gridTemplateColumns: "minmax(155px, 1.2fr) minmax(100px, .8fr) 92px", alignItems: "center", gap: 14, minHeight: 68, padding: "0 4px", border: 0, background: "#FFFFFF", textAlign: "left", cursor: "pointer", transition: "background 140ms ease" };
const referenceStyle = { color: "#20262B", fontSize: 12, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const clientStyle = { color: "#687178", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const dateStyle = { color: "#9A2348", fontSize: 12, fontWeight: 800, textAlign: "right", whiteSpace: "nowrap" };
const emptyStyle = { padding: 14 };
