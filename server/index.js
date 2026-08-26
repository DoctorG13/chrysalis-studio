import { createServer } from "node:http";
import { existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { DatabaseSync, backup as sqliteBackup } from "node:sqlite";

const APP_VERSION = "0.0.0";
const MIN_NODE_MAJOR = 24;
const MIN_NODE_MINOR = 15;
const DEFAULT_PORT = 4174;
const MAX_REQUEST_BYTES = 2 * 1024 * 1024;

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

      CREATE INDEX IF NOT EXISTS idx_jobs_client_id ON jobs(client_id);
      CREATE INDEX IF NOT EXISTS idx_jobs_due_date ON jobs(due_date);
      CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
      CREATE INDEX IF NOT EXISTS idx_appointments_job_id ON appointments(job_id);
      CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
      CREATE INDEX IF NOT EXISTS idx_payments_job_id ON payments(job_id);
      CREATE INDEX IF NOT EXISTS idx_fittings_job_id ON fittings(job_id);
      CREATE INDEX IF NOT EXISTS idx_assets_job_id ON assets(job_id);
      CREATE INDEX IF NOT EXISTS idx_measurements_client_id ON measurements(client_id);
      CREATE INDEX IF NOT EXISTS idx_timeline_client_id ON timeline_events(client_id);
      CREATE INDEX IF NOT EXISTS idx_timeline_job_id ON timeline_events(job_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_job_id ON invoices(job_id);

      INSERT OR REPLACE INTO app_metadata (key, value)
        VALUES ('schema_name', 'chrysalis-business-data');
    `,
  },
  {
    version: 2,
    name: "application-settings",
    sql: `
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
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

  if (!existsSync(DB_PATH)) return null;

  const safeReason = String(reason)
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-+|-+$/g, "") || "backup";

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
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

  const applied = new Map(appliedRows.map((row) => [row.version, row]));

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
      await backupDatabase(database, `before-migration-${migration.version}`);
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
        .run(migration.version, migration.name, expectedChecksum, appliedAt);
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
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
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

  const currentMigration = migrations.at(-1) || null;

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
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });

  response.end(body);
}

