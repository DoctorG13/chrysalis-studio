import EmptyState from "../common/EmptyState";

export default function JobsDueThisWeek({ jobs = [], onSelectJob }) {
  const dueJobs = [...jobs]
    .filter((job) => job.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 2);

  return (
    <section style={sectionStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>Jobs Due This Week</h2>
        {dueJobs.length > 0 && (
          <button type="button" style={viewAllStyle} onClick={() => onSelectJob?.(dueJobs[0])}>
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
          {dueJobs.map((job, index) => {
            const date = parseDate(job.dueDate);
            const client = job.clientName || job.client || "";
            return (
              <button
                type="button"
                key={job.id ?? job.reference ?? `${job.name}-${job.dueDate}`}
                style={{ ...rowStyle, borderBottom: index === dueJobs.length - 1 ? 0 : "1px solid #E5E8EA" }}
                onClick={() => onSelectJob?.(job)}
                onMouseEnter={(event) => { event.currentTarget.style.background = "#FFF9FB"; }}
                onMouseLeave={(event) => { event.currentTarget.style.background = "#FFFFFF"; }}
              >
                <span style={jobInfoStyle}>
                  <strong style={referenceStyle}>{job.reference || job.name || job.title || "Job"}</strong>
                  <small style={clientStyle}>{[job.name || job.title, client].filter(Boolean).join(" • ")}</small>
                </span>
                <span style={statusStyle}>{job.status || "In progress"}</span>
                <span style={dateBlockStyle}>
                  <strong>{date ? date.getDate() : "—"}</strong>
                  <small>{date ? date.toLocaleDateString("en-AU", { month: "short" }) : ""}</small>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function parseDate(value) {
  if (!value) return null;
  if (typeof value === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [day, month, year] = value.split("/").map(Number);
    return new Date(year, month - 1, day);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const sectionStyle = { background: "#FFFFFF", border: "1px solid #D9DEE2", borderRadius: 9, overflow: "hidden", boxShadow: "0 1px 4px rgba(31,41,51,.025)", minWidth: 0 };
const headerStyle = { minHeight: 50, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "0 16px", borderBottom: "1px solid #D9DEE2" };
const titleStyle = { margin: 0, color: "#20262B", fontSize: 18, lineHeight: 1.2 };
const viewAllStyle = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, minHeight: 29, padding: "0 10px", border: "1px solid #C96A83", borderRadius: 999, background: "#FFFFFF", color: "#8B1E3F", fontSize: 11, fontWeight: 800, cursor: "pointer" };
const listStyle = { padding: "0 12px" };
const rowStyle = { width: "100%", display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto 48px", alignItems: "center", gap: 10, minHeight: 78, padding: "7px 4px", border: 0, background: "#FFFFFF", textAlign: "left", cursor: "pointer", transition: "background 140ms ease", fontFamily: "inherit" };
const jobInfoStyle = { minWidth: 0, display: "flex", flexDirection: "column", gap: 4 };
const referenceStyle = { color: "#8B1E3F", fontSize: 11, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const clientStyle = { color: "#687178", fontSize: 10, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const statusStyle = { padding: "5px 8px", borderRadius: 999, background: "#F3F4F5", color: "#4F5960", fontSize: 10, fontWeight: 800, whiteSpace: "nowrap" };
const dateBlockStyle = { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#8B1E3F", lineHeight: 1 };
const emptyStyle = { padding: 14 };
