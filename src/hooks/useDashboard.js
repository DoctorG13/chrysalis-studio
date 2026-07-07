import { useMemo } from "react";
import { useChrysalis } from "../context/ChrysalisProvider";

export default function useDashboard() {
  const { clients } = useChrysalis();

  return useMemo(() => {
    const jobs = clients.flatMap(
      (client) => client.jobs || []
    );

    const appointments = clients.flatMap(
      (client) => client.appointments || []
    );

    const payments = clients.flatMap(
      (client) => client.payments || []
    );

    const activeJobs = jobs.filter(
      (job) => job.status !== "Completed"
    );

    const outstandingPayments =
      payments.filter(
        (payment) => !payment.paid
      );

    const totalOutstanding =
      outstandingPayments.reduce(
        (total, payment) =>
          total + Number(payment.amount || 0),
        0
      );

    return {
      clients,

      activeClients: clients.length,

      jobs,

      activeJobs,

      appointments,

      todaysAppointments: appointments,

      payments,

      outstandingPayments,

      totalOutstanding,
    };
  }, [clients]);
}