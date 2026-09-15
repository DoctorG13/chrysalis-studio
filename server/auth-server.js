import { createServer } from "node:http";

import {
  allowLoginAttempt,
  authenticateLogin,
  clearExpiredLoginAttempts,
  clearExpiredRevokedSessions,
  clearLoginAttempts,
  createLoginCookie,
  createLogoutCookie,
  getAuthenticatedUser,
  revokeSession,
  validateAuthConfiguration,
} from "./auth.js";

const DEFAULT_PORT = 4183;
const MAX_LOGIN_BODY_BYTES = 64 * 1024;

const authConfig = validateAuthConfiguration();

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

function readJsonBody(request) {
  return new Promise((resolveBody, reject) => {
    let body = "";
    let size = 0;
    let settled = false;

    request.setEncoding("utf8");

    request.on("data", (chunk) => {
      if (settled) return;

      size += Buffer.byteLength(chunk);

      if (size > MAX_LOGIN_BODY_BYTES) {
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

function isSameOrigin(request) {
  const origin = String(request.headers.origin || "");

  if (!origin) return true;

  const host = String(request.headers.host || "");
  const forwardedProto = String(
    request.headers["x-forwarded-proto"] || "http"
  )
    .split(",")[0]
    .trim();

  return Boolean(host) && origin === `${forwardedProto}://${host}`;
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
      {
        "Set-Cookie": createLoginCookie(username, authConfig),
      }
    );
  } catch (error) {
    sendJson(response, 400, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

const server = createServer(async (request, response) => {
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

  try {
    if (url.pathname === "/api/health" && request.method === "GET") {
      sendJson(response, 200, {
        ok: true,
        service: "auth",
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

      revokeSession(request);

      sendJson(
        response,
        200,
        { ok: true },
        { "Set-Cookie": createLogoutCookie() }
      );
      return;
    }

    sendJson(response, 404, {
      ok: false,
      error: "Not found",
    });
  } catch (error) {
    console.error("Chrysalis authentication request failed:", error);

    if (!response.headersSent) {
      sendJson(response, 500, {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
});

const port = Number(
  process.env.CHRYSALIS_AUTH_API_PORT || DEFAULT_PORT
);

server.listen(port, "127.0.0.1", () => {
  console.log(
    `Chrysalis authentication API listening on http://127.0.0.1:${port}`
  );
});

const loginCleanupTimer = setInterval(
  clearExpiredLoginAttempts,
  5 * 60 * 1000
);
const revokedSessionCleanupTimer = setInterval(
  clearExpiredRevokedSessions,
  5 * 60 * 1000
);

function shutdown() {
  clearInterval(loginCleanupTimer);
  clearInterval(revokedSessionCleanupTimer);

  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
