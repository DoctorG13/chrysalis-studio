import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assertContains(source, marker, description) {
  if (!source.includes(marker)) {
    throw new Error(`Missing workflow contract: ${description}`);
  }
}

const auth = read("server/bizzibuddi-auth.js");
const page = read("src/pages/BizzibuddiAccountPage.jsx");

const routeContracts = [
  ["GET", "/api/bizzibuddi/auth/health"],
  ["POST", "/api/bizzibuddi/auth/register"],
  ["POST", "/api/bizzibuddi/auth/login"],
  ["GET", "/api/bizzibuddi/auth/reports"],
  ["GET", "/api/bizzibuddi/auth/production"],
  ["POST", "/api/bizzibuddi/auth/production"],
  ["PUT", "url.pathname.startsWith(\"/api/bizzibuddi/auth/production/\")"],
  ["DELETE", "url.pathname.startsWith(\"/api/bizzibuddi/auth/production/\")"],
  ["GET", "/api/bizzibuddi/auth/automation"],
  ["POST", "/api/bizzibuddi/auth/automation/events"],
  ["POST", "/api/bizzibuddi/auth/automation/checks"],
  ["DELETE", "/api/bizzibuddi/auth/automation/reset"],
  ["GET", "/api/bizzibuddi/auth/invoices"],
  ["POST", "/api/bizzibuddi/auth/invoices"],
  ["GET", 'url.pathname.endsWith("/payments")'],
  ["POST", 'url.pathname.endsWith("/payments")'],
  ["PUT", 'url.pathname.startsWith("/api/bizzibuddi/auth/payments/")'],
  ["DELETE", 'url.pathname.startsWith("/api/bizzibuddi/auth/payments/")'],
  ["PUT", 'url.pathname.includes("/payments/")'],
  ["GET", "/api/bizzibuddi/auth/calendar"],
  ["POST", "/api/bizzibuddi/auth/calendar"],
  ["PUT", "url.pathname.startsWith(\"/api/bizzibuddi/auth/calendar/\")"],
  ["DELETE", "url.pathname.startsWith(\"/api/bizzibuddi/auth/calendar/\")"],
  ["GET", "/api/bizzibuddi/auth/jobs"],
  ["POST", "/api/bizzibuddi/auth/jobs"],
  ["GET", "url.pathname.startsWith(\"/api/bizzibuddi/auth/jobs/\")"],
  ["PUT", "url.pathname.startsWith(\"/api/bizzibuddi/auth/jobs/\")"],
  ["DELETE", "url.pathname.startsWith(\"/api/bizzibuddi/auth/jobs/\")"],
  ["GET", "/api/bizzibuddi/auth/people"],
  ["POST", "/api/bizzibuddi/auth/people"],
  ["PUT", "url.pathname.startsWith(\"/api/bizzibuddi/auth/people/\")"],
  ["DELETE", "url.pathname.startsWith(\"/api/bizzibuddi/auth/people/\")"],
  ["GET", "people/[^/]+/measurements"],
  ["POST", "people/[^/]+/measurements"],
  ["GET", "/api/bizzibuddi/auth/me"],
  ["PUT", "/api/bizzibuddi/auth/account"],
  ["POST", "/api/bizzibuddi/auth/logout"],
];

for (const [method, marker] of routeContracts) {
  assertContains(auth, `request.method === "${method}"`, `${method} route handling`);
  assertContains(auth, marker, `${method} ${marker}`);
}

[
  ["Dashboard", 'setView("dashboard")'],
  ["People", 'setView("people")'],
  ["Jobs", 'setView("jobs")'],
  ["Calendar", 'setView("calendar")'],
  ["Finance", 'setView("finance")'],
  ["Automation", 'setView("automation")'],
  ["Production", 'setView("production")'],
  ["Reports", 'setView("reports")'],
  ["Buddi", 'setView("buddi")'],
  ["persistent account loading", "/api/bizzibuddi/auth/reports"],
  ["production persistence", "/api/bizzibuddi/auth/production"],
  ["job timeline", "/api/bizzibuddi/auth/jobs/"],
  ["measurement history", "/api/bizzibuddi/auth/people/"],
].forEach(([name, marker]) => assertContains(page, marker, name));

