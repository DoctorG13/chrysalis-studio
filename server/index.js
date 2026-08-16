import { createServer } from "node:http";
import { existsSync, mkdirSync } from "node:fs";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { DatabaseSync, backup as sqliteBackup } from "node:sqlite";

const APP_VERSION = "0.0.0";
const MIN_NODE_MAJOR = 24;
const MIN_NODE_MINOR = 15;
const DEFAULT_PORT = 4174;

const DATA_DIR = resolve(
  process.env.CHRYSALIS_DATA_DIR || join(process.cwd(), "data")
);
const DB_PATH = join(DATA_DIR, "chrysalis.db");
const BACKUP_DIR = join(DATA_DIR, "backups");

const MIGRATIONS = [
  {
    version: 1,
    name: "initial-business-data",
    sql: `
      CREATE TABLE IF NOT EXISTS app_metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        first_name TEXT NOT NULL DEFAULT '',
        last_name TEXT NOT NULL DEFAULT '',
        phone TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL DEFAULT '',
        notes TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'Active',
        created_at TEXT NOT NULL,
        modified_at TEXT NOT NULL,
        measurements_json TEXT NOT NULL DEFAULT '{}',
        preferences_json TEXT NOT NULL DEFAULT '{}',
        tags_json TEXT NOT NULL DEFAULT '[]',
        reminders_json TEXT NOT NULL DEFAULT '[]',
        custom_fields_json TEXT NOT NULL DEFAULT '{}',
        data_json TEXT NOT NULL DEFAULT '{}'
      );

      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        reference TEXT NOT NULL DEFAULT '',
        name TEXT NOT NULL DEFAULT '',
        due_date TEXT,
        priority TEXT NOT NULL DEFAULT 'Normal',
        status TEXT NOT NULL DEFAULT 'Quote',
        description TEXT NOT NULL DEFAULT '',
        price REAL NOT NULL DEFAULT 0,
        deposit REAL NOT NULL DEFAULT 0,
        garment_type TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        modified_at TEXT NOT NULL,
        data_json TEXT NOT NULL DEFAULT '{}',
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        job_id TEXT,
        type TEXT NOT NULL DEFAULT 'Consultation',
        date TEXT NOT NULL DEFAULT '',
        time TEXT NOT NULL DEFAULT '',
        duration INTEGER NOT NULL DEFAULT 60,
        location TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'Scheduled',
        notes TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        data_json TEXT NOT NULL DEFAULT '{}',
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        job_id TEXT,
        amount REAL NOT NULL DEFAULT 0,
        date TEXT NOT NULL DEFAULT '',
        method TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT 'Payment',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        data_json TEXT NOT NULL DEFAULT '{}',
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS fittings (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        job_id TEXT,
        title TEXT NOT NULL DEFAULT '',
        date TEXT NOT NULL DEFAULT '',
        time TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'Scheduled',
        notes TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        data_json TEXT NOT NULL DEFAULT '{}',
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS assets (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        job_id TEXT,
        kind TEXT NOT NULL DEFAULT 'photo',
        caption TEXT NOT NULL DEFAULT '',
        date TEXT NOT NULL DEFAULT '',
        url TEXT NOT NULL DEFAULT '',
        file_path TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        data_json TEXT NOT NULL DEFAULT '{}',
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS measurements (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        job_id TEXT,
        data_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS timeline_events (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        job_id TEXT,
        type TEXT NOT NULL DEFAULT 'note',
        title TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        date TEXT NOT NULL,
        data_json TEXT NOT NULL DEFAULT '{}',
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        job_id TEXT,
        number TEXT NOT NULL DEFAULT '',
        amount REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'Draft',
        issue_date TEXT NOT NULL DEFAULT '',
        due_date TEXT NOT NULL DEFAULT '',
        data_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_jobs_client_id
        ON jobs(client_id);

      CREATE INDEX IF NOT EXISTS idx_jobs_due_date
        ON jobs(due_date);

      CREATE INDEX IF NOT EXISTS idx_appointments_client_id
        ON appointments(client_id);

      CREATE INDEX IF NOT EXISTS idx_appointments_job_id
        ON appointments(job_id);

      CREATE INDEX IF NOT EXISTS idx_appointments_date
        ON appointments(date);

      CREATE INDEX IF NOT EXISTS idx_payments_job_id
        ON payments(job_id);

      CREATE INDEX IF NOT EXISTS idx_fittings_job_id
        ON fittings(job_id);

      CREATE INDEX IF NOT EXISTS idx_assets_job_id
        ON assets(job_id);

      CREATE INDEX IF NOT EXISTS idx_measurements_client_id
        ON measurements(client_id);

      CREATE INDEX IF NOT EXISTS idx_timeline_client_id
        ON timeline_events(client_id);

      CREATE INDEX IF NOT EXISTS idx_timeline_job_id
        ON timeline_events(job_id);

      CREATE INDEX IF NOT EXISTS idx_invoices_job_id
        ON invoices(job_id);

      INSERT OR REPLACE INTO app_metadata (key, value)
        VALUES ('schema_name', 'chrysalis-business-data');
    `,
  },
];

function assertSupportedNode() {
  const major = Number(process.versions.node.split(".")[0]);
  const minor = Number(process.versions.node.split(".")[1]);

  if (
    major < MIN_NODE_MAJOR ||
    (major === MIN_NODE_MAJOR && minor < MIN_NODE_MINOR)
  ) {
    throw new Error(
      `Chrysalis requires Node.js ${MIN_NODE_MAJOR}.${MIN_NODE_MINOR}.0 or newer. ` +
        `Current version: ${process.versions.node}.`
    );
  }
}

function ensureDataDirectories() {
  mkdirSync(DATA_DIR, { recursive: true });
  mkdirSync(BACKUP_DIR, { recursive: true });
}

