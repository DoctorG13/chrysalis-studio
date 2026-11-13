
import { createWriteStream, existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync, backup as sqliteBackup } from "node:sqlite";
import { importDonnaMigration } from "./donna-migration-import.js";

const ROUTE = "/api/admin/donna-migration";
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
const COMMIT_CONFIRMATION = "IMPORT DONNA CHRYSALIS WORKSPACE";

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);

  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });

  response.end(body);
}

function receivePackage(request, destination) {
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

    output.on("error", fail);
    output.on("finish", () => {
      if (settled) return;
      settled = true;
      resolveUpload(size);
    });

    request.on("data", (chunk) => {
      if (settled) return;

      size += chunk.length;

      if (size > MAX_UPLOAD_BYTES) {
        fail(new Error("Migration package exceeds the 100 MB upload limit."));
        request.resume();
        return;
      }

      if (!output.write(chunk)) {
        request.pause();
        output.once("drain", () => request.resume());
      }
    });

    request.on("end", () => {
      if (!settled) output.end();
    });

    request.on("error", fail);
    output.on("error", fail);
  });
}

async function createPreImportBackup(databasePath, backupDirectory) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupName = `chrysalis-before-donna-${timestamp}-${randomUUID()}.db`;
  const backupPath = join(backupDirectory, backupName);

  const database = new DatabaseSync(databasePath, {
    timeout: 10000,
    enableForeignKeyConstraints: true,
  });

  try {
    await sqliteBackup(database, backupPath);
  } finally {
    database.close();
  }

  if (!existsSync(backupPath)) {
    throw new Error("The pre-import Railway backup could not be verified.");
  }

  const verification = new DatabaseSync(backupPath, {
    readOnly: true,
    timeout: 5000,
  });

  try {
    const integrity = verification.prepare(
      "PRAGMA integrity_check"
    ).get()?.integrity_check;

    if (integrity !== "ok") {
      throw new Error("The pre-import backup failed SQLite integrity verification.");
    }
  } finally {
    verification.close();
  }

  return {
    name: backupName,
    path: backupPath,
  };
}

export async function handleDonnaMigrationRoute({
  request,
  response,
  url,
  authenticate,
  requireSameOrigin,
  databasePath,
  backupDirectory,
}) {
  if (url.pathname !== ROUTE || request.method !== "POST") {
    return false;
  }

  if (!authenticate(request, response)) return true;
  if (!requireSameOrigin(request, response)) return true;

  const mode = url.searchParams.get("mode") || "dry-run";

  if (!["dry-run", "commit"].includes(mode)) {
    sendJson(response, 400, {
      ok: false,
      error: "Mode must be dry-run or commit.",
    });
    request.resume();
    return true;
  }

  if (
    mode === "commit" &&
    request.headers["x-migration-confirmation"] !== COMMIT_CONFIRMATION
  ) {
    sendJson(response, 400, {
      ok: false,
      error: "Explicit production migration confirmation is required.",
    });
    request.resume();
    return true;
  }

  const contentLength = Number(request.headers["content-length"] || 0);

  if (contentLength > MAX_UPLOAD_BYTES) {
    sendJson(response, 413, {
      ok: false,
      error: "Migration package exceeds the 100 MB upload limit.",
    });
    request.resume();
    return true;
  }

  const contentType = String(request.headers["content-type"] || "")
    .split(";")[0]
    .trim()
    .toLowerCase();

  if (contentType !== "application/json") {
    sendJson(response, 415, {
      ok: false,
      error: "Upload the migration package as application/json.",
    });
    request.resume();
    return true;
  }

  const temporaryPath = join(
    backupDirectory,
    `donna-migration-upload-${randomUUID()}.json`
  );

  try {
    const uploadedBytes = await receivePackage(request, temporaryPath);

    if (!uploadedBytes) {
      throw new Error("The migration package is empty.");
    }

    let backup = null;

    if (mode === "commit") {
      backup = await createPreImportBackup(databasePath, backupDirectory);
    }

    const database = new DatabaseSync(databasePath, {
      timeout: 15000,
      enableForeignKeyConstraints: true,
    });

    let result;

    try {
      result = importDonnaMigration({
        database,
        packagePath: temporaryPath,
        mode,
      });
    } finally {
      database.close();
    }

    sendJson(response, 200, {
      ...result,
      uploadedBytes,
      backup: backup
        ? {
            name: backup.name,
            verified: true,
          }
        : null,
    });
  } catch (error) {
    console.error("[Donna migration]", error);

    if (!response.headersSent) {
      sendJson(response, 400, {
        ok: false,
        mode,
        committed: false,
        error: error instanceof Error
          ? error.message
          : "Donna migration failed.",
      });
    }
  } finally {
    try {
      if (existsSync(temporaryPath)) unlinkSync(temporaryPath);
    } catch (error) {
      console.error(
        "[Donna migration] Unable to remove temporary upload:",
        error
      );
    }
  }

  return true;
}
