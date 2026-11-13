
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const DONNA = Object.freeze({
  userId: "27f7b2a7-0a47-424c-870e-853fb0e2b03f",
  workspaceId: "d4a6562a-eb5d-4df2-90e1-0b265ecd0321",
  email: "chrysalisclothes@gmail.com",
  username: "chrysalisclothes",
  displayName: "Donna Hourigan",
  workspaceName: "Chrysalis Clothes",
  workspaceSlug: "chrysalisclothes-27f7b2a7",
});

const EXPECTED_TABLES = Object.freeze({
  users: 1,
  workspaces: 1,
  workspace_memberships: 1,
  bizzibuddi_people: 3,
  bizzibuddi_jobs: 3,
  bizzibuddi_calendar: 5,
  bizzibuddi_production: 3,
  bizzibuddi_measurements: 1,
  bizzibuddi_custom_field_definitions: 5,
  bizzibuddi_job_payments: 3,
  bizzibuddi_legacy_archive: 55,
  bizzibuddi_legacy_metadata: 15,
});

const EXPECTED_TOTAL = 96;
const EXPECTED_MIGRATIONS = 26;

function fail(message) {
  throw new Error(message);
}

function tableExists(database, tableName) {
  return Boolean(database.prepare(`
    SELECT 1
    FROM sqlite_master
    WHERE type = 'table' AND name = ?
  `).get(tableName));
}

function tableColumns(database, tableName) {
  return database.prepare(
    `PRAGMA table_info("${tableName}")`
  ).all().map((column) => ({
    name: column.name,
    type: String(column.type || "").toUpperCase(),
    notnull: Number(column.notnull),
    dflt_value: column.dflt_value,
    pk: Number(column.pk),
  }));
}

function foreignKeyViolations(database) {
  return database.prepare("PRAGMA foreign_key_check").all();
}

function verifyChecksum(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    fail("Migration package is not a valid object.");
  }

  const suppliedChecksum = String(payload.checksum || "");
  if (!/^[a-f0-9]{64}$/i.test(suppliedChecksum)) {
    fail("Migration package has no valid SHA-256 checksum.");
  }

  const unsignedPayload = { ...payload };
  delete unsignedPayload.checksum;

  const actualChecksum = createHash("sha256")
    .update(JSON.stringify(unsignedPayload))
    .digest("hex");

  if (actualChecksum !== suppliedChecksum.toLowerCase()) {
    fail("Migration package checksum verification failed.");
  }

  return actualChecksum;
}