assertContains(page, "Promise.allSettled", "concurrent legacy production migration");
assertContains(page, "aria-live=\"polite\"", "accessible status messaging");
assertContains(page, "bizzibuddi-table-scroll", "responsive reporting table");
assertContains(page, "bizzibuddi-skip-link", "keyboard skip navigation");
assertContains(page, "<>
      {account && shortcutHelpOpen && (", "account page fragment wrapper");
assertContains(page, "</main>
    </>", "account page fragment closure");
assertContains(page, "const filteredPeople = normalizedQuery", "people search filtering");
assertContains(page, "{filteredPeople.map((person) => {", "filtered people render");
if (page.includes("{(() => {")) throw new Error("Legacy People filter IIFE must not return.");
assertContains(page, "days <= 7;", "Today View production due-soon seven-day window");
assertContains(read("src/components/common/DonnaAssistant.jsx"), "BuddiFocusCard", "Buddi Focus assistant integration");
assertContains(read("src/components/common/BuddiFocusCard.jsx"), "BUDDI FOCUS", "Buddi Focus card");
assertContains(read("src/components/common/BuddiFocusCard.jsx"), "What deserves your attention?", "Buddi Focus heading");
assertContains(read("src/components/common/DonnaAssistant.jsx"), "createJob", "Buddi job creation persistence");
assertContains(read("src/components/common/DonnaAssistant.jsx"), "Create a job", "Buddi job creation form");
assertContains(read("src/components/common/DonnaAssistant.jsx"), "Create a job", "Buddi job creation quick action");
assertContains(read("src/components/common/DonnaAssistant.jsx"), "parseJobRequest", "Buddi natural-language job parsing");
assertContains(read("src/components/common/DonnaAssistant.jsx"), "isJobRequest", "Buddi job command routing");
assertContains(read("src/components/common/DonnaAssistant.jsx"), "prefilledJob", "Buddi job review prefill");
assertContains(read("src/components/common/DonnaAssistant.jsx"), "Nothing is saved until you confirm.", "Buddi job confirmation guard");

assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "parseNaturalJobRequest", "account Buddi natural-language job parsing");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "requestedPersonName", "account Buddi requested-person parsing");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "Create new client", "account Buddi unmatched-client creation option");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "onAddPerson", "account Buddi new-client persistence integration");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "could not match", "account Buddi unresolved-person save guard");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "isJobRequest", "account Buddi job command routing");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "confirmCreateJob", "account Buddi job confirmation");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "Nothing changes until you confirm.", "account Buddi confirmation guard");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "onAddJob", "account Buddi Jobs API integration");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "parseNaturalDate", "account Buddi natural-language due dates");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "parseNaturalPrice", "account Buddi natural-language pricing");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "Due date", "account Buddi due-date review field");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "Price (AUD)", "account Buddi price review field");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "dueDate: jobDraft.dueDate", "account Buddi due-date persistence payload");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "price: Number(jobDraft.price)", "account Buddi price persistence payload");
assertContains(read("server/index.js"), "bizzibuddi-job-dates-and-pricing", "BizziBuddi job date/price migration");
assertContains(read("server/bizzibuddi-auth.js"), "due_date", "BizziBuddi job due-date persistence");
assertContains(read("server/bizzibuddi-auth.js"), "price", "BizziBuddi job price persistence");
assertContains(read("server/bizzibuddi-auth.js"), "UPDATE bizzibuddi_production", "BizziBuddi job due-date production sync");

assertContains(read("src/pages/BizzibuddiAccountPage.jsx"), "onAddJob={async (job)", "account Buddi job persistence callback");
assertContains(read("server/bizzibuddi-auth.js"), "function getInvoicePayments", "persistent invoice payment history query");
assertContains(read("server/bizzibuddi-auth.js"), "payments: getInvoicePayments(userId, invoice.id)", "invoice list includes persistent payment history");
assertContains(read("src/pages/BizzibuddiAccountPage.jsx"), "Array.isArray(invoice.payments)", "Finance consumes persisted invoice payments");
assertContains(read("server/bizzibuddi-auth.js"), "function toInvoicePayment", "invoice payment response mapping");
assertContains(read("src/pages/BizzibuddiAccountPage.jsx"), "PAYMENT HISTORY", "finance payment history rendering");
assertContains(read("src/pages/BizzibuddiAccountPage.jsx"), "paymentsByInvoice", "finance payment history state");


assertContains(read("server/bizzibuddi-auth.js"), "function updateInvoicePayment", "persistent payment correction workflow");
assertContains(read("src/pages/BizzibuddiAccountPage.jsx"), "PAYMENT ACTIVITY", "Finance payment activity UI");
assertContains(read("server/bizzibuddi-auth.js"), "finance-payment-removed", "payment removed audit event");
assertContains(read("server/bizzibuddi-auth.js"), "finance-payment-updated", "payment updated audit event");
assertContains(read("server/bizzibuddi-auth.js"), "finance-payment-recorded", "payment recorded audit event");
assertContains(read("server/bizzibuddi-auth.js"), "function getInvoicePaymentActivity", "persistent finance payment activity");
assertContains(read("server/bizzibuddi-auth.js"), "const actualInvoiceId = payment.invoice_id;", "payment correction uses persisted payment invoice identity");
assertContains(read("server/bizzibuddi-auth.js"), "UPDATE bizzibuddi_payments", "payment correction persistence");
assertContains(read("src/pages/BizzibuddiAccountPage.jsx"), "function handleUpdatePayment", "Finance payment correction handler");
assertContains(read("src/pages/BizzibuddiAccountPage.jsx"), "Remove", "Finance payment removal UI");
assertContains(read("src/pages/BizzibuddiAccountPage.jsx"), "function handleDeletePayment", "Finance payment removal handler");
assertContains(read("server/bizzibuddi-auth.js"), "DELETE FROM bizzibuddi_payments", "payment removal persistence");
assertContains(read("server/bizzibuddi-auth.js"), "function deleteInvoicePayment", "persistent payment removal workflow");
assertContains(read("src/pages/BizzibuddiAccountPage.jsx"), '"/api/bizzibuddi/auth/payments/"', "Finance payment correction uses payment-specific API route");
assertContains(read("src/pages/BizzibuddiAccountPage.jsx"), "EDIT PAYMENT", "Finance payment correction UI");
assertContains(read("src/pages/BizzibuddiAccountPage.jsx"), "onUpdatePayment={updateAccountPayment}", "Finance payment correction integration");
console.log("BizziBuddi workflow contract checks passed.");
assertContains(page, "function handleOpenJob(jobId)", "jobs timeline open-job handler");
assertContains(page, "onClick={() => handleOpenJob(item.jobId)}", "jobs timeline open-job action");

