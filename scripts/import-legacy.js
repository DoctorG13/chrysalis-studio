import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { DatabaseSync, backup as sqliteBackup } from "node:sqlite";

const DATA_DIR = resolve(
  process.env.CHRYSALIS_DATA_DIR || join(process.cwd(), "data")
);
const DB_PATH = join(DATA_DIR, "chrysalis.db");
const BACKUP_DIR = join(DATA_DIR, "backups");
const SCHEMA_VERSION = 1;

function usage() {
  console.log(`Usage:\n  npm run db:import -- <legacy-json-file>\n\nExample:\n  npm run db:import -- chrysalis-localstorage.json`);
}

function now() {
  return new Date().toISOString();
}

function text(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function array(value) {
  return Array.isArray(value) ? value : [];
}

function object(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function parseJsonFile(path) {
  const raw = readFileSync(path, "utf8").replace(/^\uFEFF/, "").trim();
  if (!raw) throw new Error("The legacy JSON file is empty.");

  const parsed = JSON.parse(raw);
  const clients = Array.isArray(parsed)
    ? parsed
    : array(parsed.clients || parsed.data || parsed.value);

  if (!Array.isArray(clients)) {
    throw new Error(
      "The legacy file does not contain a clients array. Expected the contents of localStorage key chrysalis-clients."
    );
  }

  return clients;
}

function stableId(prefix, parentId, index, value) {
  if (value?.id) return text(value.id);

  const hash = createHash("sha1")
    .update(`${prefix}:${parentId}:${index}:${JSON.stringify(value)}`)
    .digest("hex")
    .slice(0, 20);

  return `${prefix}-${hash}`;
}

function createDatabase() {
  if (!existsSync(DB_PATH)) {
    throw new Error(
      `Database not found at ${DB_PATH}. Run "npm run db:init" first.`
    );
  }

  const database = new DatabaseSync(DB_PATH, {
    timeout: 5000,
    enableForeignKeyConstraints: true,
  });

  database.exec("PRAGMA foreign_keys = ON;");
  return database;
}

function ensureReady(database) {
  const migration = database
    .prepare(
      "SELECT MAX(version) AS version FROM schema_migrations"
    )
    .get();

  if (Number(migration?.version || 0) < SCHEMA_VERSION) {
    throw new Error(
      `Database schema is not ready. Expected version ${SCHEMA_VERSION}. Run "npm run db:migrate" first.`
    );
  }
}

async function backup(database) {
  mkdirSync(BACKUP_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const destination = join(
    BACKUP_DIR,
    `chrysalis-before-legacy-import-${timestamp}.db`
  );

  await sqliteBackup(database, destination);
  return destination;
}

function json(value) {
  return JSON.stringify(value ?? {});
}

function dateValue(value) {
  return text(value || "");
}

function clientName(client) {
  const firstName = text(client.firstName ?? client.first_name);
  const lastName = text(client.lastName ?? client.last_name);
  return { firstName, lastName };
}

function insertClient(database, client, timestamp) {
  const id = stableId("client", "root", 0, client);
  const { firstName, lastName } = clientName(client);

  database
    .prepare(
      `INSERT OR IGNORE INTO clients
       (id, first_name, last_name, phone, email, notes, status,
        created_at, modified_at, measurements_json, preferences_json,
        tags_json, reminders_json, custom_fields_json, data_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      firstName,
      lastName,
      text(client.phone),
      text(client.email),
      text(client.notes),
      text(client.status, "Active"),
      text(client.createdAt || client.created_at, timestamp),
      text(client.modifiedAt || client.modified_at, timestamp),
      json(client.measurements),
      json(client.preferences),
      json(client.tags || []),
      json(client.reminders || []),
      json(client.customFields),
      json(client)
    );

  return id;
}

function importJob(database, client, clientId, job, index, timestamp, counts) {
  const jobId = stableId("job", clientId, index, job);

  database
    .prepare(
      `INSERT OR IGNORE INTO jobs
       (id, client_id, reference, name, due_date, priority, status,
        description, price, deposit, garment_type, created_at, modified_at,
        data_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      jobId,
      clientId,
      text(job.reference || job.jobReference),
      text(job.name || job.title || job.jobName),
      job.dueDate ?? job.due_date ?? null,
      text(job.priority, "Normal"),
      text(job.status, "Quote"),
      text(job.description),
      number(job.price ?? job.total ?? job.amount),
      number(job.deposit),
      text(job.garmentType || job.garment_type),
      text(job.createdAt || job.created_at, timestamp),
      text(job.modifiedAt || job.modified_at, timestamp),
      json(job)
    );

  counts.jobs += 1;

  for (const [collectionName, type] of [
    ["appointments", "appointment"],
    ["fittings", "fitting"],
    ["payments", "payment"],
    ["photos", "asset"],
    ["assets", "asset"],
    ["timeline", "timeline"],
    ["timelineEvents", "timeline"],
  ]) {
    const items = array(job[collectionName]);
    items.forEach((item, itemIndex) => {
      importRelated(database, client, clientId, jobId, item, itemIndex, type, timestamp, counts);
    });
  }

  const measurements = job.measurements;
  if (measurements && typeof measurements === "object") {
    const measurementId = stableId("measurement", jobId, 0, measurements);
    database
      .prepare(
        `INSERT OR IGNORE INTO measurements
         (id, client_id, job_id, data_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        measurementId,
        clientId,
        jobId,
        json(measurements),
        timestamp,
        timestamp
      );
    counts.measurements += 1;
  }
}

function importRelated(
  database,
  client,
  clientId,
  jobId,
  item,
  index,
  type,
  timestamp,
  counts
) {
  if (!item || typeof item !== "object") return;

  if (type === "appointment") {
    const id = stableId("appointment", jobId, index, item);
    database
      .prepare(
        `INSERT OR IGNORE INTO appointments
         (id, client_id, job_id, type, date, time, duration, location,
          status, notes, created_at, updated_at, data_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        clientId,
        jobId,
        text(item.type, "Consultation"),
        dateValue(item.date),
        text(item.time),
        number(item.duration, 60),
        text(item.location),
        text(item.status, "Scheduled"),
        text(item.notes),
        text(item.createdAt || item.created_at, timestamp),
        text(item.updatedAt || item.updated_at, timestamp),
        json(item)
      );
    counts.appointments += 1;
    return;
  }

  if (type === "fitting") {
    const id = stableId("fitting", jobId, index, item);
    database
      .prepare(
        `INSERT OR IGNORE INTO fittings
         (id, client_id, job_id, title, date, time, status, notes,
          created_at, updated_at, data_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        clientId,
        jobId,
        text(item.title || item.name),
        dateValue(item.date),
        text(item.time),
        text(item.status, "Scheduled"),
        text(item.notes),
        text(item.createdAt || item.created_at, timestamp),
        text(item.updatedAt || item.updated_at, timestamp),
        json(item)
      );
    counts.fittings += 1;
    return;
  }

  if (type === "payment") {
    const id = stableId("payment", jobId, index, item);
    database
      .prepare(
        `INSERT OR IGNORE INTO payments
         (id, client_id, job_id, amount, date, method, description,
          created_at, updated_at, data_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        clientId,
        jobId,
        number(item.amount),
        dateValue(item.date),
        text(item.method),
        text(item.description, "Payment"),
        text(item.createdAt || item.created_at, timestamp),
        text(item.updatedAt || item.updated_at, timestamp),
        json(item)
      );
    counts.payments += 1;
    return;
  }

  if (type === "asset") {
    const id = stableId("asset", jobId, index, item);
    database
      .prepare(
        `INSERT OR IGNORE INTO assets
         (id, client_id, job_id, kind, caption, date, url, file_path,
          created_at, updated_at, data_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        clientId,
        jobId,
        text(item.kind, "photo"),
        text(item.caption || item.title),
        dateValue(item.date),
        text(item.url || item.src || item.dataUrl),
        text(item.filePath || item.file_path),
        text(item.createdAt || item.created_at, timestamp),
        text(item.updatedAt || item.updated_at, timestamp),
        json(item)
      );
    counts.assets += 1;
    return;
  }

  const id = stableId("timeline", jobId, index, item);
  database
    .prepare(
      `INSERT OR IGNORE INTO timeline_events
       (id, client_id, job_id, type, title, description, date, data_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      clientId,
      jobId,
      text(item.type, "note"),
      text(item.title || item.name),
      text(item.description || item.notes),
      dateValue(item.date || item.createdAt),
      json(item)
    );
  counts.timeline += 1;
}

function importClientRelated(database, client, clientId, timestamp, counts) {
  for (const [collectionName, type] of [
    ["appointments", "appointment"],
    ["fittings", "fitting"],
    ["payments", "payment"],
    ["photos", "asset"],
    ["assets", "asset"],
    ["timeline", "timeline"],
    ["timelineEvents", "timeline"],
  ]) {
    array(client[collectionName]).forEach((item, index) => {
      importRelated(database, client, clientId, null, item, index, type, timestamp, counts);
    });
  }

  if (client.measurements && typeof client.measurements === "object") {
    const id = stableId("measurement", clientId, 0, client.measurements);
    database
      .prepare(
        `INSERT OR IGNORE INTO measurements
         (id, client_id, job_id, data_json, created_at, updated_at)
         VALUES (?, ?, NULL, ?, ?, ?)`
      )
      .run(id, clientId, json(client.measurements), timestamp, timestamp);
    counts.measurements += 1;
  }
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    usage();
    process.exitCode = 1;
    return;
  }

  const resolvedInput = resolve(inputPath);
  if (!existsSync(resolvedInput)) {
    throw new Error(`Legacy JSON file not found: ${resolvedInput}`);
  }

  const clients = parseJsonFile(resolvedInput);
  const database = createDatabase();

  try {
    ensureReady(database);
    const backupPath = await backup(database);
    const counts = {
      clients: 0,
      jobs: 0,
      appointments: 0,
      fittings: 0,
      payments: 0,
      assets: 0,
      measurements: 0,
      timeline: 0,
    };
    const timestamp = now();

    database.exec("BEGIN IMMEDIATE");

    try {
      for (const [index, client] of clients.entries()) {
        if (!client || typeof client !== "object") continue;

        const clientId = client.id
          ? text(client.id)
          : stableId("client", "root", index, client);

        const inserted = database
          .prepare("SELECT 1 FROM clients WHERE id = ?")
          .get(clientId);

        insertClient(database, { ...client, id: clientId }, timestamp);
        if (!inserted) counts.clients += 1;

        array(client.jobs).forEach((job, jobIndex) => {
          if (job && typeof job === "object") {
            importJob(database, client, clientId, job, jobIndex, timestamp, counts);
          }
        });

        importClientRelated(database, client, clientId, timestamp, counts);
      }

      database
        .prepare(
          `INSERT OR REPLACE INTO app_metadata (key, value)
           VALUES ('legacy_import_completed_at', ?)`
        )
        .run(timestamp);

      database
        .prepare(
          `INSERT OR REPLACE INTO app_metadata (key, value)
           VALUES ('legacy_import_source', ?)`
        )
        .run(resolvedInput);

      database.exec("COMMIT");
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }

    console.log(JSON.stringify({
      ok: true,
      source: resolvedInput,
      backup: backupPath,
      imported: counts,
    }, null, 2));
  } finally {
    database.close();
  }
}

main().catch((error) => {
  console.error(`Legacy import failed: ${error.message}`);
  process.exitCode = 1;
});
