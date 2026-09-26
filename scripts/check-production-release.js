import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error("Production release check failed: " + message);
}

const packageJson = JSON.parse(read("package.json"));
const roadmap = read("ROADMAP.md");
const readme = read("README.md");
const guide = read("docs/BIZZIBUDDI.md");
const workflow = read("scripts/test-bizzibuddi-workflow.js");
const productionEntry = read("server/production-entry.js");
const productionTransfer = read("server/production-transfer.js");
const auth = read("server/bizzibuddi-auth.js");

assert(packageJson.version === "1.0.0", "package version must be 1.0.0");
assert(packageJson.scripts?.build === "vite build", "production build script is missing");
assert(packageJson.scripts?.start === "node server/production-entry.js", "production start script is missing");
assert(packageJson.scripts?.["test:workflow"] === "node scripts/test-bizzibuddi-workflow.js", "workflow check script is missing");
assert(packageJson.scripts?.["release:check"] === "node scripts/check-production-release.js", "release check script is missing");

assert(roadmap.includes("# Release 1.0"), "Release 1.0 roadmap section is missing");
assert(readme.includes("npm run build"), "README build instructions are missing");
assert(readme.includes("npm run test:workflow"), "README workflow verification instructions are missing");
assert(guide.includes("## 14. Verification"), "application verification guide is missing");

assert(workflow.includes("BizziBuddi workflow contract checks passed"), "workflow contract checker is missing");
assert(productionEntry.includes('import("./production-transfer.js")'), "production entry does not start the production transfer gateway");
assert(productionTransfer.includes("validateAuthConfiguration"), "production gateway auth configuration validation is missing");
assert(productionTransfer.includes("waitForInternalGateway"), "production gateway readiness check is missing");
assert(productionTransfer.includes("validateImportedDatabase"), "production backup validation is missing");
assert(auth.includes("/api/bizzibuddi/auth/health"), "BizziBuddi authenticated health route is missing");

console.log("Chrysalis/BizziBuddi 1.0.0 production release checks passed.");
