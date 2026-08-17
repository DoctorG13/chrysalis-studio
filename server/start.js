import { spawn } from "node:child_process";
import { request as httpRequest } from "node:http";

const children = [];
let shuttingDown = false;

function waitForClientApi(attempt = 0) {
  return new Promise((resolve, reject) => {
    const request = httpRequest(
      "http://127.0.0.1:4174/api/health",
      { method: "GET" },
      (response) => {
        response.resume();

        if (response.statusCode === 200) {
          resolve();
          return;
        }

        retry(attempt, reject);
      }
    );

    request.setTimeout(1000, () => {
      request.destroy();
      retry(attempt, reject);
    });

    request.on("error", () => {
      retry(attempt, reject);
    });

    request.end();
  });
}

function retry(attempt, reject) {
  if (attempt >= 30) {
    reject(
      new Error(
        "The Chrysalis database API did not become ready within 30 seconds."
      )
    );
    return;
  }

  setTimeout(() => {
    waitForClientApi(attempt + 1)
      .then(() => undefined)
      .catch(reject);
  }, 1000);
}

function spawnChild(script, args = []) {
  const child = spawn(process.execPath, [script, ...args], {
    stdio: "inherit",
  });

  children.push(child);

  child.on("exit", (code, signal) => {
    if (shuttingDown) return;

    if (signal || code !== 0) {
      shutdown(code || 1);
    }
  });

  child.on("error", (error) => {
    console.error("Unable to start Chrysalis API process:", error);
    shutdown(1);
  });

  return child;
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }

  setTimeout(() => process.exit(code), 250);
}

async function main() {
  const databaseApi = spawnChild("server/index.js", ["server"]);

  try {
    await waitForClientApi();
  } catch (error) {
    console.error(error);
    if (!databaseApi.killed) {
      databaseApi.kill("SIGTERM");
    }
    process.exit(1);
  }

  spawnChild("server/job-server.js");
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

main().catch((error) => {
  console.error(error);
  shutdown(1);
});
