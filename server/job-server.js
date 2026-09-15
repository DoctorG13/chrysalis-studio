import { createServer } from "node:http";
import { existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const DEFAULT_PORT = 4175;
const MAX_REQUEST_BYTES = 2 * 1024 * 1024;
const DATA_DIR = resolve(
  process.env.CHRYSALIS_DATA_DIR || join(process.cwd(), "data")
);
const DB_PATH = join(DATA_DIR, "chrysalis.db");
const PORT = Number(process.env.CHRYSALIS_JOB_API_PORT || DEFAULT_PORT);

function ensureDatabase() {
  mkdirSync(DATA_DIR, { recursive: true });

  if (!existsSync(DB_PATH)) {
    throw new Error(`Chrysalis database not found: ${DB_PATH}`);
  }

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

function fittingFromRow(row) {
  const stored = parseJson(row.data_json, {});

  return {
    ...stored,
    id: row.id,
    clientId: row.client_id,
    jobId: row.job_id || "",
    title: row.title,
    date: row.date,
    time: row.time,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getFittings(database, jobId) {
  return database
    .prepare(
      `SELECT * FROM fittings
       WHERE job_id = ?
       ORDER BY date ASC, time ASC, created_at ASC, id ASC`
    )
    .all(jobId)
    .map(fittingFromRow);
}

function normalizeFitting(input, job) {
  const now = new Date().toISOString();
  const source = input || {};

  return {
    ...source,
    id: String(source.id || crypto.randomUUID()),
    clientId: job.clientId,
    jobId: job.id,
    title: String(
      source.title || source.name || source.type || "Fitting"
    ),
    date: String(
      source.date || source.fittingDate || ""
    ),
    time: String(
      source.time || source.fittingTime || ""
    ),
    status: String(source.status || "Scheduled"),
    notes: String(
      source.notes || source.description || ""
    ),
    createdAt: String(source.createdAt || now),
    updatedAt: now,
  };
}

function syncJobFittings(database, job) {
  const incoming = Array.isArray(job.fittings)
    ? job.fittings.map((fitting) =>
        normalizeFitting(fitting, job)
      )
    : [];

  const incomingIds = new Set(
    incoming.map((fitting) => fitting.id)
  );

  const existingRows = database
    .prepare(
      `SELECT id FROM fittings
       WHERE job_id = ?`
    )
    .all(job.id);

  for (const row of existingRows) {
    if (!incomingIds.has(row.id)) {
      database
        .prepare("DELETE FROM fittings WHERE id = ?")
        .run(row.id);
    }
  }

  for (const fitting of incoming) {
    database
      .prepare(
        `INSERT INTO fittings (
          id, client_id, job_id, title, date, time, status,
          notes, created_at, updated_at, data_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          client_id = excluded.client_id,
          job_id = excluded.job_id,
          title = excluded.title,
          date = excluded.date,
          time = excluded.time,
          status = excluded.status,
          notes = excluded.notes,
          updated_at = excluded.updated_at,
          data_json = excluded.data_json`
      )
      .run(
        fitting.id,
        fitting.clientId,
        fitting.jobId,
        fitting.title,
        fitting.date,
        fitting.time,
        fitting.status,
        fitting.notes,
        fitting.createdAt,
        fitting.updatedAt,
        JSON.stringify(fitting)
      );
  }
}

function rowToJob(row, database) {
  const stored = parseJson(row.data_json, {});
  const fittings = getFittings(database, row.id);

  return {
    ...stored,
    id: row.id,
    clientId: row.client_id,
    reference: row.reference,
    name: row.name,
    dueDate: row.due_date || "",
    priority: row.priority,
    status: row.status,
    description: row.description,
    price: row.price,
    deposit: row.deposit,
    garmentType: row.garment_type,
    createdAt: row.created_at,
    updatedAt: row.modified_at,
    modified: row.modified_at,
    timeline: Array.isArray(stored.timeline) ? stored.timeline : [],
    fittings,
    payments: Array.isArray(stored.payments) ? stored.payments : [],
    photos: Array.isArray(stored.photos) ? stored.photos : [],
    measurements: stored.measurements || {},
  };
}

function normalizeJob(input, existing = null) {
  const now = new Date().toISOString();
  const source = {
    ...(existing || {}),
    ...(input || {}),
  };

  return {
    ...source,
    id: String(source.id || crypto.randomUUID()),
    clientId: String(source.clientId || ""),
    reference: String(source.reference || ""),
    name: String(source.name || ""),
    dueDate: String(source.dueDate || ""),
    priority: String(source.priority || "Normal"),
    status: String(source.status || "Quote"),
    description: String(source.description || ""),
    price: Number(source.price || 0),
    deposit: Number(source.deposit || 0),
    garmentType: String(source.garmentType || ""),
    createdAt: existing?.createdAt || source.createdAt || now,
    updatedAt: now,
    timeline: Array.isArray(source.timeline) ? source.timeline : [],
    fittings: Array.isArray(source.fittings) ? source.fittings : [],
    payments: Array.isArray(source.payments) ? source.payments : [],
    photos: Array.isArray(source.photos) ? source.photos : [],
    measurements: source.measurements || {},
  };
}

function appendTimelineEvent(database, table, id, event) {
  const row = database
    .prepare(`SELECT data_json FROM ${table} WHERE id = ?`)
    .get(id);

  if (!row) return;

  const stored = parseJson(row.data_json, {});
  const timeline = Array.isArray(stored.timeline)
    ? stored.timeline
    : [];

  const nextTimeline = [
    event,
    ...timeline.filter(
      (item) => item?.id !== event.id
    ),
  ];

  database
    .prepare(`UPDATE ${table} SET data_json = ? WHERE id = ?`)
    .run(
      JSON.stringify({
        ...stored,
        timeline: nextTimeline,
      }),
      id
    );
}

function createWorkflowEvent(database, job, previous = null) {
  const statusChanged =
    !previous || previous.status !== job.status;

  if (!statusChanged) {
    return null;
  }

  const now = new Date().toISOString();
  const event = {
    id: crypto.randomUUID(),
    clientId: job.clientId,
    jobId: job.id,
    type: "workflow",
    title: previous
      ? "Workflow status changed"
      : "Job created",
    description: previous
      ? `${previous.status || "Unknown"} → ${job.status || "Unknown"}`
      : `Job created at ${job.status || "Quote"}`,
    date: now,
  };

  database
    .prepare(
      `INSERT INTO timeline_events
        (id, client_id, job_id, type, title, description, date, data_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      event.id,
      event.clientId,
      event.jobId,
      event.type,
      event.title,
      event.description,
      event.date,
      JSON.stringify(event)
    );

  appendTimelineEvent(
    database,
    "jobs",
    job.id,
    event
  );

  appendTimelineEvent(
    database,
    "clients",
    job.clientId,
    event
  );

  return event;
}

function saveJob(database, input, existing = null) {
  const job = normalizeJob(input, existing);

  if (!job.clientId) {
    throw new Error("A job must have a clientId.");
  }

  const client = database
    .prepare("SELECT id FROM clients WHERE id = ?")
    .get(job.clientId);

  if (!client) {
    throw new Error(`Client not found: ${job.clientId}`);
  }

  database.exec("BEGIN IMMEDIATE");

  try {
    const data = JSON.stringify({
      ...job,
      fittings: [],
    });

    database
      .prepare(
        `INSERT INTO jobs (
          id, client_id, reference, name, due_date, priority, status,
          description, price, deposit, garment_type, created_at,
          modified_at, data_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          client_id = excluded.client_id,
          reference = excluded.reference,
          name = excluded.name,
          due_date = excluded.due_date,
          priority = excluded.priority,
          status = excluded.status,
          description = excluded.description,
          price = excluded.price,
          deposit = excluded.deposit,
          garment_type = excluded.garment_type,
          modified_at = excluded.modified_at,
          data_json = excluded.data_json`
      )
      .run(
        job.id,
        job.clientId,
        job.reference,
        job.name,
        job.dueDate || null,
        job.priority,
        job.status,
        job.description,
        job.price,
        job.deposit,
        job.garmentType,
        job.createdAt,
        job.updatedAt,
        data
      );

    syncJobFittings(database, job);
    createWorkflowEvent(database, job, existing);
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }

  return getJob(database, job.id);
}

function getJobs(database) {
  return database
    .prepare("SELECT * FROM jobs ORDER BY created_at DESC, id DESC")
    .all()
    .map((row) => rowToJob(row, database));
}

function getJob(database, id) {
  const row = database
    .prepare("SELECT * FROM jobs WHERE id = ?")
    .get(id);

  return row ? rowToJob(row, database) : null;
}

function deleteJob(database, id) {
  const result = database
    .prepare("DELETE FROM jobs WHERE id = ?")
    .run(id);

  return Number(result.changes || 0) > 0;
}

function createJobServer(database) {
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
    const match = url.pathname.match(/^\/api\/jobs(?:\/([^/]+))?$/);
    const jobId = match?.[1] ? decodeURIComponent(match[1]) : null;

    try {
      if (request.method === "GET" && url.pathname === "/api/health") {
        sendJson(response, 200, {
          ok: true,
          service: "jobs",
          databasePath: DB_PATH,
        });
        return;
      }

      if (request.method === "GET" && match && !jobId) {
        sendJson(response, 200, {
          ok: true,
          jobs: getJobs(database),
        });
        return;
      }

      if (request.method === "GET" && match && jobId) {
        const job = getJob(database, jobId);

        if (!job) {
          sendJson(response, 404, {
            ok: false,
            error: "Job not found.",
          });
          return;
        }

        sendJson(response, 200, { ok: true, job });
        return;
      }

      if (request.method === "POST" && match && !jobId) {
        const body = await readJsonBody(request);
        const job = saveJob(database, body.job);
        sendJson(response, 201, { ok: true, job });
        return;
      }

      if (request.method === "PUT" && match && jobId) {
        const existing = getJob(database, jobId);

        if (!existing) {
          sendJson(response, 404, {
            ok: false,
            error: "Job not found.",
          });
          return;
        }

        const body = await readJsonBody(request);
        const job = saveJob(
          database,
          { ...(body.job || {}), id: jobId },
          existing
        );
        sendJson(response, 200, { ok: true, job });
        return;
      }

      if (request.method === "DELETE" && match && jobId) {
        const deleted = deleteJob(database, jobId);

        if (!deleted) {
          sendJson(response, 404, {
            ok: false,
            error: "Job not found.",
          });
          return;
        }

        sendJson(response, 200, { ok: true });
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
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
}

function main() {
  const database = ensureDatabase();
  const server = createJobServer(database);

  server.listen(PORT, "127.0.0.1", () => {
    console.log(
      `Chrysalis Job API listening on http://127.0.0.1:${PORT}`
    );
  });

  const shutdown = () => {
    server.close(() => {
      database.close();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main();
