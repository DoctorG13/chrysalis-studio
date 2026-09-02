import { createServer, request as httpRequest } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, resolve, sep } from "node:path";
import { spawn } from "node:child_process";

import {
  allowLoginAttempt,
  authenticateLogin,
  clearExpiredLoginAttempts,
  clearLoginAttempts,
  createLoginCookie,
  createLogoutCookie,
  getAuthenticatedUser,
  validateAuthConfiguration,
} from "./auth.js";

const DATA_DIR = resolve(
  process.env.CHRYSALIS_DATA_DIR || join(process.cwd(), "data")
);
const DIST_DIR = resolve(process.cwd(), "dist");
const PORT = Number(process.env.PORT || 4173);
const MAX_LOGIN_BODY_BYTES = 64 * 1024;

const SERVICES = [
  { name: "database", script: "server/index.js", args: ["server"], envKey: "CHRYSALIS_API_PORT", port: 4274 },
  { name: "jobs", script: "server/job-server.js", args: [], envKey: "CHRYSALIS_JOB_API_PORT", port: 4275 },
  { name: "appointments", script: "server/appointment-server.js", args: [], envKey: "CHRYSALIS_APPOINTMENT_API_PORT", port: 4276 },
  { name: "measurements", script: "server/measurement-server.js", args: [], envKey: "CHRYSALIS_MEASUREMENT_API_PORT", port: 4277 },
  { name: "payments", script: "server/payment-server.js", args: [], envKey: "CHRYSALIS_PAYMENT_API_PORT", port: 4278 },
  { name: "assets", script: "server/asset-server.js", args: [], envKey: "CHRYSALIS_ASSET_API_PORT", port: 4279 },
  { name: "timeline", script: "server/timeline-server.js", args: [], envKey: "CHRYSALIS_TIMELINE_API_PORT", port: 4280 },
  { name: "invoices", script: "server/invoice-server.js", args: [], envKey: "CHRYSALIS_INVOICE_API_PORT", port: 4281 },
  { name: "quotes", script: "server/quote-server.js", args: [], envKey: "CHRYSALIS_QUOTE_API_PORT", port: 4282 },
];

const ROUTES = [
  ["/api/jobs", 4275],
  ["/api/appointments", 4276],
  ["/api/measurements", 4277],
  ["/api/payments", 4278],
  ["/api/assets", 4279],
  ["/api/timeline", 4280],
  ["/api/invoices", 4281],
  ["/api/quotes", 4282],
];

const children = new Map();
let gateway = null;
let shuttingDown = false;
let authConfig = null;
let loginCleanupTimer = null;

function log(message) {
  console.log(`[Chrysalis production] ${message}`);
}

function getApiPort(pathname) {
  const match = ROUTES.find(
    ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  return match ? match[1] : 4274;
}

function sendJson(response, statusCode, payload, headers = {}) {
  const body = JSON.stringify(payload, null, 2);

  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    ...headers,
  });
  response.end(body);
}

function readJsonBody(request, maxBytes = MAX_LOGIN_BODY_BYTES) {
  return new Promise((resolveBody, reject) => {
    let body = "";
    let size = 0;
    let settled = false;

    request.setEncoding("utf8");

    request.on("data", (chunk) => {
      if (settled) return;

      size += Buffer.byteLength(chunk);

      if (size > maxBytes) {
        settled = true;
        reject(new Error("Request body is too large."));
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
        reject(new Error("Request body must contain valid JSON."));
      }
    });

    request.on("error", (error) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    });
  });
}

function checkHealth(service, attempt = 0) {
  return new Promise((resolveHealth, rejectHealth) => {
    const request = httpRequest(
      {
        hostname: "127.0.0.1",
        port: service.port,
        path: "/api/health",
        method: "GET",
      },
      (response) => {
        response.resume();
        if (response.statusCode === 200) {
          resolveHealth();
          return;
        }
        retryHealth(service, attempt, rejectHealth);
      }
    );

    request.setTimeout(1000, () => {
      request.destroy();
      retryHealth(service, attempt, rejectHealth);
    });
    request.on("error", () => retryHealth(service, attempt, rejectHealth));
    request.end();
  });
}

