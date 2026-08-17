import { createServer } from "node:http";
import { existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";

const PORT = Number(process.env.CHRYSALIS_TIMELINE_API_PORT || 4180);
const DATA_DIR = resolve(process.env.CHRYSALIS_DATA_DIR || join(process.cwd(), "data"));
const DB_PATH = join(DATA_DIR, "chrysalis.db");
const MAX_REQUEST_BYTES = 2 * 1024 * 1024;

function openDatabase() {
  mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(DB_PATH)) throw new Error(`Chrysalis database not found: ${DB_PATH}`);
  const database = new DatabaseSync(DB_PATH, { timeout: 5000, enableForeignKeyConstraints: true });
  database.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;");
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
      if (!body.trim()) return resolveBody({});
      try { resolveBody(JSON.parse(body)); } catch { reject(new Error("Request body must contain valid JSON.")); }
    });
    request.on("error", reject);
  });
}

function parseJson(value, fallback) {
  try { return JSON.parse(value); } catch { return fallback; }
}

function rowToEvent(row) {
  const stored = parseJson(row.data_json, {});
  return {
    ...stored,
    id: row.id,
    clientId: row.client_id,
    jobId: row.job_id || "",
    type: row.type,
    title: row.title,
    description: row.description,
    date: row.date,
  };
}

function listEvents(database, clientId = "", jobId = "") {
  if (clientId && jobId) return database.prepare("SELECT * FROM timeline_events WHERE client_id = ? AND job_id = ? ORDER BY date DESC, id DESC").all(clientId, jobId).map(rowToEvent);
  if (clientId) return database.prepare("SELECT * FROM timeline_events WHERE client_id = ? ORDER BY date DESC, id DESC").all(clientId).map(rowToEvent);
  if (jobId) return database.prepare("SELECT * FROM timeline_events WHERE job_id = ? ORDER BY date DESC, id DESC").all(jobId).map(rowToEvent);
  return database.prepare("SELECT * FROM timeline_events ORDER BY date DESC, id DESC").all().map(rowToEvent);
}

function getEvent(database, id) {
  const row = database.prepare("SELECT * FROM timeline_events WHERE id = ?").get(id);
  return row ? rowToEvent(row) : null;
}

function assertRelations(database, event) {
  const client = database.prepare("SELECT id FROM clients WHERE id = ?").get(event.clientId);
  if (!client) throw new Error(`Client not found: ${event.clientId}`);
  if (event.jobId) {
    const job = database.prepare("SELECT id, client_id AS clientId FROM jobs WHERE id = ?").get(event.jobId);
    if (!job) throw new Error(`Job not found: ${event.jobId}`);
    if (job.clientId !== event.clientId) throw new Error("The timeline job must belong to the timeline client.");
  }
}

function normalizeEvent(input, existing = null) {
  const source = { ...(existing || {}), ...(input || {}) };
  return {
    ...source,
    id: String(source.id || crypto.randomUUID()),
    clientId: String(source.clientId || ""),
    jobId: source.jobId ? String(source.jobId) : "",
    type: String(source.type || "note"),
    title: String(source.title || "Activity"),
    description: String(source.description || ""),
    date: String(source.date || new Date().toISOString()),
  };
}

function updateStoredTimeline(database, table, id, eventId, event, remove = false) {
  const row = database.prepare(`SELECT data_json FROM ${table} WHERE id = ?`).get(id);
  if (!row) return;
  const stored = parseJson(row.data_json, {});
  const timeline = Array.isArray(stored.timeline) ? stored.timeline : [];
  const next = remove ? timeline.filter((item) => item?.id !== eventId) : [event, ...timeline.filter((item) => item?.id !== eventId)];
  database.prepare(`UPDATE ${table} SET data_json = ? WHERE id = ?`).run(JSON.stringify({ ...stored, timeline: next }), id);
}

