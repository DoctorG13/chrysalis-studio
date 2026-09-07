import { useEffect, useState } from "react";

import JobCard from "./JobCard";
import Button from "../common/Button";
import { getPayments } from "../../services/paymentApi";

function getPaymentTotal(payments) {
  return payments.reduce(
    (total, payment) =>
      total + (Number(payment?.amount) || 0),
    0
  );
}

function getFallbackPaid(job) {
  if (Array.isArray(job?.payments)) {
    return getPaymentTotal(job.payments);
  }

  return Number(job?.deposit || 0);
}

function getFallbackOutstanding(job) {
  return Math.max(
    0,
    Number(job?.price || 0) - getFallbackPaid(job)
  );
}

export default function JobsSection({
  jobs = [],
  selectedJobId = null,
  onNewJob,
  onOpenJob,
}) {
  const [paymentTotals, setPaymentTotals] = useState({});

  useEffect(() => {
    let active = true;

    async function loadPaymentTotals() {
      const entries = await Promise.all(
        jobs
          .filter((job) => job?.id)
          .map(async (job) => {
            try {
              const payments = await getPayments(job.id);

              return [
                job.id,
                getPaymentTotal(payments),
              ];
            } catch (error) {
              console.error(
                "Unable to load job payments for JobsSection.",
                error
              );

              return [
                job.id,
                getFallbackPaid(job),
              ];
            }
          })
      );

      if (!active) return;

      setPaymentTotals(
        Object.fromEntries(entries)
      );
    }

    loadPaymentTotals();

    return () => {
      active = false;
    };
  }, [jobs]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + 7);

  const inProgressJobs = jobs.filter(
    (job) => job.status !== "Completed"
  );

  const overdueJobs = jobs.filter(
    (job) => job.overdue
  );

  const dueThisWeekJobs = jobs.filter((job) => {
    if (!job.dueDate) return false;

    const due = new Date(job.dueDate);

    if (Number.isNaN(due.getTime())) {
      return false;
    }

    due.setHours(0, 0, 0, 0);

    return due >= today && due <= endOfWeek;
  });

  const totalValue = jobs.reduce(
    (total, job) =>
      total + Number(job?.price || 0),
    0
  );

  const totalPaid = jobs.reduce(
    (total, job) => {
      const paid = Object.prototype.hasOwnProperty.call(
        paymentTotals,
        job.id
      )
        ? paymentTotals[job.id]
        : getFallbackPaid(job);

      return total + paid;
    },
    0
  );

  const outstanding = Math.max(
    0,
    totalValue - totalPaid
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              color: "#2F3A3F",
            }}
          >
            Jobs
          </h2>

          <div
            style={{
              color: "#666",
              marginTop: 4,
            }}
          >
            {jobs.length} Total Jobs
          </div>
        </div>

        <Button onClick={onNewJob}>
          + New Job
        </Button>
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
          title="📋 Total Jobs"
          value={jobs.length}
          background="#F8FAFC"
          border="#CBD5E1"
          colour="#1E293B"
        />

        <SummaryCard
          title="🟠 In Progress"
          value={inProgressJobs.length}
          background="#FFF7ED"
          border="#FDBA74"
          colour="#C2410C"
        />

        <SummaryCard
          title="🔵 Due This Week"
          value={dueThisWeekJobs.length}
          background="#EFF6FF"
          border="#93C5FD"
          colour="#1D4ED8"
        />

        <SummaryCard
          title="🔴 Overdue"
          value={overdueJobs.length}
          background="#FEF2F2"
          border="#FCA5A5"
          colour="#B91C1C"
        />

        <SummaryCard
          title="💰 Outstanding"
          value={`$${outstanding.toFixed(2)}`}
          background="#F0FDF4"
          border="#86EFAC"
          colour="#166534"
        />
      </div>

      {jobs.length === 0 ? (
        <div
          style={{
            border: "2px dashed #DDD",
            borderRadius: 12,
            padding: 60,
            textAlign: "center",
          }}
        >
          <h3>No Jobs Yet</h3>

          <p>Create your first job to begin.</p>

          <Button onClick={onNewJob}>
            Create Job
          </Button>
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
          {jobs
            .filter(Boolean)
            .map((job) => (
              <JobCard
                key={job.id}
                job={job}
                selected={selectedJobId === job.id}
                onOpen={onOpenJob}
              />
            ))}
        </div>
      )}
    </div>
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
        boxShadow: "0 2px 8px rgba(0,0,0,.05)",
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
