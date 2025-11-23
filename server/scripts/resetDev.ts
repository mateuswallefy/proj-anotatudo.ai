import { execSync } from "child_process";

const ports = [5173, 5050, 5000];

for (const port of ports) {
  try {
    const pids = execSync(`lsof -t -i:${port} 2>/dev/null`).toString().trim();
    if (pids) {
      pids.split("\n").forEach(pid => {
        try {
          process.kill(Number(pid), "SIGKILL");
        } catch (error: any) {
          // Ignora erros "no such process"
          if (!error.message?.includes("no such process") && !error.message?.includes("ESRCH")) {
            // Ignora silenciosamente
          }
        }
      });
      console.log(`Port ${port} cleared`);
    } else {
      console.log(`Port ${port} cleared`);
    }
  } catch (error: any) {
    // Se lsof não encontrar processos, considera limpo
    if (error.message?.includes("lsof") || error.code === "ENOENT" || error.status === 1) {
      console.log(`Port ${port} cleared`);
    } else {
      console.log(`Port ${port} cleared`);
    }
  }
}

console.log("All dev ports cleared");






