import { spawn } from "node:child_process";
import net from "node:net";

function findAvailablePort(preferredPort) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.unref();

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        resolve(findAvailablePort(preferredPort + 1));
        return;
      }

      reject(error);
    });

    server.listen(preferredPort, () => {
      const address = server.address();
      const port =
        typeof address === "object" && address ? address.port : preferredPort;

      server.close((closeError) => {
        if (closeError) {
          reject(closeError);
          return;
        }

        resolve(port);
      });
    });
  });
}

function spawnPnpm(args, extraEnv = {}) {
  return spawn("pnpm", args, {
    stdio: "inherit",
    env: { ...process.env, ...extraEnv },
  });
}

const appPort = await findAvailablePort(
  parseInt(process.env.APP_PORT || "3000", 10),
);
let apiPort = await findAvailablePort(
  parseInt(process.env.API_PORT || "3001", 10),
);

if (apiPort === appPort) {
  apiPort = await findAvailablePort(apiPort + 1);
}

console.log(`Using app port ${appPort}.`);
console.log(`Using API port ${apiPort}.`);
console.log(`Open Roughdraft in dev at http://localhost:${appPort}`);
console.log(
  `Open files directly with http://localhost:${appPort}/absolute/path/to/file.md`,
);
console.log(`API port ${apiPort} is internal; don't use it as the browser URL.`);

const server = spawnPnpm(["--filter", "@roughdraft/server", "dev"], {
  API_PORT: String(apiPort),
});
const app = spawnPnpm(
  [
    "--filter",
    "@roughdraft/app",
    "dev",
    "--",
    "--host",
    "localhost",
    "--port",
    String(appPort),
    "--strictPort",
  ],
  {
    API_PORT: String(apiPort),
  },
);

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  if (signal) {
    console.log(`\nStopping dev servers (${signal}).`);
  }

  server.kill("SIGTERM");
  app.kill("SIGTERM");
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

server.on("exit", (code) => {
  if (!shuttingDown) {
    app.kill("SIGTERM");
    process.exit(code ?? 0);
  }
});

app.on("exit", (code) => {
  if (!shuttingDown) {
    server.kill("SIGTERM");
    process.exit(code ?? 0);
  }
});
