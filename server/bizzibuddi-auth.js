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

  if (business.length > 120) {
    throw new Error("Business name must be 120 characters or fewer.");
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

  db.prepare(
    `UPDATE workspaces
     SET name = ?, updated_at = ?
     WHERE id = ? AND owner_user_id = ?`
  ).run(business, new Date().toISOString(), workspace.id, userId);

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
  return getDatabase()
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

  return toJob({
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

  const now = new Date().toISOString();
  const result = getDatabase()
    .prepare(
      `UPDATE bizzibuddi_jobs
       SET person_id = ?, title = ?, status = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`
    )
    .run(person.id, title, status, now, jobId, userId);

  if (!result.changes) return null;

  return toJob(
    getDatabase()
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
         WHERE jobs.id = ? AND jobs.user_id = ?`
      )
      .get(jobId, userId)
  );
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

    const status = /already exists|Username|email address|full name|Password|Business name/.test(
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
