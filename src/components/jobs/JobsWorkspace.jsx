import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import JobsSection from "./JobsSection";
import JobEditor from "./JobEditor";
import Button from "../common/Button";
import { getPayments } from "../../services/paymentsApi";
import {
  parseJobDate,
  PRODUCTION_WORKFLOW,
} from "../../constants/jobWorkflow";

const QUICK_FILTERS = [
  { id: "all", label: "All Jobs" },
  { id: "overdue", label: "Overdue" },
  { id: "today", label: "Due Today" },
  { id: "week", label: "Due This Week" },
  { id: "ready", label: "Ready" },
  { id: "outstanding", label: "Outstanding" },
];

function startOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function getPaymentTotal(payments) {
  return (Array.isArray(payments) ? payments : []).reduce(
    (total, payment) => total + Number(payment?.amount || 0),
    0
  );
}

function getJobBalance(job, paymentTotals) {
  const total = Number(job?.price || 0);
  const paid = paymentTotals[job?.id];

  if (Number.isFinite(paid)) {
    return Math.max(0, total - paid);
  }

  if (Array.isArray(job?.payments)) {
    return Math.max(0, total - getPaymentTotal(job.payments));
  }

  return Math.max(
    0,
    Number(
      job?.outstanding ??
        job?.balance ??
        total - Number(job?.deposit || 0)
    )
  );
}

function isOverdue(job, today) {
  if (job?.overdue) return true;
  if (["Collected", "Cancelled"].includes(job?.status)) return false;

  const dueDate = parseJobDate(job?.dueDate);
  if (!dueDate) return false;

  return startOfDay(dueDate) < today;
}

function isDueToday(job, today) {
  if (["Collected", "Cancelled"].includes(job?.status)) return false;

  const dueDate = parseJobDate(job?.dueDate);
  if (!dueDate) return false;

  return startOfDay(dueDate).getTime() === today.getTime();
}

function isDueThisWeek(job, today) {
  if (["Collected", "Cancelled"].includes(job?.status)) return false;

  const dueDate = parseJobDate(job?.dueDate);
  if (!dueDate) return false;

  const due = startOfDay(dueDate);
  const end = new Date(today);
  end.setDate(end.getDate() + 7);
  end.setHours(23, 59, 59, 999);

  return due >= today && due <= end;
}

function getDueSortValue(job) {
  const date = parseJobDate(job?.dueDate);
  return date ? date.getTime() : Number.POSITIVE_INFINITY;
}

function getWorkflowHours(job, stage) {
  const entry = job?.workflowHours?.[stage] || {};

  return {
    estimated: Math.max(0, Number(entry.estimated) || 0),
    actual: Math.max(0, Number(entry.actual) || 0),
  };
}

function Metric({ label, value, tone = "default", onClick }) {
  const tones = {
    default: { background: "#F8FAFC", border: "#CBD5E1", colour: "#1E293B" },
    danger: { background: "#FEF2F2", border: "#FCA5A5", colour: "#B91C1C" },
    warning: { background: "#FFF7ED", border: "#FDBA74", colour: "#C2410C" },
    info: { background: "#EFF6FF", border: "#93C5FD", colour: "#1D4ED8" },
    success: { background: "#ECFDF5", border: "#86EFAC", colour: "#166534" },
  };

  const style = tones[tone] || tones.default;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: "1 1 150px",
        minWidth: 140,
        padding: "13px 15px",
        border: `1px solid ${style.border}`,
        borderRadius: 11,
        background: style.background,
        textAlign: "left",
        cursor: onClick ? "pointer" : "default",
        fontFamily: "inherit",
        color: "inherit",
        boxSizing: "border-box",
      }}
    >
      <div style={{ color: "#64748B", fontSize: 11, fontWeight: 700 }}>
        {label}
      </div>
      <div
        style={{
          marginTop: 4,
          color: style.colour,
          fontSize: 24,
          fontWeight: 800,
        }}
      >
        {value}
      </div>
    </button>
  );
}

