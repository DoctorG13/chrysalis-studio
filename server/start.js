import { spawn } from "node:child_process";
import { request as httpRequest } from "node:http";

const SERVICES = [
  {
    name: "database",
    script: "server/index.js",
    args: ["server"],
    healthUrl: "http://127.0.0.1:4174/api/health",
    label: "Database API",
  },
  {
    name: "jobs",
    script: "server/job-server.js",
    args: [],
    healthUrl: "http://127.0.0.1:4175/api/health",
    label: "Job API",
  },
  {
    name: "appointments",
    script: "server/appointment-server.js",
    args: [],
    healthUrl: "http://127.0.0.1:4176/api/health",
    label: "Appointment API",
  },
  {
    name: "measurements",
    script: "server/measurement-server.js",
    args: [],
    healthUrl: "http://127.0.0.1:4177/api/health",
    label: "Measurement API",
  },
];

const children = new Map();
let shuttingDown = false;

function checkHealth(url, attempt = 0) {
  return new Promise((resolve, reject) => {
    const request = httpRequest(
      url,
      { method: "GET" },
      (response) => {
        response.resume();

        if (response.statusCode === 200) {
          resolve();
          return;
        }

        retryHealth(url, attempt, reject);
      }
    );

    request.setTimeout(1000, () => {
      request.destroy();
      retryHealth(url, attempt, reject);
    });

    request.on("error", () => {
      retryHealth(url, attempt, reject);
    });

    request.end();
  });
}

function retryHealth(url, attempt, reject) {
  if (attempt >= 30) {
    reject(
      new Error(
        `Service did not become ready within 30 seconds: ${url}`
      )
    );
    return;
  }

  setTimeout(() => {
    checkHealth(url, attempt + 1)
      .then(() => undefined)
      .catch(reject);
  }, 1000);
}

function spawnService(service) {
  console.log(`Starting Chrysalis ${service.name} service...`);

  const child = spawn(process.execPath, [service.script, ...service.args], {
    stdio: "inherit",
    windowsHide: false,
  });

  children.set(service.name, child);

  child.on("spawn", () => {
    console.log(`Chrysalis ${service.name} process started.`);
  });

  child.on("error", (error) => {
    console.error(
      `Unable to start Chrysalis ${service.name} service:`,
      error
    );

    shutdown(1);
  });

  child.on("exit", (code, signal) => {
    children.delete(service.name);

    if (shuttingDown) return;

    console.error(
      `Chrysalis ${service.name} service stopped unexpectedly ` +
        `(code=${code ?? "null"}, signal=${signal ?? "none"}).`
    );

    shutdown(code || 1);
  });

  return child;
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log("Stopping Chrysalis backend services...");

  for (const child of children.values()) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }

  setTimeout(() => process.exit(code), 500);
}

async function main() {
  for (const service of SERVICES) {
    spawnService(service);
  }

  try {
    await Promise.all(
      SERVICES.map((service) => checkHealth(service.healthUrl))
    );
  } catch (error) {
    console.error("Chrysalis backend startup failed:", error);
    shutdown(1);
    return;
  }

  console.log("");
  console.log("Chrysalis backend is ready.");
  for (const service of SERVICES) {
    console.log(`  ${service.label}: ${service.healthUrl.replace("/api/health", "")}`);
  }
  console.log("");
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

main().catch((error) => {
  console.error("Chrysalis backend startup failed:", error);
  shutdown(1);
});
