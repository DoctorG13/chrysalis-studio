import { DatabaseSync } from "node:sqlite";
import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const COOKIE_NAME = "bizzibuddi_session";
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 10;
const MAX_BODY_BYTES = 64 * 1024;
const SCRYPT_N = 32768;
const SCRYPT_R = 8;
const SCRYPT_P = 3;
const SCRYPT_KEY_LENGTH = 64;

const DATA_DIR = resolve(
  process.env.CHRYSALIS_DATA_DIR || join(process.cwd(), "data")
);
const DB_PATH = join(DATA_DIR, "chrysalis.db");

const loginAttempts = new Map();
let database = null;

function getDatabase() {
  if (database) return database;

  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

  database = new DatabaseSync(DB_PATH, {
    timeout: 5000,
    enableForeignKeyConstraints: true,
  });

  return database;
}

function safeEqual(left, right) {
  const a = Buffer.isBuffer(left) ? left : Buffer.from(String(left || ""));
  const b = Buffer.isBuffer(right) ? right : Buffer.from(String(right || ""));

  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

function hashSessionToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function createSession(userId) {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + SESSION_MAX_AGE_SECONDS * 1000
  ).toISOString();

  getDatabase()
    .prepare(
      `INSERT INTO bizzibuddi_sessions (
        token_hash, user_id, expires_at, created_at
      ) VALUES (?, ?, ?, ?)`
    )
    .run(hashSessionToken(token), userId, expiresAt, now.toISOString());

  return token;
}

function readCookie(request, name) {
  const header = String(request.headers.cookie || "");

  for (const part of header.split(";")) {
    const [key, ...valueParts] = part.trim().split("=");

    if (key === name) return valueParts.join("=");
  }

  return "";
}

function getSessionUser(request) {
  const token = readCookie(request, COOKIE_NAME);
  if (!token) return null;

  const db = getDatabase();
  const tokenHash = hashSessionToken(token);
  const session = db
    .prepare(
      `SELECT user_id, expires_at
       FROM bizzibuddi_sessions
       WHERE token_hash = ?`
    )
    .get(tokenHash);

  if (!session) return null;

  if (String(session.expires_at) <= new Date().toISOString()) {
    db.prepare("DELETE FROM bizzibuddi_sessions WHERE token_hash = ?").run(tokenHash);
    return null;
  }

  return getUserById(session.user_id);
}

function clientAddress(request) {
  return String(request.socket?.remoteAddress || "unknown");
}

function allowLoginAttempt(request) {
  const key = clientAddress(request);
  const now = Date.now();
  const existing = loginAttempts.get(key);

  if (!existing || now - existing.startedAt >= LOGIN_WINDOW_MS) {
    loginAttempts.set(key, { startedAt: now, count: 1 });
    return true;
  }

  if (existing.count >= MAX_LOGIN_ATTEMPTS) return false;

  existing.count += 1;
  return true;
}

function clearLoginAttempts(request) {
  loginAttempts.delete(clientAddress(request));
}

export function clearExpiredBizziBuddiAuthState() {
  const cutoff = Date.now() - LOGIN_WINDOW_MS;

  for (const [key, entry] of loginAttempts) {
    if (entry.startedAt < cutoff) loginAttempts.delete(key);
  }

  getDatabase()
    .prepare("DELETE FROM bizzibuddi_sessions WHERE expires_at <= ?")
    .run(new Date().toISOString());
}

function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, SCRYPT_KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: 64 * 1024 * 1024,
  });

  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

function verifyPassword(password, storedHash) {
  const parts = String(storedHash || "").split("$");

  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, nValue, rValue, pValue, saltValue, hashValue] = parts;
  const N = Number(nValue);
  const r = Number(rValue);
  const p = Number(pValue);

  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) {
    return false;
  }

  try {
    const expected = Buffer.from(hashValue, "base64url");
    const actual = scryptSync(
      password,
      Buffer.from(saltValue, "base64url"),
      expected.length,
      {
        N,
        r,
        p,
        maxmem: 64 * 1024 * 1024,
      }
    );

    return safeEqual(actual, expected);
  } catch {
    return false;
  }
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase();
}

function validateRegistration(payload) {
  const name = String(payload?.name || "").trim();
  const username = normalizeUsername(payload?.username);
  const email = normalizeEmail(payload?.email);
  const password = String(payload?.password || "");

  if (name.length < 2 || name.length > 120) {
    throw new Error("Please enter your full name.");
  }

  if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username)) {
    throw new Error("Username must be 3–32 characters and use letters, numbers, dots, underscores or hyphens.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new Error("Please enter a valid email address.");
  }

  if (password.length < 10 || password.length > 200) {
    throw new Error("Password must be at least 10 characters.");
  }

  return { name, username, email, password };
}

function toAccount(user) {
  const db = getDatabase();
  const workspace = db
    .prepare(
      `SELECT id, name, subscription_plan, subscription_status
       FROM workspaces
       WHERE owner_user_id = ?
       ORDER BY created_at
       LIMIT 1`
    )
    .get(user.id);

  return {
    id: user.id,
    name: user.display_name,
    username: user.username,
    email: user.email,
    business: workspace?.name || "",
    plan:
      workspace?.subscription_plan === "professional"
        ? "Professional"
        : workspace?.subscription_plan === "business"
          ? "Business"
          : "Free",
    workspaceId: workspace?.id || null,
    subscriptionStatus: workspace?.subscription_status || "inactive",
  };
}

function getUserById(id) {
  const user = getDatabase()
    .prepare(
      `SELECT id, email, username, display_name, status
       FROM users
       WHERE id = ?`
    )
    .get(id);

  if (!user || user.status !== "active") return null;

  return user;
}

function getUserByIdentifier(identifier) {
  const normalized = normalizeUsername(identifier);
  const email = normalizeEmail(identifier);

  return getDatabase()
    .prepare(
      `SELECT id, email, username, display_name, password_hash, status
       FROM users
       WHERE email = ? COLLATE NOCASE OR username = ? COLLATE NOCASE
       LIMIT 1`
    )
    .get(email, normalized);
}

function createAccount(payload) {
  const { name, username, email, password } = validateRegistration(payload);
  const db = getDatabase();

  const existing = db
    .prepare(
      `SELECT id
       FROM users
       WHERE email = ? COLLATE NOCASE OR username = ? COLLATE NOCASE
       LIMIT 1`
    )
    .get(email, username);

  if (existing) {
    throw new Error("An account with that email address or username already exists.");
  }

  const now = new Date().toISOString();
  const userId = randomUUID();
  const workspaceId = randomUUID();
  const slug = `${username}-${userId.slice(0, 8)}`;
  const passwordHash = hashPassword(password);

  db.exec("BEGIN IMMEDIATE");

  try {
    db.prepare(
      `INSERT INTO users (
        id, email, username, display_name, password_hash, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`
    ).run(userId, email, username, name, passwordHash, now, now);

    db.prepare(
      `INSERT INTO workspaces (
        id, name, slug, owner_user_id, subscription_plan,
        subscription_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'free', 'inactive', ?, ?)`
    ).run(
      workspaceId,
      "",
      slug,
      userId,
      now,
      now
    );

    db.prepare(
      `INSERT INTO workspace_memberships (
        workspace_id, user_id, role, status, created_at, updated_at
      ) VALUES (?, ?, 'owner', 'active', ?, ?)`
    ).run(workspaceId, userId, now, now);

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return toAccount(getUserById(userId));
}

function updateAccount(userId, payload) {
  const business = String(payload?.business || "").trim();
  const requestedPlan = payload?.plan == null ? null : String(payload.plan || "").trim();

  if (business.length > 120) {
    throw new Error("Business name must be 120 characters or fewer.");
  }

  const planMap = new Map([
    ["Free", "free"],
    ["Professional", "professional"],
    ["Business", "business"],
  ]);

  if (requestedPlan && !planMap.has(requestedPlan)) {
    throw new Error("Please select a valid BizziBuddi membership.");
  }

  const db = getDatabase();
  const workspace = db
    .prepare(
      `SELECT id
       FROM workspaces
       WHERE owner_user_id = ?
       ORDER BY created_at
       LIMIT 1`
    )
    .get(userId);

  if (!workspace) throw new Error("Business account could not be found.");

  const nextPlan = requestedPlan ? planMap.get(requestedPlan) : null;

  if (nextPlan) {
    db.prepare(
      `UPDATE workspaces
       SET name = ?, subscription_plan = ?, updated_at = ?
       WHERE id = ? AND owner_user_id = ?`
    ).run(business, nextPlan, new Date().toISOString(), workspace.id, userId);
  } else {
    db.prepare(
      `UPDATE workspaces
       SET name = ?, updated_at = ?
       WHERE id = ? AND owner_user_id = ?`
    ).run(business, new Date().toISOString(), workspace.id, userId);
  }

  return toAccount(getUserById(userId));
}
function createSessionCookie(userId, request) {
  const secure =
    process.env.NODE_ENV === "production" ||
    String(request.headers["x-forwarded-proto"] || "").split(",")[0].trim() === "https";

  return [
    `${COOKIE_NAME}=${createSession(userId)}`,
    "Path=/",
    "HttpOnly",
    secure ? "Secure" : "",
    "SameSite=Strict",
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
  ]
    .filter(Boolean)
    .join("; ");
}

function createLogoutCookie(request) {
  const secure =
    process.env.NODE_ENV === "production" ||
    String(request.headers["x-forwarded-proto"] || "").split(",")[0].trim() === "https";

  return [
    `${COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    secure ? "Secure" : "",
    "SameSite=Strict",
    "Max-Age=0",
  ]
    .filter(Boolean)
    .join("; ");
}

function revokeSession(request) {
  const token = readCookie(request, COOKIE_NAME);
  if (!token) return;

  getDatabase()
    .prepare("DELETE FROM bizzibuddi_sessions WHERE token_hash = ?")
    .run(hashSessionToken(token));
}

function isSameOrigin(request) {
  const origin = String(request.headers.origin || "").trim();

  if (!origin) return true;

  let originUrl;

  try {
    originUrl = new URL(origin);
  } catch {
    return false;
  }

  const forwardedProto = String(
    request.headers["x-forwarded-proto"] || ""
  )
    .split(",")[0]
    .trim()
    .toLowerCase();

  const protocol = forwardedProto || (process.env.NODE_ENV === "production" ? "https" : "http");
  const forwardedHost = String(request.headers["x-forwarded-host"] || "").split(",")[0].trim();
  const requestHost = String(request.headers.host || "").split(",")[0].trim();
  const candidateHosts = [forwardedHost, requestHost].filter(Boolean);

  return candidateHosts.some((candidateHost) => {
    try {
      const candidateUrl = new URL(`${protocol}://${candidateHost}`);
      return (
        originUrl.protocol === candidateUrl.protocol &&
        originUrl.hostname.toLowerCase() === candidateUrl.hostname.toLowerCase() &&
        (originUrl.port || (originUrl.protocol === "https:" ? "443" : "80")) ===
          (candidateUrl.port || (candidateUrl.protocol === "https:" ? "443" : "80"))
      );
    } catch {
      return false;
    }
  });
}

