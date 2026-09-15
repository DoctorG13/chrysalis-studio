export function getDashboardData({
    clients = [],
    jobs = [],
    appointments = [],
    payments = [],
}) {
    const today = new Date();

    const isToday = (dateString) => {
        if (!dateString) return false;

        const date = new Date(dateString);

        return (
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate()
        );
    };

    const todaysAppointments = appointments.filter((appointment) =>
        isToday(appointment.date)
    );

    const todaysJobs = jobs.filter((job) =>
        isToday(job.dueDate)
    );

    const outstandingPayments = payments.filter(
        (payment) => !payment.paid
    );

    const totalOutstanding = outstandingPayments.reduce(
        (total, payment) => total + Number(payment.amount || 0),
        0
    );

    return {
        activeClients: clients.length,

        todaysAppointments,

        todaysJobs,

        outstandingPayments,

        totalOutstanding,
    };
}