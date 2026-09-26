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

console.log(`BizziBuddi workflow contract checks passed: ${routeContracts.length} backend route contracts + 13 UI workflow contracts.`);
