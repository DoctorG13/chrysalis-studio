export const bizzibuddiDemoData = {
  account: {
    id: "demo",
    name: "Demo User",
    username: "demo",
    email: "demo@bizzibuddi.example",
    business: "Harbour & Thread Studio",
    businessType: "dressmaker",
    plan: "Business",
    workspaceId: "demo-workspace",
    subscriptionStatus: "active",
    demo: true,
  },
  people: [
    { id: "demo-person-1", name: "Sophie Martin", email: "sophie@example.com", phone: "0400 123 456", createdAt: "2026-09-04T09:00:00Z" },
    { id: "demo-person-2", name: "Emily Carter", email: "emily@example.com", phone: "0411 222 333", createdAt: "2026-09-12T10:15:00Z" },
    { id: "demo-person-3", name: "Olivia Brown", email: "olivia@example.com", phone: "0422 333 444", createdAt: "2026-09-18T11:30:00Z" },
    { id: "demo-person-4", name: "Mia Wilson", email: "mia@example.com", phone: "0433 444 555", createdAt: "2026-09-24T13:00:00Z" },
  ],
  jobs: [
    { id: "demo-job-1", personId: "demo-person-1", clientName: "Sophie Martin", title: "Wedding gown", status: "In progress", dueDate: "2026-10-18", price: 2400, productionStage: "In production", productionProgress: 50 },
    { id: "demo-job-2", personId: "demo-person-2", clientName: "Emily Carter", title: "Evening dress", status: "New", dueDate: "2026-10-24", price: 1650, productionStage: "Ready", productionProgress: 75 },
    { id: "demo-job-3", personId: "demo-person-3", clientName: "Olivia Brown", title: "Bridesmaid dress", status: "Waiting", dueDate: "2026-10-31", price: 980, productionStage: "Quality check", productionProgress: 50 },
    { id: "demo-job-4", personId: "demo-person-4", clientName: "Mia Wilson", title: "Alterations", status: "Complete", dueDate: "2026-10-06", price: 280, productionStage: "Complete", productionProgress: 100 },
  ],
  appointments: [
    { id: "demo-appt-1", title: "Wedding gown fitting", date: "2026-10-06", time: "10:00", personId: "demo-person-1", personName: "Sophie Martin", status: "Confirmed" },
    { id: "demo-appt-2", title: "Evening dress consultation", date: "2026-10-07", time: "14:00", personId: "demo-person-2", personName: "Emily Carter", status: "Booked" },
    { id: "demo-appt-3", title: "Final fitting", date: "2026-10-09", time: "11:30", personId: "demo-person-3", personName: "Olivia Brown", status: "Confirmed" },
  ],
  invoices: [
    { id: "demo-invoice-1", number: "INV-DEMO-1001", personId: "demo-person-1", personName: "Sophie Martin", amount: 2400, amountPaid: 1200, balance: 1200, status: "Part Paid", issueDate: "2026-09-20", dueDate: "2026-10-10", description: "Wedding gown" },
    { id: "demo-invoice-2", number: "INV-DEMO-1002", personId: "demo-person-2", personName: "Emily Carter", amount: 1650, amountPaid: 0, balance: 1650, status: "Issued", issueDate: "2026-09-28", dueDate: "2026-10-14", description: "Evening dress" },
    { id: "demo-invoice-3", number: "INV-DEMO-1003", personId: "demo-person-3", personName: "Olivia Brown", amount: 980, amountPaid: 980, balance: 0, status: "Paid", issueDate: "2026-09-10", dueDate: "2026-10-01", description: "Bridesmaid dress" },
  ],
  payments: [
    { id: "demo-payment-1", invoiceId: "demo-invoice-1", amount: 1200, date: "2026-09-20", method: "Bank Transfer", description: "Deposit" },
    { id: "demo-payment-2", invoiceId: "demo-invoice-3", amount: 980, date: "2026-09-25", method: "Card", description: "Paid in full" },
  ],
  production: [
    { id: "demo-production-1", jobId: "demo-job-1", jobTitle: "Wedding gown", stage: "In production", dueDate: "2026-10-18", tasks: [{ label: "Cut fabric", complete: true }, { label: "Construct bodice", complete: true }, { label: "Fit", complete: false }, { label: "Finish", complete: false }] },
    { id: "demo-production-2", jobId: "demo-job-2", jobTitle: "Evening dress", stage: "Ready", dueDate: "2026-10-24", tasks: [{ label: "Pattern", complete: true }, { label: "Cut", complete: true }, { label: "Sew", complete: true }] },
  ],
  automationEvents: [
    { id: "demo-event-1", title: "Payment received", detail: "$1,200 payment recorded on INV-DEMO-1001.", createdAt: "2026-09-20T09:00:00Z" },
    { id: "demo-event-2", title: "Fitting reminder prepared", detail: "Wedding gown fitting scheduled for Sophie Martin.", createdAt: "2026-10-01T09:00:00Z" },
    { id: "demo-event-3", title: "Production deadline approaching", detail: "Wedding gown is due on 18 Oct 2026.", createdAt: "2026-10-03T09:00:00Z" },
  ],
  customFields: [
    ["Bust", "34 in"],
    ["Waist", "27 in"],
    ["Hip", "38 in"],
    ["Height", "168 cm"],
    ["Shoe size", "8"],
  ],
};

export function getDemoSummary(data = bizzibuddiDemoData) {
  return {
    people: data.people.length,
    openJobs: data.jobs.filter((job) => job.status !== "Complete").length,
    appointments: data.appointments.length,
    outstanding: data.invoices.reduce((sum, invoice) => sum + Number(invoice.balance || 0), 0),
    productionActive: data.production.filter((record) => record.stage !== "Complete").length,
  };
}
