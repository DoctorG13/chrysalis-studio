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
  ["POST", 'url.pathname.endsWith("/payments")'],
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
assertContains(page, "<>\n      {account && shortcutHelpOpen && (", "account page fragment wrapper");
assertContains(page, "</main>\n    </>", "account page fragment closure");
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

assertContains(read("src/pages/BizzibuddiAccountPage.jsx"), "onAddJob={async (job)", "account Buddi job persistence callback");

console.log(`BizziBuddi workflow contract checks passed: ${routeContracts.length} backend route contracts + 33 UI workflow contracts.`);