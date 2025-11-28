#!/usr/bin/env tsx
/**
 * Script para resetar o ambiente Replit do modo Production/Autoscale
 * para o modo Development limpo.
 */

import { execSync } from "child_process";
import { existsSync, rmSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";

console.log("🔄 Iniciando reset do ambiente Replit para modo Dev...\n");

// 1. Matar processos Node na porta 5000 usando lsof
console.log("1️⃣ Matando processos Node na porta 5000...");
try {
  const lsofOutput = execSync("lsof -ti:5000 2>/dev/null || true", { encoding: "utf-8" }).trim();
  if (lsofOutput) {
    const pids = lsofOutput.split("\n").filter(Boolean);
    for (const pid of pids) {
      try {
        execSync(`kill -9 ${pid} 2>/dev/null || true`, { stdio: "ignore" });
        console.log(`   ✅ Processo ${pid} terminado`);
      } catch (e) {
        // Ignorar erros
      }
    }
  } else {
    console.log("   ℹ️ Nenhum processo encontrado na porta 5000");
  }
} catch (e) {
  console.log("   ⚠️ Erro ao verificar porta 5000 (pode não ter lsof)");
}

// 2. Matar todos os processos Node em background
console.log("\n2️⃣ Matando todos os processos Node...");
try {
  execSync("pkill -9 -f 'node|tsx|vite' 2>/dev/null || true", { stdio: "ignore" });
  console.log("   ✅ Processos Node terminados");
} catch (e) {
  console.log("   ⚠️ Nenhum processo Node encontrado");
}

// 3. Remover arquivos e diretórios de deploy/autoscale
console.log("\n3️⃣ Removendo arquivos de deploy/autoscale...");

const autoscalePaths = [
  ".config/autoscale",
  ".replit/autoscale",
  "replit_autoscale.json",
  ".replit/autoscale.json",
  ".config/deployment",
  ".replit/deployment",
  "replit_deployment.json",
  ".replit/deployment.json",
];

for (const path of autoscalePaths) {
  try {
    if (existsSync(path)) {
      rmSync(path, { recursive: true, force: true });
      console.log(`   ✅ Removido: ${path}`);
    }
  } catch (e) {
    // Ignorar erros
  }
}

// Procurar arquivos contendo "autoscale" ou "deployment" no nome
try {
  const findOutput = execSync(
    'find . -maxdepth 3 -type f \\( -name "*autoscale*" -o -name "*deployment*" \\) 2>/dev/null | grep -v node_modules | grep -v .git || true',
    { encoding: "utf-8" }
  ).trim();
  
  if (findOutput) {
    const files = findOutput.split("\n").filter(Boolean);
    for (const file of files) {
      try {
        rmSync(file, { force: true });
        console.log(`   ✅ Removido: ${file}`);
      } catch (e) {
        // Ignorar
      }
    }
  }
} catch (e) {
  // Ignorar
}

// 4. Restaurar .replit para modo Dev limpo
console.log("\n4️⃣ Restaurando .replit para modo Dev...");

const replitContent = `modules = ["nodejs-20", "web"]
hidden = [".git", ".config", "node_modules", "dist"]

[nix]
channel = "stable-24_05"
packages = ["nodejs-20", "pnpm", "lsof"]

[env]
PORT = "5000"

run = ["npm", "run", "dev"]

[[ports]]
localPort = 5000
externalPort = 80
`;

try {
  writeFileSync(".replit", replitContent, "utf-8");
  console.log("   ✅ .replit restaurado para modo Dev");
} catch (e) {
  console.error(`   ❌ Erro ao escrever .replit: ${e}`);
  process.exit(1);
}

// 5. Criar/restaurar replit.nix
console.log("\n5️⃣ Criando/restaurando replit.nix...");

const replitNixContent = `{ pkgs }: {
  deps = [
    pkgs.nodejs-20_x
    pkgs.pnpm
    pkgs.lsof
  ];
}
`;

try {
  writeFileSync("replit.nix", replitNixContent, "utf-8");
  console.log("   ✅ replit.nix criado/restaurado");
} catch (e) {
  console.error(`   ❌ Erro ao escrever replit.nix: ${e}`);
  process.exit(1);
}

// 6. Remover referências a autoscale em outros arquivos (se houver)
console.log("\n6️⃣ Verificando referências a autoscale em arquivos...");
try {
  // Verificar package.json
  const packageJsonPath = "package.json";
  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    let modified = false;
    
    // Remover scripts relacionados a autoscale/deployment
    if (packageJson.scripts) {
      const scriptsToRemove = Object.keys(packageJson.scripts).filter(
        (key) => key.includes("autoscale") || key.includes("deployment")
      );
      for (const key of scriptsToRemove) {
        delete packageJson.scripts[key];
        modified = true;
        console.log(`   ✅ Removido script: ${key}`);
      }
    }
    
    if (modified) {
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n", "utf-8");
    }
  }
} catch (e) {
  console.log("   ⚠️ Erro ao verificar package.json (pode não existir)");
}

// 7. Limpar caches do Replit
console.log("\n7️⃣ Limpando caches...");

const cachePaths = [
  "~/.cache",
  ".cache",
  "node_modules/.cache",
  "dist",
  "build",
  ".vite",
  "node_modules/.vite",
];

for (const path of cachePaths) {
  try {
    const fullPath = path.startsWith("~") ? path.replace("~", process.env.HOME || "") : path;
    if (existsSync(fullPath)) {
      rmSync(fullPath, { recursive: true, force: true });
      console.log(`   ✅ Cache removido: ${path}`);
    }
  } catch (e) {
    // Ignorar erros
  }
}

// 8. Limpar processos Node restantes
console.log("\n8️⃣ Limpeza final de processos...");
try {
  execSync("pkill -9 -f 'node|tsx|vite' 2>/dev/null || true", { stdio: "ignore" });
  console.log("   ✅ Limpeza final concluída");
} catch (e) {
  // Ignorar
}

// 9. Verificar porta 5000
console.log("\n9️⃣ Verificando porta 5000...");
try {
  const checkPort = execSync("lsof -ti:5000 2>/dev/null || true", { encoding: "utf-8" }).trim();
  if (checkPort) {
    console.log(`   ⚠️ Ainda há processos na porta 5000: ${checkPort}`);
    console.log("   💡 Execute manualmente: pkill -9 -f node");
  } else {
    console.log("   ✅ Porta 5000 está livre");
  }
} catch (e) {
  console.log("   ℹ️ Não foi possível verificar porta 5000 (lsof pode não estar disponível)");
}

console.log("\n" + "=".repeat(60));
console.log("✅ DEV MODE RESET COMPLETE");
console.log("=".repeat(60));
console.log("\n📋 Próximos passos:");
console.log("   1. Execute: pkill -f node || true");
console.log("   2. Execute: npm install");
console.log("   3. Execute: npm run dev");
console.log("   4. Verifique que o Replit Preview está funcionando");
console.log("\n");

