function retryHealth(service, attempt, rejectHealth) {
  if (attempt >= 30) {
    rejectHealth(
      new Error(`${service.name} service did not become ready within 30 seconds.`)
    );
    return;
  }

  setTimeout(() => {
    checkHealth(service, attempt + 1)
      .then(() => undefined)
      .catch(rejectHealth);
  }, 1000);
}

function spawnService(service) {
  log(`Starting ${service.name} service on 127.0.0.1:${service.port}...`);

  const child = spawn(process.execPath, [service.script, ...service.args], {
    stdio: "inherit",
    windowsHide: true,
    env: {
      ...process.env,
      CHRYSALIS_DATA_DIR: DATA_DIR,
      [service.envKey]: String(service.port),
    },
  });

  children.set(service.name, child);

  child.on("error", (error) => {
    console.error(`[Chrysalis production] ${service.name} failed to start:`, error);
    shutdown(1);
  });

  child.on("exit", (code, signal) => {
    children.delete(service.name);
    if (shuttingDown) return;

    console.error(
      `[Chrysalis production] ${service.name} stopped unexpectedly ` +
        `(code=${code ?? "null"}, signal=${signal ?? "none"}).`
    );
    shutdown(code || 1);
  });
}

function contentType(filePath) {
  const types = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
  };
  return types[extname(filePath).toLowerCase()] || "application/octet-stream";
}

function serveStatic(request, response) {
  let pathname;

  try {
    pathname = decodeURIComponent(
      new URL(request.url || "/", "http://localhost").pathname
    );
  } catch {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Bad request");
    return;
  }

  const requestedPath = resolve(DIST_DIR, `.${pathname}`);
  const distPrefix = `${DIST_DIR}${sep}`;
  const safePath =
    requestedPath === DIST_DIR || requestedPath.startsWith(distPrefix);

  if (!safePath) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  let filePath = requestedPath;
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    filePath = join(DIST_DIR, "index.html");
  }

  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Chrysalis frontend has not been built.");
    return;
  }

  const body = readFileSync(filePath);
  response.writeHead(200, {
    "Content-Type": contentType(filePath),
    "Content-Length": body.length,
    "Cache-Control": filePath.endsWith("index.html")
      ? "no-cache"
      : "public, max-age=31536000, immutable",
  });
  response.end(request.method === "HEAD" ? undefined : body);
}

function isSameOrigin(request) {
  const origin = String(request.headers.origin || "");

  if (!origin) return true;

  const forwardedProto = String(
    request.headers["x-forwarded-proto"] || "https"
  ).split(",")[0].trim();
  const host = String(request.headers.host || "");

  if (!host) return false;

  return origin === `${forwardedProto}://${host}`;
}

function isStateChangingMethod(method) {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method);
}

function sanitiseUpstreamHeaders(headers) {
  return Object.fromEntries(
    Object.entries(headers).filter(
      ([name]) => !name.toLowerCase().startsWith("access-control-")
    )
  );
}

function proxyApi(request, response) {
  const url = new URL(
    request.url || "/",
    `http://${request.headers.host || "localhost"}`
  );
  const port = getApiPort(url.pathname);

  const proxy = httpRequest(
    {
      hostname: "127.0.0.1",
      port,
      path: `${url.pathname}${url.search}`,
      method: request.method,
      headers: {
        ...request.headers,
        host: `127.0.0.1:${port}`,
        connection: "close",
      },
    },
    (upstream) => {
      response.writeHead(
        upstream.statusCode || 502,
        sanitiseUpstreamHeaders(upstream.headers)
      );
      upstream.pipe(response);
    }
  );

  proxy.on("error", (error) => {
    console.error("[Chrysalis production] API proxy error:", error);

    if (!response.headersSent) {
      response.writeHead(502, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      });
    }

    response.end(
      JSON.stringify({
        ok: false,
        error: "Chrysalis API is temporarily unavailable.",
      })
    );
  });

  request.pipe(proxy);
}

