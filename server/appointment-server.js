import { createServer } from "node:http";
import { existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import crypto from "node:crypto";

const DEFAULT_PORT = 4176;
const MAX_REQUEST_BYTES = 2 * 1024 * 1024;
const DATA_DIR = resolve(
  process.env.CHRYSALIS_DATA_DIR || join(process.cwd(), "data")
);
const DB_PATH = join(DATA_DIR, "chrysalis.db");
const PORT = Number(
  process.env.CHRYSALIS_APPOINTMENT_API_PORT || DEFAULT_PORT
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

function rowToAppointment(row) {
  const stored = parseJson(row.data_json, {});

  return {
    ...stored,
    id: row.id,
    clientId: row.client_id,
    jobId: row.job_id || "",
    type: row.type,
    date: row.date,
    time: row.time,
    duration: row.duration,
    location: row.location,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeAppointment(input, existing = null) {
  const now = new Date().toISOString();
  const source = {
    ...(existing || {}),
    ...(input || {}),
  };

  return {
    ...source,
    id: String(source.id || crypto.randomUUID()),
    clientId: String(source.clientId || ""),
    jobId: source.jobId ? String(source.jobId) : "",
    type: String(source.type || "Consultation"),
    date: String(source.date || ""),
    time: String(source.time || ""),
    duration: Number(source.duration || 60),
    location: String(source.location || ""),
    status: String(source.status || "Scheduled"),
    notes: String(source.notes || ""),
    createdAt: existing?.createdAt || source.createdAt || now,
    updatedAt: now,
  };
}

function saveAppointment(database, input, existing = null) {
  const appointment = normalizeAppointment(input, existing);

  if (!appointment.clientId) {
    throw new Error("An appointment must have a clientId.");
  }

  const client = database
    .prepare("SELECT id FROM clients WHERE id = ?")
    .get(appointment.clientId);

  if (!client) {
    throw new Error(`Client not found: ${appointment.clientId}`);
  }

  if (appointment.jobId) {
    const job = database
      .prepare(
        "SELECT id, client_id AS clientId FROM jobs WHERE id = ?"
      )
      .get(appointment.jobId);

    if (!job) {
      throw new Error(`Job not found: ${appointment.jobId}`);
    }

    if (job.clientId !== appointment.clientId) {
      throw new Error(
        "The appointment job must belong to the appointment client."
      );
    }
  }

  database
    .prepare(
      `INSERT INTO appointments (
        id, client_id, job_id, type, date, time, duration,
        location, status, notes, created_at, updated_at, data_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        client_id = excluded.client_id,
        job_id = excluded.job_id,
        type = excluded.type,
        date = excluded.date,
        time = excluded.time,
        duration = excluded.duration,
        location = excluded.location,
        status = excluded.status,
        notes = excluded.notes,
        updated_at = excluded.updated_at,
        data_json = excluded.data_json`
    )
    .run(
      appointment.id,
      appointment.clientId,
      appointment.jobId || null,
      appointment.type,
      appointment.date,
      appointment.time,
      appointment.duration,
      appointment.location,
      appointment.status,
      appointment.notes,
      appointment.createdAt,
      appointment.updatedAt,
      JSON.stringify(appointment)
    );

  return appointment;
}

function getAppointments(database) {
  return database
    .prepare(
      `SELECT * FROM appointments
       ORDER BY date ASC, time ASC, created_at ASC, id ASC`
    )
    .all()
    .map(rowToAppointment);
}

function getAppointment(database, id) {
  const row = database
    .prepare("SELECT * FROM appointments WHERE id = ?")
    .get(id);

  return row ? rowToAppointment(row) : null;
}

function deleteAppointment(database, id) {
  const result = database
    .prepare("DELETE FROM appointments WHERE id = ?")
    .run(id);

  return Number(result.changes || 0) > 0;
}

function createAppointmentServer(database) {
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
    const match = url.pathname.match(/^\/api\/appointments(?:\/([^/]+))?$/);
    const appointmentId = match?.[1]
      ? decodeURIComponent(match[1])
      : null;

    try {
      if (request.method === "GET" && url.pathname === "/api/health") {
        sendJson(response, 200, {
          ok: true,
          service: "appointments",
          databasePath: DB_PATH,
        });
        return;
      }

      if (request.method === "GET" && match && !appointmentId) {
        sendJson(response, 200, {
          ok: true,
          appointments: getAppointments(database),
        });
        return;
      }

      if (request.method === "GET" && match && appointmentId) {
        const appointment = getAppointment(database, appointmentId);

        if (!appointment) {
          sendJson(response, 404, {
            ok: false,
            error: "Appointment not found.",
          });
          return;
        }

        sendJson(response, 200, { ok: true, appointment });
        return;
      }

      if (request.method === "POST" && match && !appointmentId) {
        const body = await readJsonBody(request);
        const appointment = saveAppointment(
          database,
          body.appointment || body
        );
        sendJson(response, 201, { ok: true, appointment });
        return;
      }

      if (request.method === "PUT" && match && appointmentId) {
        const existing = getAppointment(database, appointmentId);

        if (!existing) {
          sendJson(response, 404, {
            ok: false,
            error: "Appointment not found.",
          });
          return;
        }

        const body = await readJsonBody(request);
        const appointment = saveAppointment(
          database,
          { ...(body.appointment || body), id: appointmentId },
          existing
        );
        sendJson(response, 200, { ok: true, appointment });
        return;
      }

      if (request.method === "DELETE" && match && appointmentId) {
        const deleted = deleteAppointment(database, appointmentId);

        if (!deleted) {
          sendJson(response, 404, {
            ok: false,
            error: "Appointment not found.",
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
  const server = createAppointmentServer(database);

  server.listen(PORT, "127.0.0.1", () => {
    console.log(
      `Chrysalis Appointment API listening on http://127.0.0.1:${PORT}`
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
