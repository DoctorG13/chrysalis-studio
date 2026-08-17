import { createServer } from "node:http";
import { existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import crypto from "node:crypto";

const DEFAULT_PORT = 4179;
const MAX_REQUEST_BYTES = 8 * 1024 * 1024;
const DATA_DIR = resolve(process.env.CHRYSALIS_DATA_DIR || join(process.cwd(), "data"));
const DB_PATH = join(DATA_DIR, "chrysalis.db");
const PORT = Number(process.env.CHRYSALIS_ASSET_API_PORT || DEFAULT_PORT);

function openDatabase() {
  mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(DB_PATH)) throw new Error(`Chrysalis database not found: ${DB_PATH}`);
  const database = new DatabaseSync(DB_PATH, { timeout: 5000, enableForeignKeyConstraints: true });
  database.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;");
  return database;
}
function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(body), "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" });
  response.end(body);
}
function readJsonBody(request) {
  return new Promise((resolveBody, reject) => {
    let body = ""; let size = 0; request.setEncoding("utf8");
    request.on("data", (chunk) => { size += Buffer.byteLength(chunk); if (size > MAX_REQUEST_BYTES) { reject(new Error("Request body is too large.")); request.destroy(); return; } body += chunk; });
    request.on("end", () => { if (!body.trim()) return resolveBody({}); try { resolveBody(JSON.parse(body)); } catch { reject(new Error("Request body must contain valid JSON.")); } });
    request.on("error", reject);
  });
}
function parseJson(value, fallback = {}) { try { return JSON.parse(value); } catch { return fallback; } }
function rowToAsset(row) {
  const stored = parseJson(row.data_json, {});
  return { ...stored, id: row.id, clientId: row.client_id, jobId: row.job_id || "", kind: row.kind, caption: row.caption, date: row.date, url: row.url, filePath: row.file_path, createdAt: row.created_at, updatedAt: row.updated_at };
}
function listAssets(database, ownerType, ownerId) {
  const column = ownerType === "client" ? "client_id" : "job_id";
  return database.prepare(`SELECT * FROM assets WHERE ${column} = ? ORDER BY date DESC, created_at DESC, id DESC`).all(ownerId).map(rowToAsset);
}
function saveAsset(database, input, existing = null) {
  const source = { ...(existing || {}), ...(input || {}) }; const now = new Date().toISOString();
  const asset = { ...source, id: String(source.id || crypto.randomUUID()), clientId: String(source.clientId || ""), jobId: source.jobId ? String(source.jobId) : "", kind: String(source.kind || "photo"), caption: String(source.caption || source.fileName || "Untitled asset"), date: String(source.date || ""), url: String(source.url || ""), filePath: String(source.filePath || ""), createdAt: existing?.createdAt || source.createdAt || now, updatedAt: now };
  if (!asset.clientId) throw new Error("An asset must have a clientId.");
  if (!asset.url && !asset.filePath) throw new Error("An asset must have a URL or file path.");
  const client = database.prepare("SELECT id FROM clients WHERE id = ?").get(asset.clientId);
  if (!client) throw new Error(`Client not found: ${asset.clientId}`);
  if (asset.jobId) {
    const job = database.prepare("SELECT id, client_id AS clientId FROM jobs WHERE id = ?").get(asset.jobId);
    if (!job) throw new Error(`Job not found: ${asset.jobId}`);
    if (job.clientId !== asset.clientId) throw new Error("The asset job must belong to the asset client.");
  }
  database.prepare(`INSERT INTO assets (id, client_id, job_id, kind, caption, date, url, file_path, created_at, updated_at, data_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET client_id = excluded.client_id, job_id = excluded.job_id, kind = excluded.kind, caption = excluded.caption, date = excluded.date, url = excluded.url, file_path = excluded.file_path, updated_at = excluded.updated_at, data_json = excluded.data_json`).run(asset.id, asset.clientId, asset.jobId || null, asset.kind, asset.caption, asset.date, asset.url, asset.filePath, asset.createdAt, asset.updatedAt, JSON.stringify(asset));
  return asset;
}
function getAsset(database, id) { const row = database.prepare("SELECT * FROM assets WHERE id = ?").get(id); return row ? rowToAsset(row) : null; }
function deleteAsset(database, id) { const result = database.prepare("DELETE FROM assets WHERE id = ?").run(id); return Number(result.changes || 0) > 0; }
function createServerHandler(database) {
  return createServer(async (request, response) => {
    if (request.method === "OPTIONS") { response.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" }); response.end(); return; }
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    const match = url.pathname.match(/^\/api\/assets(?:\/([^/]+))?(?:\/([^/]+))?$/); const first = match?.[1] ? decodeURIComponent(match[1]) : null; const second = match?.[2] ? decodeURIComponent(match[2]) : null;
    try {
      if (request.method === "GET" && url.pathname === "/api/health") { sendJson(response, 200, { ok: true, service: "assets", databasePath: DB_PATH }); return; }
      if (request.method === "GET" && first === "client" && second) { sendJson(response, 200, { ok: true, assets: listAssets(database, "client", second) }); return; }
      if (request.method === "GET" && first === "job" && second) { sendJson(response, 200, { ok: true, assets: listAssets(database, "job", second) }); return; }
      if (request.method === "GET" && first && !second) { sendJson(response, 200, { ok: true, asset: getAsset(database, first) }); return; }
      if ((request.method === "POST" || request.method === "PUT") && first) { const body = await readJsonBody(request); const incoming = body.asset || body; const existing = getAsset(database, first); const asset = saveAsset(database, { ...incoming, id: existing?.id || incoming.id || first }, existing); sendJson(response, 200, { ok: true, asset }); return; }
      if (request.method === "DELETE" && first) { sendJson(response, 200, { ok: true, deleted: deleteAsset(database, first) }); return; }
      sendJson(response, 404, { ok: false, error: "Not found" });
    } catch (error) { const message = error instanceof Error ? error.message : String(error); console.error(error); sendJson(response, /not found/i.test(message) ? 404 : 400, { ok: false, error: message }); }
  });
}
function main() { const database = openDatabase(); const server = createServerHandler(database); server.listen(PORT, "127.0.0.1", () => console.log(`Chrysalis Asset API listening on http://127.0.0.1:${PORT}`)); const shutdown = () => server.close(() => { database.close(); process.exit(0); }); process.on("SIGINT", shutdown); process.on("SIGTERM", shutdown); }
main();
