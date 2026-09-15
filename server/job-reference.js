import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const DATA_DIR = resolve(
  process.env.CHRYSALIS_DATA_DIR || join(process.cwd(), "data")
);
const DB_PATH = join(DATA_DIR, "chrysalis.db");

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "00000000";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}${month}${year}`;
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function nextReference(database, createdAt, reserved = new Set()) {
  const prefix = `CHR-${formatDate(createdAt)}-`;
  const rows = database
    .prepare(
      "SELECT reference FROM jobs WHERE reference LIKE ?"
    )
    .all(`${prefix}%`);

  const used = new Set(reserved);

  for (const row of rows) {
    const reference = String(row.reference || "");

    if (reference.startsWith(prefix)) {
      const suffix = Number(reference.slice(prefix.length));

      if (Number.isInteger(suffix) && suffix > 0) {
        used.add(suffix);
      }
    }
  }

  let sequence = 1;

  while (used.has(sequence)) {
    sequence += 1;
  }

  return `${prefix}${String(sequence).padStart(3, "0")}`;
}

function updateStoredReference(database, job, reference) {
  const stored = parseJson(job.data_json, {});

  database
    .prepare(
      `UPDATE jobs
       SET reference = ?,
           data_json = ?
       WHERE id = ?`
    )
    .run(
      reference,
      JSON.stringify({
        ...stored,
        reference,
      }),
      job.id
    );
}

export function repairAndEnforceJobReferences() {
  if (!existsSync(DB_PATH)) {
    return {
      repaired: 0,
      databasePath: DB_PATH,
    };
  }

  const database = new DatabaseSync(DB_PATH, {
    timeout: 5000,
    enableForeignKeyConstraints: true,
  });

  try {
    database.exec("PRAGMA foreign_keys = ON;");
    database.exec("BEGIN IMMEDIATE");

    let repaired = 0;

    try {
      const jobs = database
        .prepare(
          `SELECT id, reference, created_at, data_json
           FROM jobs
           ORDER BY created_at ASC, id ASC`
        )
        .all();

      const seenReferences = new Set();

      for (const job of jobs) {
        const current = String(job.reference || "").trim();

        if (
          current &&
          !seenReferences.has(current)
        ) {
          seenReferences.add(current);
          continue;
        }

        const reference = nextReference(
          database,
          job.created_at,
          seenReferences
        );

        updateStoredReference(
          database,
          job,
          reference
        );

        seenReferences.add(reference);
        repaired += 1;
      }

      database.exec(`
        CREATE TRIGGER IF NOT EXISTS trg_jobs_reference_insert
        AFTER INSERT ON jobs
        WHEN NEW.reference = ''
          OR EXISTS (
            SELECT 1
            FROM jobs
            WHERE reference = NEW.reference
              AND id <> NEW.id
          )
        BEGIN
          UPDATE jobs
          SET reference = (
            SELECT 'CHR-' ||
              strftime('%d%m%Y', NEW.created_at) || '-' ||
              printf('%03d', COALESCE(MAX(
                CASE
                  WHEN reference LIKE 'CHR-' || strftime('%d%m%Y', NEW.created_at) || '-%'
                  THEN CAST(substr(reference, 14) AS INTEGER)
                  ELSE 0
                END
              ), 0) + 1)
            FROM jobs
            WHERE id <> NEW.id
              AND reference LIKE 'CHR-' || strftime('%d%m%Y', NEW.created_at) || '-%'
          ),
          data_json = json_set(
            CASE
              WHEN json_valid(data_json) THEN data_json
              ELSE '{}'
            END,
            '$.reference',
            (
              SELECT 'CHR-' ||
                strftime('%d%m%Y', NEW.created_at) || '-' ||
                printf('%03d', COALESCE(MAX(
                  CASE
                    WHEN reference LIKE 'CHR-' || strftime('%d%m%Y', NEW.created_at) || '-%'
                    THEN CAST(substr(reference, 14) AS INTEGER)
                    ELSE 0
                  END
                ), 0) + 1)
              FROM jobs
              WHERE id <> NEW.id
                AND reference LIKE 'CHR-' || strftime('%d%m%Y', NEW.created_at) || '-%'
            )
          )
          WHERE id = NEW.id;
        END;

        CREATE TRIGGER IF NOT EXISTS trg_jobs_reference_update
        AFTER UPDATE OF reference ON jobs
        WHEN NEW.reference = ''
          OR EXISTS (
            SELECT 1
            FROM jobs
            WHERE reference = NEW.reference
              AND id <> NEW.id
          )
        BEGIN
          UPDATE jobs
          SET reference = (
            SELECT 'CHR-' ||
              strftime('%d%m%Y', NEW.created_at) || '-' ||
              printf('%03d', COALESCE(MAX(
                CASE
                  WHEN reference LIKE 'CHR-' || strftime('%d%m%Y', NEW.created_at) || '-%'
                  THEN CAST(substr(reference, 14) AS INTEGER)
                  ELSE 0
                END
              ), 0) + 1)
            FROM jobs
            WHERE id <> NEW.id
              AND reference LIKE 'CHR-' || strftime('%d%m%Y', NEW.created_at) || '-%'
          ),
          data_json = json_set(
            CASE
              WHEN json_valid(data_json) THEN data_json
              ELSE '{}'
            END,
            '$.reference',
            (
              SELECT 'CHR-' ||
                strftime('%d%m%Y', NEW.created_at) || '-' ||
                printf('%03d', COALESCE(MAX(
                  CASE
                    WHEN reference LIKE 'CHR-' || strftime('%d%m%Y', NEW.created_at) || '-%'
                    THEN CAST(substr(reference, 14) AS INTEGER)
                    ELSE 0
                  END
                ), 0) + 1)
              FROM jobs
              WHERE id <> NEW.id
                AND reference LIKE 'CHR-' || strftime('%d%m%Y', NEW.created_at) || '-%'
            )
          )
          WHERE id = NEW.id;
        END;
      `);

      database.exec("COMMIT");
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }

    return {
      repaired,
      databasePath: DB_PATH,
    };
  } finally {
    database.close();
  }
}
