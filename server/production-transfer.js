import { createServer, request as httpRequest } from "node:http";
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  statSync,
  unlinkSync,
} from "node:fs";
import { basename, join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

import {
  getAuthenticatedUser,
  validateAuthConfiguration,
} from "./auth.js";

const DATA_DIR = resolve(
  process.env.CHRYSALIS_DATA_DIR || join(process.cwd(), "data")
);
const BACKUP_DIR = join(DATA_DIR, "backups");
const PUBLIC_PORT = Number(process.env.PORT || 4173);
const INTERNAL_PORT = 4172;
const MAX_TRANSFER_BYTES = 100 * 1024 * 1024;

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);

  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  response.end(body);
}

function isSameOrigin(request) {
  const origin = String(request.headers.origin || "");
  if (!origin) return true;

  const forwardedProto = String(
    request.headers["x-forwarded-proto"] || "https"
  )
    .split(",")[0]
    .trim();
  const host = String(request.headers.host || "");

  return Boolean(host) && origin === `${forwardedProto}://${host}`;
}

function authenticate(request, response) {
  const user = getAuthenticatedUser(request, authConfig);

  if (!user) {
    sendJson(response, 401, {
      ok: false,
      error: "Authentication required.",
    });
    return false;
  }

  if (
    ["POST", "PUT", "PATCH", "DELETE"].includes(request.method) &&
    !isSameOrigin(request)
  ) {
    sendJson(response, 403, {
      ok: false,
      error: "Cross-origin requests are not permitted.",
    });
    return false;
  }

  return true;
}

function getSafeBackupPath(id) {
  const filename = basename(String(id || ""));

  if (
    !filename ||
    filename !== String(id || "") ||
    !filename.startsWith("chrysalis-") ||
    !filename.endsWith(".db")
  ) {
    throw new Error("Invalid backup version.");
  }

  const fullPath = join(BACKUP_DIR, filename);

  if (!existsSync(fullPath) || !statSync(fullPath).isFile()) {
    throw new Error("That backup version could not be found.");
  }

  return fullPath;
}

function validateImportedDatabase(filePath) {
  const database = new DatabaseSync(filePath, {
    readOnly: true,
    timeout: 5000,
    enableForeignKeyConstraints: false,
  });

  try {
    const tables = new Set(
      database
        .prepare(
          `SELECT name FROM sqlite_master
           WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`
        )
        .all()
        .map((row) => row.name)
    );

    const requiredTables = [
      "schema_migrations",
      "clients",
      "jobs",
      "settings",
    ];

    const missing = requiredTables.filter(
      (table) => !tables.has(table)
    );

    if (missing.length > 0) {
      throw new Error(
        `This file is not a valid Chrysalis backup. Missing required table(s): ${missing.join(
          ", "
        )}.`
      );
    }

    const integrity = database.prepare("PRAGMA integrity_check").get();
    if (integrity?.integrity_check !== "ok") {
      throw new Error("This file failed the SQLite integrity check.");
    }
  } finally {
    database.close();
  }
}

function writeUpload(request, destination) {
  return new Promise((resolveUpload, rejectUpload) => {
    let settled = false;
    let size = 0;
    const output = createWriteStream(destination, { flags: "wx" });

    const fail = (error) => {
      if (settled) return;
      settled = true;
      output.destroy();
      rejectUpload(error);
    };

    const succeed = () => {
      if (settled) return;
      settled = true;
      resolveUpload();
    };

    output.on("error", fail);
    output.on("finish", succeed);

    request.on("data", (chunk) => {
      if (settled) return;

      size += chunk.length;

      if (size > MAX_TRANSFER_BYTES) {
        fail(
          new Error(
            `Backup file is too large. The maximum supported size is ${
              MAX_TRANSFER_BYTES / (1024 * 1024)
            } MB.`
          )
        );
        request.destroy();
        return;
      }

      output.write(chunk);
    });

    request.on("end", () => {
      if (!settled) output.end();
    });

    request.on("error", fail);
  });
}

function getPublicForwardingHeaders(request) {
  const publicHost = String(request.headers.host || "")
    .split(",")[0]
    .trim();
  const forwardedProto = String(
    request.headers["x-forwarded-proto"] || "https"
  )
    .split(",")[0]
    .trim();

  return {
    "x-forwarded-host": publicHost,
    "x-forwarded-proto": forwardedProto,
  };
}

function proxyToInternal(request, response, path) {
  const publicForwardingHeaders = getPublicForwardingHeaders(request);

  const proxy = httpRequest(
    {
      hostname: "127.0.0.1",
      port: INTERNAL_PORT,
      path,
      method: request.method,
      headers: {
        ...request.headers,
        ...publicForwardingHeaders,
        host: publicForwardingHeaders["x-forwarded-host"],
        connection: "close",
      },
    },
    (upstream) => {
      response.writeHead(upstream.statusCode || 502, upstream.headers);
      upstream.pipe(response);
    }
  );

  proxy.on("error", (error) => {
    console.error("[Chrysalis transfer gateway] Internal proxy error:", error);

    if (!response.headersSent) {
      sendJson(response, 502, {
        ok: false,
        error: "Chrysalis API is temporarily unavailable.",
      });
      return;
    }

    response.end();
  });

  request.pipe(proxy);
}

