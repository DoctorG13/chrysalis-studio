import { createServer } from "node:http";

import {
  clearExpiredBizziBuddiAuthState,
  closeBizziBuddiAuthDatabase,
  handleBizziBuddiAuthRequest,
} from "./bizzibuddi-auth.js";

const DEFAULT_PORT = 4185;

const server = createServer(async (request, response) => {
  const handled = await handleBizziBuddiAuthRequest(request, response);

  if (handled) return;

  response.writeHead(404, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify({ ok: false, error: "Not found." }));
});

const port = Number(
  process.env.BIZZIBUDDI_AUTH_API_PORT || DEFAULT_PORT
);

server.listen(port, "127.0.0.1", () => {
  console.log(
    `BizziBuddi authentication API listening on http://127.0.0.1:${port}`
  );
});

const cleanupTimer = setInterval(
  clearExpiredBizziBuddiAuthState,
  5 * 60 * 1000
);

function shutdown() {
  clearInterval(cleanupTimer);
  closeBizziBuddiAuthDatabase();
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
