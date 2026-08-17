import { createServer } from "node:http";
import { existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const DEFAULT_PORT = 4177;
const MAX_REQUEST_BYTES = 2 * 1024 * 1024;
const DATA_DIR = resolve(
  process.env.CHRYSALIS_DATA_DIR || join(process.cwd(), "data")
);
const DB_PATH = join(DATA_DIR, "chrysalis.db");
const PORT = Number(
  process.env.CHRYSALIS_MEASUREMENT_API_PORT || DEFAULT_PORT
);

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

function rowToMeasurement(row) {
  return {
    id: row.id,
    clientId: row.client_id,
    jobId: row.job_id || "",
    measurements: parseJson(row.data_json, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getMeasurement(database, jobId) {
  const row = database
    .prepare(
      "SELECT * FROM measurements WHERE job_id = ? ORDER BY updated_at DESC LIMIT 1"
    )
    .get(jobId);

  return row ? rowToMeasurement(row) : null;
}

function saveMeasurement(database, input) {
  const jobId = String(input.jobId || "");
  const clientId = String(input.clientId || "");
  const measurements = input.measurements || {};

  if (!jobId) {
    throw new Error("A jobId is required.");
  }

  const job = database
    .prepare("SELECT id, client_id FROM jobs WHERE id = ?")
    .get(jobId);

  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }

  const resolvedClientId = clientId || job.client_id;

  if (resolvedClientId !== job.client_id) {
    throw new Error("Measurement clientId does not match the job client.");
  }

  const client = database
    .prepare("SELECT id FROM clients WHERE id = ?")
    .get(resolvedClientId);

  if (!client) {
    throw new Error(`Client not found: ${resolvedClientId}`);
  }

  const now = new Date().toISOString();
  const existing = database
    .prepare("SELECT * FROM measurements WHERE job_id = ? ORDER BY updated_at DESC LIMIT 1")
    .get(jobId);

  const id = existing?.id || crypto.randomUUID();
  const createdAt = existing?.created_at || now;
  const data = JSON.stringify(measurements);

  database.exec("BEGIN IMMEDIATE");

  try {
    if (existing) {
      database
        .prepare(
          `UPDATE measurements
           SET client_id = ?, job_id = ?, data_json = ?, updated_at = ?
           WHERE id = ?`
        )
        .run(resolvedClientId, jobId, data, now, id);
    } else {
      database
        .prepare(
          `INSERT INTO measurements (
            id, client_id, job_id, data_json, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run(id, resolvedClientId, jobId, data, createdAt, now);
    }

    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }

  return {
    id,
    clientId: resolvedClientId,
    jobId,
    measurements,
    createdAt,
    updatedAt: now,
  };
}

function deleteMeasurement(database, jobId) {
  const result = database
    .prepare("DELETE FROM measurements WHERE job_id = ?")
    .run(jobId);

  return Number(result.changes || 0) > 0;
}

function createMeasurementServer(database) {
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
    const match = url.pathname.match(/^\/api\/measurements(?:\/([^/]+))?$/);
    const jobId = match?.[1] ? decodeURIComponent(match[1]) : null;

    try {
      if (request.method === "GET" && url.pathname === "/api/health") {
        sendJson(response, 200, {
          ok: true,
          service: "measurements",
          databasePath: DB_PATH,
        });
        return;
      }

      if (request.method === "GET" && match && jobId) {
        const measurement = getMeasurement(database, jobId);
        sendJson(response, 200, {
          ok: true,
          measurement,
        });
        return;
      }

      if (
        (request.method === "POST" || request.method === "PUT") &&
        match &&
        jobId
      ) {
        const body = await readJsonBody(request);
        const measurement = saveMeasurement(database, {
          ...(body.measurement || body),
          jobId,
        });

        sendJson(response, 200, {
          ok: true,
          measurement,
        });
        return;
      }

      if (request.method === "DELETE" && match && jobId) {
        const deleted = deleteMeasurement(database, jobId);
        sendJson(response, 200, {
          ok: true,
          deleted,
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
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
}

function main() {
  const database = ensureDatabase();
  const server = createMeasurementServer(database);

  server.listen(PORT, "127.0.0.1", () => {
    console.log(
      `Chrysalis Measurement API listening on http://127.0.0.1:${PORT}`
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
