import { DatabaseSync, backup as sqliteBackup } from "node:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";

const DATA_DIR = resolve(
  process.env.CHRYSALIS_DATA_DIR || join(process.cwd(), "data")
);
const DB_PATH = join(DATA_DIR, "chrysalis.db");
const BACKUP_DIR = join(DATA_DIR, "backups");

const DEFAULTS = {
  invoiceNumber: "INV-995739",
  personName: "Jessica Williams",
  originalAmount: 300,
  restoredAmount: 100,
  method: "Card",
  description: "2nd payment installment",
};

function readOption(name, fallback = null) {
  const prefix = `--${name}=`;
  const argument = process.argv.slice(2).find((value) => value.startsWith(prefix));
  return argument ? argument.slice(prefix.length) : fallback;
}

function fail(message) {
  throw new Error(message);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function backupName(invoiceNumber) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return join(BACKUP_DIR, `before-payment-audit-repair-${invoiceNumber}-${stamp}.db`);
}

async function main() {
  const invoiceNumber = readOption("invoice", DEFAULTS.invoiceNumber);
  const personName = readOption("person", DEFAULTS.personName);
  const originalAmount = Number(readOption("original", String(DEFAULTS.originalAmount)));
  const restoredAmount = Number(readOption("restored", String(DEFAULTS.restoredAmount)));
  const method = readOption("method", DEFAULTS.method);
  const description = readOption("description", DEFAULTS.description);

  if (!existsSync(DB_PATH)) {
    fail(`Database not found at ${DB_PATH}. Run "npm run db:init" first.`);
  }

  if (!Number.isFinite(originalAmount) || !Number.isFinite(restoredAmount)) {
    fail("Original and restored amounts must be valid numbers.");
  }

  const database = new DatabaseSync(DB_PATH, {
    timeout: 5000,
    enableForeignKeyConstraints: true,
  });

  try {
    const invoice = database
      .prepare(
        `SELECT id, user_id, number
         FROM bizzibuddi_invoices
         WHERE number = ?
         LIMIT 2`
      )
      .all(invoiceNumber);

    if (invoice.length === 0) fail(`Invoice ${invoiceNumber} was not found.`);
    if (invoice.length > 1) fail(`Invoice ${invoiceNumber} is not unique. Repair was not applied.`);

    const selectedInvoice = invoice[0];

    const candidates = database
      .prepare(
        `SELECT id, user_id, invoice_id, amount, date, method, description, created_at, updated_at
         FROM bizzibuddi_payments
         WHERE user_id = ?
           AND invoice_id = ?
           AND method = ?
           AND description = ?
         ORDER BY created_at ASC`
      )
      .all(
        selectedInvoice.user_id,
        selectedInvoice.id,
        method,
        description
      );

    if (candidates.length !== 1) {
      fail(
        `Expected exactly one ${method} / "${description}" payment on ${invoiceNumber}, found ${candidates.length}. Repair was not applied.`
      );
    }

    const payment = candidates[0];

    const recordedSourceKey =
      `finance-payment:recorded:${payment.id}:${selectedInvoice.id}`;
    const repairedUpdateSourceKey =
      `finance-payment:updated:${selectedInvoice.id}:${payment.id}:legacy-300-to-100`;

    const recordedEvent = database
      .prepare(
        `SELECT id, type, title, detail, source_key, created_at
         FROM bizzibuddi_automation_events
         WHERE user_id = ? AND source_key = ?
         LIMIT 1`
      )
      .get(selectedInvoice.user_id, recordedSourceKey);

    const existingRepairEvent = database
      .prepare(
        `SELECT id, type, title, detail, source_key, created_at
         FROM bizzibuddi_automation_events
         WHERE user_id = ? AND source_key = ?
         LIMIT 1`
      )
      .get(selectedInvoice.user_id, repairedUpdateSourceKey);

    console.log("");
    console.log("Payment audit repair");
    console.log("--------------------");
    console.log(`Invoice:        ${invoiceNumber}`);
    console.log(`Person:         ${personName}`);
    console.log(`Payment ID:     ${payment.id}`);
    console.log(`Current amount: ${formatCurrency(payment.amount)}`);
    console.log(`Historical:     ${formatCurrency(originalAmount)} → ${formatCurrency(restoredAmount)}`);
    console.log(`Recorded event: ${recordedEvent ? "found" : "missing"}`);
    console.log(`Repair event:   ${existingRepairEvent ? "found" : "missing"}`);
    console.log("");

    const backupPath = backupName(invoiceNumber);
    mkdirSync(BACKUP_DIR, { recursive: true });
    await sqliteBackup(database, backupPath);

    database.exec("BEGIN IMMEDIATE");

    try {
      const recordedDetail =
        `${formatCurrency(originalAmount)} payment recorded on ${invoiceNumber} · ${payment.date} · ${payment.method}` +
        (payment.description ? ` · ${payment.description}` : "") +
        ".";

      if (recordedEvent) {
        database
          .prepare(
            `UPDATE bizzibuddi_automation_events
             SET detail = ?, title = 'Payment recorded', type = 'finance-payment-recorded'
             WHERE id = ? AND user_id = ?`
          )
          .run(recordedDetail, recordedEvent.id, selectedInvoice.user_id);
      } else {
        database
          .prepare(
            `INSERT INTO bizzibuddi_automation_events (
              id, user_id, type, title, detail, source_key, job_id, created_at
            ) VALUES (?, ?, 'finance-payment-recorded', 'Payment recorded', ?, ?, NULL, ?)`
          )
          .run(
            randomUUID(),
            selectedInvoice.user_id,
            recordedDetail,
            recordedSourceKey,
            payment.created_at
          );
      }

      if (!existingRepairEvent) {
        const updateDetail =
          `${invoiceNumber} · Amount ${formatCurrency(originalAmount)} → ${formatCurrency(restoredAmount)}.`;

        database
          .prepare(
            `INSERT INTO bizzibuddi_automation_events (
              id, user_id, type, title, detail, source_key, job_id, created_at
            ) VALUES (?, ?, 'finance-payment-updated', 'Payment updated', ?, ?, NULL, ?)`
          )
          .run(
            randomUUID(),
            selectedInvoice.user_id,
            updateDetail,
            repairedUpdateSourceKey,
            recordedEvent?.created_at || payment.created_at
          );
      }

      database.exec("COMMIT");
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }

    console.log(`Backup:         ${backupPath}`);
    console.log("Repair applied successfully.");
    console.log("");
    console.log("The existing payment row was not changed.");
    console.log(
      "The recorded event now preserves the original $300 snapshot, and the missing $300 → $100 update event has been restored."
    );
  } finally {
    database.close();
  }
}

main().catch((error) => {
  console.error(`Payment audit repair failed: ${error.message}`);
  process.exitCode = 1;
});
