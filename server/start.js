import { spawn } from "node:child_process";

const children = [
  spawn(process.execPath, ["server/index.js", "server"], {
    stdio: "inherit",
  }),
  spawn(process.execPath, ["server/job-server.js"], {
    stdio: "inherit",
  }),
];

let shuttingDown = false;

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

for (const child of children) {
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
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
