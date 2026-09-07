import { repairAndEnforceJobReferences } from "./job-reference.js";

const referenceRepair = repairAndEnforceJobReferences();

console.log(
  `[Chrysalis production] Job reference check complete: ${referenceRepair.repaired} reference(s) repaired.`
);

await import("./production.js");
