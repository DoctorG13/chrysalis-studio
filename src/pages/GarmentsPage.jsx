import { useMemo, useState } from "react";

import JobCard from "../components/jobs/JobCard";
import Button from "../components/common/Button";
import { useChrysalis } from "../context/ChrysalisProvider";
import {
  JOB_WORKFLOW,
  parseJobDate,
  getWorkflowProgress,
} from "../constants/jobWorkflow";

function clientName(client) {
  if (!client) return "";

  if (client.name) {
    return client.name;
  }

  return [
    client.firstName,
    client.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function getOutstanding(job) {
  return Math.max(
    0,
    Number(
      job.balance ??
        job.outstanding ??
        (Number(job.price || 0) -
          Number(job.deposit || 0))
    )
  );
}

function isDueThisWeek(job) {
  const dueDate = parseJobDate(job?.dueDate);

  if (!dueDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + 7);
  endOfWeek.setHours(23, 59, 59, 999);

  return dueDate >= today && dueDate <= endOfWeek;
}

function isOverdue(job) {
  if (job?.overdue) return true;

  const dueDate = parseJobDate(job?.dueDate);

  if (!dueDate) return false;

  if (
    job.status === "Collected" ||
    job.status === "Cancelled"
  ) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  dueDate.setHours(0, 0, 0, 0);

  return dueDate < today;
}

function SummaryCard({
  title,
  value,
  background,
  border,
  colour,
}) {
  return (
    <div
      style={{
        background,
        border: `1px solid ${border}`,
        borderRadius: 14,
        padding: 20,
        boxShadow:
          "0 2px 8px rgba(0,0,0,.05)",
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#64748B",
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 10,
          fontSize: 30,
          fontWeight: 700,
          color: colour,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function WorkflowColumn({
  status,
  jobs,
  onOpenJob,
}) {
  const total = jobs.length;

  return (
    <div
      style={{
        minWidth: 0,
        width: "100%",
        boxSizing: "border-box",
        background: "#F5F7F8",
        border:
          "1px solid #DCE1E4",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          background: "#2F3A3F",
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
          }}
        >
          {status}
        </div>

        <span
          style={{
            minWidth: 24,
            height: 24,
            padding: "0 7px",
            borderRadius: 999,
            background: "#FFFFFF",
            color: "#2F3A3F",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          {total}
        </span>
      </div>

      <div
        style={{
          padding: 10,
          minHeight: 150,
        }}
      >
        {jobs.length === 0 ? (
          <div
            style={{
              padding: "28px 12px",
              textAlign: "center",
              color: "#9AA1A6",
              fontSize: 12,
              fontStyle: "italic",
            }}
          >
            No garments
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {jobs.map((job) => (
              <ProductionJobCard
                key={job.id}
                job={job}
                onOpenJob={onOpenJob}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductionJobCard({
  job,
  onOpenJob,
}) {
  const client =
    job.clientDisplayName ||
    job.clientName ||
    "No client";

  const garment =
    job.name ||
    job.title ||
    "Untitled Garment";

  const progress =
    job.progress ??
    getWorkflowProgress(job.status);

  const dueDate =
    job.dueDate || null;

  const overdue =
    job.overdue ||
    isOverdue(job);

  return (
    <button
      type="button"
      onClick={() => onOpenJob(job)}
      style={{
        width: "100%",
        textAlign: "left",
        padding: 14,
        borderRadius: 10,
        border: overdue
          ? "1px solid #FCA5A5"
          : "1px solid #D9DEE2",
        background: "#FFFFFF",
        cursor: "pointer",
        boxSizing: "border-box",
        fontFamily: "inherit",
        color: "inherit",
        appearance: "none",
        WebkitAppearance: "none",
        boxShadow:
          "0 2px 6px rgba(31,41,51,.05)",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.borderColor =
          "#8B1E3F";

        event.currentTarget.style.boxShadow =
          "0 5px 14px rgba(31,41,51,.10)";

        event.currentTarget.style.transform =
          "translateY(-1px)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.borderColor =
          overdue
            ? "#FCA5A5"
            : "#D9DEE2";

        event.currentTarget.style.boxShadow =
          "0 2px 6px rgba(31,41,51,.05)";

        event.currentTarget.style.transform =
          "translateY(0)";
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <div
          style={{
            minWidth: 0,
            flex: 1,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: "#2F3A3F",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            {client}
          </div>

          <div
            style={{
              marginTop: 4,
              fontSize: 13,
              color: "#687178",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            {garment}
          </div>
        </div>

        <div
          style={{
            flexShrink: 0,
            padding: "4px 7px",
            borderRadius: 6,
            background: "#8B1E3F",
            color: "#FFFFFF",
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 0.5,
          }}
        >
          {job.reference || "NEW"}
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          height: 7,
          background: "#E5E7EB",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.max(
              0,
              Math.min(100, progress)
            )}%`,
            height: "100%",
            background: "#8B1E3F",
            borderRadius: 999,
            transition:
              "width .25s ease",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          gap: 8,
          marginTop: 8,
          fontSize: 11,
          color: "#687178",
        }}
      >
        <span>
          {progress}% complete
        </span>

        {dueDate && (
          <span
            style={{
              color: overdue
                ? "#B91C1C"
                : "#687178",
              fontWeight: overdue
                ? 800
                : 600,
            }}
          >
            {overdue
              ? "OVERDUE"
              : `Due ${dueDate}`}
          </span>
        )}
      </div>
    </button>
  );
}

export default function GarmentsPage({
  clients = [],
  jobs = [],
}) {
  const { openJob } = useChrysalis();

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [
    showProductionBoard,
    setShowProductionBoard,
  ] = useState(true);

  const clientLookup = useMemo(
    () =>
      new Map(
        clients.map((client) => [
          String(client.id),
          client,
        ])
      ),
    [clients]
  );

  const garmentJobs = useMemo(() => {
    return jobs.map((job) => {
      const client =
        clientLookup.get(
          String(job.clientId)
        );

      const name =
        clientName(client);

      return {
        ...job,
        client,
        clientDisplayName:
          name ||
          job.clientName ||
          "No client",
        searchIndex: [
          job.name,
          job.title,
          job.reference,
          job.status,
          job.dueDate,
          job.nextAction,
          name,
          job.clientName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
      };
    });
  }, [jobs, clientLookup]);

  const filteredJobs = useMemo(() => {
    const term =
      search.trim().toLowerCase();

    return garmentJobs.filter(
      (job) => {
        const matchesSearch =
          term === "" ||
          job.searchIndex.includes(
            term
          );

        const matchesStatus =
          statusFilter === "All" ||
          job.status === statusFilter;

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );
  }, [
    garmentJobs,
    search,
    statusFilter,
  ]);

  const inProgressJobs =
    jobs.filter(
      (job) =>
        job.status !== "Collected" &&
        job.status !== "Cancelled"
    );

  const dueThisWeekJobs =
    jobs.filter(isDueThisWeek);

  const overdueJobs =
    jobs.filter(isOverdue);

  const outstanding =
    jobs.reduce(
      (total, job) =>
        total +
        getOutstanding(job),
      0
    );

  const workflowJobs =
    useMemo(() => {
      return JOB_WORKFLOW.reduce(
        (columns, status) => {
          columns[status] =
            filteredJobs.filter(
              (job) =>
                job.status === status
            );

          return columns;
        },
        {}
      );
    }, [filteredJobs]);

  function handleOpenJob(job) {
    if (!job) return;

    const client =
      job.client ||
      clients.find(
        (candidate) =>
          String(candidate.id) ===
          String(job.clientId)
      );

    openJob(
      client || null,
      job.id
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
        paddingBottom: 40,
      }}
    >
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "flex-start",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              color: "#8B1E3F",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 1,
              textTransform:
                "uppercase",
              marginBottom: 6,
            }}
          >
            Garments
          </div>

          <h1
            style={{
              margin: 0,
              color: "#2F3A3F",
              fontSize: 28,
            }}
          >
            Garment Production
          </h1>

          <p
            style={{
              margin:
                "8px 0 0",
              color: "#687178",
              fontSize: 14,
            }}
          >
            Track garments through
            the production workflow.
          </p>
        </div>

        <div
          style={{
            color: "#687178",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Showing{" "}
          {filteredJobs.length}{" "}
          of {jobs.length} garments
        </div>
      </div>

      {/* SUMMARY */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(180px,1fr))",
          gap: 20,
        }}
      >
        <SummaryCard
          title="Total Garments"
          value={jobs.length}
          background="#F8FAFC"
          border="#CBD5E1"
          colour="#1E293B"
        />

        <SummaryCard
          title="In Progress"
          value={
            inProgressJobs.length
          }
          background="#FFF7ED"
          border="#FDBA74"
          colour="#C2410C"
        />

        <SummaryCard
          title="Due This Week"
          value={
            dueThisWeekJobs.length
          }
          background="#EFF6FF"
          border="#93C5FD"
          colour="#1D4ED8"
        />

        <SummaryCard
          title="Overdue"
          value={
            overdueJobs.length
          }
          background="#FEF2F2"
          border="#FCA5A5"
          colour="#B91C1C"
        />

        <SummaryCard
          title="Outstanding"
          value={`$${outstanding.toFixed(
            2
          )}`}
          background="#F0FDF4"
          border="#86EFAC"
          colour="#166534"
        />
      </div>

      {/* SEARCH / FILTER */}

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          placeholder="Search client, garment, reference..."
          style={{
            flex: 1,
            minWidth: 280,
            padding: 12,
            borderRadius: 8,
            border:
              "1px solid #CBD5E1",
            fontSize: 14,
          }}
        />

        {search && (
          <Button
            onClick={() =>
              setSearch("")
            }
          >
            Clear
          </Button>
        )}

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value
            )
          }
          style={{
            padding: 12,
            borderRadius: 8,
            border:
              "1px solid #CBD5E1",
            background: "#FFFFFF",
          }}
        >
          <option value="All">
            All Statuses
          </option>

          {JOB_WORKFLOW.map(
            (status) => (
              <option
                key={status}
                value={status}
              >
                {status}
              </option>
            )
          )}

          <option value="Cancelled">
            Cancelled
          </option>
        </select>

        <Button
          onClick={() =>
            setShowProductionBoard(
              (value) => !value
            )
          }
        >
          {showProductionBoard
            ? "Hide Production Board"
            : "Show Production Board"}
        </Button>
      </div>

      {/* PRODUCTION BOARD */}

      {showProductionBoard && (
        <section>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between",
              gap: 16,
              marginBottom: 14,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  color: "#2F3A3F",
                }}
              >
                Production Board
              </h2>

              <p
                style={{
                  margin:
                    "5px 0 0",
                  color: "#687178",
                  fontSize: 13,
                }}
              >
                Move through the
                workflow at a glance.
              </p>
            </div>

            <div
              style={{
                fontSize: 12,
                color: "#687178",
              }}
            >
              {filteredJobs.length}{" "}
              visible garments
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
              width: "100%",
              alignItems: "start",
            }}
          >
            {JOB_WORKFLOW.map(
              (status) => (
                <WorkflowColumn
                  key={status}
                  status={status}
                  jobs={
                    workflowJobs[
                      status
                    ] || []
                  }
                  onOpenJob={
                    handleOpenJob
                  }
                />
              )
            )}
          </div>
        </section>
      )}

      {/* GARMENT LIST */}

      <section>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: 16,
            marginBottom: 14,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: "#2F3A3F",
              }}
            >
              Garment List
            </h2>

            <p
              style={{
                margin:
                  "5px 0 0",
                color: "#687178",
                fontSize: 13,
              }}
            >
              Detailed garment and
              job information.
            </p>
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <div
            style={{
              border:
                "2px dashed #DDD",
              borderRadius: 12,
              padding: 60,
              textAlign: "center",
            }}
          >
            <h3>
              No garments found
            </h3>

            <p
              style={{
                color: "#777",
              }}
            >
              Try changing your
              search or status filter.
            </p>

            {(search ||
              statusFilter !==
                "All") && (
              <Button
                onClick={() => {
                  setSearch("");
                  setStatusFilter(
                    "All"
                  );
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill,minmax(380px,1fr))",
              gap: 20,
            }}
          >
            {filteredJobs.map(
              (job) => (
                <div
                  key={job.id}
                  style={{
                    position:
                      "relative",
                  }}
                >
                  <div
                    style={{
                      marginBottom: 8,
                      padding:
                        "8px 12px",
                      background:
                        "#F8F8F8",
                      borderRadius:
                        "8px 8px 0 0",
                      border:
                        "1px solid #E1E4E7",
                      borderBottom:
                        "none",
                      fontSize: 13,
                      fontWeight: 700,
                      color:
                        "#2F3A3F",
                    }}
                  >
                    {
                      job.clientDisplayName
                    }
                  </div>

                  <JobCard
                    job={job}
                    onOpen={() =>
                      handleOpenJob(job)
                    }
                  />
                </div>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}