function readAndValidatePackage(packagePath) {
  let payload;

  try {
    payload = JSON.parse(readFileSync(packagePath, "utf8"));
  } catch (error) {
    fail(`Unable to read migration package: ${error.message}`);
  }

  const checksum = verifyChecksum(payload);

  if (
    payload.format !== "bizzibuddi-donna-migration" ||
    payload.formatVersion !== 1
  ) {
    fail("Unsupported migration package format.");
  }

  const account = payload.account || {};

  if (
    account.userId !== DONNA.userId ||
    account.email !== DONNA.email ||
    account.username !== DONNA.username ||
    account.displayName !== DONNA.displayName ||
    account.workspaceId !== DONNA.workspaceId ||
    account.workspaceName !== DONNA.workspaceName ||
    account.workspaceSlug !== DONNA.workspaceSlug
  ) {
    fail("Migration package account identity does not match Donna's verified account.");
  }

  if (!Array.isArray(payload.migrations) ||
      payload.migrations.length !== EXPECTED_MIGRATIONS) {
    fail(`Expected exactly ${EXPECTED_MIGRATIONS} migration records.`);
  }

  if (!payload.tables || typeof payload.tables !== "object") {
    fail("Migration package contains no table records.");
  }

  const suppliedTables = Object.keys(payload.tables).sort();
  const expectedTables = Object.keys(EXPECTED_TABLES).sort();

  if (JSON.stringify(suppliedTables) !== JSON.stringify(expectedTables)) {
    fail("Migration package contains missing or unexpected tables.");
  }

  let totalRecords = 0;

  for (const [tableName, expectedCount] of Object.entries(EXPECTED_TABLES)) {
    const table = payload.tables[tableName];

    if (!table || !Array.isArray(table.rows)) {
      fail(`Invalid table data for ${tableName}.`);
    }

    if (table.rows.length !== expectedCount) {
      fail(
        `${tableName}: expected ${expectedCount} records, found ${table.rows.length}.`
      );
    }

    if (table.rows.some(
      (row) => !row || typeof row !== "object" || Array.isArray(row)
    )) {
      fail(`Invalid record structure in ${tableName}.`);
    }

    totalRecords += table.rows.length;
  }

  if (totalRecords !== EXPECTED_TOTAL ||
      payload.verification?.totalRecords !== EXPECTED_TOTAL) {
    fail(`Expected exactly ${EXPECTED_TOTAL} records in the migration package.`);
  }

  if (
    payload.verification?.integrity !== "ok" ||
    Number(payload.verification?.foreignKeyViolations) !== 0
  ) {
    fail("Source database verification did not pass.");
  }

  if (
    !Number.isInteger(Number(payload.verification?.existingSessionsExcluded)) ||
    Number(payload.verification.existingSessionsExcluded) < 0
  ) {
    fail("Session exclusion verification is invalid.");
  }

  const user = payload.tables.users.rows[0];

  if (
    user.id !== DONNA.userId ||
    String(user.email).toLowerCase() !== DONNA.email ||
    String(user.username).toLowerCase() !== DONNA.username ||
    user.display_name !== DONNA.displayName ||
    user.status !== "active" ||
    !String(user.password_hash || "").startsWith("scrypt$")
  ) {
    fail("Donna's account record failed identity or password-hash validation.");
  }

  const workspace = payload.tables.workspaces.rows[0];

  if (
    workspace.id !== DONNA.workspaceId ||
    workspace.name !== DONNA.workspaceName ||
    workspace.slug !== DONNA.workspaceSlug ||
    workspace.owner_user_id !== DONNA.userId
  ) {
    fail("Donna's workspace record failed validation.");
  }

  const membership = payload.tables.workspace_memberships.rows[0];

  if (
    membership.user_id !== DONNA.userId ||
    membership.workspace_id !== DONNA.workspaceId ||
    membership.role !== "owner" ||
    membership.status !== "active"
  ) {
    fail("Donna's workspace membership failed validation.");
  }

  for (const tableName of [
    "bizzibuddi_people",
    "bizzibuddi_jobs",
    "bizzibuddi_calendar",
    "bizzibuddi_production",
    "bizzibuddi_measurements",
    "bizzibuddi_custom_field_definitions",
    "bizzibuddi_job_payments",
    "bizzibuddi_legacy_archive",
    "bizzibuddi_legacy_metadata",
  ]) {
    for (const row of payload.tables[tableName].rows) {
      if (row.user_id !== DONNA.userId) {
        fail(`Unexpected account ownership in ${tableName}.`);
      }
    }
  }

  return { payload, checksum, totalRecords };
}

function validateMigrationHistory(database, migrations) {
  const targetMigrations = database.prepare(`
    SELECT version, name, checksum
    FROM schema_migrations
    ORDER BY version
  `).all();

  if (targetMigrations.length !== migrations.length) {
    fail("Source and Railway migration histories have different lengths.");
  }

  for (let index = 0; index < migrations.length; index += 1) {
    const source = migrations[index];
    const target = targetMigrations[index];

    if (
      Number(source.version) !== Number(target.version) ||
      source.name !== target.name ||
      source.checksum !== target.checksum
    ) {
      fail("Source and Railway migration histories do not match exactly.");
    }
  }
}

function createMissingLegacyTables(database, payload) {
  for (const tableName of [
    "bizzibuddi_legacy_archive",
    "bizzibuddi_legacy_metadata",
  ]) {
    if (tableExists(database, tableName)) continue;

    const table = payload.tables[tableName];

    if (typeof table.createSql !== "string" ||
        !table.createSql.trim()) {
      fail(`Missing CREATE TABLE statement for ${tableName}.`);
    }

    database.exec(table.createSql);

    for (const indexSql of table.indexes || []) {
      if (typeof indexSql !== "string" || !indexSql.trim()) {
        fail(`Invalid index definition for ${tableName}.`);
      }
      database.exec(indexSql);
    }
  }
}

function validateTableSchemas(database, payload) {
  for (const [tableName, table] of Object.entries(payload.tables)) {
    if (!tableExists(database, tableName)) {
      fail(`Railway is missing required table ${tableName}.`);
    }

    const columns = tableColumns(database, tableName);
    const sourceColumnNames = Object.keys(table.rows[0]);
    const targetColumnNames = columns.map((column) => column.name);

    if (JSON.stringify(sourceColumnNames) !== JSON.stringify(targetColumnNames)) {
      fail(`Schema column mismatch for ${tableName}.`);
    }
  }
}