function saveEvent(database, input, existing = null) {
  const event = normalizeEvent(input, existing);
  assertRelations(database, event);
  const previous = existing || getEvent(database, event.id);
  database.exec("BEGIN IMMEDIATE");
  try {
    database.prepare(`
      INSERT INTO timeline_events
        (id, client_id, job_id, type, title, description, date, data_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        client_id = excluded.client_id,
        job_id = excluded.job_id,
        type = excluded.type,
        title = excluded.title,
        description = excluded.description,
        date = excluded.date,
        data_json = excluded.data_json
    `).run(event.id, event.clientId, event.jobId || null, event.type, event.title, event.description, event.date, JSON.stringify(event));
    if (previous && previous.clientId && previous.clientId !== event.clientId) updateStoredTimeline(database, "clients", previous.clientId, event.id, previous, true);
    if (previous && previous.jobId && previous.jobId !== event.jobId) updateStoredTimeline(database, "jobs", previous.jobId, event.id, previous, true);
    updateStoredTimeline(database, "clients", event.clientId, event.id, event);
    if (event.jobId) updateStoredTimeline(database, "jobs", event.jobId, event.id, event);
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
  return event;
}

function deleteEvent(database, id) {
  const existing = getEvent(database, id);
  if (!existing) return false;
  database.exec("BEGIN IMMEDIATE");
  try {
    database.prepare("DELETE FROM timeline_events WHERE id = ?").run(id);
    updateStoredTimeline(database, "clients", existing.clientId, id, existing, true);
    if (existing.jobId) updateStoredTimeline(database, "jobs", existing.jobId, id, existing, true);
    database.exec("COMMIT");
    return true;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

function importLegacyEvents(database) {
  const count = Number(database.prepare("SELECT COUNT(*) AS count FROM timeline_events").get().count || 0);
  if (count > 0) return;
  const clients = database.prepare("SELECT id, data_json FROM clients").all();
  const jobs = database.prepare("SELECT id, client_id AS clientId, data_json FROM jobs").all();
  const events = [];
  for (const row of clients) {
    const stored = parseJson(row.data_json, {});
    for (const event of Array.isArray(stored.timeline) ? stored.timeline : []) events.push({ ...event, clientId: row.id, jobId: event.jobId || "" });
  }
  for (const row of jobs) {
    const stored = parseJson(row.data_json, {});
    for (const event of Array.isArray(stored.timeline) ? stored.timeline : []) events.push({ ...event, clientId: row.clientId, jobId: row.id });
  }
  const seen = new Set();
  for (const event of events) {
    if (!event.id || seen.has(event.id)) continue;
    seen.add(event.id);
    try { saveEvent(database, event); } catch (error) { console.warn(`Skipping legacy timeline event ${event.id}: ${error.message}`); }
  }
}

function main() {
  const database = openDatabase();
  importLegacyEvents(database);
  const server = createServer(async (request, response) => {
    if (request.method === "OPTIONS") { response.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" }); response.end(); return; }
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    const match = url.pathname.match(/^\/api\/timeline(?:\/([^/]+))?$/);
    const id = match?.[1] ? decodeURIComponent(match[1]) : "";
    try {
      if (request.method === "GET" && url.pathname === "/api/health") return sendJson(response, 200, { ok: true, service: "timeline" });
      if (request.method === "GET" && !id) return sendJson(response, 200, { ok: true, events: listEvents(database, url.searchParams.get("clientId") || "", url.searchParams.get("jobId") || "") });
      if (request.method === "GET" && id) return sendJson(response, 200, { ok: true, event: getEvent(database, id) });
      if (request.method === "POST" && !id) { const body = await readJsonBody(request); return sendJson(response, 201, { ok: true, event: saveEvent(database, body.event || body) }); }
      if ((request.method === "PUT" || request.method === "POST") && id) { const body = await readJsonBody(request); const existing = getEvent(database, id); if (!existing) return sendJson(response, 404, { ok: false, error: "Timeline event not found" }); return sendJson(response, 200, { ok: true, event: saveEvent(database, { ...(body.event || body), id }, existing) }); }
      if (request.method === "DELETE" && id) return sendJson(response, 200, { ok: true, deleted: deleteEvent(database, id) });
      return sendJson(response, 404, { ok: false, error: "Not found" });
    } catch (error) { const message = error instanceof Error ? error.message : String(error); console.error(error); sendJson(response, /not found/i.test(message) ? 404 : 400, { ok: false, error: message }); }
  });
  server.listen(PORT, "127.0.0.1", () => console.log(`Chrysalis Timeline API listening on http://127.0.0.1:${PORT}`));
  const shutdown = () => server.close(() => { database.close(); process.exit(0); });
  process.on("SIGINT", shutdown); process.on("SIGTERM", shutdown);
}

main();
