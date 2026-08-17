import { createServer } from "node:http";
import { existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import crypto from "node:crypto";

const DEFAULT_PORT = 4178;
const MAX_REQUEST_BYTES = 2 * 1024 * 1024;
const DATA_DIR = resolve(
  process.env.CHRYSALIS_DATA_DIR || join(process.cwd(), "data")
);
const DB_PATH = join(DATA_DIR, "chrysalis.db");
const PORT = Number(
  process.env.CHRYSALIS_PAYMENT_API_PORT || DEFAULT_PORT
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

function rowToPayment(row) {
  const stored = parseJson(row.data_json, {});

  return {
    ...stored,
    id: row.id,
    clientId: row.client_id,
    jobId: row.job_id || "",
    amount: Number(row.amount || 0),
    date: row.date,
    method: row.method,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getPayments(database, jobId) {
  return database
    .prepare(
      `SELECT * FROM payments
       WHERE job_id = ?
       ORDER BY date ASC, created_at ASC, id ASC`
    )
    .all(jobId)
    .map(rowToPayment);
}

function normalizePayment(input, existing = null) {
  const now = new Date().toISOString();
  const source = {
    ...(existing || {}),
    ...(input || {}),
  };

  const amount = Number(source.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Payment amount must be greater than $0.");
  }

  const date = String(source.date || "");

  if (!date) {
    throw new Error("Payment date is required.");
  }

  return {
    ...source,
    id: String(source.id || crypto.randomUUID()),
    clientId: String(source.clientId || ""),
    jobId: source.jobId ? String(source.jobId) : "",
    amount: Math.round(amount * 100) / 100,
    date,
    method: String(source.method || ""),
    description: String(source.description || "Payment"),
    createdAt: existing?.createdAt || source.createdAt || now,
    updatedAt: now,
  };
}

function savePayment(database, input, existing = null) {
  const payment = normalizePayment(input, existing);

  if (!payment.clientId) {
    throw new Error("A payment must have a clientId.");
  }

  if (!payment.jobId) {
    throw new Error("A payment must have a jobId.");
  }

  const client = database
    .prepare("SELECT id FROM clients WHERE id = ?")
    .get(payment.clientId);

  if (!client) {
    throw new Error(`Client not found: ${payment.clientId}`);
  }

  const job = database
    .prepare(
      "SELECT id, client_id AS clientId FROM jobs WHERE id = ?"
    )
    .get(payment.jobId);

  if (!job) {
    throw new Error(`Job not found: ${payment.jobId}`);
  }

  if (job.clientId !== payment.clientId) {
    throw new Error("The payment job must belong to the payment client.");
  }

  database
    .prepare(
      `INSERT INTO payments (
        id, client_id, job_id, amount, date, method, description,
        created_at, updated_at, data_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        client_id = excluded.client_id,
        job_id = excluded.job_id,
        amount = excluded.amount,
        date = excluded.date,
        method = excluded.method,
        description = excluded.description,
        updated_at = excluded.updated_at,
        data_json = excluded.data_json`
    )
    .run(
      payment.id,
      payment.clientId,
      payment.jobId,
      payment.amount,
      payment.date,
      payment.method,
      payment.description,
      payment.createdAt,
      payment.updatedAt,
      JSON.stringify(payment)
    );

  return payment;
}

function getPayment(database, id) {
  const row = database
    .prepare("SELECT * FROM payments WHERE id = ?")
    .get(id);

  return row ? rowToPayment(row) : null;
}

function deletePayment(database, id) {
  const result = database
    .prepare("DELETE FROM payments WHERE id = ?")
    .run(id);

  return Number(result.changes || 0) > 0;
}

function createPaymentServer(database) {
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
    const match = url.pathname.match(/^\/api\/payments(?:\/([^/]+))?$/);
    const identifier = match?.[1]
      ? decodeURIComponent(match[1])
      : null;

    try {
      if (request.method === "GET" && url.pathname === "/api/health") {
        sendJson(response, 200, {
          ok: true,
          service: "payments",
          databasePath: DB_PATH,
        });
        return;
      }

      if (request.method === "GET" && match && identifier) {
        const payment = getPayment(database, identifier);

        if (payment) {
          sendJson(response, 200, {
            ok: true,
            payment,
          });
          return;
        }

        const payments = getPayments(database, identifier);
        sendJson(response, 200, {
          ok: true,
          payments,
        });
        return;
      }

      if (
        (request.method === "POST" || request.method === "PUT") &&
        match &&
        identifier
      ) {
        const body = await readJsonBody(request);
        const incoming = body.payment || body;
        const existing = getPayment(database, identifier);
        const payment = savePayment(database, {
          ...incoming,
          id: existing?.id || incoming.id || identifier,
        }, existing);

        sendJson(response, 200, {
          ok: true,
          payment,
        });
        return;
      }

      if (request.method === "DELETE" && match && identifier) {
        const deleted = deletePayment(database, identifier);
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
      const message = error instanceof Error ? error.message : String(error);
      const statusCode = /not found/i.test(message) ? 404 : 400;

      sendJson(response, statusCode, {
        ok: false,
        error: message,
      });
    }
  });
}

function main() {
  const database = ensureDatabase();
  const server = createPaymentServer(database);

  server.listen(PORT, "127.0.0.1", () => {
    console.log(
      `Chrysalis Payment API listening on http://127.0.0.1:${PORT}`
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