function openDatabase() {
  ensureDataDirectories();

  const database = new DatabaseSync(DB_PATH, {
    timeout: 5000,
    enableForeignKeyConstraints: true,
  });

  database.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
  `);

  return database;
}

function ensureMigrationTable(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      checksum TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);
}

function checksumForMigration(migration) {
  return createHash("sha256")
    .update(`${migration.version}:${migration.name}:${migration.sql}`)
    .digest("hex");
}

async function backupDatabase(database, reason = "manual") {
  ensureDataDirectories();

  if (!existsSync(DB_PATH)) {
    return null;
  }

  const safeReason = String(reason)
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-+|-+$/g, "") || "backup";

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-");

  const destination = join(
    BACKUP_DIR,
    `chrysalis-${timestamp}-${safeReason}.db`
  );

  await sqliteBackup(database, destination);

  return destination;
}

async function runMigrations(database) {
  ensureMigrationTable(database);

  const appliedRows = database
    .prepare(
      "SELECT version, name, checksum FROM schema_migrations ORDER BY version"
    )
    .all();

  const applied = new Map(
    appliedRows.map((row) => [row.version, row])
  );

  for (const migration of MIGRATIONS) {
    const expectedChecksum = checksumForMigration(migration);
    const existing = applied.get(migration.version);

    if (existing) {
      if (existing.checksum !== expectedChecksum) {
        throw new Error(
          `Migration ${migration.version} (${migration.name}) has changed after it was applied. ` +
            "Create a new migration instead of modifying an existing one."
        );
      }

      continue;
    }

    if (existsSync(DB_PATH)) {
      await backupDatabase(
        database,
        `before-migration-${migration.version}`
      );
    }

    const appliedAt = new Date().toISOString();

    database.exec("BEGIN IMMEDIATE");

    try {
      database.exec(migration.sql);

      database
        .prepare(
          `INSERT INTO schema_migrations
             (version, name, checksum, applied_at)
           VALUES (?, ?, ?, ?)`
        )
        .run(
          migration.version,
          migration.name,
          expectedChecksum,
          appliedAt
        );

      database.exec("COMMIT");
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
  }

  return getDatabaseInfo(database);
}

function getDatabaseInfo(database) {
  ensureMigrationTable(database);

  const migrations = database
    .prepare(
      "SELECT version, name, applied_at AS appliedAt FROM schema_migrations ORDER BY version"
    )
    .all();

  const tableNames = database
    .prepare(
      `SELECT name
       FROM sqlite_master
       WHERE type = 'table'
         AND name NOT LIKE 'sqlite_%'
       ORDER BY name`
    )
    .all()
    .map((row) => row.name);

  const counts = {};

  for (const table of tableNames) {
    if (table === "schema_migrations") continue;

    counts[table] = database
      .prepare(`SELECT COUNT(*) AS count FROM "${table}"`)
      .get().count;
  }

  const currentMigration =
    migrations.length > 0
      ? migrations[migrations.length - 1]
      : null;

  return {
    applicationVersion: APP_VERSION,
    nodeVersion: process.versions.node,
    databasePath: DB_PATH,
    backupDirectory: BACKUP_DIR,
    schemaVersion: currentMigration?.version || 0,
    migrations,
    tableCounts: counts,
  };
}

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);

  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });

  response.end(body);
}

function createApiServer(database) {
  return createServer(async (request, response) => {
    if (request.method === "OPTIONS") {
      response.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      response.end();
      return;
    }

    const url = new URL(
      request.url || "/",
      `http://${request.headers.host || "localhost"}`
    );

    try {
      if (
        request.method === "GET" &&
        url.pathname === "/api/health"
      ) {
        sendJson(response, 200, {
          ok: true,
          ...getDatabaseInfo(database),
        });
        return;
      }

      if (
        request.method === "GET" &&
        url.pathname === "/api/database/info"
      ) {
        sendJson(response, 200, getDatabaseInfo(database));
        return;
      }

      if (
        request.method === "POST" &&
        url.pathname === "/api/database/migrate"
      ) {
        const info = await runMigrations(database);
        sendJson(response, 200, {
          ok: true,
          ...info,
        });
        return;
      }

      if (
        request.method === "POST" &&
        url.pathname === "/api/database/backup"
      ) {
        const path = await backupDatabase(database, "manual");
        sendJson(response, 200, {
          ok: true,
          path,
        });
        return;
      }

      sendJson(response, 404, {
        ok: false,
        error: "Not found",
      });
    } catch (error) {
      console.error(error);

      sendJson(response, 500, {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  });
}

async function main() {
  assertSupportedNode();

  const command = process.argv[2] || "server";
  const database = openDatabase();

  try {
    if (command === "db:init" || command === "db:migrate") {
      const info = await runMigrations(database);
      console.log(JSON.stringify(info, null, 2));
      return;
    }

    if (command === "db:info") {
      console.log(
        JSON.stringify(
          getDatabaseInfo(database),
          null,
          2
        )
      );
      return;
    }

    if (command === "db:backup") {
      const path = await backupDatabase(database, "manual");
      console.log(path || "No database exists yet.");
      return;
    }

    if (command !== "server") {
      throw new Error(
        `Unknown database command: ${command}`
      );
    }

    await runMigrations(database);

    const port = Number(
      process.env.CHRYSALIS_API_PORT || DEFAULT_PORT
    );

    const server = createApiServer(database);

    server.listen(port, "127.0.0.1", () => {
      console.log(
        `Chrysalis API listening on http://127.0.0.1:${port}`
      );
      console.log(`Database: ${DB_PATH}`);
    });

    const shutdown = () => {
      server.close(() => {
        database.close();
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } finally {
    if (command !== "server") {
      database.close();
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