function ProductionWorkload({ jobs, clients, onOpenJob }) {
  const today = startOfDay();
  const clientLookup = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients]
  );

  const productionJobs = useMemo(() => {
    return jobs
      .filter((job) => PRODUCTION_WORKFLOW.includes(job?.status))
      .map((job) => ({
        ...job,
        clientDisplayName:
          job.clientName || clientLookup.get(job.clientId)?.name || "Client unavailable",
      }))
      .sort((a, b) => getDueSortValue(a) - getDueSortValue(b));
  }, [jobs, clientLookup]);

  const workload = useMemo(() => {
    const stages = PRODUCTION_WORKFLOW.map((stage) => {
      const stageJobs = productionJobs.filter((job) => job.status === stage);
      const estimatedHours = stageJobs.reduce(
        (total, job) => total + getWorkflowHours(job, stage).estimated,
        0
      );
      const actualHours = stageJobs.reduce(
        (total, job) => total + getWorkflowHours(job, stage).actual,
        0
      );

      return {
        stage,
        jobs: stageJobs,
        estimatedHours,
        actualHours,
      };
    });

    const dueToday = productionJobs.filter((job) => isDueToday(job, today));
    const overdue = productionJobs.filter((job) => isOverdue(job, today));
    const estimatedHours = stages.reduce(
      (total, stage) => total + stage.estimatedHours,
      0
    );
    const actualHours = stages.reduce(
      (total, stage) => total + stage.actualHours,
      0
    );

    return {
      stages,
      dueToday,
      overdue,
      estimatedHours,
      actualHours,
    };
  }, [productionJobs, today]);

  return (
    <section
      style={{
        border: "1px solid #E5E7EB",
        borderRadius: 16,
        background: "#FFFFFF",
        padding: 18,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 14,
        }}
      >
        <div>
          <div
            style={{
              color: "#8B1E3F",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            Production Workload
          </div>
          <h2
            style={{
              margin: "5px 0 0",
              color: "#2F3A3F",
              fontSize: 22,
            }}
          >
            Work on the floor
          </h2>
          <div style={{ marginTop: 5, color: "#777", fontSize: 13 }}>
            Active production jobs grouped by workflow stage and ordered by due date.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <div style={workloadMetricStyle}>
            <strong>{productionJobs.length}</strong>
            <span>Active</span>
          </div>
          <div style={workloadMetricStyle}>
            <strong>{workload.dueToday.length}</strong>
            <span>Due Today</span>
          </div>
          <div style={{ ...workloadMetricStyle, color: workload.overdue.length ? "#B91C1C" : "#2F3A3F" }}>
            <strong>{workload.overdue.length}</strong>
            <span>Overdue</span>
          </div>
          <div style={workloadMetricStyle}>
            <strong>{workload.estimatedHours.toFixed(1)}h</strong>
            <span>Estimated</span>
          </div>
          <div style={workloadMetricStyle}>
            <strong>{workload.actualHours.toFixed(1)}h</strong>
            <span>Actual</span>
          </div>
        </div>
      </div>

      {productionJobs.length === 0 ? (
        <div style={emptyWorkloadStyle}>
          No active production jobs are currently assigned to a production stage.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 10,
          }}
        >
          {workload.stages.map((stage) => (
            <div
              key={stage.stage}
              style={{
                border: "1px solid #E5E7EB",
                borderRadius: 12,
                background: "#FAF9F6",
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "11px 12px",
                  borderBottom: "1px solid #E5E7EB",
                  background: "#FFFFFF",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <strong style={{ color: "#2F3A3F", fontSize: 13 }}>
                  {stage.stage}
                </strong>
                <span
                  style={{
                    minWidth: 24,
                    padding: "2px 7px",
                    borderRadius: 999,
                    background: stage.jobs.length ? "#8B1E3F" : "#E5E7EB",
                    color: stage.jobs.length ? "#FFFFFF" : "#6B7280",
                    fontSize: 11,
                    fontWeight: 800,
                    textAlign: "center",
                  }}
                >
                  {stage.jobs.length}
                </span>
              </div>

              <div style={{ padding: 10 }}>
                <div style={{ display: "flex", gap: 12, marginBottom: 8, color: "#777", fontSize: 11 }}>
                  <span>Est. {stage.estimatedHours.toFixed(1)}h</span>
                  <span>Actual {stage.actualHours.toFixed(1)}h</span>
                </div>

                {stage.jobs.length === 0 ? (
                  <div style={{ color: "#9CA3AF", fontSize: 12, padding: "8px 2px" }}>
                    No jobs
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 7 }}>
                    {stage.jobs.map((job) => {
                      const hours = getWorkflowHours(job, stage.stage);
                      const overdue = isOverdue(job, today);
                      const dueToday = isDueToday(job, today);
                      const dueDate = parseJobDate(job.dueDate);

                      return (
                        <button
                          key={job.id}
                          type="button"
                          onClick={() => onOpenJob(job)}
                          style={{
                            width: "100%",
                            border: overdue
                              ? "1px solid #FCA5A5"
                              : dueToday
                                ? "1px solid #FDBA74"
                                : "1px solid #E5E7EB",
                            borderRadius: 9,
                            background: "#FFFFFF",
                            padding: 9,
                            textAlign: "left",
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          <div style={{ color: "#8B1E3F", fontSize: 11, fontWeight: 800 }}>
                            {job.reference || "CHR-NEW"}
                          </div>
                          <div style={{ marginTop: 3, color: "#2F3A3F", fontWeight: 700, fontSize: 12 }}>
                            {job.name || job.garmentType || "Untitled Job"}
                          </div>
                          <div style={{ marginTop: 3, color: "#667085", fontSize: 11 }}>
                            {job.clientDisplayName}
                          </div>
                          <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", gap: 8, color: "#777", fontSize: 10 }}>
                            <span>
                              {overdue
                                ? "OVERDUE"
                                : dueToday
                                  ? "DUE TODAY"
                                  : dueDate
                                    ? `Due ${dueDate.toLocaleDateString("en-AU", { day: "numeric", month: "short" })}`
                                    : "No due date"}
                            </span>
                            <span>{hours.estimated.toFixed(1)}h est.</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

const workloadMetricStyle = {
  minWidth: 70,
  padding: "8px 10px",
  border: "1px solid #E5E7EB",
  borderRadius: 9,
  background: "#FAF9F6",
  color: "#2F3A3F",
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const emptyWorkloadStyle = {
  padding: 20,
  border: "1px dashed #D1D5DB",
  borderRadius: 10,
  background: "#FAFAF9",
  color: "#777",
  textAlign: "center",
  fontSize: 13,
};

export default function JobsWorkspace({
  jobs = [],
  clients = [],
  updateJob,
  deleteJob,
  onClose,
  navigation,
}) {
  const editorRef = useRef(null);
  const feedbackTimerRef = useRef(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [quickFilter, setQuickFilter] = useState("all");
  const [sortBy, setSortBy] = useState("due");
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [paymentTotals, setPaymentTotals] = useState({});
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(null);


  useEffect(() => {
    if (!navigation?.token || navigation.page !== "jobs") return;

    const label = String(navigation.label || "").toLowerCase();
    setSearch("");
    setStatusFilter("All");

    if (label === "due today") setQuickFilter("today");
    else if (label === "overdue") setQuickFilter("overdue");
    else setQuickFilter("all");

    setSelectedJobId(null);
  }, [navigation?.token, navigation?.page, navigation?.label]);

  const clientLookup = useMemo(() => {
    return new Map(clients.map((client) => [client.id, client]));
  }, [clients]);

  useEffect(() => {
    let active = true;

    async function loadPaymentTotals() {
      if (!jobs.length) {
        setPaymentTotals({});
        return;
      }

      setIsLoadingPayments(true);

      const entries = await Promise.all(
        jobs.map(async (job) => {
          try {
            const payments = await getPayments(job.id);
            return [job.id, getPaymentTotal(payments)];
          } catch {
            return [job.id, null];
          }
        })
      );

      if (active) {
        setPaymentTotals(Object.fromEntries(entries));
        setIsLoadingPayments(false);
      }
    }

    loadPaymentTotals();

    return () => {
      active = false;
    };
  }, [jobs]);

  const searchableJobs = useMemo(() => {
    return jobs.map((job) => {
      const client = clientLookup.get(job.clientId);

      return {
        ...job,
        searchIndex: [
          job.name,
          job.clientName,
          client?.phone,
          job.reference,
          job.status,
          job.dueDate,
          job.nextAction,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
      };
    });
  }, [jobs, clientLookup]);

  const metrics = useMemo(() => {
    const today = startOfDay();
    const activeJobs = jobs.filter(
      (job) => !["Collected", "Cancelled"].includes(job.status)
    );

    const overdue = activeJobs.filter((job) => isOverdue(job, today));
    const dueToday = activeJobs.filter((job) => isDueToday(job, today));
    const dueWeek = activeJobs.filter((job) => isDueThisWeek(job, today));
    const ready = activeJobs.filter((job) => job.status === "Ready");
    const outstanding = activeJobs.reduce(
      (total, job) => total + getJobBalance(job, paymentTotals),
      0
    );

    return {
      active: activeJobs.length,
      overdue: overdue.length,
      dueToday: dueToday.length,
      dueWeek: dueWeek.length,
      ready: ready.length,
      outstanding,
    };
  }, [jobs, paymentTotals]);

  const filteredJobs = useMemo(() => {
    const term = search.trim().toLowerCase();
    const today = startOfDay();

    const result = searchableJobs.filter((job) => {
      const matchesSearch = term === "" || job.searchIndex.includes(term);
      const matchesStatus = statusFilter === "All" || job.status === statusFilter;

      let matchesQuickFilter = true;

      if (quickFilter === "overdue") matchesQuickFilter = isOverdue(job, today);
      if (quickFilter === "today") matchesQuickFilter = isDueToday(job, today);
      if (quickFilter === "week") matchesQuickFilter = isDueThisWeek(job, today);
      if (quickFilter === "ready") matchesQuickFilter = job.status === "Ready";
      if (quickFilter === "outstanding") {
        matchesQuickFilter = getJobBalance(job, paymentTotals) > 0;
      }

      return matchesSearch && matchesStatus && matchesQuickFilter;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "due") return getDueSortValue(a) - getDueSortValue(b);
      if (sortBy === "client") {
        const aName = (a.clientName || clientLookup.get(a.clientId)?.name || "").toLowerCase();
        const bName = (b.clientName || clientLookup.get(b.clientId)?.name || "").toLowerCase();
        return aName.localeCompare(bName);
      }
      if (sortBy === "status") return String(a.status || "").localeCompare(String(b.status || ""));
      if (sortBy === "outstanding") {
        return getJobBalance(b, paymentTotals) - getJobBalance(a, paymentTotals);
      }
      return 0;
    });
  }, [searchableJobs, search, statusFilter, quickFilter, sortBy, paymentTotals, clientLookup]);

  const selectedJob = filteredJobs.find((job) => job.id === selectedJobId) || null;

  useEffect(() => {
    if (filteredJobs.length === 1) {
      setSelectedJobId(filteredJobs[0].id);
    } else if (selectedJobId && !filteredJobs.some((job) => job.id === selectedJobId)) {
      setSelectedJobId(null);
    }
  }, [filteredJobs, selectedJobId]);

  useEffect(() => {
    if (selectedJob && editorRef.current) {
      editorRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedJob]);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  function showSaveFeedback(type, message) {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setSaveFeedback({ type, message });

    if (type === "success") {
      feedbackTimerRef.current = setTimeout(() => setSaveFeedback(null), 5000);
    }
  }

  async function saveJob(updatedJob) {
    const existing = jobs.find((job) => job.id === updatedJob.id) || updatedJob;
    const timeline = [...(updatedJob.timeline || [])];

    if (existing.status === updatedJob.status) {
      timeline.push({
        id: crypto.randomUUID(),
        type: "note",
        title: "Job Updated",
        description: "Job information updated.",
        date: new Date().toISOString(),
      });
    }

    setIsSaving(true);
    setSaveFeedback(null);

    try {
      await updateJob({
        ...updatedJob,
        timeline,
        updatedAt: new Date().toISOString(),
      });
      showSaveFeedback("success", "Job saved successfully.");
    } catch (error) {
      showSaveFeedback(
        "error",
        error instanceof Error ? error.message : "Unable to save job."
      );
      throw error;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteJob(jobId) {
    setIsSaving(true);
    setSaveFeedback(null);

    try {
      await deleteJob(jobId);
      setSelectedJobId(null);
    } finally {
      setIsSaving(false);
    }
  }

  function selectQuickFilter(filter) {
    setQuickFilter(filter);
    setSelectedJobId(null);
  }

  const saveFeedbackPortal = saveFeedback
    ? createPortal(
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            left: "50%",
            bottom: 88,
            transform: "translateX(-50%)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            width: "min(430px, calc(100vw - 48px))",
            boxSizing: "border-box",
            padding: "12px 18px",
            borderRadius: 12,
            background: saveFeedback.type === "success" ? "#ECFDF5" : "#FEF2F2",
            border: saveFeedback.type === "success" ? "1px solid #86EFAC" : "1px solid #FCA5A5",
            color: saveFeedback.type === "success" ? "#166534" : "#991B1B",
            boxShadow: "0 10px 30px rgba(0,0,0,0.14)",
            fontSize: 15,
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          <span
            style={{
              width: 30,
              height: 30,
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              background: saveFeedback.type === "success" ? "#16A34A" : "#DC2626",
              color: "#FFFFFF",
              fontSize: 18,
              fontWeight: 800,
            }}
          >
            {saveFeedback.type === "success" ? "✓" : "!"}
          </span>
          <span>{saveFeedback.message}</span>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <style>{`
        .jobs-workspace-job-editor [role="status"][aria-live="polite"] {
          display: none !important;
        }
      `}</style>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          padding: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div>
            <h1 style={{ margin: 0 }}>Jobs Workspace</h1>
            <div style={{ color: "#777", marginTop: 6 }}>
              Showing {filteredJobs.length} of {jobs.length} jobs
              {isLoadingPayments ? " · Updating balances…" : ""}
            </div>
          </div>
          <Button onClick={onClose}>Close</Button>
        </div>

        <ProductionWorkload
          jobs={jobs}
          clients={clients}
          onOpenJob={(job) => {
            setSelectedJobId(job.id);
            requestAnimationFrame(() => {
              editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            });
          }}
        />

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <Metric label="Active Jobs" value={metrics.active} onClick={() => selectQuickFilter("all")} />
          <Metric label="Overdue" value={metrics.overdue} tone="danger" onClick={() => selectQuickFilter("overdue")} />
          <Metric label="Due Today" value={metrics.dueToday} tone="warning" onClick={() => selectQuickFilter("today")} />
          <Metric label="Due This Week" value={metrics.dueWeek} tone="info" onClick={() => selectQuickFilter("week")} />
          <Metric label="Ready" value={metrics.ready} tone="success" onClick={() => selectQuickFilter("ready")} />
          <Metric label="Outstanding" value={`$${metrics.outstanding.toFixed(2)}`} tone={metrics.outstanding > 0 ? "warning" : "success"} onClick={() => selectQuickFilter("outstanding")} />
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {QUICK_FILTERS.map((filter) => {
            const active = quickFilter === filter.id;

            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => selectQuickFilter(filter.id)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: active ? "1px solid #8B1E3F" : "1px solid #D1D5DB",
                  background: active ? "#8B1E3F" : "#FFFFFF",
                  color: active ? "#FFFFFF" : "#475569",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <input
            placeholder="Search client, garment, reference, phone..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{
              flex: 1,
              minWidth: 320,
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
            }}
          />

          {search && <Button onClick={() => setSearch("")}>Clear</Button>}

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            style={{ padding: 10, borderRadius: 8 }}
          >
            <option>All</option>
            <option>Quote</option>
            <option>Booked</option>
            <option>Measuring</option>
            <option>Pattern</option>
            <option>Cutting</option>
            <option>Sewing</option>
            <option>Fitting</option>
            <option>Alterations</option>
            <option>Mending</option>
            <option>Ready</option>
            <option>Collected</option>
            <option>Cancelled</option>
          </select>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            aria-label="Sort jobs"
            style={{ padding: 10, borderRadius: 8 }}
          >
            <option value="due">Sort: Due Date</option>
            <option value="client">Sort: Client</option>
            <option value="status">Sort: Workflow Status</option>
            <option value="outstanding">Sort: Outstanding</option>
          </select>
        </div>

        {isSaving && (
          <div style={{ color: "#777", fontSize: 13 }}>Saving job…</div>
        )}

        <JobsSection
          jobs={filteredJobs}
          selectedJobId={selectedJobId}
          onOpenJob={(job) => setSelectedJobId(job.id)}
          onNewJob={() => {}}
        />

        {selectedJob && (
          <div
            ref={editorRef}
            className="jobs-workspace-job-editor"
            style={{
              position: "relative",
              marginTop: 24,
              borderTop: "1px solid #ddd",
              paddingTop: 24,
            }}
          >
            <JobEditor
              job={selectedJob}
              onSave={saveJob}
              onDelete={handleDeleteJob}
              onCancel={() => setSelectedJobId(null)}
            />
          </div>
        )}
      </div>

      {saveFeedbackPortal}
    </>
  );
}