function validateTargetDoesNotContainDonna(database) {
  const existingUsers = database.prepare(`
    SELECT id, email, username
    FROM users
    WHERE id = ?
       OR email = ? COLLATE NOCASE
       OR username = ? COLLATE NOCASE
  `).all(DONNA.userId, DONNA.email, DONNA.username);

  if (existingUsers.length) {
    fail("Donna's account ID, email or username already exists. Import refused.");
  }

  const existingWorkspace = database.prepare(`
    SELECT id, slug
    FROM workspaces
    WHERE id = ? OR slug = ? COLLATE NOCASE
  `).all(DONNA.workspaceId, DONNA.workspaceSlug);

  if (existingWorkspace.length) {
    fail("Donna's workspace ID or slug already exists. Import refused.");
  }
}

function insertRows(database, tableName, rows) {
  if (!rows.length) return 0;

  const columns = Object.keys(rows[0]);

  const sql = `
    INSERT INTO "${tableName}" (
      ${columns.map((column) => `"${column}"`).join(", ")}
    )
    VALUES (${columns.map(() => "?").join(", ")})
  `;

  const insert = database.prepare(sql);

  for (const row of rows) {
    insert.run(...columns.map((column) => row[column]));
  }

  return rows.length;
}

function verifyImportedCounts(database) {
  const counts = {};

  for (const [tableName, expectedCount] of Object.entries(EXPECTED_TABLES)) {
    const where = tableName === "users"
      ? "id = ?"
      : tableName === "workspaces"
        ? "id = ?"
        : tableName === "workspace_memberships"
          ? "user_id = ? AND workspace_id = ?"
          : "user_id = ?";

    const params = tableName === "users"
      ? [DONNA.userId]
      : tableName === "workspaces"
        ? [DONNA.workspaceId]
        : tableName === "workspace_memberships"
          ? [DONNA.userId, DONNA.workspaceId]
          : [DONNA.userId];

    const result = database.prepare(
      `SELECT COUNT(*) AS count FROM "${tableName}" WHERE ${where}`
    ).get(...params);

    const count = Number(result?.count || 0);

    if (count !== expectedCount) {
      fail(`Post-import count mismatch for ${tableName}: expected ${expectedCount}, found ${count}.`);
    }

    counts[tableName] = count;
  }

  return counts;
}

export function importDonnaMigration({
  database,
  packagePath,
  mode = "dry-run",
}) {
  if (!database) fail("A production database connection is required.");

  if (!new Set(["dry-run", "commit"]).has(mode)) {
    fail("Mode must be dry-run or commit.");
  }

  const { payload, checksum, totalRecords } =
    readAndValidatePackage(packagePath);

  const integrityBefore = database.prepare(
    "PRAGMA integrity_check"
  ).get()?.integrity_check;

  if (integrityBefore !== "ok") {
    fail("Railway database failed its pre-import integrity check.");
  }

  if (foreignKeyViolations(database).length) {
    fail("Railway database already contains foreign-key violations.");
  }

  validateMigrationHistory(database, payload.migrations);

  let transactionOpen = false;
  let committed = false;

  try {
    database.exec("PRAGMA foreign_keys = ON");
    database.exec("BEGIN IMMEDIATE");
    transactionOpen = true;

    validateTargetDoesNotContainDonna(database);

    createMissingLegacyTables(database, payload);
    validateTableSchemas(database, payload);

    const imported = {};

    for (const tableName of Object.keys(EXPECTED_TABLES)) {
      imported[tableName] = insertRows(
        database,
        tableName,
        payload.tables[tableName].rows
      );
    }

    const countsVerified = verifyImportedCounts(database);

    const violations = foreignKeyViolations(database);

    if (violations.length) {
      fail(`Post-import foreign-key check failed (${violations.length} violation(s)).`);
    }

    const integrityAfter = database.prepare(
      "PRAGMA integrity_check"
    ).get()?.integrity_check;

    if (integrityAfter !== "ok") {
      fail("Post-import SQLite integrity check failed.");
    }

    if (mode === "commit") {
      database.exec("COMMIT");
      committed = true;
    } else {
      database.exec("ROLLBACK");
    }

    transactionOpen = false;

    return {
      ok: true,
      mode,
      committed,
      account: {
        id: DONNA.userId,
        email: DONNA.email,
        username: DONNA.username,
        workspaceId: DONNA.workspaceId,
        workspaceName: DONNA.workspaceName,
      },
      checksum,
      imported,
      totalImported: totalRecords,
      countsVerified,
      integrity: integrityAfter,
      foreignKeyViolations: 0,
    };
  } catch (error) {
    if (transactionOpen) {
      try {
        database.exec("ROLLBACK");
      } catch {
        // Preserve the original migration error.
      }
    }

    throw error;
  }
}
