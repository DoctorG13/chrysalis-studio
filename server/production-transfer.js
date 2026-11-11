import { createServer, request as httpRequest } from "node:http";
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  statSync,
  unlinkSync,
} from "node:fs";
import { basename, join, resolve } from "node:path";
import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

import {
  getAuthenticatedUser,
  validateAuthConfiguration,
} from "./auth.js";

const DATA_DIR = resolve(
  process.env.CHRYSALIS_DATA_DIR || join(process.cwd(), "data")
);
const BACKUP_DIR = join(DATA_DIR, "backups");
const PUBLIC_PORT = Number(process.env.PORT || 4173);
const INTERNAL_PORT = 4172;
const MAX_TRANSFER_BYTES = 100 * 1024 * 1024;
const CUSTOMER_DATABASE_PATH = join(DATA_DIR, "chrysalis.db");
const CUSTOMER_PASSWORD_MIN_LENGTH = 10;
const CUSTOMER_PASSWORD_MAX_LENGTH = 200;
const CUSTOMER_SCRYPT = {
  N: 32768,
  r: 8,
  p: 3,
  keyLength: 64,
  maxmem: 64 * 1024 * 1024,
};

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);

  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  response.end(body);
}

function isSameOrigin(request) {
  const origin = String(request.headers.origin || "");
  if (!origin) return true;

  const forwardedProto = String(
    request.headers["x-forwarded-proto"] || "https"
  )
    .split(",")[0]
    .trim();
  const host = String(request.headers.host || "");

  return Boolean(host) && origin === `${forwardedProto}://${host}`;
}

function authenticate(request, response) {
  const user = getAuthenticatedUser(request, authConfig);

  if (!user) {
    sendJson(response, 401, {
      ok: false,
      error: "Authentication required.",
    });
    return false;
  }

  if (
    ["POST", "PUT", "PATCH", "DELETE"].includes(request.method) &&
    !isSameOrigin(request)
  ) {
    sendJson(response, 403, {
      ok: false,
      error: "Cross-origin requests are not permitted.",
    });
    return false;
  }

  return true;
}

function requireSameOrigin(request, response) {
  const origin = String(request.headers.origin || "").trim();
  if (!origin || !isSameOrigin(request)) {
    sendJson(response, 403, {
      ok: false,
      error: "A valid same-origin request is required.",
    });
    return false;
  }
  return true;
}

function readJsonBody(request, maximumBytes = 16 * 1024) {
  return new Promise((resolveBody, rejectBody) => {
    let body = "";
    let size = 0;
    let settled = false;
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      if (settled) return;
      size += Buffer.byteLength(chunk, "utf8");
      if (size > maximumBytes) {
        settled = true;
        rejectBody(new Error("Request body is too large."));
        request.resume();
        return;
      }
      body += chunk;
    });
    request.on("end", () => {
      if (settled) return;
      if (!body.trim()) return resolveBody({});
      try {
        resolveBody(JSON.parse(body));
      } catch {
        rejectBody(new Error("Request body must contain valid JSON."));
      }
    });
    request.on("error", (error) => {
      if (!settled) rejectBody(error);
    });
  });
}

function openCustomerDatabase() {
  if (!existsSync(CUSTOMER_DATABASE_PATH)) {
    throw new Error("The BizziBuddi customer database could not be found.");
  }
  return new DatabaseSync(CUSTOMER_DATABASE_PATH, {
    timeout: 5000,
    enableForeignKeyConstraints: true,
  });
}

function hashCustomerPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, CUSTOMER_SCRYPT.keyLength, {
    N: CUSTOMER_SCRYPT.N,
    r: CUSTOMER_SCRYPT.r,
    p: CUSTOMER_SCRYPT.p,
    maxmem: CUSTOMER_SCRYPT.maxmem,
  });
  return `scrypt$${CUSTOMER_SCRYPT.N}$${CUSTOMER_SCRYPT.r}$${CUSTOMER_SCRYPT.p}$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

function lookupCustomerAccount(identifier) {
  const normalized = String(identifier || "").trim();
  if (normalized.length < 3 || normalized.length > 254) {
    throw new Error("Enter Donna's account email address or username.");
  }
  const database = openCustomerDatabase();
  try {
    const matches = database.prepare(
      `SELECT id, email, username, display_name, status
       FROM users
       WHERE email = ? COLLATE NOCASE OR username = ? COLLATE NOCASE
       LIMIT 2`
    ).all(normalized, normalized);
    if (matches.length > 1) {
      throw new Error("More than one account matched. Search using the exact email address.");
    }
    if (!matches.length) return null;
    const account = matches[0];
    const sessions = database.prepare(
      `SELECT COUNT(*) AS count FROM bizzibuddi_sessions
       WHERE user_id = ? AND expires_at > ?`
    ).get(account.id, new Date().toISOString());
    return { ...account, activeSessionCount: Number(sessions?.count || 0) };
  } finally {
    database.close();
  }
}

function resetCustomerPassword(userId, password) {
  const accountId = String(userId || "").trim();
  const newPassword = String(password || "");
  if (!accountId || accountId.length > 128) throw new Error("Invalid customer account.");
  if (newPassword.length < CUSTOMER_PASSWORD_MIN_LENGTH || newPassword.length > CUSTOMER_PASSWORD_MAX_LENGTH) {
    throw new Error(`Password must be ${CUSTOMER_PASSWORD_MIN_LENGTH}–${CUSTOMER_PASSWORD_MAX_LENGTH} characters.`);
  }
  const passwordHash = hashCustomerPassword(newPassword);
  const database = openCustomerDatabase();
  try {
    database.exec("BEGIN IMMEDIATE");
    const account = database.prepare(
      "SELECT id, email, username, display_name, status FROM users WHERE id = ?"
    ).get(accountId);
    if (!account) throw new Error("Customer account not found.");
    database.prepare(
      "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?"
    ).run(passwordHash, new Date().toISOString(), accountId);
    const revoked = database.prepare(
      "DELETE FROM bizzibuddi_sessions WHERE user_id = ?"
    ).run(accountId);
    database.exec("COMMIT");
    return {
      account: {
        id: account.id,
        email: account.email,
        username: account.username,
        display_name: account.display_name,
        status: account.status,
      },
      sessionsRevoked: Number(revoked.changes || 0),
    };
  } catch (error) {
    try { database.exec("ROLLBACK"); } catch {}
    throw error;
  } finally {
    database.close();
  }
}

const CUSTOMER_ACCESS_PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>BizziBuddi · Customer access recovery</title>
<style>
*{box-sizing:border-box}body{margin:0;padding:32px 16px;background:#f3f6fb;color:#172033;font:15px/1.5 system-ui,-apple-system,Segoe UI,sans-serif}.wrap{max-width:620px;margin:36px auto}.card{background:#fff;border:1px solid #dce3ee;border-radius:16px;padding:28px;box-shadow:0 12px 35px #1c315014}h1{font-size:25px;margin:0 0 8px}p{color:#596579}.field{display:block;font-weight:600;margin:20px 0 7px}input{width:100%;padding:13px;border:1px solid #cbd5e1;border-radius:9px;font:inherit}button{border:0;border-radius:9px;padding:12px 17px;background:#263b64;color:#fff;font-weight:650;cursor:pointer;margin:14px 8px 0 0}button.secondary{background:#e8edf5;color:#263b64}button:disabled{opacity:.55;cursor:wait}.panel{margin-top:20px;padding:16px;border-radius:10px;background:#f6f8fc;border:1px solid #e1e7f0}.hidden{display:none}.status{margin-top:16px;padding:12px;border-radius:8px;white-space:pre-wrap}.error{background:#fff0f0;color:#9b1c1c}.success{background:#eaf8ef;color:#176437}.muted{font-size:13px;color:#68758a}.row{display:flex;gap:8px;flex-wrap:wrap}.row button{flex:0 0 auto}
</style></head><body><main class="wrap"><section class="card"><h1>Customer account access</h1><p>Platform administrator only. Find an existing customer account and issue a temporary password. Business records are not changed.</p>
<label class="field" for="identifier">Customer email address or username</label><input id="identifier" type="text" autocomplete="off" placeholder="Enter Donna's account email">
<button id="lookup">Find account</button><div id="account" class="panel hidden"></div>
<div id="resetPanel" class="panel hidden"><label class="field" for="password">New temporary password</label><input id="password" type="password" autocomplete="new-password" minlength="10" maxlength="200">
<div class="row"><button id="generate" class="secondary">Generate secure password</button><button id="show" class="secondary">Show password</button><button id="copy" class="secondary">Copy password</button></div>
<p class="muted">Keep this password private and pass it to Donna securely. Her existing business data will remain untouched. All existing customer sessions will be signed out.</p>
<button id="reset">Reset password and sign out existing sessions</button></div><div id="status" aria-live="polite"></div>
</section></main><script>
const $=id=>document.getElementById(id);let selected=null;
function message(text,kind){$('status').className='status '+kind;$('status').textContent=text;}
function generatedPassword(){const bytes=new Uint8Array(24);crypto.getRandomValues(bytes);return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')+'aA!';}
$('lookup').onclick=async()=>{selected=null;$('account').classList.add('hidden');$('resetPanel').classList.add('hidden');message('Looking up account…','');try{const r=await fetch('/api/admin/customer-access?identifier='+encodeURIComponent($('identifier').value.trim()),{credentials:'same-origin',cache:'no-store'});const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||'Account not found.');selected=d.account;$('account').classList.remove('hidden');$('account').textContent='Account found: '+(selected.display_name||'(no display name)')+' · '+selected.email+' · Username: '+(selected.username||'not set')+' · Status: '+selected.status+' · Active sessions: '+selected.activeSessionCount;$('resetPanel').classList.remove('hidden');message('Check that this is Donna’s account before resetting the password.','success');}catch(e){message(e.message,'error');}};
$('generate').onclick=()=>{$('password').value=generatedPassword();$('password').type='text';};
$('show').onclick=()=>{$('password').type=$('password').type==='password'?'text':'password';};
$('copy').onclick=async()=>{if(!$('password').value)return message('Generate or enter a password first.','error');try{await navigator.clipboard.writeText($('password').value);message('Password copied. Keep it private.','success');}catch{message('Clipboard access was blocked. You can select and copy the password manually.','error');}};
$('reset').onclick=async()=>{if(!selected)return;const password=$('password').value;if(password.length<10)return message('Use a password of at least 10 characters.','error');if(!confirm('Reset the password for '+selected.email+' and sign out all existing sessions?'))return;$('reset').disabled=true;try{const r=await fetch('/api/admin/customer-access/'+encodeURIComponent(selected.id)+'/password',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({password,confirmation:'RESET CUSTOMER PASSWORD'})});const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||'Password reset failed.');message('Password reset successfully for '+d.account.email+'. Existing sessions revoked: '+d.sessionsRevoked+'. Donna can now sign in with this email/username and the new password. Business records were not modified.','success');$('password').value='';}catch(e){message(e.message,'error');}finally{$('reset').disabled=false;}};
</script></body></html>`;

