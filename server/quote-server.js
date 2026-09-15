import { createServer } from "node:http";
import { existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";

const PORT = Number(
  process.env.CHRYSALIS_QUOTE_API_PORT || 4182
);

const DATA_DIR = resolve(
  process.env.CHRYSALIS_DATA_DIR ||
    join(process.cwd(), "data")
);

const DB_PATH = join(
  DATA_DIR,
  "chrysalis.db"
);

const MAX_REQUEST_BYTES =
  2 * 1024 * 1024;

function openDatabase() {
  mkdirSync(DATA_DIR, {
    recursive: true,
  });

  if (!existsSync(DB_PATH)) {
    throw new Error(
      `Chrysalis database not found: ${DB_PATH}`
    );
  }

  const database = new DatabaseSync(
    DB_PATH,
    {
      timeout: 5000,
      enableForeignKeyConstraints: true,
    }
  );

  database.exec(
    "PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;"
  );

  database.exec(`
    CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY,
      client_id TEXT,
      job_id TEXT,
      number TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Draft',
      issue_date TEXT NOT NULL,
      valid_until TEXT,
      data_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (client_id)
        REFERENCES clients(id)
        ON DELETE RESTRICT,
      FOREIGN KEY (job_id)
        REFERENCES jobs(id)
        ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_quotes_client_id
      ON quotes(client_id);

    CREATE INDEX IF NOT EXISTS idx_quotes_job_id
      ON quotes(job_id);

    CREATE INDEX IF NOT EXISTS idx_quotes_issue_date
      ON quotes(issue_date);

    CREATE INDEX IF NOT EXISTS idx_quotes_number
      ON quotes(number);
  `);

  return database;
}

function sendJson(
  response,
  statusCode,
  payload
) {
  const body = JSON.stringify(
    payload,
    null,
    2
  );

  response.writeHead(statusCode, {
    "Content-Type":
      "application/json; charset=utf-8",
    "Content-Length":
      Buffer.byteLength(body),
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods":
      "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type",
  });

  response.end(body);
}

function readJsonBody(request) {
  return new Promise(
    (resolveBody, reject) => {
      let body = "";
      let size = 0;

      request.setEncoding("utf8");

      request.on("data", (chunk) => {
        size += Buffer.byteLength(
          chunk
        );

        if (
          size > MAX_REQUEST_BYTES
        ) {
          reject(
            new Error(
              "Request body is too large."
            )
          );

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
          resolveBody(
            JSON.parse(body)
          );
        } catch {
          reject(
            new Error(
              "Request body must contain valid JSON."
            )
          );
        }
      });

      request.on("error", reject);
    }
  );
}

function parseJson(
  value,
  fallback
) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function rowToQuote(row) {
  const stored = parseJson(
    row.data_json,
    {}
  );

  return {
    ...stored,
    id: row.id,
    clientId: row.client_id,
    jobId: row.job_id || "",
    number: row.number,
    amount: row.amount,
    status: row.status,
    issueDate: row.issue_date,
    validUntil:
      row.valid_until || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function listQuotes(
  database,
  clientId = "",
  jobId = ""
) {
  if (clientId && jobId) {
    return database
      .prepare(
        `SELECT *
         FROM quotes
         WHERE client_id = ?
           AND job_id = ?
         ORDER BY
           issue_date DESC,
           created_at DESC,
           id DESC`
      )
      .all(
        clientId,
        jobId
      )
      .map(rowToQuote);
  }

  if (clientId) {
    return database
      .prepare(
        `SELECT *
         FROM quotes
         WHERE client_id = ?
         ORDER BY
           issue_date DESC,
           created_at DESC,
           id DESC`
      )
      .all(clientId)
      .map(rowToQuote);
  }

  if (jobId) {
    return database
      .prepare(
        `SELECT *
         FROM quotes
         WHERE job_id = ?
         ORDER BY
           issue_date DESC,
           created_at DESC,
           id DESC`
      )
      .all(jobId)
      .map(rowToQuote);
  }

  return database
    .prepare(
      `SELECT *
       FROM quotes
       ORDER BY
         issue_date DESC,
         created_at DESC,
         id DESC`
    )
    .all()
    .map(rowToQuote);
}

function getQuote(
  database,
  id
) {
  const row = database
    .prepare(
      "SELECT * FROM quotes WHERE id = ?"
    )
    .get(id);

  return row
    ? rowToQuote(row)
    : null;
}

function assertRelations(
  database,
  quote
) {
  const client = database
    .prepare(
      "SELECT id FROM clients WHERE id = ?"
    )
    .get(quote.clientId);

  if (!client) {
    throw new Error(
      `Client not found: ${quote.clientId}`
    );
  }

  if (quote.jobId) {
    const job = database
      .prepare(
        `SELECT
           id,
           client_id AS clientId
         FROM jobs
         WHERE id = ?`
      )
      .get(quote.jobId);

    if (!job) {
      throw new Error(
        `Job not found: ${quote.jobId}`
      );
    }

    if (
      String(job.clientId) !==
      String(quote.clientId)
    ) {
      throw new Error(
        "The quote job must belong to the quote client."
      );
    }
  }
}

function normalizeQuote(
  input,
  existing = null
) {
  const source = {
    ...(existing || {}),
    ...(input || {}),
  };

  const now =
    new Date().toISOString();

  const lineItems =
    Array.isArray(
      source.lineItems
    )
      ? source.lineItems
      : [];

  const subtotal = Number(
    source.subtotal ??
      lineItems.reduce(
        (sum, item) =>
          sum +
          Number(
            item.quantity || 0
          ) *
            Number(
              item.rate || 0
            ),
        0
      )
  );

  const gst = Number(
    source.gst ?? 0
  );

  const total = Number(
    source.total ??
      subtotal + gst
  );

  const depositRequired =
    Number(
      source.depositRequired ??
        source.deposit ??
        0
    );

  const balance = Math.max(
    0,
    total - depositRequired
  );

  return {
    ...source,

    id: String(
      source.id ||
        crypto.randomUUID()
    ),

    clientId: String(
      source.clientId || ""
    ),

    jobId: source.jobId
      ? String(source.jobId)
      : "",

    number: String(
      source.number ||
        source.quoteNumber ||
        ""
    ),

    amount: total,

    subtotal,
    gst,
    total,

    depositRequired,
    balance,

    status: String(
      source.status || "Draft"
    ),

    issueDate: String(
      source.issueDate ||
        source.date ||
        now.slice(0, 10)
    ),

    validUntil: String(
      source.validUntil || ""
    ),

    lineItems,

    notes: String(
      source.notes || ""
    ),

    createdAt: String(
      existing?.createdAt ||
        source.createdAt ||
        now
    ),

    updatedAt: now,
  };
}

function updateStoredQuotes(
  database,
  table,
  id,
  quoteId,
  quote,
  remove = false
) {
  const row = database
    .prepare(
      `SELECT data_json
       FROM ${table}
       WHERE id = ?`
    )
    .get(id);

  if (!row) return;

  const stored = parseJson(
    row.data_json,
    {}
  );

  const quotes =
    Array.isArray(
      stored.quotes
    )
      ? stored.quotes
      : [];

  const next = remove
    ? quotes.filter(
        (item) =>
          item?.id !== quoteId
      )
    : [
        quote,
        ...quotes.filter(
          (item) =>
            item?.id !== quoteId
        ),
      ];

  database
    .prepare(
      `UPDATE ${table}
       SET data_json = ?
       WHERE id = ?`
    )
    .run(
      JSON.stringify({
        ...stored,
        quotes: next,
      }),
      id
    );
}

function saveQuote(
  database,
  input,
  existing = null
) {
  const quote =
    normalizeQuote(
      input,
      existing
    );

  assertRelations(
    database,
    quote
  );

  const previous =
    existing ||
    getQuote(
      database,
      quote.id
    );

  database.exec(
    "BEGIN IMMEDIATE"
  );

  try {
    database
      .prepare(
        `INSERT INTO quotes (
          id,
          client_id,
          job_id,
          number,
          amount,
          status,
          issue_date,
          valid_until,
          data_json,
          created_at,
          updated_at
        )
        VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?
        )
        ON CONFLICT(id)
        DO UPDATE SET
          client_id =
            excluded.client_id,
          job_id =
            excluded.job_id,
          number =
            excluded.number,
          amount =
            excluded.amount,
          status =
            excluded.status,
          issue_date =
            excluded.issue_date,
          valid_until =
            excluded.valid_until,
          data_json =
            excluded.data_json,
          updated_at =
            excluded.updated_at`
      )
      .run(
        quote.id,
        quote.clientId,
        quote.jobId || null,
        quote.number,
        quote.amount,
        quote.status,
        quote.issueDate,
        quote.validUntil ||
          null,
        JSON.stringify(
          quote
        ),
        quote.createdAt,
        quote.updatedAt
      );

    if (
      previous &&
      previous.clientId &&
      previous.clientId !==
        quote.clientId
    ) {
      updateStoredQuotes(
        database,
        "clients",
        previous.clientId,
        quote.id,
        previous,
        true
      );
    }

    if (
      previous &&
      previous.jobId &&
      previous.jobId !==
        quote.jobId
    ) {
      updateStoredQuotes(
        database,
        "jobs",
        previous.jobId,
        quote.id,
        previous,
        true
      );
    }

    updateStoredQuotes(
      database,
      "clients",
      quote.clientId,
      quote.id,
      quote
    );

    if (quote.jobId) {
      updateStoredQuotes(
        database,
        "jobs",
        quote.jobId,
        quote.id,
        quote
      );
    }

    database.exec("COMMIT");
  } catch (error) {
    database.exec(
      "ROLLBACK"
    );
    throw error;
  }

  return quote;
}

function deleteQuote(
  database,
  id
) {
  const existing =
    getQuote(
      database,
      id
    );

  if (!existing) {
    return false;
  }

  database.exec(
    "BEGIN IMMEDIATE"
  );

  try {
    database
      .prepare(
        "DELETE FROM quotes WHERE id = ?"
      )
      .run(id);

    updateStoredQuotes(
      database,
      "clients",
      existing.clientId,
      id,
      existing,
      true
    );

    if (existing.jobId) {
      updateStoredQuotes(
        database,
        "jobs",
        existing.jobId,
        id,
        existing,
        true
      );
    }

    database.exec("COMMIT");

    return true;
  } catch (error) {
    database.exec(
      "ROLLBACK"
    );
    throw error;
  }
}

function main() {
  const database =
    openDatabase();

  const server =
    createServer(
      async (
        request,
        response
      ) => {
        if (
          request.method ===
          "OPTIONS"
        ) {
          response.writeHead(
            204,
            {
              "Access-Control-Allow-Origin":
                "*",
              "Access-Control-Allow-Methods":
                "GET,POST,PUT,DELETE,OPTIONS",
              "Access-Control-Allow-Headers":
                "Content-Type",
            }
          );

          response.end();
          return;
        }

        const url =
          new URL(
            request.url ||
              "/",
            `http://${
              request.headers
                .host ||
              "localhost"
            }`
          );

        const match =
          url.pathname.match(
            /^\/api\/quotes(?:\/([^/]+))?$/
          );

        const id =
          match?.[1]
            ? decodeURIComponent(
                match[1]
              )
            : "";

        try {
          if (
            request.method ===
              "GET" &&
            url.pathname ===
              "/api/health"
          ) {
            return sendJson(
              response,
              200,
              {
                ok: true,
                service:
                  "quotes",
              }
            );
          }

          if (
            request.method ===
              "GET" &&
            !id
          ) {
            return sendJson(
              response,
              200,
              {
                ok: true,
                quotes:
                  listQuotes(
                    database,
                    url.searchParams.get(
                      "clientId"
                    ) || "",
                    url.searchParams.get(
                      "jobId"
                    ) || ""
                  ),
              }
            );
          }

          if (
            request.method ===
              "GET" &&
            id
          ) {
            return sendJson(
              response,
              200,
              {
                ok: true,
                quote:
                  getQuote(
                    database,
                    id
                  ),
              }
            );
          }

          if (
            request.method ===
              "POST" &&
            !id
          ) {
            const body =
              await readJsonBody(
                request
              );

            return sendJson(
              response,
              201,
              {
                ok: true,
                quote:
                  saveQuote(
                    database,
                    body.quote ||
                      body
                  ),
              }
            );
          }

          if (
            (
              request.method ===
                "PUT" ||
              request.method ===
                "POST"
            ) &&
            id
          ) {
            const body =
              await readJsonBody(
                request
              );

            const existing =
              getQuote(
                database,
                id
              );

            if (!existing) {
              return sendJson(
                response,
                404,
                {
                  ok: false,
                  error:
                    "Quote not found",
                }
              );
            }

            return sendJson(
              response,
              200,
              {
                ok: true,
                quote:
                  saveQuote(
                    database,
                    {
                      ...(body.quote ||
                        body),
                      id,
                    },
                    existing
                  ),
              }
            );
          }

          if (
            request.method ===
              "DELETE" &&
            id
          ) {
            return sendJson(
              response,
              200,
              {
                ok: true,
                deleted:
                  deleteQuote(
                    database,
                    id
                  ),
              }
            );
          }

          return sendJson(
            response,
            404,
            {
              ok: false,
              error:
                "Not found",
            }
          );
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : String(error);

          console.error(error);

          sendJson(
            response,
            /not found/i.test(
              message
            )
              ? 404
              : 400,
            {
              ok: false,
              error: message,
            }
          );
        }
      }
    );

  server.listen(
    PORT,
    "127.0.0.1",
    () =>
      console.log(
        `Chrysalis Quote API listening on http://127.0.0.1:${PORT}`
      )
  );

  const shutdown =
    () =>
      server.close(
        () => {
          database.close();
          process.exit(0);
        }
      );

  process.on(
    "SIGINT",
    shutdown
  );

  process.on(
    "SIGTERM",
    shutdown
  );
}

main();