function wait(milliseconds) {
  return new Promise((resolveWait) => setTimeout(resolveWait, milliseconds));
}

async function waitForInternalGateway() {
  const deadline = Date.now() + 30000;

  while (Date.now() < deadline) {
    const healthy = await new Promise((resolveHealth) => {
      const request = httpRequest(
        {
          hostname: "127.0.0.1",
          port: INTERNAL_PORT,
          path: "/health",
          method: "GET",
        },
        (response) => {
          response.resume();
          response.on("end", () => resolveHealth(response.statusCode === 200));
        }
      );

      request.setTimeout(1000, () => {
        request.destroy();
        resolveHealth(false);
      });
      request.on("error", () => resolveHealth(false));
      request.end();
    });

    if (healthy) return;
    await wait(250);
  }

  throw new Error("Internal Chrysalis production gateway did not become ready.");
}

const authConfig = validateAuthConfiguration();

// The existing production gateway remains the source of truth for all normal
// application traffic. It binds to localhost:4172 so this transfer gateway
// can add the authenticated file-transfer endpoints on the public PORT.
process.env.PORT = String(INTERNAL_PORT);
await import("./production.js");
await waitForInternalGateway();

mkdirSync(BACKUP_DIR, { recursive: true });

const server = createServer(async (request, response) => {
  const url = new URL(
    request.url || "/",
    `http://${request.headers.host || "localhost"}`
  );

  const downloadPrefix = "/api/database/backups/";
  const restoreUploadPath = "/api/database/restore-upload";

  if (
    request.method === "GET" &&
    url.pathname.startsWith(downloadPrefix) &&
    url.pathname.endsWith("/download")
  ) {
    if (!authenticate(request, response)) return;

    try {
      const id = decodeURIComponent(
        url.pathname.slice(downloadPrefix.length, -"/download".length)
      );
      const filePath = getSafeBackupPath(id);
      const stats = statSync(filePath);

      response.writeHead(200, {
        "Content-Type": "application/x-sqlite3",
        "Content-Length": stats.size,
        "Content-Disposition": `attachment; filename="${basename(filePath)}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });

      createReadStream(filePath).pipe(response);
    } catch (error) {
      sendJson(response, 404, {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return;
  }

  if (url.pathname === restoreUploadPath && request.method === "POST") {
    if (!authenticate(request, response)) return;

    const contentLength = Number(request.headers["content-length"] || 0);
    if (contentLength > MAX_TRANSFER_BYTES) {
      sendJson(response, 413, {
        ok: false,
        error: `Backup file is too large. The maximum supported size is ${
          MAX_TRANSFER_BYTES / (1024 * 1024)
        } MB.`,
      });
      request.resume();
      return;
    }

    const importedFilename = `chrysalis-import-${randomUUID()}.db`;
    const importedPath = join(BACKUP_DIR, importedFilename);

    try {
      await writeUpload(request, importedPath);
      validateImportedDatabase(importedPath);

      await new Promise((resolveProxy, rejectProxy) => {
        const proxy = httpRequest(
          {
            hostname: "127.0.0.1",
            port: INTERNAL_PORT,
            path: `/api/database/restore/${encodeURIComponent(importedFilename)}`,
            method: "POST",
            headers: {
              cookie: request.headers.cookie || "",
              host: `127.0.0.1:${INTERNAL_PORT}`,
              connection: "close",
            },
          },
          (upstream) => {
            response.writeHead(
              upstream.statusCode || 502,
              upstream.headers
            );
            upstream.pipe(response);
            upstream.on("end", resolveProxy);
            upstream.on("error", rejectProxy);
          }
        );

        proxy.on("error", rejectProxy);
        proxy.end();
      });
    } catch (error) {
      if (!response.headersSent) {
        sendJson(response, 400, {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Unable to restore the uploaded backup.",
        });
      }
    } finally {
      try {
        if (existsSync(importedPath)) unlinkSync(importedPath);
      } catch (cleanupError) {
        console.error(
          "[Chrysalis transfer gateway] Unable to remove imported backup:",
          cleanupError
        );
      }
    }
    return;
  }

  proxyToInternal(request, response, `${url.pathname}${url.search}`);
});

server.listen(PUBLIC_PORT, "0.0.0.0", () => {
  console.log(
    `[Chrysalis transfer gateway] Public gateway listening on 0.0.0.0:${PUBLIC_PORT}`
  );
  console.log(
    `[Chrysalis transfer gateway] Internal production gateway: 127.0.0.1:${INTERNAL_PORT}`
  );
  console.log("[Chrysalis transfer gateway] Portable backup transfer is enabled.");
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
