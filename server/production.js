import { createServer, request as httpRequest } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, resolve, sep } from "node:path";
import { spawn } from "node:child_process";

const DATA_DIR = resolve(
  process.env.CHRYSALIS_DATA_DIR || join(process.cwd(), "data")
);
const DIST_DIR = resolve(process.cwd(), "dist");
const PORT = Number(process.env.PORT || 4173);

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

function log(message) {
  console.log(`[Chrysalis production] ${message}`);
}

function getApiPort(pathname) {
  const match = ROUTES.find(
    ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  return match ? match[1] : 4274;
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
      response.writeHead(upstream.statusCode || 502, upstream.headers);
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

function createGateway() {
  return createServer((request, response) => {
    const url = new URL(
      request.url || "/",
      `http://${request.headers.host || "localhost"}`
    );

    if (request.method === "OPTIONS") {
      response.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      response.end();
      return;
    }

    if (url.pathname === "/health" || url.pathname === "/api/health") {
      response.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      });
      response.end(
        JSON.stringify({
          ok: true,
          service: "chrysalis",
          environment: process.env.NODE_ENV || "production",
        })
      );
      return;
    }

    if (url.pathname.startsWith("/api/")) {
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

  log("Stopping production gateway and backend services...");

  if (gateway) gateway.close();

  for (const child of children.values()) {
    if (!child.killed) child.kill("SIGTERM");
  }

  setTimeout(() => process.exit(code), 750);
}

async function main() {
  if (!existsSync(DIST_DIR)) {
    throw new Error(
      `Production frontend build not found: ${DIST_DIR}. Run npm run build first.`
    );
  }

  for (const service of SERVICES) spawnService(service);
  await Promise.all(SERVICES.map((service) => checkHealth(service)));

  gateway = createGateway();
  gateway.listen(PORT, "0.0.0.0", () => {
    log(`Gateway listening on 0.0.0.0:${PORT}`);
    log(`Persistent data directory: ${DATA_DIR}`);
    log("Chrysalis production backend is ready.");
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

main().catch((error) => {
  console.error("[Chrysalis production] Startup failed:", error);
  shutdown(1);
});