assertContains(page, "setTimelineJobId(null);", "jobs open-job closes timeline");
assertContains(page, "startEdit(job);", "jobs open-job opens job details");
assertContains(page, "setSelectedJobId(String(job.id));", "jobs open-job focuses selected job");
assertContains(page, "function handleOpenJob(jobId)", "people timeline open-job handler");
assertContains(page, "startEdit(job);", "jobs deep-link opens job details");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "parseNaturalAppointmentRequest", "account Buddi natural-language appointment parsing");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "parseNaturalTime", "account Buddi natural appointment time parsing");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "CONFIRM NEW APPOINTMENT", "account Buddi appointment confirmation UI");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "Confirm & save appointment", "account Buddi appointment save confirmation");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "onAddAppointment", "account Buddi appointment persistence integration");
assertContains(read("src/pages/BizzibuddiAccountPage.jsx"), "onAddAppointment={async (appointment)", "account page Buddi appointment integration");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "book|schedule|arrange", "natural booking phrase routing");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "replace(/^a\\s+/i, "")", "natural appointment article cleanup");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "parseNaturalPaymentRequest", "account Buddi natural-language payment parsing");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), '(?:\\$\\s*)?[\\d,.]+(?:k)?', "natural-language payment amount preservation");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "CONFIRM PAYMENT", "account Buddi payment confirmation UI");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "Confirm & record payment", "account Buddi payment save confirmation");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "onRecordPayment", "account Buddi payment persistence integration");
assertContains(read("src/pages/BizzibuddiAccountPage.jsx"), "onRecordPayment={recordAccountPayment}", "account page Buddi payment integration");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "parseNaturalInvoiceRequest", "account Buddi natural-language invoice parsing");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "CONFIRM NEW INVOICE", "account Buddi invoice confirmation UI");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "Confirm & create invoice", "account Buddi invoice save confirmation");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "onCreateInvoice", "account Buddi invoice persistence integration");
assertContains(read("src/pages/BizzibuddiAccountPage.jsx"), "onCreateInvoice={async (invoice)", "account page Buddi invoice integration");
assertContains(read("src/pages/BizzibuddiAccountPage.jsx"), '["logout", "Log out", "logout"]', "logical authenticated logout navigation");
assertContains(read("src/pages/BizzibuddiAccountPage.jsx"), 'targetView === "logout"', "workspace logout action");
assertContains(read("src/pages/BizzibuddiAccountPage.jsx"), 'successMessage={message === "You have been logged out." ? message : ""}', "logout success message separation");
assertContains(read("src/pages/BizzibuddiAccountPage.jsx"), "bizzibuddi-auth-success", "logout success message UI");
assertContains(read("src/pages/BizzibuddiAccountPage.jsx"), "handleLogout();", "logout handler invocation");
assertContains(read("server/bizzibuddi-auth.js"), "description", "invoice description persistence");
assertContains(read("server/index.js"), "bizzibuddi-invoice-descriptions", "invoice description migration");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "payment received\\s+from", "natural-language payment received phrasing");
assertContains(read("src/pages/BizzibuddiAccountPage.jsx"), "RECORD PAYMENT", "direct invoice payment entry UI");
assertContains(read("src/pages/BizzibuddiAccountPage.jsx"), "Add payment", "direct invoice payment action");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "autoMatchPaymentInvoice", "account Buddi payment-to-invoice matching");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "invoiceDescription.includes(description)", "account Buddi payment description matching");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "outstanding.length === 1", "account Buddi single-outstanding-invoice matching");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "getFinanceIntelligence", "account Buddi finance intelligence");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "currently outstanding", "account Buddi outstanding balance answer");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "overdue invoice", "account Buddi overdue invoice answer");
assertContains(read("src/components/common/BizziBuddiAccountBuddi.jsx"), "Open finance →", "account Buddi finance navigation action");