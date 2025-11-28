/**
 * Script seguro para reiniciar o servidor Express
 * 
 * Este script:
 * 1. Mata processos do servidor na porta 5000 (protegendo SSH/Cursor/Replit)
 * 2. Aguarda a porta ser liberada
 * 3. Inicia o servidor em modo produção
 * 4. NUNCA derruba o SSH
 * 
 * Uso:
 *   npm run restart-safe
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { killPortSafe, isPortFree } from './killPortSafe.js';

const execAsync = promisify(exec);

/**
 * Aguarda a porta ser liberada
 */
async function waitForPortFree(port: number, maxWait: number = 15000): Promise<boolean> {
  const startTime = Date.now();
  const checkInterval = 500;
  
  console.log(`[Restart Server Safe] ⏳ Aguardando porta ${port} ser liberada (máximo ${maxWait}ms)...`);
  
  while (Date.now() - startTime < maxWait) {
    if (await isPortFree(port)) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }
  
  return false;
}

/**
 * Inicia o servidor
 */
async function startServer(): Promise<void> {
  console.log(`[Restart Server Safe] 🚀 Iniciando servidor...\n`);
  
  const isProduction = process.env.NODE_ENV === 'production';
  const command = isProduction 
    ? 'NODE_ENV=production node dist/index.js'
    : 'NODE_ENV=development tsx server/index.ts';
  
  console.log(`[Restart Server Safe] Comando: ${command}`);
  console.log(`[Restart Server Safe] Ambiente: ${isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}\n`);
  
  // Inicia o servidor em background
  const child = exec(command, {
    env: { ...process.env },
    cwd: process.cwd(),
  });
  
  // Redireciona stdout e stderr
  child.stdout?.on('data', (data) => {
    process.stdout.write(data);
  });
  
  child.stderr?.on('data', (data) => {
    const errorMsg = data.toString();
    process.stderr.write(data);
    
    // Detecta erro de porta ocupada
    if (errorMsg.includes('EADDRINUSE') || errorMsg.includes('address already in use')) {
      console.error(`\n[Restart Server Safe] ❌ ERRO: Porta 5000 ainda está ocupada!`);
      console.error(`[Restart Server Safe] 🔄 Tentando liberar novamente...\n`);
      
      killPortSafe(5000).then(() => {
        console.log(`[Restart Server Safe] 💡 Execute 'npm run restart-safe' novamente`);
      }).catch(() => {
        console.error(`[Restart Server Safe] ❌ Falha ao tentar liberar porta novamente`);
      });
    }
  });
  
  child.on('error', (error) => {
    console.error(`[Restart Server Safe] ❌ Erro ao iniciar servidor:`, error);
    
    // Se for erro de porta ocupada, tenta novamente
    if (error.message.includes('EADDRINUSE') || error.message.includes('address already in use')) {
      console.error(`[Restart Server Safe] 🔄 Porta ocupada detectada, tentando liberar...`);
      killPortSafe(5000).then(() => {
        console.log(`[Restart Server Safe] 💡 Execute 'npm run restart-safe' novamente`);
      });
    }
    
    process.exit(1);
  });
  
  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[Restart Server Safe] ❌ Servidor encerrado com código ${code}`);
      process.exit(code);
    }
  });
  
  // Aguarda um pouco para verificar se o servidor iniciou
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Verifica se o servidor está rodando
  const portStillFree = await isPortFree(5000);
  if (portStillFree) {
    console.error(`[Restart Server Safe] ❌ Servidor não iniciou na porta 5000`);
    console.error(`[Restart Server Safe] ⚠️  Porta pode ainda estar ocupada ou servidor falhou ao iniciar`);
    process.exit(1);
  }
  
  console.log(`[Restart Server Safe] ✅ Servidor iniciado com sucesso!`);
  console.log(`[Restart Server Safe] 📡 Servidor rodando na porta 5000`);
  console.log(`[Restart Server Safe] 🔗 PID do processo: ${child.pid}\n`);
  
  // Mantém o processo vivo e repassa sinais para o filho
  process.on('SIGINT', () => {
    console.log(`\n[Restart Server Safe] 🛑 Recebido SIGINT, encerrando servidor...`);
    if (child.pid) {
      child.kill('SIGINT');
    }
    setTimeout(() => process.exit(0), 1000);
  });
  
  process.on('SIGTERM', () => {
    console.log(`\n[Restart Server Safe] 🛑 Recebido SIGTERM, encerrando servidor...`);
    if (child.pid) {
      child.kill('SIGTERM');
    }
    setTimeout(() => process.exit(0), 1000);
  });
  
  // Mantém o processo pai vivo enquanto o servidor estiver rodando
  // O processo pai só termina se o servidor for encerrado
}

/**
 * Função principal
 */
async function restartServerSafe(): Promise<void> {
  console.log(`[Restart Server Safe] ========================================`);
  console.log(`[Restart Server Safe] REINÍCIO SEGURO DO SERVIDOR`);
  console.log(`[Restart Server Safe] ========================================\n`);
  
  const port = 5000;
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    // Passo 1: Matar processos do servidor na porta 5000
    if (retryCount === 0) {
      console.log(`[Restart Server Safe] 📋 Passo 1: Liberando porta ${port}...\n`);
    } else {
      console.log(`[Restart Server Safe] 📋 Passo 1 (tentativa ${retryCount + 1}): Liberando porta ${port}...\n`);
    }
    
    await killPortSafe(port);
    
    // Passo 2: Aguardar porta ser liberada
    console.log(`\n[Restart Server Safe] 📋 Passo 2: Aguardando porta ${port} ser liberada...`);
    const portFreed = await waitForPortFree(port, 15000);
    
    if (!portFreed) {
      retryCount++;
      
      if (retryCount >= maxRetries) {
        console.error(`[Restart Server Safe] ❌ Porta ${port} não foi liberada após ${maxRetries} tentativas`);
        console.error(`[Restart Server Safe] ⚠️  Pode haver processos protegidos usando a porta`);
        console.error(`[Restart Server Safe] 💡 Verifique manualmente com: lsof -i:${port}`);
        process.exit(1);
      }
      
      console.log(`[Restart Server Safe] ⚠️  Porta ainda ocupada, tentando novamente...\n`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      continue;
    }
    
    console.log(`[Restart Server Safe] ✅ Porta ${port} liberada!\n`);
    break;
  }
  
  // Passo 3: Iniciar servidor
  console.log(`[Restart Server Safe] 📋 Passo 3: Iniciando servidor...\n`);
  await startServer();
}

// Executar se chamado diretamente
const isMainModule = process.argv[1] && (
  process.argv[1].includes('restartServerSafe.ts') || 
  process.argv[1].includes('restartServerSafe.js')
);
if (isMainModule) {
  restartServerSafe().catch(error => {
    console.error(`[Restart Server Safe] ❌ ERRO FATAL:`, error);
    process.exit(1);
  });
}

export { restartServerSafe };
