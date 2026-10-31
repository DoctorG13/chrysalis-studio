import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const root = process.cwd();
const dataDir = mkdtempSync(join(tmpdir(), "bizzi-invoice-allocation-"));
const dbPath = join(dataDir, "chrysalis.db");
const paymentPort = 47000 + (process.pid % 500);
const invoicePort = paymentPort + 1;
let paymentProcess;
let invoiceProcess;

const wait = (ms) => new Promise((resolveWait) => setTimeout(resolveWait, ms));

async function waitForHealth(port, child) {
  for (let i = 0; i < 80; i += 1) {
    if (child.exitCode !== null) throw new Error(`API exited early: ${child.exitCode}`);
    try {
      if ((await fetch(`http://127.0.0.1:${port}/api/health`)).ok) return;
    } catch {}
    await wait(150);
  }
  throw new Error(`API on port ${port} did not become healthy.`);
}

async function api(port, path, options = {}) {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  return { response, payload: await response.json().catch(() => ({})) };
}

async function stop(child) {
  if (!child || child.exitCode !== null) return;
  await new Promise((resolveStop) => {
    child.once("exit", resolveStop);
    child.kill("SIGTERM");
    setTimeout(() => child.exitCode === null && child.kill("SIGKILL"), 1500).unref();
  });
}

