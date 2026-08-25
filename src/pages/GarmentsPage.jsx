import { useMemo, useState } from "react";

import JobCard from "../components/jobs/JobCard";
import Button from "../components/common/Button";
import { useChrysalis } from "../context/ChrysalisProvider";

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
  if (!job.dueDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + 7);

  const due = new Date(job.dueDate);

  if (Number.isNaN(due.getTime())) {
    return false;
  }

  due.setHours(0, 0, 0, 0);

  return due >= today && due <= endOfWeek;
}

function isOverdue(job) {
  if (job.overdue) return true;

  if (!job.dueDate) return false;

  const due = new Date(job.dueDate);

  if (Number.isNaN(due.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  return (
    due < today &&
    job.status !== "Completed"
  );
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

export default function GarmentsPage({
  clients = [],
  jobs = [],
}) {
  const { openJob } = useChrysalis();

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

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
          job.status ===
            statusFilter;

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
        job.status !==
        "Completed"
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
          value={overdueJobs.length}
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

          <option value="New">
            New
          </option>

          <option value="In Progress">
            In Progress
          </option>

          <option value="Awaiting Fitting">
            Awaiting Fitting
          </option>

          <option value="Ready">
            Ready
          </option>

          <option value="Ready for Collection">
            Ready for Collection
          </option>

          <option value="Completed">
            Completed
          </option>
        </select>
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
                  {job.clientDisplayName}
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
    </div>
  );
}