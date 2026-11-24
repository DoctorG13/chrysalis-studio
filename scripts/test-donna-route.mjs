
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
      authenticate: (request, response) => {
        if (request.headers["x-test-admin"] !== "authorized") {
          response.writeHead(401, { "Content-Type": "application/json" });
          response.end(JSON.stringify({
            ok: false,
            error: "Authentication required.",
          }));
          return false;
        }
        return true;
      },
      requireSameOrigin: (request, response) => {
        const expectedOrigin = `http://${request.headers.host}`;
        if (!request.headers.origin || request.headers.origin !== expectedOrigin) {
          response.writeHead(403, { "Content-Type": "application/json" });
          response.end(JSON.stringify({
            ok: false,
            error: "A valid same-origin request is required.",
          }));
          return false;
        }
        return true;
      },
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
  const baseUrl = `http://127.0.0.1:${address.port}`;

  // Security Test 1: Reject a request without administrator authentication.
  const unauthenticated = await fetch(
    `${baseUrl}/api/admin/donna-migration?mode=dry-run`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: baseUrl,
      },
      body: packageBytes,
    }
  );

  assert.equal(unauthenticated.status, 401);
  assert.match((await unauthenticated.json()).error, /authentication/i);

  // Security Test 2: Reject an authenticated request from another origin.
  const crossOrigin = await fetch(
    `${baseUrl}/api/admin/donna-migration?mode=dry-run`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Test-Admin": "authorized",
        Origin: "https://attacker.example",
      },
      body: packageBytes,
    }
  );

  assert.equal(crossOrigin.status, 403);
  assert.match((await crossOrigin.json()).error, /origin/i);

  // Security Test 3: Reject an authenticated request with no Origin header.
  const missingOrigin = await fetch(
    `${baseUrl}/api/admin/donna-migration?mode=dry-run`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Test-Admin": "authorized",
      },
      body: packageBytes,
    }
  );

  assert.equal(missingOrigin.status, 403);
  assert.match((await missingOrigin.json()).error, /origin/i);
  // Test 1: A commit without explicit confirmation must be rejected.
  const rejectedCommit = await fetch(
    `${baseUrl}/api/admin/donna-migration?mode=commit`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Test-Admin": "authorized",
        Origin: baseUrl,
      },
      body: packageBytes,
    }
  );

  const rejectedResult = await rejectedCommit.json();

  assert.equal(rejectedCommit.status, 400);
  assert.match(rejectedResult.error, /confirmation/i);

  // Test 2: A dry-run must validate but leave the database unchanged.
  const dryRun = await fetch(
    `${baseUrl}/api/admin/donna-migration?mode=dry-run`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Test-Admin": "authorized",
        Origin: baseUrl,
      },
      body: packageBytes,
    }
  );

  const dryRunResult = await dryRun.json();

  assert.equal(dryRun.status, 200);
  assert.equal(dryRunResult.ok, true);
  assert.equal(dryRunResult.mode, "dry-run");
  assert.equal(dryRunResult.committed, false);
  assert.equal(dryRunResult.totalImported, 96);
  assert.equal(dryRunResult.integrity, "ok");
  assert.equal(dryRunResult.foreignKeyViolations, 0);

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

  // Test 3: Perform a confirmed commit against the disposable database.
  const committed = await fetch(
    `${baseUrl}/api/admin/donna-migration?mode=commit`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Test-Admin": "authorized",
        Origin: baseUrl,
        "X-Migration-Confirmation": confirmation,
      },
      body: packageBytes,
    }
  );

  const commitResult = await committed.json();

  assert.equal(
    committed.status,
    200,
    `Commit request failed: ${JSON.stringify(commitResult)}`
  );

  assert.equal(commitResult.ok, true);
  assert.equal(commitResult.mode, "commit");
  assert.equal(commitResult.committed, true);
  assert.equal(commitResult.totalImported, 96);
  assert.equal(commitResult.integrity, "ok");
  assert.equal(commitResult.foreignKeyViolations, 0);

  // Test 4: Verify that a pre-import backup was created and verified.
  assert.ok(commitResult.backup);
  assert.equal(commitResult.backup.verified, true);
  assert.equal(commitResult.backup.integrity, "ok");
  assert.equal(commitResult.backup.foreignKeyViolations, 0);
  assert.ok(commitResult.backup.name);
  assert.ok(
    Number.isSafeInteger(commitResult.backup.sizeBytes) &&
      commitResult.backup.sizeBytes > 0,
    "Pre-import backup must report a positive verified size"
  );
  assert.match(
    commitResult.backup.sha256,
    /^[a-f0-9]{64}$/,
    "Pre-import backup must report a valid SHA-256 digest"
  );

  const backupPath = join(
    backupDirectory,
    commitResult.backup.name
  );

  assert.ok(
    existsSync(backupPath),
    "The pre-import backup file was not created."
  );
  assert.equal(
    statSync(backupPath).size,
    commitResult.backup.sizeBytes,
    "Reported backup size must match the actual file"
  );
  const actualBackupSha256 = createHash("sha256")
    .update(readFileSync(backupPath))
    .digest("hex");
  assert.equal(
    actualBackupSha256,
    commitResult.backup.sha256,
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

  // Test 5: Verify Donna and the original four customers are present.
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
    console.log("DONNA HTTP ROUTE COMMIT TEST PASSED");
    console.log("===================================");
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
