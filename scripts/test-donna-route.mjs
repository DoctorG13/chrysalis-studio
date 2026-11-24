import assert from "node:assert/strict";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";

import { handleDonnaMigrationRoute } from "../server/donna-migration-route.js";
import { importDonnaMigration } from "../server/donna-migration-import.js";

const projectRoot = process.cwd();

const sourceDatabase = resolve(
  projectRoot,
  "data/railway-before-donna-test.db"
);

const packagePath = resolve(
  projectRoot,
  "data/donna-migration-20261113.json"
);

const confirmation = "IMPORT DONNA CHRYSALIS WORKSPACE";
const testAdminHeader = "x-test-admin";
const testAdminValue = "authorized";

const donna = {
  id: "27f7b2a7-0a47-424c-870e-853fb0e2b03f",
  email: "chrysalisclothes@gmail.com",
  username: "chrysalisclothes",
  workspaceId: "d4a6562a-eb5d-4df2-90e1-0b265ecd0321",
};

assert.ok(
  existsSync(sourceDatabase),
  "Disposable Railway database copy is missing."
);

assert.ok(
  existsSync(packagePath),
  "Donna migration package is missing."
);

const temporaryDirectory = mkdtempSync(
  join(tmpdir(), "donna-route-test-")
);

const testDatabase = join(temporaryDirectory, "chrysalis.db");
const backupDirectory = join(temporaryDirectory, "backups");

mkdirSync(backupDirectory, { recursive: true });
copyFileSync(sourceDatabase, testDatabase);

const packageBytes = readFileSync(packagePath);

let server;
let baseUrl;

function openDatabase(path, readOnly = true) {
  return new DatabaseSync(path, {
    readOnly,
    timeout: 10000,
    enableForeignKeyConstraints: true,
  });
}

function getDatabaseChecks(database) {
  return {
    integrity: database.prepare(
      "PRAGMA integrity_check"
    ).get()?.integrity_check,

    foreignKeyViolations: database.prepare(
      "PRAGMA foreign_key_check"
    ).all().length,
  };
}

function sendJson(response, status, body) {
  if (response.headersSent || response.writableEnded) return;

  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
}

function authenticate(request, response) {
  if (request.headers[testAdminHeader] !== testAdminValue) {
    sendJson(response, 401, {
      ok: false,
      error: "Authentication required.",
    });
    return false;
  }

  return true;
}

function requireSameOrigin(request, response) {
  const origin = request.headers.origin;
  const expectedOrigin = `http://${request.headers.host}`;

  if (!origin || origin !== expectedOrigin) {
    sendJson(response, 403, {
      ok: false,
      error: "A valid same-origin request is required.",
    });
    return false;
  }

  return true;
}

async function postMigration(mode, {
  authenticated = true,
  origin = baseUrl,
  confirm = false,
} = {}) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (origin !== null) {
    headers.Origin = origin;
  }

  if (authenticated) {
    headers[testAdminHeader] = testAdminValue;
  }

  if (confirm) {
    headers["X-Migration-Confirmation"] = confirmation;
  }

  const response = await fetch(
    `${baseUrl}/api/admin/donna-migration?mode=${mode}`,
    {
      method: "POST",
      headers,
      body: packageBytes,
    }
  );

  const result = await response.json();
  return { response, result };
}

