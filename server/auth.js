import crypto from "node:crypto";

const COOKIE_NAME = "chrysalis_session";
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 10;

const loginAttempts = new Map();

function requiredEnv(name) {
  const value = String(process.env[name] || "").trim();

  if (!value) {
    throw new Error(
      `Missing required production authentication environment variable: ${name}`
    );
  }

  return value;
}

export function validateAuthConfiguration() {
  const username = requiredEnv("CHRYSALIS_AUTH_USERNAME");
  const password = requiredEnv("CHRYSALIS_AUTH_PASSWORD");
  const sessionSecret = requiredEnv("CHRYSALIS_SESSION_SECRET");

  if (password.length < 12) {
    throw new Error(
      "CHRYSALIS_AUTH_PASSWORD must be at least 12 characters long."
    );
  }

  if (sessionSecret.length < 32) {
    throw new Error(
      "CHRYSALIS_SESSION_SECRET must be at least 32 characters long."
    );
  }

  return { username, password, sessionSecret };
}

function base64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fromBase64Url(value) {
  const padded = String(value || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padding = padded.length % 4;
  return Buffer.from(
    padded + (padding ? "=".repeat(4 - padding) : ""),
    "base64"
  );
}

function sign(value, secret) {
  return base64Url(
    crypto
      .createHmac("sha256", secret)
      .update(value)
      .digest()
  );
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ""));
  const b = Buffer.from(String(right || ""));

  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}

function createSession(username, secret) {
  const payload = JSON.stringify({
    username,
    expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  });
  const encoded = base64Url(payload);

  return `${encoded}.${sign(encoded, secret)}`;
}

function readCookie(request, name) {
  const header = String(request.headers.cookie || "");

  for (const part of header.split(";")) {
    const [key, ...valueParts] = part.trim().split("=");

    if (key === name) return valueParts.join("=");
  }

  return "";
}

function parseSession(token, secret) {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encoded, providedSignature] = parts;
  const expectedSignature = sign(encoded, secret);

  if (!safeEqual(providedSignature, expectedSignature)) return null;

  try {
    const payload = JSON.parse(fromBase64Url(encoded).toString("utf8"));

    if (!payload?.username || !Number.isFinite(payload.expiresAt)) {
      return null;
    }

    if (payload.expiresAt <= Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}

function clientAddress(request) {
  return String(request.socket?.remoteAddress || "unknown");
}

export function allowLoginAttempt(request) {
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

export function clearLoginAttempts(request) {
  loginAttempts.delete(clientAddress(request));
}

export function clearExpiredLoginAttempts() {
  const cutoff = Date.now() - LOGIN_WINDOW_MS;

  for (const [key, entry] of loginAttempts) {
    if (entry.startedAt < cutoff) loginAttempts.delete(key);
  }
}

export function getAuthenticatedUser(request, authConfig) {
  const session = parseSession(
    readCookie(request, COOKIE_NAME),
    authConfig.sessionSecret
  );

  if (!session || !safeEqual(session.username, authConfig.username)) {
    return null;
  }

  return { username: authConfig.username };
}

export function authenticateLogin(username, password, authConfig) {
  return (
    safeEqual(username, authConfig.username) &&
    safeEqual(password, authConfig.password)
  );
}

export function createLoginCookie(username, authConfig) {
  const session = createSession(username, authConfig.sessionSecret);

  return [
    `${COOKIE_NAME}=${session}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
  ].join("; ");
}

export function createLogoutCookie() {
  return [
    `${COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    "Max-Age=0",
  ].join("; ");
}