try {
  const db = new DatabaseSync(dbPath);
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE clients (id TEXT PRIMARY KEY, data_json TEXT NOT NULL DEFAULT '{}');
    CREATE TABLE jobs (id TEXT PRIMARY KEY, client_id TEXT NOT NULL, data_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (client_id) REFERENCES clients(id));
    CREATE TABLE invoices (
      id TEXT PRIMARY KEY, client_id TEXT NOT NULL, job_id TEXT, number TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'Draft',
      issue_date TEXT NOT NULL, due_date TEXT NOT NULL DEFAULT '', data_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      FOREIGN KEY (client_id) REFERENCES clients(id), FOREIGN KEY (job_id) REFERENCES jobs(id)
    );
    CREATE TABLE payments (
      id TEXT PRIMARY KEY, client_id TEXT NOT NULL, job_id TEXT NOT NULL, amount REAL NOT NULL,
      date TEXT NOT NULL, method TEXT NOT NULL DEFAULT '', description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL, data_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (client_id) REFERENCES clients(id), FOREIGN KEY (job_id) REFERENCES jobs(id)
    );
    CREATE TABLE timeline_events (
      id TEXT PRIMARY KEY, client_id TEXT, job_id TEXT, type TEXT, title TEXT,
      description TEXT, date TEXT, data_json TEXT NOT NULL DEFAULT '{}'
    );
    INSERT INTO clients (id) VALUES ('client-1');
    INSERT INTO jobs (id, client_id) VALUES ('job-1', 'client-1'), ('job-2', 'client-1');
    INSERT INTO payments (id,client_id,job_id,amount,date,created_at,updated_at,data_json)
      VALUES ('legacy','client-1','job-1',12.5,'2026-10-01','2026-10-01','2026-10-01','{"paymentType":"Deposit"}');
  `);

  // Version 22 migration SQL; old records retain NULL invoice_id.
  db.exec(`
    ALTER TABLE payments ADD COLUMN invoice_id TEXT REFERENCES invoices(id) ON DELETE RESTRICT;
    CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
  `);
  assert.equal(db.prepare("SELECT invoice_id FROM payments WHERE id='legacy'").get().invoice_id, null);
  db.close();

  const env = { ...process.env, CHRYSALIS_DATA_DIR: dataDir };
  paymentProcess = spawn(process.execPath, [resolve(root, "server/payment-server.js")], {
    cwd: root, env: { ...env, CHRYSALIS_PAYMENT_API_PORT: String(paymentPort) }, stdio: "ignore",
  });
  invoiceProcess = spawn(process.execPath, [resolve(root, "server/invoice-server.js")], {
    cwd: root, env: { ...env, CHRYSALIS_INVOICE_API_PORT: String(invoicePort) }, stdio: "ignore",
  });
  await Promise.all([waitForHealth(paymentPort, paymentProcess), waitForHealth(invoicePort, invoiceProcess)]);

  async function createInvoice(id, number, jobId, amount, status = "Issued") {
    const result = await api(invoicePort, "/api/invoices", {
      method: "POST",
      body: JSON.stringify({ invoice: {
        id, clientId: "client-1", jobId, number, amount, total: amount,
        status, issueDate: "2026-10-01", dueDate: "2026-11-01",
      }}),
    });
    assert.equal(result.response.status, 201, JSON.stringify(result.payload));
  }
  async function createPayment(payment) {
    const result = await api(paymentPort, "/api/payments", {
      method: "POST", body: JSON.stringify({ payment }),
    });
    assert.equal(result.response.status, 201, JSON.stringify(result.payload));
    return result.payload.payment;
  }
  async function invoice(id) {
    const result = await api(invoicePort, `/api/invoices/${id}`);
    assert.equal(result.response.status, 200, JSON.stringify(result.payload));
    return result.payload.invoice;
  }

  await createInvoice("inv-1", "INV-001", "job-1", 100);
  await createInvoice("inv-2", "INV-002", "job-1", 200);
  await createInvoice("inv-other", "INV-003", "job-2", 75);
  await createInvoice("inv-draft", "INV-004", "job-1", 60, "Draft");

  const editedPayment = await createPayment({
    clientId: "client-1", jobId: "job-1", invoiceId: "inv-1", amount: 40,
    date: "2026-10-02", paymentType: "Part Payment", paymentMethod: "Bank Transfer",
  });
  await createPayment({
    clientId: "client-1", jobId: "job-1", invoiceId: "inv-2", amount: 25,
    date: "2026-10-03", paymentType: "Deposit",
  });
  await createPayment({
    clientId: "client-1", jobId: "job-1", amount: 50,
    date: "2026-10-04", paymentType: "Payment",
  });
  await createPayment({
    clientId: "client-1", jobId: "job-1", invoiceId: "inv-1", amount: 10,
    date: "2026-10-05", paymentType: "Refund",
  });

  assert.equal((await invoice("inv-1")).amountPaid, 30);
  assert.equal((await invoice("inv-1")).balance, 70);
  assert.equal((await invoice("inv-2")).amountPaid, 25);
  assert.equal((await invoice("inv-2")).balance, 175);

  const invalid = await api(paymentPort, "/api/payments", {
    method: "POST",
    body: JSON.stringify({ payment: {
      clientId: "client-1", jobId: "job-1", invoiceId: "inv-other",
      amount: 5, date: "2026-10-06", paymentType: "Part Payment",
    }}),
  });
  assert.equal(invalid.response.status, 400);

  const draftAllocation = await api(paymentPort, "/api/payments", {
    method: "POST",
    body: JSON.stringify({ payment: {
      clientId: "client-1", jobId: "job-1", invoiceId: "inv-draft",
      amount: 5, date: "2026-10-06", paymentType: "Part Payment",
    }}),
  });
  assert.equal(draftAllocation.response.status, 400, "draft invoice allocation must be rejected");

  const edit = await api(paymentPort, `/api/payments/${editedPayment.id}`, {
    method: "PUT",
    body: JSON.stringify({ payment: { ...editedPayment, amount: 35 } }),
  });
  assert.equal(edit.response.status, 200);
  assert.equal((await invoice("inv-1")).amountPaid, 25);
  assert.equal((await invoice("inv-1")).balance, 75);

  const remove = await api(paymentPort, `/api/payments/${editedPayment.id}`, { method: "DELETE" });
  assert.equal(remove.response.status, 200);
  assert.equal((await invoice("inv-1")).amountPaid, 0);
  assert.equal((await invoice("inv-1")).balance, 100);

  const legacy = await api(paymentPort, "/api/payments/job/job-1");
  assert(legacy.payload.payments.some((payment) => payment.id === "legacy" && !payment.invoiceId));

  console.log("PASS: migration preserves historical payments as unallocated.");
  console.log("PASS: invoice balances include only allocated payments.");
  console.log("PASS: refunds reduce invoice paid totals.");
  console.log("PASS: cross-job and draft invoice allocations are rejected.");
  console.log("PASS: payment edits and deletions recalculate balances.");
} finally {
  await Promise.all([stop(paymentProcess), stop(invoiceProcess)]);
  rmSync(dataDir, { recursive: true, force: true });
}