function sendJson(response, statusCode, payload, headers = {}) {
  const body = JSON.stringify(payload);

  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    ...headers,
  });

  response.end(body);
}

async function readJsonBody(request) {
  return new Promise((resolveBody, rejectBody) => {
    let body = "";
    let size = 0;
    let settled = false;

    request.setEncoding("utf8");

    request.on("data", (chunk) => {
      if (settled) return;

      size += Buffer.byteLength(chunk);

      if (size > MAX_BODY_BYTES) {
        settled = true;
        rejectBody(new Error("Request body is too large."));
        request.destroy();
        return;
      }

      body += chunk;
    });

    request.on("end", () => {
      if (settled) return;
      settled = true;

      if (!body.trim()) {
        resolveBody({});
        return;
      }

      try {
        resolveBody(JSON.parse(body));
      } catch {
        rejectBody(new Error("Request body must contain valid JSON."));
      }
    });

    request.on("error", (error) => {
      if (!settled) {
        settled = true;
        rejectBody(error);
      }
    });
  });
}

const BIZZIBUDDI_JOB_STATUSES = ["New", "In progress", "Waiting", "Complete"];

function validateJobPayload(payload) {
  const title = String(payload?.title || "").trim();
  const personId = String(payload?.personId || "").trim();
  const status = String(payload?.status || "New").trim();

  if (!title || title.length > 160) {
    throw new Error("Job name is required and must be 160 characters or fewer.");
  }

  if (!personId) {
    throw new Error("Please select a person for this job.");
  }

  if (!BIZZIBUDDI_JOB_STATUSES.includes(status)) {
    throw new Error("Please select a valid job status.");
  }

  return { title, personId, status };
}

function toJob(row) {
  if (!row) return null;

  return {
    id: row.id,
    personId: row.person_id || null,
    title: row.title,
    clientName: row.client_name || "Unassigned",
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    productionStage: row.production_stage || "Not started",
    productionProgress: Number(row.production_progress || 0),
    productionDueDate: row.production_due_date || "",
    productionTaskCount: Number(row.production_task_count || 0),
    productionCompletedTaskCount: Number(row.production_completed_task_count || 0),
    productionTaskProgress: Number(row.production_task_progress || 0),
    productionReadiness: row.production_readiness || "In progress",
    productionReadinessDetail: row.production_readiness_detail || "",
  };
}

function getPersonForUser(userId, personId) {
  return getDatabase()
    .prepare(
      `SELECT id, name
       FROM bizzibuddi_people
       WHERE id = ? AND user_id = ?`
    )
    .get(personId, userId);
}

function getJobs(userId) {
  const jobs = getDatabase()
    .prepare(
      `SELECT
         jobs.id,
         jobs.person_id,
         jobs.title,
         jobs.status,
         jobs.created_at,
         jobs.updated_at,
         people.name AS client_name
       FROM bizzibuddi_jobs AS jobs
       LEFT JOIN bizzibuddi_people AS people
         ON people.id = jobs.person_id
        AND people.user_id = jobs.user_id
       WHERE jobs.user_id = ?
       ORDER BY jobs.created_at DESC`
    )
    .all(userId);

  const productionByJob = new Map(
    getProductionRecords(userId).map((record) => [record.jobId, record])
  );

  return jobs.map((job) => {
    const production = productionByJob.get(job.id);
    const tasks = production?.tasks || [];
    return {
      ...job,
      production_stage: production?.stage || "Not started",
      production_progress: production ? productionStageProgress(production.stage) : 0,
      production_due_date: production?.dueDate || "",
      production_task_count: tasks.length,
      production_completed_task_count: tasks.filter((task) => task.complete).length,
      production_task_progress: productionTaskProgress(tasks),
      production_readiness: productionReadiness(
        production?.stage,
        production?.dueDate,
        tasks
      ).status,
      production_readiness_detail: productionReadiness(
        production?.stage,
        production?.dueDate,
        tasks
      ).detail,
    };
  });
}


function createJob(userId, payload) {
  const { title, personId, status } = validateJobPayload(payload);
  const person = getPersonForUser(userId, personId);

  if (!person) {
    throw new Error("The selected person could not be found.");
  }

  const now = new Date().toISOString();
  const job = {
    id: randomUUID(),
    person_id: person.id,
    title,
    status,
    created_at: now,
    updated_at: now,
  };

  getDatabase()
    .prepare(
      `INSERT INTO bizzibuddi_jobs (
        id, user_id, person_id, title, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      job.id,
      userId,
      job.person_id,
      job.title,
      job.status,
      job.created_at,
      job.updated_at
    );

  createAutomationEvent(userId, {
    type: "job-created",
    title: "Job created",
    detail: job.title + " was created for " + person.name + ".",
    sourceKey: "job-created:" + job.id + ":" + job.created_at,
    jobId: job.id,
  });

  getDatabase()
    .prepare(
      `INSERT INTO bizzibuddi_production (
        id, user_id, job_id, job_title, stage, due_date, notes, tasks_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'Not started', '', '', '[]', ?, ?)`
    )
    .run(randomUUID(), userId, job.id, job.title, now, now);

  createAutomationEvent(userId, {
    type: "job-production-started",
    title: "Production tracking ready",
    detail: job.title + " is ready for production tracking.",
    sourceKey: "job-production-started:" + job.id + ":" + now,
    jobId: job.id,
  });

  return getJobs(userId).find((item) => item.id === job.id) || null;
    ...job,
    client_name: person.name,
  });
}

function updateJob(userId, jobId, payload) {
  const { title, personId, status } = validateJobPayload(payload);
  const person = getPersonForUser(userId, personId);

  if (!person) {
    throw new Error("The selected person could not be found.");
  }

  const existing = getDatabase()
    .prepare("SELECT id, title, status, person_id FROM bizzibuddi_jobs WHERE id = ? AND user_id = ?")
    .get(jobId, userId);

  if (!existing) return null;

  const now = new Date().toISOString();
  const result = getDatabase()
    .prepare(
      `UPDATE bizzibuddi_jobs
       SET person_id = ?, title = ?, status = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`
    )
    .run(person.id, title, status, now, jobId, userId);

  if (!result.changes) return null;

  if (existing.status !== status) {
    createAutomationEvent(userId, {
      type: "job-status-changed",
      title: "Job status changed",
      detail: title + ": " + existing.status + " → " + status + ".",
      sourceKey: "job-status:" + jobId + ":" + existing.status + ":" + status + ":" + now,
      jobId,
    });
  } else if (existing.title !== title || existing.person_id !== person.id) {
    createAutomationEvent(userId, {
      type: "job-updated",
      title: "Job updated",
      detail: title + " was updated.",
      sourceKey: "job-updated:" + jobId + ":" + now,
      jobId,
    });
  }

  return getJobs(userId).find((item) => item.id === jobId) || null;
}

function deleteJob(userId, jobId) {
  const result = getDatabase()
    .prepare(
      `DELETE FROM bizzibuddi_jobs
       WHERE id = ? AND user_id = ?`
    )
    .run(jobId, userId);

  return Boolean(result.changes);
}

const BIZZIBUDDI_INVOICE_STATUSES = ["Issued", "Part Paid", "Paid", "Overdue"];

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function validateInvoicePayload(payload) {
  const personId = String(payload?.personId || "").trim();
  const amount = Number(payload?.amount ?? 0);
  const issueDate = String(payload?.issueDate || todayDate()).trim();
  const dueDate = String(payload?.dueDate || "").trim();

  if (!personId) throw new Error("Please select a person for this invoice.");
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000) {
    throw new Error("Invoice amount must be greater than zero.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(issueDate)) {
    throw new Error("Please enter a valid invoice issue date.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    throw new Error("Please enter a valid invoice due date.");
  }

  return {
    personId,
    amount: Math.round(amount * 100) / 100,
    issueDate,
    dueDate,
  };
}

function getInvoicePerson(userId, personId) {
  return getDatabase()
    .prepare(
      `SELECT id, name
       FROM bizzibuddi_people
       WHERE id = ? AND user_id = ?`
    )
    .get(personId, userId);
}

function getInvoicePaymentTotal(userId, invoiceId) {
  const row = getDatabase()
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) AS amount_paid
       FROM bizzibuddi_payments
       WHERE invoice_id = ? AND user_id = ?`
    )
    .get(invoiceId, userId);

  return Number(row?.amount_paid || 0);
}