function serveCustomerAccessPage(response) {
  response.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
  });
  response.end(CUSTOMER_ACCESS_PAGE);
}

function getSafeBackupPath(id) {
  const filename = basename(String(id || ""));

  if (
    !filename ||
    filename !== String(id || "") ||
    !filename.startsWith("chrysalis-") ||
    !filename.endsWith(".db")
  ) {
    throw new Error("Invalid backup version.");
  }

  const fullPath = join(BACKUP_DIR, filename);

  if (!existsSync(fullPath) || !statSync(fullPath).isFile()) {
    throw new Error("That backup version could not be found.");
  }

  return fullPath;
}

function validateImportedDatabase(filePath) {
  const database = new DatabaseSync(filePath, {
    readOnly: true,
    timeout: 5000,
    enableForeignKeyConstraints: false,
  });

  try {
    const tables = new Set(
      database
        .prepare(
          `SELECT name FROM sqlite_master
           WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`
        )
        .all()
        .map((row) => row.name)
    );

    const requiredTables = [
      "schema_migrations",
      "clients",
      "jobs",
      "settings",
    ];

    const missing = requiredTables.filter(
      (table) => !tables.has(table)
    );

    if (missing.length > 0) {
      throw new Error(
        `This file is not a valid Chrysalis backup. Missing required table(s): ${missing.join(
          ", "
        )}.`
      );
    }

    const integrity = database.prepare("PRAGMA integrity_check").get();
    if (integrity?.integrity_check !== "ok") {
      throw new Error("This file failed the SQLite integrity check.");
    }
  } finally {
    database.close();
  }
}

