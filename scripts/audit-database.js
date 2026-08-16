import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const DATA_DIR = resolve(
  process.env.CHRYSALIS_DATA_DIR || join(process.cwd(), "data")
);
const DB_PATH = join(DATA_DIR, "chrysalis.db");

const RELATIONSHIPS = [
  {
    name: "jobs → clients",
    table: "jobs",
    column: "client_id",
    parentTable: "clients",
    parentColumn: "id",
  },
  {
    name: "appointments → clients",
    table: "appointments",
    column: "client_id",
    parentTable: "clients",
    parentColumn: "id",
  },
  {
    name: "appointments → jobs",
    table: "appointments",
    column: "job_id",
    parentTable: "jobs",
    parentColumn: "id",
    nullable: true,
  },
  {
    name: "fittings → clients",
    table: "fittings",
    column: "client_id",
    parentTable: "clients",
    parentColumn: "id",
  },
  {
    name: "fittings → jobs",
    table: "fittings",
    column: "job_id",
    parentTable: "jobs",
    parentColumn: "id",
    nullable: true,
  },
  {
    name: "payments → clients",
    table: "payments",
    column: "client_id",
    parentTable: "clients",
    parentColumn: "id",
  },
  {
    name: "payments → jobs",
    table: "payments",
    column: "job_id",
    parentTable: "jobs",
    parentColumn: "id",
    nullable: true,
  },
  {
    name: "assets → clients",
    table: "assets",
    column: "client_id",
    parentTable: "clients",
    parentColumn: "id",
  },
  {
    name: "assets → jobs",
    table: "assets",
    column: "job_id",
    parentTable: "jobs",
    parentColumn: "id",
    nullable: true,
  },
  {
    name: "measurements → clients",
    table: "measurements",
    column: "client_id",
    parentTable: "clients",
    parentColumn: "id",
  },
  {
    name: "measurements → jobs",
    table: "measurements",
    column: "job_id",
    parentTable: "jobs",
    parentColumn: "id",
    nullable: true,
  },
  {
    name: "timeline_events → clients",
    table: "timeline_events",
    column: "client_id",
    parentTable: "clients",
    parentColumn: "id",
  },
  {
    name: "timeline_events → jobs",
    table: "timeline_events",
    column: "job_id",
    parentTable: "jobs",
    parentColumn: "id",
    nullable: true,
  },
  {
    name: "invoices → clients",
    table: "invoices",
    column: "client_id",
    parentTable: "clients",
    parentColumn: "id",
  },
  {
    name: "invoices → jobs",
    table: "invoices",
    column: "job_id",
    parentTable: "jobs",
    parentColumn: "id",
    nullable: true,
  },
];

const TABLES = [
  "clients",
  "jobs",
  "appointments",
  "fittings",
  "payments",
  "assets",
  "measurements",
  "timeline_events",
  "invoices",
];

function fail(message) {
  throw new Error(message);
}

function openDatabase() {
  if (!existsSync(DB_PATH)) {
    fail(`Database not found at ${DB_PATH}. Run "npm run db:init" first.`);
  }

  const database = new DatabaseSync(DB_PATH, {
    timeout: 5000,
    enableForeignKeyConstraints: true,
  });

  database.exec("PRAGMA foreign_keys = ON;");
  return database;
}

function count(database, table) {
  return Number(
    database.prepare(`SELECT COUNT(*) AS count FROM "${table}"`).get().count
  );
}

function relationshipAudit(database, relationship) {
  const nullableClause = relationship.nullable
    ? `AND child."${relationship.column}" IS NOT NULL`
    : "";

  const sql = `
    SELECT COUNT(*) AS count
    FROM "${relationship.table}" AS child
    LEFT JOIN "${relationship.parentTable}" AS parent
      ON parent."${relationship.parentColumn}" = child."${relationship.column}"
    WHERE parent."${relationship.parentColumn}" IS NULL
      ${nullableClause}
  `;

  return Number(database.prepare(sql).get().count);
}

function foreignKeyAudit(database) {
  return database
    .prepare("PRAGMA foreign_key_check")
    .all();
}

function audit() {
  const database = openDatabase();

  try {
    const schema = database
      .prepare(
        "SELECT MAX(version) AS version FROM schema_migrations"
      )
      .get();

    const tableCounts = Object.fromEntries(
      TABLES.map((table) => [table, count(database, table)])
    );

    const relationships = RELATIONSHIPS.map((relationship) => {
      const orphanCount = relationshipAudit(database, relationship);
      return {
        name: relationship.name,
        orphanCount,
        ok: orphanCount === 0,
      };
    });

    const foreignKeys = foreignKeyAudit(database);

    const checks = {
      schemaReady: Number(schema?.version || 0) >= 1,
      foreignKeyCheck: foreignKeys.length === 0,
      relationships: relationships.every((relationship) => relationship.ok),
      clientsPresent: tableCounts.clients > 0,
      jobsHaveClients:
        tableCounts.jobs === 0 ||
        relationships.find((relationship) => relationship.name === "jobs → clients")
          ?.orphanCount === 0,
    };

    const ok = Object.values(checks).every(Boolean);

    return {
      ok,
      databasePath: DB_PATH,
      schemaVersion: Number(schema?.version || 0),
      tableCounts,
      relationships,
      foreignKeyViolations: foreignKeys,
      checks,
    };
  } finally {
    database.close();
  }
}

try {
  console.log(JSON.stringify(audit(), null, 2));
  if (!audit().ok) process.exitCode = 1;
} catch (error) {
  console.error(`Database audit failed: ${error.message}`);
  process.exitCode = 1;
}
