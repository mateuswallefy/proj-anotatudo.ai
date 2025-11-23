import { execSync } from "child_process";

const ports = [5000, 5050, 5173, 5174, 5175];

for (const port of ports) {
  try {
    const pids = execSync(`lsof -t -i:${port} 2>/dev/null`).toString().trim();
    if (pids) {
      pids.split("\n").forEach(pid => {
        try { process.kill(Number(pid)); } catch {}
      });
      console.log(`Port ${port} cleared`);
    }
  } catch {}
}

console.log("All dev ports cleared");
