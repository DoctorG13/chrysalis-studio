import { createServer } from "node:http";
import { existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";

const PORT = Number(process.env.CHRYSALIS_INVOICE_API_PORT || 4181);
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
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(body), "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" });
  response.end(body);
}

function readJsonBody(request) {
  return new Promise((resolveBody, reject) => {
    let body = ""; let size = 0;
    request.setEncoding("utf8");
    request.on("data", (chunk) => { size += Buffer.byteLength(chunk); if (size > MAX_REQUEST_BYTES) { reject(new Error("Request body is too large.")); request.destroy(); return; } body += chunk; });
    request.on("end", () => { if (!body.trim()) return resolveBody({}); try { resolveBody(JSON.parse(body)); } catch { reject(new Error("Request body must contain valid JSON.")); } });
    request.on("error", reject);
  });
}

function parseJson(value, fallback) { try { return JSON.parse(value); } catch { return fallback; } }

function rowToInvoice(row) {
  const stored = parseJson(row.data_json, {});
  return { ...stored, id: row.id, clientId: row.client_id, jobId: row.job_id || "", number: row.number, amount: row.amount, status: row.status, issueDate: row.issue_date, dueDate: row.due_date, createdAt: row.created_at, updatedAt: row.updated_at };
}

function listInvoices(database, clientId = "", jobId = "") {
  if (clientId && jobId) return database.prepare("SELECT * FROM invoices WHERE client_id = ? AND job_id = ? ORDER BY issue_date DESC, created_at DESC, id DESC").all(clientId, jobId).map(rowToInvoice);
  if (clientId) return database.prepare("SELECT * FROM invoices WHERE client_id = ? ORDER BY issue_date DESC, created_at DESC, id DESC").all(clientId).map(rowToInvoice);
  if (jobId) return database.prepare("SELECT * FROM invoices WHERE job_id = ? ORDER BY issue_date DESC, created_at DESC, id DESC").all(jobId).map(rowToInvoice);
  return database.prepare("SELECT * FROM invoices ORDER BY issue_date DESC, created_at DESC, id DESC").all().map(rowToInvoice);
}

function getInvoice(database, id) { const row = database.prepare("SELECT * FROM invoices WHERE id = ?").get(id); return row ? rowToInvoice(row) : null; }

function assertRelations(database, invoice) {
  const client = database.prepare("SELECT id FROM clients WHERE id = ?").get(invoice.clientId);
  if (!client) throw new Error(`Client not found: ${invoice.clientId}`);
  if (invoice.jobId) {
    const job = database.prepare("SELECT id, client_id AS clientId FROM jobs WHERE id = ?").get(invoice.jobId);
    if (!job) throw new Error(`Job not found: ${invoice.jobId}`);
    if (job.clientId !== invoice.clientId) throw new Error("The invoice job must belong to the invoice client.");
  }
}

function normalizeInvoice(input, existing = null) {
  const source = { ...(existing || {}), ...(input || {}) };
  const now = new Date().toISOString();
  return { ...source, id: String(source.id || crypto.randomUUID()), clientId: String(source.clientId || ""), jobId: source.jobId ? String(source.jobId) : "", number: String(source.number || source.invoiceNumber || ""), amount: Number(source.amount || 0), status: String(source.status || "Draft"), issueDate: String(source.issueDate || source.date || now.slice(0, 10)), dueDate: String(source.dueDate || ""), createdAt: String(existing?.createdAt || source.createdAt || now), updatedAt: now };
}

function updateStoredInvoices(database, table, id, invoiceId, invoice, remove = false) {
  const row = database.prepare(`SELECT data_json FROM ${table} WHERE id = ?`).get(id);
  if (!row) return;
  const stored = parseJson(row.data_json, {});
  const invoices = Array.isArray(stored.invoices) ? stored.invoices : [];
  const next = remove ? invoices.filter((item) => item?.id !== invoiceId) : [invoice, ...invoices.filter((item) => item?.id !== invoiceId)];
  database.prepare(`UPDATE ${table} SET data_json = ? WHERE id = ?`).run(JSON.stringify({ ...stored, invoices: next }), id);
}