try {
  // Capture the four existing Railway customer usernames before testing.
  const originalDatabase = openDatabase(testDatabase);

  let originalUsernames;

  try {
    originalUsernames = originalDatabase.prepare(
      "SELECT username FROM users ORDER BY username"
    ).all().map((row) => row.username);

    assert.equal(
      originalUsernames.length,
      4,
      "The disposable Railway database should contain exactly four customers."
    );

    const existingDonna = originalDatabase.prepare(
      `SELECT COUNT(*) AS count
       FROM users
       WHERE id = ? OR email = ? OR username = ?`
    ).get(donna.id, donna.email, donna.username).count;

    assert.equal(
      existingDonna,
      0,
      "Donna must not already exist in the test database."
    );
  } finally {
    originalDatabase.close();
  }

  server = createServer(async (request, response) => {
    const url = new URL(
      request.url || "/",
      `http://${request.headers.host || "127.0.0.1"}`
    );

    const handled = await handleDonnaMigrationRoute({
      request,
      response,
      url,
      authenticate,
      requireSameOrigin,
      databasePath: testDatabase,
      backupDirectory,
    });

    if (!handled && !response.headersSent) {
      response.writeHead(404);
      response.end();
    }
  });

  await new Promise((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(0, "127.0.0.1", resolveListen);
  });

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;

  // Test 1: An unauthenticated request must be rejected before processing.
  const unauthenticated = await postMigration("dry-run", {
    authenticated: false,
  });

  assert.equal(unauthenticated.response.status, 401);
  assert.equal(unauthenticated.result.ok, false);
  assert.match(unauthenticated.result.error, /authentication/i);

  // Test 2: An authenticated request from another origin must be rejected.
  const crossOrigin = await postMigration("dry-run", {
    origin: "https://untrusted.example",
  });

  assert.equal(crossOrigin.response.status, 403);
  assert.equal(crossOrigin.result.ok, false);
  assert.match(crossOrigin.result.error, /origin/i);

  // Test 3: An authenticated request without an Origin must be rejected.
  const missingOrigin = await postMigration("dry-run", {
    origin: null,
  });

  assert.equal(missingOrigin.response.status, 403);
  assert.equal(missingOrigin.result.ok, false);
  assert.match(missingOrigin.result.error, /origin/i);

  // Test 4: A commit without explicit confirmation must be rejected.
  const rejectedCommit = await postMigration("commit");

  assert.equal(rejectedCommit.response.status, 400);
  assert.match(rejectedCommit.result.error, /confirmation/i);

  // Test 5: A dry-run must validate but leave the database unchanged.
  const dryRun = await postMigration("dry-run");

  assert.equal(dryRun.response.status, 200);
  assert.equal(dryRun.result.ok, true);
  assert.equal(dryRun.result.mode, "dry-run");
  assert.equal(dryRun.result.committed, false);
  assert.equal(dryRun.result.totalImported, 96);
  assert.equal(dryRun.result.integrity, "ok");
  assert.equal(dryRun.result.foreignKeyViolations, 0);

  const afterDryRun = openDatabase(testDatabase);

  try {
    const userCount = afterDryRun.prepare(
      "SELECT COUNT(*) AS count FROM users"
    ).get().count;

    const donnaCount = afterDryRun.prepare(
      `SELECT COUNT(*) AS count
       FROM users
       WHERE id = ? OR email = ? OR username = ?`
    ).get(donna.id, donna.email, donna.username).count;

    assert.equal(userCount, 4);
    assert.equal(donnaCount, 0);

    assert.deepEqual(
      afterDryRun.prepare(
        "SELECT username FROM users ORDER BY username"
      ).all().map((row) => row.username),
      originalUsernames
    );

    const checks = getDatabaseChecks(afterDryRun);
    assert.equal(checks.integrity, "ok");
    assert.equal(checks.foreignKeyViolations, 0);
  } finally {
    afterDryRun.close();
  }

  // Test 6: Perform a confirmed commit against the disposable database.
  const committed = await postMigration("commit", {
    confirm: true,
  });

  assert.equal(
    committed.response.status,
    200,
    `Commit request failed: ${JSON.stringify(committed.result)}`
  );

  assert.equal(committed.result.ok, true);
  assert.equal(committed.result.mode, "commit");
  assert.equal(committed.result.committed, true);
  assert.equal(committed.result.totalImported, 96);
  assert.equal(committed.result.integrity, "ok");
  assert.equal(committed.result.foreignKeyViolations, 0);

  // Test 7: Verify that a pre-import backup was created and verified.
  assert.ok(committed.result.backup);
  assert.equal(committed.result.backup.verified, true);
  assert.equal(committed.result.backup.integrity, "ok");
  assert.equal(committed.result.backup.foreignKeyViolations, 0);
  assert.ok(committed.result.backup.name);
  assert.ok(
    Number.isSafeInteger(committed.result.backup.sizeBytes) &&
      committed.result.backup.sizeBytes > 0,
    "Pre-import backup must report a positive verified size"
  );
  assert.match(
    committed.result.backup.sha256,
    /^[a-f0-9]{64}$/,
    "Pre-import backup must report a valid SHA-256 digest"
  );

  const backupPath = join(
    backupDirectory,
    committed.result.backup.name
  );

  assert.ok(
    existsSync(backupPath),
    "The pre-import backup file was not created."
  );
  assert.equal(
    statSync(backupPath).size,
    committed.result.backup.sizeBytes,
    "Reported backup size must match the actual file"
  );

  const actualBackupSha256 = createHash("sha256")
    .update(readFileSync(backupPath))
    .digest("hex");

  assert.equal(
    actualBackupSha256,
    committed.result.backup.sha256,
    "Reported backup SHA-256 must match the actual file"
  );

  const backupDatabase = openDatabase(backupPath);

  try {
    const backupUserCount = backupDatabase.prepare(
      "SELECT COUNT(*) AS count FROM users"
    ).get().count;

    const backupDonnaCount = backupDatabase.prepare(
      `SELECT COUNT(*) AS count
       FROM users
       WHERE id = ? OR email = ? OR username = ?`
    ).get(donna.id, donna.email, donna.username).count;

    const backupChecks = getDatabaseChecks(backupDatabase);

    assert.equal(backupUserCount, 4);
    assert.equal(backupDonnaCount, 0);
    assert.equal(backupChecks.integrity, "ok");
    assert.equal(backupChecks.foreignKeyViolations, 0);

    assert.deepEqual(
      backupDatabase.prepare(
        "SELECT username FROM users ORDER BY username"
      ).all().map((row) => row.username),
      originalUsernames
    );
  } finally {
    backupDatabase.close();
  }

  // Test 7B: Verify conflicting records are identified and rolled back.
  const conflictDatabasePath = join(
    temporaryDirectory,
    "conflict-chrysalis.db"
  );

  copyFileSync(testDatabase, conflictDatabasePath);

  const conflictDatabase = openDatabase(
    conflictDatabasePath,
    false
  );

  try {
    const migrationPackage = JSON.parse(
      packageBytes.toString("utf8")
    );

    const incomingJob =
      migrationPackage.tables.bizzibuddi_jobs.rows[0];

    assert.ok(incomingJob?.id, "Migration package has no test job.");

    const originalJob = conflictDatabase.prepare(
      `SELECT id, user_id, title
       FROM bizzibuddi_jobs
       WHERE id = ? AND user_id = ?`
    ).get(incomingJob.id, donna.id);

    assert.ok(originalJob, "Imported test job was not found.");

    const sentinel = "__donna_migration_conflict_test__";

    const updateResult = conflictDatabase.prepare(
      `UPDATE bizzibuddi_jobs
       SET title = ?
       WHERE id = ? AND user_id = ?`
    ).run(sentinel, incomingJob.id, donna.id);

    assert.equal(updateResult.changes, 1);

    const conflictBefore = conflictDatabase.prepare(
      `SELECT id, user_id, title
       FROM bizzibuddi_jobs
       WHERE id = ? AND user_id = ?`
    ).get(incomingJob.id, donna.id);

    let conflictError;

    try {
      importDonnaMigration({
        database: conflictDatabase,
        packagePath,
        mode: "dry-run",
      });
    } catch (error) {
      conflictError = error;
    }

    assert.ok(
      conflictError,
      "Importer did not reject the deliberately altered job."
    );

    assert.match(
      conflictError.message,
      /bizzibuddi_jobs/
    );

    assert.match(
      conflictError.message,
      new RegExp(
        `Record: id=${incomingJob.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`
      )
    );

    assert.match(
      conflictError.message,
      /Different fields:.*title/
    );

    assert.doesNotMatch(
      conflictError.message,
      /__donna_migration_conflict_test__/
    );

    const conflictAfter = conflictDatabase.prepare(
      `SELECT id, user_id, title
       FROM bizzibuddi_jobs
       WHERE id = ? AND user_id = ?`
    ).get(incomingJob.id, donna.id);

    assert.deepEqual(conflictAfter, conflictBefore);

    const conflictChecks = getDatabaseChecks(conflictDatabase);

    assert.equal(conflictChecks.integrity, "ok");
    assert.equal(conflictChecks.foreignKeyViolations, 0);

    console.log("Conflict diagnostic:       passed");
    console.log("Conflict rollback:         passed");
    console.log("Conflict data values:      not exposed");
  } finally {
    conflictDatabase.close();
  }
  // Test 8: Verify Donna and the original four customers are present.
  const migratedDatabase = openDatabase(testDatabase);

  try {
    const totalUsers = migratedDatabase.prepare(
      "SELECT COUNT(*) AS count FROM users"
    ).get().count;

    const donnaUser = migratedDatabase.prepare(
      `SELECT id, email, username
       FROM users
       WHERE id = ? AND email = ? AND username = ?`
    ).get(donna.id, donna.email, donna.username);

    const existingUsernames = migratedDatabase.prepare(
      "SELECT username FROM users WHERE username <> ? ORDER BY username"
    ).all(donna.username).map((row) => row.username);

    const workspace = migratedDatabase.prepare(
      `SELECT id, name
       FROM workspaces
       WHERE id = ?`
    ).get(donna.workspaceId);

    const membership = migratedDatabase.prepare(
      `SELECT COUNT(*) AS count
       FROM workspace_memberships
       WHERE workspace_id = ? AND user_id = ?`
    ).get(donna.workspaceId, donna.id).count;

    const checks = getDatabaseChecks(migratedDatabase);

    assert.equal(totalUsers, 5);
    assert.ok(donnaUser);
    assert.deepEqual(existingUsernames, originalUsernames);

    assert.ok(workspace);
    assert.equal(workspace.name, "Chrysalis Clothes");
    assert.equal(membership, 1);

    assert.equal(checks.integrity, "ok");
    assert.equal(checks.foreignKeyViolations, 0);

    console.log("");
    console.log("DONNA HTTP ROUTE SECURITY AND COMMIT TEST PASSED");
    console.log("================================================");
    console.log("Unauthenticated request:     rejected (401)");
    console.log("Cross-origin request:        rejected (403)");
    console.log("Missing Origin request:      rejected (403)");
    console.log("Commit without confirmation: rejected");
    console.log("Dry-run validation:          passed");
    console.log("Confirmed test commit:       passed");
    console.log("Records imported:            96");
    console.log("Customers after test:        5");
    console.log("Original customers retained: 4");
    console.log("Donna account:               verified");
    console.log("Donna workspace:             verified");
    console.log("Pre-import backup:           verified");
    console.log("Database integrity:          ok");
    console.log("Foreign-key violations:      0");
    console.log("");
    console.log("IMPORTANT: All changes were made only to a");
    console.log("temporary disposable database on this PC.");
    console.log("Railway production was not modified.");
    console.log("The authentication and Origin checks above");
    console.log("exercise the route callbacks, not Railway login.");
  } finally {
    migratedDatabase.close();
  }
} finally {
  if (server?.listening) {
    server.closeAllConnections();

    await new Promise((resolveClose) => {
      server.close(resolveClose);
    });
  }

  rmSync(temporaryDirectory, {
    recursive: true,
    force: true,
  });
}