function readJsonBody(request) {
  return new Promise((resolveBody, reject) => {
    let body = "";
    let size = 0;

    request.setEncoding("utf8");

    request.on("data", (chunk) => {
      size += Buffer.byteLength(chunk);

      if (size > MAX_REQUEST_BYTES) {
        reject(new Error("Request body is too large."));
        request.destroy();
        return;
      }

      body += chunk;
    });

    request.on("end", () => {
      if (!body.trim()) {
        resolveBody({});
        return;
      }

      try {
        resolveBody(JSON.parse(body));
      } catch {
        reject(new Error("Request body must contain valid JSON."));
      }
    });

    request.on("error", reject);
  });
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function clientFromRow(row) {
  const stored = parseJson(row.data_json, {});

  return {
    ...stored,
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    email: row.email,
    notes: row.notes,
    status: row.status,
    created: row.created_at,
    modified: row.modified_at,
    measurements: parseJson(row.measurements_json, stored.measurements || {}),
    preferences: parseJson(row.preferences_json, stored.preferences || {}),
    tags: parseJson(row.tags_json, stored.tags || []),
    reminders: parseJson(row.reminders_json, stored.reminders || []),
    customFields: parseJson(row.custom_fields_json, stored.customFields || {}),
    jobs: Array.isArray(stored.jobs) ? stored.jobs : [],
    appointments: Array.isArray(stored.appointments) ? stored.appointments : [],
    payments: Array.isArray(stored.payments) ? stored.payments : [],
    invoices: Array.isArray(stored.invoices) ? stored.invoices : [],
    timeline: Array.isArray(stored.timeline) ? stored.timeline : [],
    photos: Array.isArray(stored.photos) ? stored.photos : [],
    documents: Array.isArray(stored.documents) ? stored.documents : [],
  };
}

function normalizeClient(input, existing = null) {
  const now = new Date().toISOString();
  const client = {
    ...(existing || {}),
    ...(input || {}),
  };

  const id = String(client.id || crypto.randomUUID());
  const created = existing?.created || client.created || now;

  return {
    ...client,
    id,
    firstName: String(client.firstName || ""),
    lastName: String(client.lastName || ""),
    phone: String(client.phone || ""),
    email: String(client.email || ""),
    notes: String(client.notes || ""),
    status: String(client.status || "Active"),
    created,
    modified: now,
    measurements: client.measurements || {},
    preferences: client.preferences || {},
    tags: Array.isArray(client.tags) ? client.tags : [],
    reminders: Array.isArray(client.reminders) ? client.reminders : [],
    customFields: client.customFields || {},
    jobs: Array.isArray(client.jobs) ? client.jobs : [],
    appointments: Array.isArray(client.appointments) ? client.appointments : [],
    payments: Array.isArray(client.payments) ? client.payments : [],
    invoices: Array.isArray(client.invoices) ? client.invoices : [],
    timeline: Array.isArray(client.timeline) ? client.timeline : [],
    photos: Array.isArray(client.photos) ? client.photos : [],
    documents: Array.isArray(client.documents) ? client.documents : [],
  };
}

function saveClient(database, input, existing = null) {
  const client = normalizeClient(input, existing);

  database
    .prepare(
      `INSERT INTO clients (
        id, first_name, last_name, phone, email, notes, status,
        created_at, modified_at, measurements_json, preferences_json,
        tags_json, reminders_json, custom_fields_json, data_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        first_name = excluded.first_name,
        last_name = excluded.last_name,
        phone = excluded.phone,
        email = excluded.email,
        notes = excluded.notes,
        status = excluded.status,
        modified_at = excluded.modified_at,
        measurements_json = excluded.measurements_json,
        preferences_json = excluded.preferences_json,
        tags_json = excluded.tags_json,
        reminders_json = excluded.reminders_json,
        custom_fields_json = excluded.custom_fields_json,
        data_json = excluded.data_json`
    )
    .run(
      client.id,
      client.firstName,
      client.lastName,
      client.phone,
      client.email,
      client.notes,
      client.status,
      client.created,
      client.modified,
      JSON.stringify(client.measurements),
      JSON.stringify(client.preferences),
      JSON.stringify(client.tags),
      JSON.stringify(client.reminders),
      JSON.stringify(client.customFields),
      JSON.stringify(client)
    );

  return client;
}

function getAllClients(database) {
  return database
    .prepare("SELECT * FROM clients ORDER BY last_name COLLATE NOCASE, first_name COLLATE NOCASE")
    .all()
    .map(clientFromRow);
}

function getClient(database, id) {
  const row = database.prepare("SELECT * FROM clients WHERE id = ?").get(id);
  return row ? clientFromRow(row) : null;
}

const DEFAULT_SETTINGS = {
  business: {
    businessName: "Chrysalis Studio",
    ownerName: "Donna",
    address: "",
    phone: "",
    email: "",
    website: "",
    abn: "",
  },
  financial: {
    gstRate: 10,
    depositPercent: 25,
    paymentTerms: 14,
    currency: "AUD",
  },
  quotesInvoices: {
    quoteValidityDays: 30,
    invoicePrefix: "INV",
    quotePrefix: "QUO",
    paymentInstructions: "",
    terms: "",
  },
  jobs: {
    referencePrefix: "CHR",
    defaultStatus: "Quote",
    defaultPriority: "Normal",
    workflowStages:
      "Quote, Cutting, Sewing, Fitting, Finishing, Completed, Collected",
  },
  calendar: {
    workingDays:
      "Monday, Tuesday, Wednesday, Thursday, Friday",
    openingTime: "09:00",
    closingTime: "17:00",
    defaultAppointmentDuration: 60,
  },
  production: {
    garmentCategories:
      "Wedding Dress, Formal Dress, Alteration, Other",
    productionStages:
      "Quote, Cutting, Sewing, Fitting, Finishing, Completed",
    measurementUnit: "cm",
  },
};

function cloneDefaultSettings() {
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

function getSettings(database) {
  const settings = cloneDefaultSettings();
  const rows = database
    .prepare("SELECT key, value FROM settings ORDER BY key")
    .all();

  for (const row of rows) {
    try {
      const stored = JSON.parse(row.value);
      if (stored && typeof stored === "object" && !Array.isArray(stored)) {
        settings[row.key] = {
          ...(settings[row.key] || {}),
          ...stored,
        };
      }
    } catch {
      // Keep the built-in defaults if a stored value is malformed.
    }
  }

  return settings;
}

function saveSettings(database, input) {
  const current = cloneDefaultSettings();
  const incoming = input && typeof input === "object" ? input : {};
  const settings = {};

  for (const key of Object.keys(current)) {
    settings[key] = {
      ...current[key],
      ...(incoming[key] && typeof incoming[key] === "object"
        ? incoming[key]
        : {}),
    };
  }

  const updatedAt = new Date().toISOString();
  const statement = database.prepare(
    `INSERT INTO settings (key, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       updated_at = excluded.updated_at`
  );

  database.exec("BEGIN IMMEDIATE");

  try {
    for (const [key, value] of Object.entries(settings)) {
      statement.run(key, JSON.stringify(value), updatedAt);
    }

    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }

  return getSettings(database);
}

function resetSettings(database) {
  database.exec("DELETE FROM settings");
  return getSettings(database);
}

function createApiServer(database) {
  return createServer(async (request, response) => {
    if (request.method === "OPTIONS") {
      response.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
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
      if (request.method === "GET" && url.pathname === "/api/health") {
        sendJson(response, 200, { ok: true, ...getDatabaseInfo(database) });
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/database/info") {
        sendJson(response, 200, getDatabaseInfo(database));
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/database/migrate") {
        const info = await runMigrations(database);
        sendJson(response, 200, { ok: true, ...info });
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/database/backup") {
        const path = await backupDatabase(database, "manual");
        sendJson(response, 200, { ok: true, path });
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/settings") {
        sendJson(response, 200, {
          ok: true,
          settings: getSettings(database),
        });
        return;
      }

      if (request.method === "PUT" && url.pathname === "/api/settings") {
        const payload = await readJsonBody(request);
        const settings = saveSettings(database, payload.settings || payload);

        sendJson(response, 200, {
          ok: true,
          settings,
        });
        return;
      }

      if (
        request.method === "POST" &&
        url.pathname === "/api/settings/reset"
      ) {
        const settings = resetSettings(database);

        sendJson(response, 200, {
          ok: true,
          settings,
        });
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/clients") {
        sendJson(response, 200, { ok: true, clients: getAllClients(database) });
        return;
      }

      if (request.method === "GET" && url.pathname.startsWith("/api/clients/")) {
        const id = decodeURIComponent(url.pathname.slice("/api/clients/".length));
        const client = getClient(database, id);

        if (!client) {
          sendJson(response, 404, { ok: false, error: "Client not found." });
          return;
        }

        sendJson(response, 200, { ok: true, client });
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/clients") {
        const payload = await readJsonBody(request);
        const input = payload.client || payload;
        const client = normalizeClient(input);

        if (getClient(database, client.id)) {
          sendJson(response, 409, { ok: false, error: "A client with this ID already exists." });
          return;
        }

        saveClient(database, client);
        sendJson(response, 201, { ok: true, client });
        return;
      }

      if (request.method === "PUT" && url.pathname.startsWith("/api/clients/")) {
        const id = decodeURIComponent(url.pathname.slice("/api/clients/".length));
        const existing = getClient(database, id);

        if (!existing) {
          sendJson(response, 404, { ok: false, error: "Client not found." });
          return;
        }

        const payload = await readJsonBody(request);
        const input = payload.client || payload;
        const client = saveClient(database, { ...input, id }, existing);

        sendJson(response, 200, { ok: true, client });
        return;
      }

      if (request.method === "DELETE" && url.pathname.startsWith("/api/clients/")) {
        const id = decodeURIComponent(url.pathname.slice("/api/clients/".length));
        const existing = getClient(database, id);

        if (!existing) {
          sendJson(response, 404, { ok: false, error: "Client not found." });
          return;
        }

        database.prepare("DELETE FROM clients WHERE id = ?").run(id);
        sendJson(response, 200, { ok: true, id });
        return;
      }

      sendJson(response, 404, { ok: false, error: "Not found" });
    } catch (error) {
      console.error(error);
      sendJson(response, 500, {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
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
      console.log(JSON.stringify(getDatabaseInfo(database), null, 2));
      return;
    }

    if (command === "db:backup") {
      const path = await backupDatabase(database, "manual");
      console.log(path || "No database exists yet.");
      return;
    }

    if (command !== "server") {
      throw new Error(`Unknown database command: ${command}`);
    }

    await runMigrations(database);

    const port = Number(process.env.CHRYSALIS_API_PORT || DEFAULT_PORT);
    const server = createApiServer(database);

    server.listen(port, "127.0.0.1", () => {
      console.log(`Chrysalis API listening on http://127.0.0.1:${port}`);
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
    if (command !== "server") database.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