async function handleLogin(request, response) {
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
    return;
  }

  try {
    const payload = await readJsonBody(request);
    const username = String(payload?.username || "");
    const password = String(payload?.password || "");

    if (!authenticateLogin(username, password, authConfig)) {
      sendJson(response, 401, {
        ok: false,
        error: "Invalid username or password.",
      });
      return;
    }

    clearLoginAttempts(request);

    sendJson(
      response,
      200,
      {
        ok: true,
        authenticated: true,
        user: { username: authConfig.username },
      },
      { "Set-Cookie": createLoginCookie(username, authConfig) }
    );
  } catch (error) {
    sendJson(response, 400, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function createGateway() {
  return createServer(async (request, response) => {
    const url = new URL(
      request.url || "/",
      `http://${request.headers.host || "localhost"}`
    );

    if (request.method === "OPTIONS") {
      if (!isSameOrigin(request)) {
        sendJson(response, 403, {
          ok: false,
          error: "Cross-origin requests are not permitted.",
        });
        return;
      }

      response.writeHead(204, {
        "Cache-Control": "no-store",
      });
      response.end();
      return;
    }

    if (url.pathname === "/health" || url.pathname === "/api/health") {
      sendJson(response, 200, {
        ok: true,
        service: "chrysalis",
        environment: process.env.NODE_ENV || "production",
      });
      return;
    }

    if (url.pathname === "/api/auth/me" && request.method === "GET") {
      const user = getAuthenticatedUser(request, authConfig);

      if (!user) {
        sendJson(response, 401, {
          ok: false,
          authenticated: false,
        });
        return;
      }

      sendJson(response, 200, {
        ok: true,
        authenticated: true,
        user,
      });
      return;
    }

    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      if (!isSameOrigin(request)) {
        sendJson(response, 403, {
          ok: false,
          error: "Cross-origin requests are not permitted.",
        });
        return;
      }

      await handleLogin(request, response);
      return;
    }

    if (url.pathname === "/api/auth/logout" && request.method === "POST") {
      if (!isSameOrigin(request)) {
        sendJson(response, 403, {
          ok: false,
          error: "Cross-origin requests are not permitted.",
        });
        return;
      }

      sendJson(
        response,
        200,
        { ok: true },
        { "Set-Cookie": createLogoutCookie() }
      );
      return;
    }

    if (url.pathname.startsWith("/api/")) {
      const user = getAuthenticatedUser(request, authConfig);

      if (!user) {
        sendJson(response, 401, {
          ok: false,
          error: "Authentication required.",
        });
        return;
      }

      if (isStateChangingMethod(request.method) && !isSameOrigin(request)) {
        sendJson(response, 403, {
          ok: false,
          error: "Cross-origin requests are not permitted.",
        });
        return;
      }

      proxyApi(request, response);
      return;
    }

    if (request.method === "GET" || request.method === "HEAD") {
      serveStatic(request, response);
      return;
    }

    response.writeHead(405, {
      "Content-Type": "text/plain; charset=utf-8",
      Allow: "GET,HEAD,OPTIONS",
    });
    response.end("Method not allowed");
  });
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  if (loginCleanupTimer) clearInterval(loginCleanupTimer);

  log("Stopping production gateway and backend services...");

  if (gateway) gateway.close();

  for (const child of children.values()) {
    if (!child.killed) child.kill("SIGTERM");
  }

  setTimeout(() => process.exit(code), 750);
}

async function main() {
  authConfig = validateAuthConfiguration();

  if (!existsSync(DIST_DIR)) {
    throw new Error(
      `Production frontend build not found: ${DIST_DIR}. Run npm run build first.`
    );
  }

  loginCleanupTimer = setInterval(clearExpiredLoginAttempts, 5 * 60 * 1000);

  for (const service of SERVICES) spawnService(service);
  await Promise.all(SERVICES.map((service) => checkHealth(service)));

  gateway = createGateway();
  gateway.listen(PORT, "0.0.0.0", () => {
    log(`Gateway listening on 0.0.0.0:${PORT}`);
    log(`Persistent data directory: ${DATA_DIR}`);
    log("Production authentication is enabled.");
    log("Chrysalis production backend is ready.");
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

main().catch((error) => {
  console.error("[Chrysalis production] Startup failed:", error);
  shutdown(1);
});