function writeUpload(request, destination) {
  return new Promise((resolveUpload, rejectUpload) => {
    let settled = false;
    let size = 0;
    const output = createWriteStream(destination, { flags: "wx" });

    const fail = (error) => {
      if (settled) return;
      settled = true;
      output.destroy();
      rejectUpload(error);
    };

    const succeed = () => {
      if (settled) return;
      settled = true;
      resolveUpload();
    };

    output.on("error", fail);
    output.on("finish", succeed);

    request.on("data", (chunk) => {
      if (settled) return;

      size += chunk.length;

      if (size > MAX_TRANSFER_BYTES) {
        fail(
          new Error(
            `Backup file is too large. The maximum supported size is ${
              MAX_TRANSFER_BYTES / (1024 * 1024)
            } MB.`
          )
        );
        request.destroy();
        return;
      }

      output.write(chunk);
    });

    request.on("end", () => {
      if (!settled) output.end();
    });

    request.on("error", fail);
  });
}

function getPublicForwardingHeaders(request) {
  const publicHost = String(request.headers.host || "")
    .split(",")[0]
    .trim();
  const forwardedProto = String(
    request.headers["x-forwarded-proto"] || "https"
  )
    .split(",")[0]
    .trim();

  return {
    "x-forwarded-host": publicHost,
    "x-forwarded-proto": forwardedProto,
  };
}

function proxyToInternal(request, response, path) {
  const publicForwardingHeaders = getPublicForwardingHeaders(request);

  const proxy = httpRequest(
    {
      hostname: "127.0.0.1",
      port: INTERNAL_PORT,
      path,
      method: request.method,
      headers: {
        ...request.headers,
        ...publicForwardingHeaders,
        host: publicForwardingHeaders["x-forwarded-host"],
        connection: "close",
      },
    },
    (upstream) => {
      response.writeHead(upstream.statusCode || 502, upstream.headers);
      upstream.pipe(response);
    }
  );

  proxy.on("error", (error) => {
    console.error("[Chrysalis transfer gateway] Internal proxy error:", error);

    if (!response.headersSent) {
      sendJson(response, 502, {
        ok: false,
        error: "Chrysalis API is temporarily unavailable.",
      });
      return;
    }

    response.end();
  });

  request.pipe(proxy);
}

function wait(milliseconds) {
  return new Promise((resolveWait) => setTimeout(resolveWait, milliseconds));
}

async function waitForInternalGateway() {
  const deadline = Date.now() + 30000;

  while (Date.now() < deadline) {
    const healthy = await new Promise((resolveHealth) => {
      const request = httpRequest(
        {
          hostname: "127.0.0.1",
          port: INTERNAL_PORT,
          path: "/health",
          method: "GET",
        },
        (response) => {
          response.resume();
          response.on("end", () => resolveHealth(response.statusCode === 200));
        }
      );

      request.setTimeout(1000, () => {
        request.destroy();
        resolveHealth(false);
      });
      request.on("error", () => resolveHealth(false));
      request.end();
    });

    if (healthy) return;
    await wait(250);
  }

  throw new Error("Internal Chrysalis production gateway did not become ready.");
}

const authConfig = validateAuthConfiguration();

// The existing production gateway remains the source of truth for all normal
// application traffic. It binds to localhost:4172 so this transfer gateway
// can add the authenticated file-transfer endpoints on the public PORT.
process.env.PORT = String(INTERNAL_PORT);
await import("./production.js");
await waitForInternalGateway();

mkdirSync(BACKUP_DIR, { recursive: true });