function getInvoiceStatus(amount, amountPaid, storedStatus, dueDate) {
  const balance = Math.max(0, Number(amount || 0) - Number(amountPaid || 0));

  if (balance <= 0) return "Paid";
  if (Number(amountPaid || 0) > 0) return "Part Paid";
  if (storedStatus === "Draft") return "Draft";
  if (dueDate && dueDate < todayDate()) return "Overdue";
  return "Issued";
}

function toInvoice(row) {
  if (!row) return null;

  const amount = Number(row.amount || 0);
  const amountPaid = Number(row.amount_paid || 0);
  const balance = Math.max(0, amount - amountPaid);

  return {
    id: row.id,
    number: row.number,
    personId: row.person_id || null,
    personName: row.person_name || "Unassigned",
    amount,
    amountPaid,
    balance,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    status: getInvoiceStatus(amount, amountPaid, row.status, row.due_date),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getInvoices(userId) {
  return getDatabase()
    .prepare(
      `SELECT
         invoices.id,
         invoices.number,
         invoices.person_id,
         invoices.amount,
         invoices.status,
         invoices.issue_date,
         invoices.due_date,
         invoices.created_at,
         invoices.updated_at,
         people.name AS person_name,
         COALESCE(
           (SELECT SUM(payments.amount)
            FROM bizzibuddi_payments AS payments
            WHERE payments.invoice_id = invoices.id
              AND payments.user_id = invoices.user_id),
           0
         ) AS amount_paid
       FROM bizzibuddi_invoices AS invoices
       LEFT JOIN bizzibuddi_people AS people
         ON people.id = invoices.person_id
        AND people.user_id = invoices.user_id
       WHERE invoices.user_id = ?
       ORDER BY invoices.due_date ASC, invoices.created_at ASC`
    )
    .all(userId);
}

function nextInvoiceNumber(userId) {
  const prefix = "INV-";
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const number = prefix + String(Math.floor(100000 + Math.random() * 900000));
    const existing = getDatabase()
      .prepare(
        `SELECT id FROM bizzibuddi_invoices
         WHERE user_id = ? AND number = ?`
      )
      .get(userId, number);
    if (!existing) return number;
  }
  return prefix + Date.now().toString().slice(-8);
}

function createInvoice(userId, payload) {
  const values = validateInvoicePayload(payload);
  const person = getInvoicePerson(userId, values.personId);

  if (!person) throw new Error("The selected person could not be found.");

  const now = new Date().toISOString();
  const invoice = {
    id: randomUUID(),
    user_id: userId,
    person_id: person.id,
    number: nextInvoiceNumber(userId),
    amount: values.amount,
    status: "Issued",
    issue_date: values.issueDate,
    due_date: values.dueDate,
    created_at: now,
    updated_at: now,
  };

  getDatabase()
    .prepare(
      `INSERT INTO bizzibuddi_invoices (
        id, user_id, person_id, number, amount, status,
        issue_date, due_date, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      invoice.id,
      invoice.user_id,
      invoice.person_id,
      invoice.number,
      invoice.amount,
      invoice.status,
      invoice.issue_date,
      invoice.due_date,
      invoice.created_at,
      invoice.updated_at
    );

  return toInvoice({
    ...invoice,
    person_name: person.name,
    amount_paid: 0,
  });
}

function recordInvoicePayment(userId, invoiceId, payload = {}) {
  const invoice = getDatabase()
    .prepare(
      `SELECT id, amount, status, due_date
       FROM bizzibuddi_invoices
       WHERE id = ? AND user_id = ?`
    )
    .get(invoiceId, userId);

  if (!invoice) return null;

  const currentPaid = getInvoicePaymentTotal(userId, invoiceId);
  const balance = Math.max(0, Number(invoice.amount || 0) - currentPaid);

  if (balance <= 0) {
    return toInvoice({
      ...getDatabase().prepare(
        `SELECT invoices.*, people.name AS person_name,
                COALESCE((SELECT SUM(amount) FROM bizzibuddi_payments WHERE invoice_id = invoices.id AND user_id = invoices.user_id), 0) AS amount_paid
         FROM bizzibuddi_invoices AS invoices
         LEFT JOIN bizzibuddi_people AS people
           ON people.id = invoices.person_id AND people.user_id = invoices.user_id
         WHERE invoices.id = ? AND invoices.user_id = ?`
      ).get(invoiceId, userId),
    });
  }

  const requestedAmount =
    payload?.amount === undefined || payload?.amount === null || payload?.amount === ""
      ? balance
      : Number(payload.amount);
  const amount = Math.round(requestedAmount * 100) / 100;
  const method = String(payload?.method || "Other").trim().slice(0, 60) || "Other";
  const date = String(payload?.date || todayDate()).trim();
  const description = String(payload?.description || "Payment").trim().slice(0, 160) || "Payment";

  if (!Number.isFinite(amount) || amount <= 0 || amount > balance) {
    throw new Error(`Payment amount must be greater than zero and no more than the remaining balance of ${balance.toFixed(2)}.`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Please enter a valid payment date.");
  }

  const now = new Date().toISOString();
  const payment = {
    id: randomUUID(),
    user_id: userId,
    invoice_id: invoiceId,
    amount,
    date,
    method,
    description,
    created_at: now,
    updated_at: now,
  };

  const database = getDatabase();
  database.exec("BEGIN");
  try {
    database.prepare(
      `INSERT INTO bizzibuddi_payments (
        id, user_id, invoice_id, amount, date, method,
        description, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      payment.id,
      payment.user_id,
      payment.invoice_id,
      payment.amount,
      payment.date,
      payment.method,
      payment.description,
      payment.created_at,
      payment.updated_at
    );

    const nextPaid = currentPaid + amount;
    const nextStatus = getInvoiceStatus(invoice.amount, nextPaid, invoice.status, invoice.due_date);

    database.prepare(
      `UPDATE bizzibuddi_invoices
       SET status = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`
    ).run(nextStatus, now, invoiceId, userId);

    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }

  return toInvoice(
    getDatabase()
      .prepare(
        `SELECT invoices.*, people.name AS person_name,
                COALESCE((SELECT SUM(amount) FROM bizzibuddi_payments WHERE invoice_id = invoices.id AND user_id = invoices.user_id), 0) AS amount_paid
         FROM bizzibuddi_invoices AS invoices
         LEFT JOIN bizzibuddi_people AS people
           ON people.id = invoices.person_id AND people.user_id = invoices.user_id
         WHERE invoices.id = ? AND invoices.user_id = ?`
      )
      .get(invoiceId, userId)
  );
}


function validateCalendarPayload(payload) {
  const title = String(payload?.title || "").trim();
  const date = String(payload?.date || "").trim();
  const time = String(payload?.time || "").trim();
  const personId = String(payload?.personId || "").trim();
  const jobId = String(payload?.jobId || "").trim();
  const notes = String(payload?.notes || "").trim();
  const duration = Number(payload?.duration ?? 60);
  const buffer = Number(payload?.buffer ?? 0);
  const status = String(payload?.status || "Booked").trim();

  if (!title || title.length > 160) throw new Error("Appointment title is required and must be 160 characters or fewer.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Please enter a valid appointment date.");
  if (!/^\d{2}:\d{2}$/.test(time)) throw new Error("Please enter a valid appointment time.");
  if (!Number.isInteger(duration) || duration < 5 || duration > 1440) throw new Error("Appointment duration must be between 5 and 1440 minutes.");
  if (!Number.isInteger(buffer) || buffer < 0 || buffer > 480) throw new Error("Appointment buffer must be between 0 and 480 minutes.");
  if (!["Booked", "Confirmed", "Pending", "Cancelled"].includes(status)) throw new Error("Please select a valid appointment status.");

  return {
    title,
    date,
    time,
    personId: personId || null,
    jobId: jobId || null,
    duration,
    buffer,
    status,
    notes: notes.slice(0, 2000),
  };
}

function getCalendarPerson(userId, personId) {
  if (!personId) return null;
  return getDatabase().prepare(
    `SELECT id, name FROM bizzibuddi_people WHERE id = ? AND user_id = ?`
  ).get(personId, userId);
}

function getCalendarJob(userId, jobId) {
  if (!jobId) return null;
  return getDatabase().prepare(
    `SELECT id, title FROM bizzibuddi_jobs WHERE id = ? AND user_id = ?`
  ).get(jobId, userId);
}

function toCalendarEntry(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    time: row.time,
    personId: row.person_id || null,
    personName: row.person_name || "",
    jobId: row.job_id || null,
    jobTitle: row.job_title || "",
    duration: row.duration,
    buffer: row.buffer,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getCalendar(userId) {
  return getDatabase().prepare(
    `SELECT calendar.id, calendar.title, calendar.date, calendar.time,
            calendar.person_id, calendar.job_id, calendar.duration,
            calendar.buffer, calendar.status, calendar.notes,
            calendar.created_at, calendar.updated_at,
            people.name AS person_name, jobs.title AS job_title
     FROM bizzibuddi_calendar AS calendar
     LEFT JOIN bizzibuddi_people AS people
       ON people.id = calendar.person_id AND people.user_id = calendar.user_id
     LEFT JOIN bizzibuddi_jobs AS jobs
       ON jobs.id = calendar.job_id AND jobs.user_id = calendar.user_id
     WHERE calendar.user_id = ?
     ORDER BY calendar.date ASC, calendar.time ASC, calendar.created_at ASC`
  ).all(userId);
}

function createCalendarEntry(userId, payload) {
  const values = validateCalendarPayload(payload);
  const person = getCalendarPerson(userId, values.personId);
  const job = getCalendarJob(userId, values.jobId);

  if (values.personId && !person) throw new Error("The selected person could not be found.");
  if (values.jobId && !job) throw new Error("The selected job could not be found.");

  const now = new Date().toISOString();
  const entry = { id: randomUUID(), ...values, created_at: now, updated_at: now };

  getDatabase().prepare(
    `INSERT INTO bizzibuddi_calendar (
      id, user_id, person_id, job_id, title, date, time,
      duration, buffer, status, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    entry.id, userId, entry.personId, entry.jobId, entry.title,
    entry.date, entry.time, entry.duration, entry.buffer,
    entry.status, entry.notes, entry.created_at, entry.updated_at
  );

  return toCalendarEntry({ ...entry, person_name: person?.name || "", job_title: job?.title || "" });
}

function updateCalendarEntry(userId, entryId, payload) {
  const values = validateCalendarPayload(payload);
  const person = getCalendarPerson(userId, values.personId);
  const job = getCalendarJob(userId, values.jobId);

  if (values.personId && !person) throw new Error("The selected person could not be found.");
  if (values.jobId && !job) throw new Error("The selected job could not be found.");

  const now = new Date().toISOString();
  const result = getDatabase().prepare(
    `UPDATE bizzibuddi_calendar
     SET person_id = ?, job_id = ?, title = ?, date = ?, time = ?,
         duration = ?, buffer = ?, status = ?, notes = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`
  ).run(
    values.personId, values.jobId, values.title, values.date, values.time,
    values.duration, values.buffer, values.status, values.notes,
    now, entryId, userId
  );

  if (!result.changes) return null;

  return toCalendarEntry(getDatabase().prepare(
    `SELECT calendar.id, calendar.title, calendar.date, calendar.time,
            calendar.person_id, calendar.job_id, calendar.duration,
            calendar.buffer, calendar.status, calendar.notes,
            calendar.created_at, calendar.updated_at,
            people.name AS person_name, jobs.title AS job_title
     FROM bizzibuddi_calendar AS calendar
     LEFT JOIN bizzibuddi_people AS people
       ON people.id = calendar.person_id AND people.user_id = calendar.user_id
     LEFT JOIN bizzibuddi_jobs AS jobs
       ON jobs.id = calendar.job_id AND jobs.user_id = calendar.user_id
     WHERE calendar.id = ? AND calendar.user_id = ?`
  ).get(entryId, userId));
}

function deleteCalendarEntry(userId, entryId) {
  const result = getDatabase().prepare(
    `DELETE FROM bizzibuddi_calendar WHERE id = ? AND user_id = ?`
  ).run(entryId, userId);
  return Boolean(result.changes);
}


function validatePersonPayload(payload) {
  const name = String(payload?.name || "").trim();
  const email = normalizeEmail(payload?.email);
  const phone = String(payload?.phone || "").trim();

  if (!name || name.length > 120) {
    throw new Error("Person name is required and must be 120 characters or fewer.");
  }

  if (email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)) {
    throw new Error("Please enter a valid email address.");
  }

  if (phone.length > 60) {
    throw new Error("Phone number must be 60 characters or fewer.");
  }

  return { name, email, phone };
}

function toPerson(row) {
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getPeople(userId) {
  return getDatabase()
    .prepare(
      `SELECT id, name, email, phone, created_at, updated_at
       FROM bizzibuddi_people
       WHERE user_id = ?
       ORDER BY created_at DESC`
    )
    .all(userId);
}

function createPerson(userId, payload) {
  const { name, email, phone } = validatePersonPayload(payload);
  const now = new Date().toISOString();
  const person = {
    id: randomUUID(),
    name,
    email,
    phone,
    created_at: now,
    updated_at: now,
  };

  getDatabase()
    .prepare(
      `INSERT INTO bizzibuddi_people (
        id, user_id, name, email, phone, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      person.id,
      userId,
      person.name,
      person.email,
      person.phone,
      person.created_at,
      person.updated_at
    );

  return toPerson(person);
}

function updatePerson(userId, personId, payload) {
  const { name, email, phone } = validatePersonPayload(payload);
  const now = new Date().toISOString();

  const result = getDatabase()
    .prepare(
      `UPDATE bizzibuddi_people
       SET name = ?, email = ?, phone = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`
    )
    .run(name, email, phone, now, personId, userId);

  if (!result.changes) return null;

  return toPerson(
    getDatabase()
      .prepare(
        `SELECT id, name, email, phone, created_at, updated_at
         FROM bizzibuddi_people
         WHERE id = ? AND user_id = ?`
      )
      .get(personId, userId)
  );
}

function deletePerson(userId, personId) {
  const result = getDatabase()
    .prepare(
      `DELETE FROM bizzibuddi_people
       WHERE id = ? AND user_id = ?`
    )
    .run(personId, userId);

  return Boolean(result.changes);
}

function getMeasurements(userId, personId) {
  const person = getDatabase()
    .prepare(
      `SELECT id FROM bizzibuddi_people
       WHERE id = ? AND user_id = ?`
    )
    .get(personId, userId);

  if (!person) return null;

  return getDatabase()
    .prepare(
      `SELECT id, person_id, label, data_json, created_at, updated_at
       FROM bizzibuddi_measurements
       WHERE person_id = ? AND user_id = ?
       ORDER BY created_at DESC`
    )
    .all(personId, userId)
    .map(toMeasurement);
}

function toMeasurement(row) {
  if (!row) return null;
  let data = {};
  try {
    const parsed = JSON.parse(String(row.data_json || "{}"));
    data = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    data = {};
  }

  return {
    id: row.id,
    personId: row.person_id,
    label: row.label || "Measurement set",
    data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validateMeasurementPayload(payload) {
  const label = String(payload?.label || "Measurement set").trim();
  const allowedFields = [
    "bust",
    "waist",
    "hip",
    "shoulder",
    "sleeve",
    "neck",
    "backWaist",
    "inseam",
    "height",
    "notes",
  ];
  const data = {};

  if (!label || label.length > 120) {
    throw new Error("Measurement label is required and must be 120 characters or fewer.");
  }

  for (const field of allowedFields) {
    const value = String(payload?.data?.[field] ?? "").trim();
    if (value.length > 120) {
      throw new Error("Measurement values must be 120 characters or fewer.");
    }
    if (value) data[field] = value;
  }

  if (!Object.keys(data).length) {
    throw new Error("Please enter at least one measurement.");
  }

  return { label, data };
}

function createMeasurement(userId, personId, payload) {
  const person = getDatabase()
    .prepare(
      `SELECT id FROM bizzibuddi_people
       WHERE id = ? AND user_id = ?`
    )
    .get(personId, userId);

  if (!person) return null;

  const { label, data } = validateMeasurementPayload(payload);
  const now = new Date().toISOString();
  const measurement = {
    id: randomUUID(),
    user_id: userId,
    person_id: personId,
    label,
    data_json: JSON.stringify(data),
    created_at: now,
    updated_at: now,
  };

  getDatabase()
    .prepare(
      `INSERT INTO bizzibuddi_measurements (
        id, user_id, person_id, label, data_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      measurement.id,
      measurement.user_id,
      measurement.person_id,
      measurement.label,
      measurement.data_json,
      measurement.created_at,
      measurement.updated_at
    );

  return toMeasurement(measurement);
}



const BIZZIBUDDI_PRODUCTION_STAGES = [
  "Not started",
  "In production",
  "Quality check",
  "Ready",
  "Complete",
];

function productionStageProgress(stage) {
  const index = BIZZIBUDDI_PRODUCTION_STAGES.indexOf(stage);
  if (index < 0) return 0;
  return Math.round((index / (BIZZIBUDDI_PRODUCTION_STAGES.length - 1)) * 100);
}

function productionTaskProgress(tasks) {
  const total = Array.isArray(tasks) ? tasks.length : 0;
  if (!total) return 0;
  const completed = tasks.filter((task) => task.complete).length;
  return Math.round((completed / total) * 100);
}

function productionReadiness(stage, dueDate, tasks) {
  const normalizedStage = String(stage || "Not started");
  const totalTasks = Array.isArray(tasks) ? tasks.length : 0;
  const completedTasks = Array.isArray(tasks) ? tasks.filter((task) => task.complete).length : 0;
  const today = new Date().toISOString().slice(0, 10);

  if (normalizedStage === "Complete") {
    return { status: "Complete", detail: "Production is complete." };
  }

  if (dueDate && dueDate < today) {
    return { status: "Overdue", detail: "Ready-by date has passed." };
  }

  if (normalizedStage === "Ready") {
    if (totalTasks > 0 && completedTasks < totalTasks) {
      return { status: "Tasks outstanding", detail: (totalTasks - completedTasks) + " production task(s) remain." };
    }
    return { status: "Ready", detail: "Production is ready for completion." };
  }

  if (totalTasks > 0 && completedTasks === totalTasks) {
    return { status: "Stage update needed", detail: "All production tasks are complete." };
  }

  if (normalizedStage === "Not started") {
    return { status: "Not started", detail: "Production has not started." };
  }

  return { status: "In progress", detail: "Production is moving through its workflow." };
}

function validateProductionPayload(payload) {
  const jobId = String(payload?.jobId || "").trim();
  const stage = String(payload?.stage || "Not started").trim();
  const dueDate = String(payload?.dueDate || "").trim();
  const notes = String(payload?.notes || "").trim();
  const tasks = Array.isArray(payload?.tasks) ? payload.tasks : [];

  if (!jobId) throw new Error("Please select a job for this production record.");
  if (!BIZZIBUDDI_PRODUCTION_STAGES.includes(stage)) throw new Error("Please select a valid production stage.");
  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) throw new Error("Please enter a valid production ready-by date.");
  if (notes.length > 2000) throw new Error("Production notes must be 2000 characters or fewer.");
  if (tasks.length > 100) throw new Error("Production cannot contain more than 100 tasks.");

  const normalizedTasks = tasks.map((task, index) => {
    const title = String(task?.title || "").trim();
    if (!title || title.length > 200) throw new Error("Production task " + (index + 1) + " must contain a title of 200 characters or fewer.");
    return { id: String(task?.id || randomUUID()), title, complete: Boolean(task?.complete) };
  });

  return { jobId, stage, dueDate, notes, tasks: normalizedTasks };
}

function toProductionRecord(row) {
  if (!row) return null;
  let tasks = [];
  try {
    const parsed = JSON.parse(String(row.tasks_json || "[]"));
    tasks = Array.isArray(parsed) ? parsed : [];
  } catch {
    tasks = [];
  }
  return {
    id: row.id, jobId: row.job_id, jobTitle: row.job_title || "Untitled job",
    stage: row.stage, dueDate: row.due_date || "", notes: row.notes || "", tasks,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function getProductionRecords(userId) {
  return getDatabase()
    .prepare(`SELECT id, job_id, job_title, stage, due_date, notes, tasks_json, created_at, updated_at
      FROM bizzibuddi_production
      WHERE user_id = ?
      ORDER BY updated_at DESC`)
    .all(userId)
    .map(toProductionRecord);
}

function saveProductionRecord(userId, payload) {
  const values = validateProductionPayload(payload);
  const database = getDatabase();
  const job = database.prepare(`SELECT id, title FROM bizzibuddi_jobs WHERE id = ? AND user_id = ?`).get(values.jobId, userId);
  if (!job) throw new Error("The selected job could not be found.");

  const existing = database.prepare(`SELECT id, stage, tasks_json, created_at FROM bizzibuddi_production WHERE job_id = ? AND user_id = ?`).get(values.jobId, userId);
  const existingTasks = (() => {
    if (!existing?.tasks_json) return [];
    try {
      const parsed = JSON.parse(String(existing.tasks_json));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();
  const now = new Date().toISOString();
  const id = existing?.id || randomUUID();

  database.prepare(`INSERT INTO bizzibuddi_production
    (id, user_id, job_id, job_title, stage, due_date, notes, tasks_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, job_id) DO UPDATE SET
      job_title = excluded.job_title, stage = excluded.stage, due_date = excluded.due_date,
      notes = excluded.notes, tasks_json = excluded.tasks_json, updated_at = excluded.updated_at`).run(
    id, userId, job.id, job.title, values.stage, values.dueDate, values.notes,
    JSON.stringify(values.tasks), existing?.created_at || now, now
  );

  if (!existing) {
    createAutomationEvent(userId, {
      type: "job-production-started",
      title: "Production tracking started",
      detail: job.title + " entered production tracking.",
      sourceKey: "job-production-started:" + job.id + ":" + now,
      jobId: job.id,
    });
  } else if (existing.stage !== values.stage) {
    createAutomationEvent(userId, {
      type: "job-production-stage-changed",
      title: "Production stage changed",
      detail: job.title + ": " + existing.stage + " → " + values.stage + ".",
      sourceKey: "job-production-stage:" + job.id + ":" + existing.stage + ":" + values.stage + ":" + now,
      jobId: job.id,
    });
  }

  const previousTasksById = new Map(existingTasks.map((task) => [String(task.id), task]));
  values.tasks.forEach((task) => {
    const previous = previousTasksById.get(String(task.id));
    if (!previous || previous.complete === task.complete) return;
    const type = task.complete ? "job-production-task-completed" : "job-production-task-reopened";
    const title = task.complete ? "Production task completed" : "Production task reopened";
    createAutomationEvent(userId, {
      type,
      title,
      detail: job.title + ": " + task.title + ".",
      sourceKey: type + ":" + job.id + ":" + task.id + ":" + now,
      jobId: job.id,
    });
  });

  return toProductionRecord(database.prepare(`SELECT id, job_id, job_title, stage, due_date, notes, tasks_json, created_at, updated_at
    FROM bizzibuddi_production WHERE id = ? AND user_id = ?`).get(id, userId));
}

function updateProductionRecord(userId, recordId, payload) {
  const values = validateProductionPayload(payload);
  const database = getDatabase();
  const job = database.prepare(`SELECT id, title FROM bizzibuddi_jobs WHERE id = ? AND user_id = ?`).get(values.jobId, userId);
  if (!job) throw new Error("The selected job could not be found.");

  const existing = database.prepare(`SELECT stage FROM bizzibuddi_production WHERE id = ? AND user_id = ?`).get(recordId, userId);
  if (!existing) return null;
  const now = new Date().toISOString();

  const result = database.prepare(`UPDATE bizzibuddi_production
    SET job_id = ?, job_title = ?, stage = ?, due_date = ?, notes = ?, tasks_json = ?, updated_at = ?
    WHERE id = ? AND user_id = ?`).run(
    job.id, job.title, values.stage, values.dueDate, values.notes, JSON.stringify(values.tasks),
    now, recordId, userId
  );
  if (!result.changes) return null;

  if (existing.stage !== values.stage) {
    createAutomationEvent(userId, {
      type: "job-production-stage-changed",
      title: "Production stage changed",
      detail: job.title + ": " + existing.stage + " → " + values.stage + ".",
      sourceKey: "job-production-stage:" + job.id + ":" + existing.stage + ":" + values.stage + ":" + now,
      jobId: job.id,
    });
  }
  return toProductionRecord(database.prepare(`SELECT id, job_id, job_title, stage, due_date, notes, tasks_json, created_at, updated_at
    FROM bizzibuddi_production WHERE id = ? AND user_id = ?`).get(recordId, userId));
}

function deleteProductionRecord(userId, recordId) {
  const result = getDatabase().prepare(`DELETE FROM bizzibuddi_production WHERE id = ? AND user_id = ?`).run(recordId, userId);
  return Boolean(result.changes);
}
const BIZZIBUDDI_AUTOMATION_TYPES = [
  "appointment-created",
  "invoice-overdue",
  "check-complete",
  "job-created",
  "job-status-changed",
  "job-updated",
  "job-production-started",
  "job-production-stage-changed",
  "job-production-task-completed",
  "job-production-task-reopened",
];

function validateAutomationEventPayload(payload) {
  const type = String(payload?.type || "").trim();
  const title = String(payload?.title || "").trim();
  const detail = String(payload?.detail || "").trim();
  const sourceKey = String(payload?.sourceKey || "").trim();
  const jobId = payload?.jobId ? String(payload.jobId).trim() : null;

  if (!BIZZIBUDDI_AUTOMATION_TYPES.includes(type)) {
    throw new Error("Please provide a valid automation event type.");
  }

  if (!title || title.length > 160) {
    throw new Error("Automation event title is required and must be 160 characters or fewer.");
  }

  if (detail.length > 1000) {
    throw new Error("Automation event detail must be 1000 characters or fewer.");
  }

  if (sourceKey.length > 240) {
    throw new Error("Automation event source key must be 240 characters or fewer.");
  }

  return { type, title, detail, sourceKey, jobId };
}

function toAutomationEvent(row) {
  if (!row) return null;

  return {
    id: row.id,
    type: row.type,
    title: row.title,
    detail: row.detail,
    sourceKey: row.source_key || "",
    jobId: row.job_id || null,
    createdAt: row.created_at,
  };
}

function getAutomationEvents(userId) {
  return getDatabase()
    .prepare(
      `SELECT id, type, title, detail, source_key, created_at
       FROM bizzibuddi_automation_events
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 100`
    )
    .all(userId);
}

function createAutomationEvent(userId, payload) {
  const values = validateAutomationEventPayload(payload);
  const now = new Date().toISOString();
  const event = {
    id: randomUUID(),
    type: values.type,
    title: values.title,
    detail: values.detail,
    source_key: values.sourceKey,
    job_id: values.jobId,
    created_at: now,
  };

  const database = getDatabase();

  if (values.sourceKey) {
    const existing = database
      .prepare(
        `SELECT id, type, title, detail, source_key, created_at
         FROM bizzibuddi_automation_events
         WHERE user_id = ? AND source_key = ?`
      )
      .get(userId, values.sourceKey);

    if (existing) return toAutomationEvent(existing);
  }

  database
    .prepare(
      `INSERT INTO bizzibuddi_automation_events (
        id, user_id, type, title, detail, source_key, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      event.id,
      userId,
      event.type,
      event.title,
      event.detail,
      event.source_key,
      event.job_id,
      event.created_at
    );

  return toAutomationEvent({
    ...event,
  });
}

function getJobTimeline(userId, jobId) {
  const job = getDatabase()
    .prepare("SELECT id FROM bizzibuddi_jobs WHERE id = ? AND user_id = ?")
    .get(jobId, userId);

  if (!job) return null;

  return getDatabase()
    .prepare(
      `SELECT id, type, title, detail, source_key, job_id, created_at
       FROM bizzibuddi_automation_events
       WHERE user_id = ? AND job_id = ?
       ORDER BY created_at DESC
       LIMIT 100`
    )
    .all(userId, jobId)
    .map(toAutomationEvent);
}

function runAutomationChecks(userId) {
  const database = getDatabase();
  const overdueInvoices = database
    .prepare(
      `SELECT
         invoices.id,
         invoices.number,
         invoices.due_date,
         people.name AS person_name,
         invoices.amount,
         COALESCE(
           (SELECT SUM(payments.amount)
            FROM bizzibuddi_payments AS payments
            WHERE payments.invoice_id = invoices.id
              AND payments.user_id = invoices.user_id),
           0
         ) AS amount_paid
       FROM bizzibuddi_invoices AS invoices
       LEFT JOIN bizzibuddi_people AS people
         ON people.id = invoices.person_id
        AND people.user_id = invoices.user_id
       WHERE invoices.user_id = ?
         AND invoices.due_date < ?
         AND invoices.status <> 'Paid'`
    )
    .all(userId, todayDate());

  const created = [];

  if (overdueInvoices.length === 0) {
    created.push(
      createAutomationEvent(userId, {
        type: "check-complete",
        title: "Automation check complete",
        detail: "No overdue invoices were found.",
        sourceKey: `check-complete:${todayDate()}`,
      })
    );
  }

  for (const invoice of overdueInvoices) {
    const balance = Math.max(
      0,
      Number(invoice.amount || 0) - Number(invoice.amount_paid || 0)
    );

    if (balance <= 0) continue;

    const event = createAutomationEvent(userId, {
      type: "invoice-overdue",
      title: "Overdue invoice flagged",
      detail: `${invoice.number} for ${invoice.person_name || "a client"} is overdue.`,
      sourceKey: `invoice-overdue:${invoice.id}:${invoice.due_date}`,
    });

    created.push(event);
  }

  return {
    checkedAt: new Date().toISOString(),
    overdueCount: overdueInvoices.length,
    created,
    events: getAutomationEvents(userId).map(toAutomationEvent),
  };
}

function deleteAutomationEvents(userId) {
  const result = getDatabase()
    .prepare(
      `DELETE FROM bizzibuddi_automation_events
       WHERE user_id = ?`
    )
    .run(userId);

  return Number(result.changes || 0);
}

function buildBizziBuddiBusinessInsights(monthlyStatistics, finance, jobs, calendar, production) {
  const recent = monthlyStatistics.slice(-3);
  const previous = monthlyStatistics.slice(-6, -3);

  const sum = (rows, field) => rows.reduce((total, row) => total + (Number(row[field]) || 0), 0);
  const percentageChange = (current, previousValue) => {
    if (previousValue === 0) return current > 0 ? null : 0;
    return Math.round(((current - previousValue) / previousValue) * 100);
  };
  const trend = (change) => {
    if (change === null) return "new";
    if (Math.abs(change) < 5) return "stable";
    return change > 0 ? "up" : "down";
  };
  const trendLabel = (change) => {
    if (change === null) return "New activity";
    if (change === 0) return "No change";
    return `${change > 0 ? "+" : ""}${change}%`;
  };

  const recentInvoiced = sum(recent, "invoiced");
  const previousInvoiced = sum(previous, "invoiced");
  const recentPaid = sum(recent, "paid");
  const previousPaid = sum(previous, "paid");
  const recentPeople = sum(recent, "newPeople");
  const previousPeople = sum(previous, "newPeople");
  const recentJobs = sum(recent, "jobsCreated");
  const previousJobs = sum(previous, "jobsCreated");

  const invoicedChange = percentageChange(recentInvoiced, previousInvoiced);
  const paidChange = percentageChange(recentPaid, previousPaid);
  const peopleChange = percentageChange(recentPeople, previousPeople);
  const jobsChange = percentageChange(recentJobs, previousJobs);

  return [
    {
      key: "invoiced-trend",
      label: "Invoicing trend",
      value: formatBusinessInsightCurrency(recentInvoiced),
      trend: trend(invoicedChange),
      change: trendLabel(invoicedChange),
      detail: "Total invoices issued across the most recent three months.",
    },
    {
      key: "paid-trend",
      label: "Payments recorded",
      value: formatBusinessInsightCurrency(recentPaid),
      trend: trend(paidChange),
      change: trendLabel(paidChange),
      detail: "Payments recorded across the most recent three months.",
    },
    {
      key: "client-activity",
      label: "New client activity",
      value: String(recentPeople),
      trend: trend(peopleChange),
      change: trendLabel(peopleChange),
      detail: "New people added across the most recent three months.",
    },
    {
      key: "job-activity",
      label: "Job activity",
      value: String(recentJobs),
      trend: trend(jobsChange),
      change: trendLabel(jobsChange),
      detail: "Jobs created across the most recent three months.",
    },
    {
      key: "current-workload",
      label: "Current workload",
      value: String(jobs.open),
      trend: "current",
      change: `${calendar.upcoming} upcoming appointments`,
      detail: `${production.active} production record${production.active === 1 ? "" : "s"} currently active.`,
    },
    {
      key: "outstanding-exposure",
      label: "Outstanding balance",
      value: formatBusinessInsightCurrency(finance.outstanding),
      trend: finance.overdueInvoices > 0 ? "attention" : "current",
      change: `${finance.overdueInvoices} overdue invoice${finance.overdueInvoices === 1 ? "" : "s"}`,
      detail: "Current unpaid invoice balance from the account finance records.",
    },
  ];
}

function formatBusinessInsightCurrency(value) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function getMonthlyBizziBuddiStatistics(userId, now = new Date()) {
  const people = getPeople(userId).map(toPerson);
  const jobs = getJobs(userId).map(toJob);
  const appointments = getCalendar(userId).map(toCalendarEntry);
  const invoices = getInvoices(userId).map(toInvoice);
  const productionRecords = getProductionRecords(userId);

  const months = [];
  const cursor = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  for (let index = 0; index < 12; index += 1) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const key = `${year}-${String(month + 1).padStart(2, "0")}`;
    months.push({
      key,
      label: cursor.toLocaleDateString("en-AU", { month: "short", year: "numeric" }),
      newPeople: 0,
      jobsCreated: 0,
      appointments: 0,
      invoiced: 0,
      paid: 0,
      productionCompleted: 0,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const byMonth = new Map(months.map((month) => [month.key, month]));
  const monthKey = (value) => {
    const text = String(value || "");
    return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 7) : "";
  };

  for (const person of people) {
    const month = byMonth.get(monthKey(person.createdAt));
    if (month) month.newPeople += 1;
  }

  for (const job of jobs) {
    const month = byMonth.get(monthKey(job.createdAt));
    if (month) month.jobsCreated += 1;
  }

  for (const appointment of appointments) {
    const month = byMonth.get(monthKey(appointment.date));
    if (month) month.appointments += 1;
  }

  for (const invoice of invoices) {
    const month = byMonth.get(monthKey(invoice.issueDate || invoice.createdAt));
    if (month) month.invoiced += Number(invoice.amount) || 0;
  }

  const payments = getDatabase()
    .prepare(
      `SELECT amount, date
       FROM bizzibuddi_payments
       WHERE user_id = ?
       ORDER BY date ASC, created_at ASC`
    )
    .all(userId);

  for (const payment of payments) {
    const month = byMonth.get(monthKey(payment.date));
    if (month) month.paid += Number(payment.amount) || 0;
  }

  for (const record of productionRecords) {
    if (record.stage !== "Complete") continue;
    const month = byMonth.get(monthKey(record.updatedAt || record.createdAt));
    if (month) month.productionCompleted += 1;
  }

  return months.map((month) => ({
    ...month,
    invoiced: Math.round(month.invoiced * 100) / 100,
    paid: Math.round(month.paid * 100) / 100,
  }));
}

function getBizziBuddiReports(userId) {
  const people = getPeople(userId).map(toPerson);
  const jobs = getJobs(userId).map(toJob);
  const appointments = getCalendar(userId).map(toCalendarEntry);
  const invoices = getInvoices(userId).map(toInvoice);
  const productionRecords = getProductionRecords(userId);
  const totalInvoiced = invoices.reduce((sum, invoice) => sum + (Number(invoice.amount) || 0), 0);
  const totalPaid = invoices.reduce((sum, invoice) => sum + (Number(invoice.amountPaid) || 0), 0);
  const completedJobs = jobs.filter((job) => job.status === "Complete").length;
  const openJobs = jobs.filter((job) => job.status !== "Complete").length;
  const today = todayDate();
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);
  const upcomingAppointments = appointments.filter((appointment) => {
    if (!appointment.date) return false;
    if (appointment.date > today) return true;
    if (appointment.date < today) return false;
    return String(appointment.time || "23:59") >= currentTime;
  }).length;
  const overdueInvoiceRecords = invoices.filter((invoice) => invoice.status !== "Paid" && invoice.dueDate && invoice.dueDate < today);
  const outstandingInvoiceRecords = invoices.filter((invoice) => invoice.status !== "Paid");
  const paidInvoices = invoices.filter((invoice) => invoice.status === "Paid");
  const overdueAmount = overdueInvoiceRecords.reduce((sum, invoice) => sum + Math.max(0, Number(invoice.balance ?? (invoice.amount - (invoice.amountPaid || 0))) || 0), 0);
  const outstandingInvoiceCount = outstandingInvoiceRecords.length;
  const paidInvoiceCount = paidInvoices.length;
  const averageInvoice = invoices.length ? totalInvoiced / invoices.length : 0;
  const jobStatusGroups = [
    ["New", jobs.filter((job) => job.status === "New").length],
    ["In progress", jobs.filter((job) => job.status === "In progress").length],
    ["Waiting", jobs.filter((job) => job.status === "Waiting").length],
    ["Complete", completedJobs],
  ];
  const productionComplete = productionRecords.filter((record) => record.stage === "Complete").length;
  const productionActive = productionRecords.filter((record) => record.stage && record.stage !== "Complete").length;
  const productionStageGroups = BIZZIBUDDI_PRODUCTION_STAGES.map((stage) => [
    stage,
    productionRecords.filter((record) => record.stage === stage).length,
  ]);
  const jobCompletionRate = jobs.length ? Math.round((completedJobs / jobs.length) * 100) : 0;
  const paymentCollectionRate = totalInvoiced > 0 ? Math.round((Math.min(totalPaid, totalInvoiced) / totalInvoiced) * 100) : 0;
  const productionCompletionRate = productionRecords.length ? Math.round((productionComplete / productionRecords.length) * 100) : 0;
  return {
    generatedAt: now.toISOString(),
    people: { total: people.length },
    jobs: { total: jobs.length, open: openJobs, completed: completedJobs, statusGroups: jobStatusGroups },
    calendar: {
      total: appointments.length,
      upcoming: upcomingAppointments,
      bookedConfirmed: appointments.filter((item) => !item.status || item.status === "Booked" || item.status === "Confirmed").length,
      cancelled: appointments.filter((item) => item.status === "Cancelled").length,
    },
    finance: {
      totalInvoiced: Math.round(totalInvoiced * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      outstanding: Math.max(0, Math.round((totalInvoiced - totalPaid) * 100) / 100),
      overdueInvoices,
      overdueAmount: Math.round(overdueAmount * 100) / 100,
      outstandingInvoiceCount,
      paidInvoiceCount,
      averageInvoice: Math.round(averageInvoice * 100) / 100,
      collectionRate: totalInvoiced > 0 ? Math.round((Math.min(totalPaid, totalInvoiced) / totalInvoiced) * 100) : 0,
    },
    production: { total: productionRecords.length, active: productionActive, complete: productionComplete, stageGroups: productionStageGroups },
    insights: { jobCompletionRate, paymentCollectionRate, productionCompletionRate },
    monthlyStatistics: getMonthlyBizziBuddiStatistics(userId, now),
    businessInsights: buildBizziBuddiBusinessInsights(monthlyStatistics, finance, jobs, calendar, production),
  };
}

export async function handleBizziBuddiAuthRequest(request, response) {
  const url = new URL(
    request.url || "/",
    `http://${request.headers.host || "localhost"}`
  );

  if (url.pathname === "/api/bizzibuddi/auth/health" && request.method === "GET") {
    sendJson(response, 200, {
      ok: true,
      service: "bizzibuddi-auth",
    });
    return true;
  }

  if (request.method === "OPTIONS" && url.pathname.startsWith("/api/bizzibuddi/auth/")) {
    if (!isSameOrigin(request)) {
      sendJson(response, 403, {
        ok: false,
        error: "Cross-origin requests are not permitted.",
      });
      return true;
    }

    response.writeHead(204, { "Cache-Control": "no-store" });
    response.end();
    return true;
  }

  if (!url.pathname.startsWith("/api/bizzibuddi/auth/")) return false;

  if (
    request.method !== "POST" &&
    request.method !== "GET" &&
    request.method !== "PUT" &&
    request.method !== "DELETE"
  ) {
    sendJson(response, 405, { ok: false, error: "Method not allowed." });
    return true;
  }

  if (
    ["POST", "PUT", "DELETE"].includes(request.method) &&
    !isSameOrigin(request)
  ) {
    sendJson(response, 403, {
      ok: false,
      error: "Cross-origin requests are not permitted.",
    });
    return true;
  }

  try {
    if (url.pathname === "/api/bizzibuddi/auth/register" && request.method === "POST") {
      const payload = await readJsonBody(request);
      const account = createAccount(payload);

      sendJson(
        response,
        201,
        { ok: true, authenticated: true, account },
        { "Set-Cookie": createSessionCookie(account.id, request) }
      );
      return true;
    }

    if (url.pathname === "/api/bizzibuddi/auth/login" && request.method === "POST") {
      if (!allowLoginAttempt(request)) {
        sendJson(
          response,
          429,
          {
            ok: false,
            error: "Too many login attempts. Please try again later.",
          },
          { "Retry-After": "900" }
        );
        return true;
      }

      const payload = await readJsonBody(request);
      const identifier = String(payload?.identifier || "");
      const password = String(payload?.password || "");
      const user = getUserByIdentifier(identifier);

      if (!user || user.status !== "active" || !verifyPassword(password, user.password_hash)) {
        sendJson(response, 401, {
          ok: false,
          authenticated: false,
          error: "Invalid email/username or password.",
        });
        return true;
      }

      clearLoginAttempts(request);

      const account = toAccount(user);

      sendJson(
        response,
        200,
        { ok: true, authenticated: true, account },
        { "Set-Cookie": createSessionCookie(user.id, request) }
      );
      return true;
    }


    if (url.pathname === "/api/bizzibuddi/auth/reports" && request.method === "GET") {
      const user = getSessionUser(request);
      if (!user) {
        sendJson(response, 401, { ok: false, authenticated: false, error: "Authentication required." });
        return true;
      }
      sendJson(response, 200, { ok: true, authenticated: true, reports: getBizziBuddiReports(user.id) });
      return true;
    }

    if (url.pathname === "/api/bizzibuddi/auth/production" && request.method === "GET") {
      const user = getSessionUser(request);
      if (!user) {
        sendJson(response, 401, { ok: false, authenticated: false, error: "Authentication required." });
        return true;
      }
      sendJson(response, 200, { ok: true, authenticated: true, records: getProductionRecords(user.id) });
      return true;
    }

    if (url.pathname === "/api/bizzibuddi/auth/production" && request.method === "POST") {
      const user = getSessionUser(request);
      if (!user) {
        sendJson(response, 401, { ok: false, authenticated: false, error: "Authentication required." });
        return true;
      }
      const payload = await readJsonBody(request);
      sendJson(response, 200, { ok: true, authenticated: true, record: saveProductionRecord(user.id, payload) });
      return true;
    }

    if (url.pathname.startsWith("/api/bizzibuddi/auth/production/")) {
      const recordId = decodeURIComponent(url.pathname.slice("/api/bizzibuddi/auth/production/".length)).trim();
      if (!recordId || recordId.includes("/")) {
        sendJson(response, 404, { ok: false, error: "Production record not found." });
        return true;
      }
      const user = getSessionUser(request);
      if (!user) {
        sendJson(response, 401, { ok: false, authenticated: false, error: "Authentication required." });
        return true;
      }
      if (request.method === "PUT") {
        const payload = await readJsonBody(request);
        const record = updateProductionRecord(user.id, recordId, payload);
        if (!record) {
          sendJson(response, 404, { ok: false, error: "Production record not found." });
          return true;
        }
        sendJson(response, 200, { ok: true, authenticated: true, record });
        return true;
      }
      if (request.method === "DELETE") {
        const deleted = deleteProductionRecord(user.id, recordId);
        if (!deleted) {
          sendJson(response, 404, { ok: false, error: "Production record not found." });
          return true;
        }
        sendJson(response, 200, { ok: true, authenticated: true, deleted: true, productionId: recordId });
        return true;
      }
    }

    if (url.pathname === "/api/bizzibuddi/auth/automation" && request.method === "GET") {
      const user = getSessionUser(request);
      if (!user) {
        sendJson(response, 401, { ok: false, authenticated: false, error: "Authentication required." });
        return true;
      }

      sendJson(response, 200, {
        ok: true,
        authenticated: true,
        events: getAutomationEvents(user.id).map(toAutomationEvent),
      });
      return true;
    }

    if (url.pathname === "/api/bizzibuddi/auth/automation/events" && request.method === "POST") {
      const user = getSessionUser(request);
      if (!user) {
        sendJson(response, 401, { ok: false, authenticated: false, error: "Authentication required." });
        return true;
      }

      const payload = await readJsonBody(request);
      const event = createAutomationEvent(user.id, payload);

      sendJson(response, 201, {
        ok: true,
        authenticated: true,
        event,
      });
      return true;
    }

    if (url.pathname === "/api/bizzibuddi/auth/automation/checks" && request.method === "POST") {
      const user = getSessionUser(request);
      if (!user) {
        sendJson(response, 401, { ok: false, authenticated: false, error: "Authentication required." });
        return true;
      }

      sendJson(response, 200, {
        ok: true,
        authenticated: true,
        ...runAutomationChecks(user.id),
      });
      return true;
    }

    if (url.pathname === "/api/bizzibuddi/auth/automation/reset" && request.method === "DELETE") {
      const user = getSessionUser(request);
      if (!user) {
        sendJson(response, 401, { ok: false, authenticated: false, error: "Authentication required." });
        return true;
      }

      sendJson(response, 200, {
        ok: true,
        authenticated: true,
        deleted: deleteAutomationEvents(user.id),
      });
      return true;
    }

    if (url.pathname === "/api/bizzibuddi/auth/invoices" && request.method === "GET") {
      const user = getSessionUser(request);
      if (!user) {
        sendJson(response, 401, { ok: false, authenticated: false, error: "Authentication required." });
        return true;
      }
      sendJson(response, 200, {
        ok: true,
        authenticated: true,
        invoices: getInvoices(user.id).map(toInvoice),
      });
      return true;
    }

    if (url.pathname === "/api/bizzibuddi/auth/invoices" && request.method === "POST") {
      const user = getSessionUser(request);
      if (!user) {
        sendJson(response, 401, { ok: false, authenticated: false, error: "Authentication required." });
        return true;
      }
      const payload = await readJsonBody(request);
      sendJson(response, 201, {
        ok: true,
        authenticated: true,
        invoice: createInvoice(user.id, payload),
      });
      return true;
    }

    if (url.pathname.startsWith("/api/bizzibuddi/auth/invoices/") &&
        url.pathname.endsWith("/payments") &&
        request.method === "POST") {
      const invoiceId = decodeURIComponent(
        url.pathname.slice("/api/bizzibuddi/auth/invoices/".length, -"/payments".length)
      ).replace(/\/$/, "").trim();

      if (!invoiceId || invoiceId.includes("/")) {
        sendJson(response, 404, { ok: false, error: "Invoice not found." });
        return true;
      }

      const user = getSessionUser(request);
      if (!user) {
        sendJson(response, 401, { ok: false, authenticated: false, error: "Authentication required." });
        return true;
      }

      const payload = await readJsonBody(request);
      const invoice = recordInvoicePayment(user.id, invoiceId, payload);
      if (!invoice) {
        sendJson(response, 404, { ok: false, error: "Invoice not found." });
        return true;
      }

      sendJson(response, 200, {
        ok: true,
        authenticated: true,
        invoice,
      });
      return true;
    }

    if (url.pathname === "/api/bizzibuddi/auth/calendar" && request.method === "GET") {
      const user = getSessionUser(request);
      if (!user) {
        sendJson(response, 401, { ok: false, authenticated: false, error: "Authentication required." });
        return true;
      }
      sendJson(response, 200, { ok: true, authenticated: true, calendar: getCalendar(user.id).map(toCalendarEntry) });
      return true;
    }

    if (url.pathname === "/api/bizzibuddi/auth/calendar" && request.method === "POST") {
      const user = getSessionUser(request);
      if (!user) {
        sendJson(response, 401, { ok: false, authenticated: false, error: "Authentication required." });
        return true;
      }
      const payload = await readJsonBody(request);
      sendJson(response, 201, {
        ok: true,
        authenticated: true,
        appointment: createCalendarEntry(user.id, payload),
      });
      return true;
    }

    if (url.pathname.startsWith("/api/bizzibuddi/auth/calendar/")) {
      const entryId = decodeURIComponent(url.pathname.slice("/api/bizzibuddi/auth/calendar/".length)).trim();

      if (!entryId || entryId.includes("/")) {
        sendJson(response, 404, { ok: false, error: "Appointment not found." });
        return true;
      }

      const user = getSessionUser(request);
      if (!user) {
        sendJson(response, 401, { ok: false, authenticated: false, error: "Authentication required." });
        return true;
      }

      if (request.method === "PUT") {
        const payload = await readJsonBody(request);
        const appointment = updateCalendarEntry(user.id, entryId, payload);
        if (!appointment) {
          sendJson(response, 404, { ok: false, error: "Appointment not found." });
          return true;
        }
        sendJson(response, 200, { ok: true, authenticated: true, appointment });
        return true;
      }

      if (request.method === "DELETE") {
        const deleted = deleteCalendarEntry(user.id, entryId);
        if (!deleted) {
          sendJson(response, 404, { ok: false, error: "Appointment not found." });
          return true;
        }
        sendJson(response, 200, { ok: true, authenticated: true, deleted: true, appointmentId: entryId });
        return true;
      }
    }

    if (url.pathname === "/api/bizzibuddi/auth/jobs" && request.method === "GET") {
      const user = getSessionUser(request);

      if (!user) {
        sendJson(response, 401, {
          ok: false,
          authenticated: false,
          error: "Authentication required.",
        });
        return true;
      }

      sendJson(response, 200, {
        ok: true,
        authenticated: true,
        jobs: getJobs(user.id).map(toJob),
      });
      return true;
    }

    if (url.pathname === "/api/bizzibuddi/auth/jobs" && request.method === "POST") {
      const user = getSessionUser(request);

      if (!user) {
        sendJson(response, 401, {
          ok: false,
          authenticated: false,
          error: "Authentication required.",
        });
        return true;
      }

      const payload = await readJsonBody(request);
      sendJson(response, 201, {
        ok: true,
        authenticated: true,
        job: createJob(user.id, payload),
      });
      return true;
    }

    if (url.pathname.startsWith("/api/bizzibuddi/auth/jobs/") && request.method === "GET") {
      const user = getSessionUser(request);
      if (!user) {
        sendJson(response, 401, { ok: false, authenticated: false, error: "Authentication required." });
        return true;
      }

      const jobId = decodeURIComponent(
        url.pathname.slice("/api/bizzibuddi/auth/jobs/".length)
      ).trim();

      if (!jobId || jobId.includes("/")) {
        sendJson(response, 404, { ok: false, error: "Job not found." });
        return true;
      }

      const timeline = getJobTimeline(user.id, jobId);

      if (!timeline) {
        sendJson(response, 404, { ok: false, error: "Job not found." });
        return true;
      }

      sendJson(response, 200, {
        ok: true,
        authenticated: true,
        timeline,
      });
      return true;
    }

    if (url.pathname.startsWith("/api/bizzibuddi/auth/jobs/")) {
      const jobId = decodeURIComponent(
        url.pathname.slice("/api/bizzibuddi/auth/jobs/".length)
      ).trim();

      if (!jobId || jobId.includes("/")) {
        sendJson(response, 404, { ok: false, error: "Job not found." });
        return true;
      }

      const user = getSessionUser(request);

      if (!user) {
        sendJson(response, 401, {
          ok: false,
          authenticated: false,
          error: "Authentication required.",
        });
        return true;
      }

      if (request.method === "PUT") {
        const payload = await readJsonBody(request);
        const job = updateJob(user.id, jobId, payload);

        if (!job) {
          sendJson(response, 404, {
            ok: false,
            error: "Job not found.",
          });
          return true;
        }

        sendJson(response, 200, {
          ok: true,
          authenticated: true,
          job,
        });
        return true;
      }

      if (request.method === "DELETE") {
        const deleted = deleteJob(user.id, jobId);

        if (!deleted) {
          sendJson(response, 404, {
            ok: false,
            error: "Job not found.",
          });
          return true;
        }

        sendJson(response, 200, {
          ok: true,
          authenticated: true,
          deleted: true,
          jobId,
        });
        return true;
      }
    }

    if (url.pathname === "/api/bizzibuddi/auth/people" && request.method === "GET") {
      const user = getSessionUser(request);

      if (!user) {
        sendJson(response, 401, {
          ok: false,
          authenticated: false,
          error: "Authentication required.",
        });
        return true;
      }

      sendJson(response, 200, {
        ok: true,
        authenticated: true,
        people: getPeople(user.id).map(toPerson),
      });
      return true;
    }

    if (url.pathname === "/api/bizzibuddi/auth/people" && request.method === "POST") {
      const user = getSessionUser(request);

      if (!user) {
        sendJson(response, 401, {
          ok: false,
          authenticated: false,
          error: "Authentication required.",
        });
        return true;
      }

      const payload = await readJsonBody(request);
      sendJson(response, 201, {
        ok: true,
        authenticated: true,
        person: createPerson(user.id, payload),
      });
      return true;
    }

    if (url.pathname.startsWith("/api/bizzibuddi/auth/people/")) {
      const personId = decodeURIComponent(
        url.pathname.slice("/api/bizzibuddi/auth/people/".length)
      ).trim();

      if (!personId || personId.includes("/")) {
        sendJson(response, 404, { ok: false, error: "Person not found." });
        return true;
      }

      const user = getSessionUser(request);

      if (!user) {
        sendJson(response, 401, {
          ok: false,
          authenticated: false,
          error: "Authentication required.",
        });
        return true;
      }

      if (request.method === "PUT") {
        const payload = await readJsonBody(request);
        const person = updatePerson(user.id, personId, payload);

        if (!person) {
          sendJson(response, 404, {
            ok: false,
            error: "Person not found.",
          });
          return true;
        }

        sendJson(response, 200, {
          ok: true,
          authenticated: true,
          person,
        });
        return true;
      }

      if (request.method === "DELETE") {
        const deleted = deletePerson(user.id, personId);

        if (!deleted) {
          sendJson(response, 404, {
            ok: false,
            error: "Person not found.",
          });
          return true;
        }

        sendJson(response, 200, {
          ok: true,
          authenticated: true,
          deleted: true,
          personId,
        });
        return true;
      }
    }

    if (url.pathname.match(/^\/api\/bizzibuddi\/auth\/people\/[^/]+\/measurements$/)) {
      const match = url.pathname.match(/^\/api\/bizzibuddi\/auth\/people\/([^/]+)\/measurements$/);
      const personId = decodeURIComponent(match[1]).trim();
      const user = getSessionUser(request);

      if (!user) {
        sendJson(response, 401, { ok: false, authenticated: false, error: "Authentication required." });
        return true;
      }

      if (request.method === "GET") {
        const measurements = getMeasurements(user.id, personId);
        if (measurements === null) {
          sendJson(response, 404, { ok: false, error: "Person not found." });
          return true;
        }
        sendJson(response, 200, { ok: true, authenticated: true, measurements });
        return true;
      }

      if (request.method === "POST") {
        const payload = await readJsonBody(request);
        const measurement = createMeasurement(user.id, personId, payload);
        if (!measurement) {
          sendJson(response, 404, { ok: false, error: "Person not found." });
          return true;
        }
        sendJson(response, 201, { ok: true, authenticated: true, measurement });
        return true;
      }
    }

    if (url.pathname === "/api/bizzibuddi/auth/me" && request.method === "GET") {
      const user = getSessionUser(request);

      if (!user) {
        sendJson(response, 401, {
          ok: false,
          authenticated: false,
        });
        return true;
      }

      sendJson(response, 200, {
        ok: true,
        authenticated: true,
        account: toAccount(user),
      });
      return true;
    }

    if (url.pathname === "/api/bizzibuddi/auth/account" && request.method === "PUT") {
      const user = getSessionUser(request);

      if (!user) {
        sendJson(response, 401, {
          ok: false,
          authenticated: false,
          error: "Authentication required.",
        });
        return true;
      }

      const payload = await readJsonBody(request);
      sendJson(response, 200, {
        ok: true,
        authenticated: true,
        account: updateAccount(user.id, payload),
      });
      return true;
    }

    if (url.pathname === "/api/bizzibuddi/auth/logout" && request.method === "POST") {
      revokeSession(request);

      sendJson(
        response,
        200,
        { ok: true },
        { "Set-Cookie": createLogoutCookie(request) }
      );
      return true;
    }

    sendJson(response, 404, { ok: false, error: "Not found." });
    return true;
  } catch (error) {
    console.error("BizziBuddi authentication request failed:", error);

    const status = /already exists|Username|email address|full name|Password|Business name|Invoice amount|invoice|payment|Payment/.test(
      error instanceof Error ? error.message : ""
    )
      ? 400
      : 500;

    sendJson(response, status, {
      ok: false,
      error: error instanceof Error ? error.message : "Authentication request failed.",
    });
    return true;
  }
}

export function closeBizziBuddiAuthDatabase() {
  if (!database) return;
  database.close();
  database = null;
}