function saveInvoice(database, input, existing = null) {
  const invoice = normalizeInvoice(input, existing);
  assertRelations(database, invoice);
  const previous = existing || getInvoice(database, invoice.id);
  database.exec("BEGIN IMMEDIATE");
  try {
    database.prepare(`INSERT INTO invoices (id, client_id, job_id, number, amount, status, issue_date, due_date, data_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET client_id = excluded.client_id, job_id = excluded.job_id, number = excluded.number, amount = excluded.amount, status = excluded.status, issue_date = excluded.issue_date, due_date = excluded.due_date, data_json = excluded.data_json, updated_at = excluded.updated_at`).run(invoice.id, invoice.clientId, invoice.jobId || null, invoice.number, invoice.amount, invoice.status, invoice.issueDate, invoice.dueDate, JSON.stringify(invoice), invoice.createdAt, invoice.updatedAt);
    if (previous && previous.clientId && previous.clientId !== invoice.clientId) updateStoredInvoices(database, "clients", previous.clientId, invoice.id, previous, true);
    if (previous && previous.jobId && previous.jobId !== invoice.jobId) updateStoredInvoices(database, "jobs", previous.jobId, invoice.id, previous, true);
    updateStoredInvoices(database, "clients", invoice.clientId, invoice.id, invoice);
    if (invoice.jobId) updateStoredInvoices(database, "jobs", invoice.jobId, invoice.id, invoice);
    database.exec("COMMIT");
  } catch (error) { database.exec("ROLLBACK"); throw error; }
  return invoice;
}

function deleteInvoice(database, id) {
  const existing = getInvoice(database, id);
  if (!existing) return false;
  database.exec("BEGIN IMMEDIATE");
  try {
    database.prepare("DELETE FROM invoices WHERE id = ?").run(id);
    updateStoredInvoices(database, "clients", existing.clientId, id, existing, true);
    if (existing.jobId) updateStoredInvoices(database, "jobs", existing.jobId, id, existing, true);
    database.exec("COMMIT");
    return true;
  } catch (error) { database.exec("ROLLBACK"); throw error; }
}

function main() {
  const database = openDatabase();
  const server = createServer(async (request, response) => {
    if (request.method === "OPTIONS") { response.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" }); response.end(); return; }
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    const match = url.pathname.match(/^\/api\/invoices(?:\/([^/]+))?$/);
    const id = match?.[1] ? decodeURIComponent(match[1]) : "";
    try {
      if (request.method === "GET" && url.pathname === "/api/health") return sendJson(response, 200, { ok: true, service: "invoices" });
      if (request.method === "GET" && !id) return sendJson(response, 200, { ok: true, invoices: listInvoices(database, url.searchParams.get("clientId") || "", url.searchParams.get("jobId") || "") });
      if (request.method === "GET" && id) return sendJson(response, 200, { ok: true, invoice: getInvoice(database, id) });
      if (request.method === "POST" && !id) { const body = await readJsonBody(request); return sendJson(response, 201, { ok: true, invoice: saveInvoice(database, body.invoice || body) }); }
      if ((request.method === "PUT" || request.method === "POST") && id) { const body = await readJsonBody(request); const existing = getInvoice(database, id); if (!existing) return sendJson(response, 404, { ok: false, error: "Invoice not found" }); return sendJson(response, 200, { ok: true, invoice: saveInvoice(database, { ...(body.invoice || body), id }, existing) }); }
      if (request.method === "DELETE" && id) return sendJson(response, 200, { ok: true, deleted: deleteInvoice(database, id) });
      return sendJson(response, 404, { ok: false, error: "Not found" });
    } catch (error) { const message = error instanceof Error ? error.message : String(error); console.error(error); sendJson(response, /not found/i.test(message) ? 404 : 400, { ok: false, error: message }); }
  });
  server.listen(PORT, "127.0.0.1", () => console.log(`Chrysalis Invoice API listening on http://127.0.0.1:${PORT}`));
  const shutdown = () => server.close(() => { database.close(); process.exit(0); });
  process.on("SIGINT", shutdown); process.on("SIGTERM", shutdown);
}

main();