const server = createServer(async (request, response) => {
  const url = new URL(
    request.url || "/",
    `http://${request.headers.host || "localhost"}`
  );

  if (url.pathname === "/admin/customer-access" && request.method === "GET") {
    if (!authenticate(request, response)) return;
    serveCustomerAccessPage(response);
    return;
  }

  if (url.pathname === "/api/admin/customer-access" && request.method === "GET") {
    if (!authenticate(request, response)) return;
    try {
      const account = lookupCustomerAccount(url.searchParams.get("identifier"));
      sendJson(response, account ? 200 : 404, {
        ok: Boolean(account),
        account,
        error: account ? undefined : "Customer account not found.",
      });
    } catch (error) {
      sendJson(response, 400, {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to look up customer account.",
      });
    }
    return;
  }

  const customerResetPrefix = "/api/admin/customer-access/";
  const isCustomerPasswordReset =
    url.pathname.startsWith(customerResetPrefix) &&
    url.pathname.endsWith("/password");
  if (isCustomerPasswordReset && request.method === "POST") {
    if (!authenticate(request, response)) return;
    if (!requireSameOrigin(request, response)) return;
    try {
      const userId = decodeURIComponent(
        url.pathname.slice(customerResetPrefix.length, -"/password".length)
      );
      const payload = await readJsonBody(request);
      if (String(payload?.confirmation || "") !== "RESET CUSTOMER PASSWORD") {
        sendJson(response, 400, { ok: false, error: "Confirmation required." });
        return;
      }
      const result = resetCustomerPassword(userId, payload?.password);
      sendJson(response, 200, { ok: true, ...result });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to reset customer password.";
      sendJson(response, message === "Customer account not found." ? 404 : 400, {
        ok: false,
        error: message,
      });
    }
    return;
  }

  const downloadPrefix = "/api/database/backups/";
  const restoreUploadPath = "/api/database/restore-upload";

  if (
    request.method === "GET" &&
    url.pathname.startsWith(downloadPrefix) &&
    url.pathname.endsWith("/download")
  ) {
    if (!authenticate(request, response)) return;

    try {
      const id = decodeURIComponent(
        url.pathname.slice(downloadPrefix.length, -"/download".length)
      );
      const filePath = getSafeBackupPath(id);
      const stats = statSync(filePath);

      response.writeHead(200, {
        "Content-Type": "application/x-sqlite3",
        "Content-Length": stats.size,
        "Content-Disposition": `attachment; filename="${basename(filePath)}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });

      createReadStream(filePath).pipe(response);
    } catch (error) {
      sendJson(response, 404, {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return;
  }

  if (url.pathname === restoreUploadPath && request.method === "POST") {
    if (!authenticate(request, response)) return;

    const contentLength = Number(request.headers["content-length"] || 0);
    if (contentLength > MAX_TRANSFER_BYTES) {
      sendJson(response, 413, {
        ok: false,
        error: `Backup file is too large. The maximum supported size is ${
          MAX_TRANSFER_BYTES / (1024 * 1024)
        } MB.`,
      });
      request.resume();
      return;
    }

    const importedFilename = `chrysalis-import-${randomUUID()}.db`;
    const importedPath = join(BACKUP_DIR, importedFilename);

    try {
      await writeUpload(request, importedPath);
      validateImportedDatabase(importedPath);

      await new Promise((resolveProxy, rejectProxy) => {
        const proxy = httpRequest(
          {
            hostname: "127.0.0.1",
            port: INTERNAL_PORT,
            path: `/api/database/restore/${encodeURIComponent(importedFilename)}`,
            method: "POST",
            headers: {
              cookie: request.headers.cookie || "",
              host: `127.0.0.1:${INTERNAL_PORT}`,
              connection: "close",
            },
          },
          (upstream) => {
            response.writeHead(
              upstream.statusCode || 502,
              upstream.headers
            );
            upstream.pipe(response);
            upstream.on("end", resolveProxy);
            upstream.on("error", rejectProxy);
          }
        );

        proxy.on("error", rejectProxy);
        proxy.end();
      });
    } catch (error) {
      if (!response.headersSent) {
        sendJson(response, 400, {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Unable to restore the uploaded backup.",
        });
      }
    } finally {
      try {
        if (existsSync(importedPath)) unlinkSync(importedPath);
      } catch (cleanupError) {
        console.error(
          "[Chrysalis transfer gateway] Unable to remove imported backup:",
          cleanupError
        );
      }
    }
    return;
  }

  proxyToInternal(request, response, `${url.pathname}${url.search}`);
});

server.listen(PUBLIC_PORT, "0.0.0.0", () => {
  console.log(
    `[Chrysalis transfer gateway] Public gateway listening on 0.0.0.0:${PUBLIC_PORT}`
  );
  console.log(
    `[Chrysalis transfer gateway] Internal production gateway: 127.0.0.1:${INTERNAL_PORT}`
  );
  console.log("[Chrysalis transfer gateway] Portable backup transfer is enabled.");
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
