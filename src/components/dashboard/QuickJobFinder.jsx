import { useMemo, useState } from "react";

export default function QuickJobFinder({ jobs = [], clients = [], onSelectJob }) {
  const [query, setQuery] = useState("");

  const clientNames = useMemo(() => {
    const map = new Map();
    clients.forEach((client) => map.set(String(client.id), getClientName(client)));
    return map;
  }, [clients]);

  const recentJobs = useMemo(() => {
    return [...jobs]
      .filter((job) => String(job.status || "").trim() !== "Archived")
      .sort((a, b) => new Date(b.updatedAt || b.dueDate || b.createdAt || 0) - new Date(a.updatedAt || a.dueDate || a.createdAt || 0))
      .slice(0, 5);
  }, [jobs]);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return recentJobs;
    return jobs.filter((job) => {
      const clientName = job.clientName || clientNames.get(String(job.clientId)) || job.client || "";
      return [job.reference, job.name, job.title, clientName].filter(Boolean).some((value) => String(value).toLowerCase().includes(term));
    }).slice(0, 8);
  }, [query, jobs, recentJobs, clientNames]);

  return (
    <section style={finderStyle} aria-label="Find a job">
      <div style={finderHeaderStyle}>
        <div>
          <div style={eyebrowStyle}>Quick Access</div>
          <h2 style={titleStyle}>Find a Job</h2>
        </div>
        <span style={helperStyle}>Reference, client or job name</span>
      </div>

      <div style={searchWrapStyle}>
        <span style={searchIconStyle} aria-hidden="true">🔎</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search CHR reference, client or job..."
          aria-label="Search jobs"
          style={searchInputStyle}
        />
        {query && <button type="button" onClick={() => setQuery("")} style={clearButtonStyle} aria-label="Clear job search">×</button>}
      </div>

      <div style={listHeaderStyle}>
        <span>{query.trim() ? "Search Results" : "Recent Jobs"}</span>
        <span style={countStyle}>{results.length}</span>
      </div>

      {results.length === 0 ? (
        <div style={emptyStyle}>{query.trim() ? "No jobs match your search." : "No jobs available yet."}</div>
      ) : (
        <div style={listStyle}>
          {results.map((job) => (
            <button key={job.id ?? job.reference ?? job.name} type="button" onClick={() => onSelectJob?.(job)} style={jobRowStyle} onMouseEnter={(event) => { event.currentTarget.style.borderColor = "#C96A83"; event.currentTarget.style.background = "#FFF9FB"; }} onMouseLeave={(event) => { event.currentTarget.style.borderColor = "#E5E7EB"; event.currentTarget.style.background = "#FFFFFF"; }}>
              <span style={jobMainStyle}>
                <span style={referenceStyle}>{job.reference || "No reference"}</span>
                <span style={jobNameStyle}>{job.name || job.title || "Unnamed Job"}</span>
                <span style={clientStyle}>{job.clientName || clientNames.get(String(job.clientId)) || job.client || "No client linked"}</span>
              </span>
              <span style={jobMetaStyle}>
                <span style={statusStyle}>{job.status || "—"}</span>
                {job.dueDate && <span>Due {formatDate(job.dueDate)}</span>}
                <span style={arrowStyle}>→</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function getClientName(client) {
  if (!client) return "";
  return client.name || [client.firstName, client.lastName].filter(Boolean).join(" ") || "";
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

const finderStyle = { background: "#FFFFFF", border: "1px solid #D9DEE2", borderRadius: 9, padding: "12px 16px", boxShadow: "0 1px 4px rgba(31,41,51,.025)" };
const finderHeaderStyle = { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 8 };
const eyebrowStyle = { color: "#8B1E3F", fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 };
const titleStyle = { margin: 0, color: "#20262B", fontSize: 17, lineHeight: 1.2 };
const helperStyle = { color: "#687178", fontSize: 10, whiteSpace: "nowrap" };
const searchWrapStyle = { position: "relative", display: "flex", alignItems: "center", marginBottom: 8 };
const searchIconStyle = { position: "absolute", left: 13, fontSize: 15, pointerEvents: "none" };
const searchInputStyle = { width: "100%", boxSizing: "border-box", height: 40, padding: "0 40px 0 38px", border: "1px solid #D9DEE2", borderRadius: 9, background: "#FAFBFC", color: "#20262B", fontSize: 14, outline: "none" };
const clearButtonStyle = { position: "absolute", right: 9, width: 28, height: 28, border: 0, borderRadius: 999, background: "#EEF0F2", color: "#687178", fontSize: 18, lineHeight: 1, cursor: "pointer" };
const listHeaderStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", margin: "7px 0 5px", color: "#687178", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5 };
const countStyle = { minWidth: 20, height: 20, padding: "0 6px", boxSizing: "border-box", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 999, background: "#F8E9EE", color: "#8B1E3F", fontSize: 10 };
const listStyle = { display: "flex", flexDirection: "column", gap: 6 };
const jobRowStyle = { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "7px 10px", boxSizing: "border-box", border: "1px solid #E5E7EB", borderRadius: 8, background: "#FFFFFF", color: "#20262B", textAlign: "left", cursor: "pointer", transition: "border-color 160ms ease, background 160ms ease" };
const jobMainStyle = { display: "flex", alignItems: "baseline", gap: 9, minWidth: 0, flex: 1, flexWrap: "wrap" };
const referenceStyle = { color: "#8B1E3F", fontSize: 11, fontWeight: 800, letterSpacing: 0.3, whiteSpace: "nowrap" };
const jobNameStyle = { fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 260 };
const clientStyle = { color: "#687178", fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 };
const jobMetaStyle = { display: "flex", alignItems: "center", gap: 10, flexShrink: 0, color: "#687178", fontSize: 11 };
const statusStyle = { padding: "4px 7px", borderRadius: 999, background: "#F3F4F5", color: "#4F5960", fontWeight: 700 };
const arrowStyle = { color: "#8B1E3F", fontSize: 16, fontWeight: 700 };
const emptyStyle = { padding: "18px 10px", textAlign: "center", color: "#687178", fontSize: 13, border: "1px dashed #D9DEE2", borderRadius: 8, background: "#FAFBFC" };
