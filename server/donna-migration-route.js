import {
  createReadStream,
  createWriteStream,
  existsSync,
  statSync,
  unlinkSync,
} from "node:fs";
import { join } from "node:path";
import { randomUUID, createHash } from "node:crypto";
import { DatabaseSync, backup as sqliteBackup } from "node:sqlite";
import { importDonnaMigration } from "./donna-migration-import.js";

const ROUTE = "/api/admin/donna-migration";
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
const COMMIT_CONFIRMATION = "IMPORT DONNA CHRYSALIS WORKSPACE";
const INSPECT_ROUTE = `${ROUTE}/inspect-conflict`;
const CONFLICT_JOB_ID = "bf11f4cf-923b-405f-b336-851eac9ae409";
const DONNA_USER_ID = "27f7b2a7-0a47-424c-870e-853fb0e2b03f";

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
    let failure = null;
    const output = createWriteStream(destination, { flags: "wx" });

    const fail = (error) => {
      if (settled || failure) return;
      failure = error;
      output.destroy();
      output.once("close", () => {
        if (settled) return;
        settled = true;
        rejectUpload(failure);
      });
    };

    output.on("error", fail);
    output.on("finish", () => {
      if (settled || failure) return;
      settled = true;
      resolveUpload(size);
    });

    request.on("data", (chunk) => {
      if (settled || failure) return;
      size += chunk.length;
      if (size > MAX_UPLOAD_BYTES) {
        fail(new Error("Migration package exceeds the 100 MB upload limit."));
        request.resume();
        return;
      }
      if (!output.write(chunk)) {
        request.pause();
        output.once("drain", () => {
          if (!settled && !failure) request.resume();
        });
      }
    });

    request.on("end", () => {
      if (!settled && !failure) output.end();
    });
    request.on("aborted", () => {
      fail(new Error("Migration package upload was interrupted by the client."));
    });
    request.on("error", fail);
  });
}

async function calculateSha256(filePath) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest("hex");
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
  const backupStats = statSync(backupPath);
  if (!backupStats.isFile() || backupStats.size <= 0) {
    throw new Error("The pre-import Railway backup is empty or invalid.");
  }

  const verification = new DatabaseSync(backupPath, {
    readOnly: true,
    timeout: 5000,
    enableForeignKeyConstraints: true,
  });
  let integrity;
  let foreignKeyViolations;

  try {
    integrity = verification.prepare("PRAGMA integrity_check").get()?.integrity_check;
    if (integrity !== "ok") {
      throw new Error("The pre-import backup failed SQLite integrity verification.");
    }
    foreignKeyViolations = verification.prepare("PRAGMA foreign_key_check").all().length;
    if (foreignKeyViolations !== 0) {
      throw new Error(`The pre-import backup contains ${foreignKeyViolations} foreign-key violation(s).`);
    }
  } finally {
    verification.close();
  }

  const sha256 = await calculateSha256(backupPath);
  if (!/^[a-f0-9]{64}$/.test(sha256)) {
    throw new Error("The pre-import backup checksum could not be verified.");
  }

  return {
    name: backupName,
    path: backupPath,
    verified: true,
    sizeBytes: backupStats.size,
    sha256,
    integrity,
    foreignKeyViolations,
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
  const isInspection = url.pathname === INSPECT_ROUTE;
  const isMigration = url.pathname === ROUTE;

  if (request.method !== "POST" || (!isInspection && !isMigration)) {
    return false;
  }

  if (!authenticate(request, response)) return true;
  if (!requireSameOrigin(request, response)) return true;

  if (isInspection) {
    request.resume();

    let database;

    try {
      database = new DatabaseSync(databasePath, {
        readOnly: true,
        timeout: 5000,
        enableForeignKeyConstraints: true,
      });

      const record = database.prepare(`
        SELECT id, title, updated_at, due_date
        FROM bizzibuddi_jobs
        WHERE id = ? AND user_id = ?
      `).get(CONFLICT_JOB_ID, DONNA_USER_ID);

      if (!record) {
        sendJson(response, 404, {
          ok: false,
          error: "The specified conflicting job was not found.",
        });
        return true;
      }

      sendJson(response, 200, {
        ok: true,
        readOnly: true,
        record,
      });
    } catch (error) {
      console.error("[Donna migration inspection]", error);

      if (!response.headersSent) {
        sendJson(response, 500, {
          ok: false,
          error: "The conflicting record could not be inspected.",
        });
      }
    } finally {
      database?.close();
    }

    return true;
  }

  const mode = url.searchParams.get("mode") || "dry-run";
  if (!["dry-run", "commit"].includes(mode)) {
    sendJson(response, 400, { ok: false, error: "Mode must be dry-run or commit." });
    request.resume();
    return true;
  }

  if (mode === "commit" &&
      request.headers["x-migration-confirmation"] !== COMMIT_CONFIRMATION) {
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
    .split(";")[0].trim().toLowerCase();
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
    if (!uploadedBytes) throw new Error("The migration package is empty.");

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
      result = importDonnaMigration({ database, packagePath: temporaryPath, mode });
    } finally {
      database.close();
    }

    sendJson(response, 200, {
      ...result,
      uploadedBytes,
      backup: backup ? {
        name: backup.name,
        verified: backup.verified,
        sizeBytes: backup.sizeBytes,
        sha256: backup.sha256,
        integrity: backup.integrity,
        foreignKeyViolations: backup.foreignKeyViolations,
      } : null,
    });
  } catch (error) {
    console.error("[Donna migration]", error);
    if (!response.headersSent) {
      sendJson(response, 400, {
        ok: false,
        mode,
        committed: false,
        error: error instanceof Error ? error.message : "Donna migration failed.",
      });
    }
  } finally {
    try {
      if (existsSync(temporaryPath)) unlinkSync(temporaryPath);
    } catch (error) {
      console.error("[Donna migration] Unable to remove temporary upload:", error);
    }
  }
  return true;
}
