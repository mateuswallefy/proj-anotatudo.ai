/**
 * Script seguro para iniciar o servidor
 * 
 * Este script:
 * 1. Verifica se a porta 5000 está em uso
 * 2. Mata apenas processos do servidor Express (protegendo SSH/Cursor/Replit)
 * 3. Inicia o servidor em modo produção
 * 4. Detecta falhas por porta ocupada e tenta novamente
 * 
 * Uso:
 *   npm start
 *   (chamado automaticamente pelo package.json)
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { killPortSafe, isPortFree } from './killPortSafe.js';

const execAsync = promisify(exec);

/**
 * Inicia o servidor diretamente
 */
async function startServerDirect(): Promise<void> {
  const command = 'NODE_ENV=production node dist/index.js';
  
  console.log(`[Start Safe] 🚀 Iniciando servidor em modo produção...`);
  console.log(`[Start Safe] Comando: ${command}\n`);
  
  // Executa o servidor (não em background, para manter o processo vivo)
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
      console.error(`\n[Start Safe] ❌ ERRO: Porta 5000 ainda está ocupada!`);
      console.error(`[Start Safe] 🔄 Tentando liberar novamente...\n`);
      
      // Mata processos novamente
      killPortSafe(5000).then(() => {
        console.log(`[Start Safe] 💡 Execute 'npm start' novamente após alguns segundos`);
      }).catch(() => {
        console.error(`[Start Safe] ❌ Falha ao tentar liberar porta novamente`);
      });
    }
  });
  
  child.on('error', (error) => {
    console.error(`[Start Safe] ❌ Erro ao iniciar servidor:`, error);
    
    // Se for erro de porta ocupada, tenta novamente
    if (error.message.includes('EADDRINUSE') || error.message.includes('address already in use')) {
      console.error(`[Start Safe] 🔄 Porta ocupada detectada, tentando liberar...`);
      killPortSafe(5000).then(() => {
        console.log(`[Start Safe] 💡 Execute 'npm start' novamente`);
      });
    }
    
    process.exit(1);
  });
  
  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[Start Safe] ❌ Servidor encerrado com código ${code}`);
      process.exit(code);
    }
  });
  
  // Mantém o processo vivo
  process.on('SIGINT', () => {
    console.log(`\n[Start Safe] 🛑 Recebido SIGINT, encerrando servidor...`);
    child.kill('SIGINT');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log(`\n[Start Safe] 🛑 Recebido SIGTERM, encerrando servidor...`);
    child.kill('SIGTERM');
    process.exit(0);
  });
}

/**
 * Função principal
 */
async function startSafe(): Promise<void> {
  console.log(`[Start Safe] ========================================`);
  console.log(`[Start Safe] INÍCIO SEGURO DO SERVIDOR`);
  console.log(`[Start Safe] ========================================\n`);
  
  const port = 5000;
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    // Verifica se a porta está em uso
    const portInUse = !(await isPortFree(port));
    
    if (portInUse) {
      if (retryCount === 0) {
        console.log(`[Start Safe] ⚠️  Porta ${port} está em uso`);
        console.log(`[Start Safe] 🔍 Verificando processos...\n`);
      } else {
        console.log(`[Start Safe] ⚠️  Porta ${port} ainda está em uso (tentativa ${retryCount + 1}/${maxRetries})`);
        console.log(`[Start Safe] 🔍 Tentando liberar novamente...\n`);
      }
      
      // Mata apenas processos do servidor (protegendo SSH/Cursor/Replit)
      await killPortSafe(port);
      
      // Aguarda um pouco para a porta ser liberada
      console.log(`\n[Start Safe] ⏳ Aguardando porta ${port} ser liberada...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verifica novamente
      const stillInUse = !(await isPortFree(port));
      if (stillInUse) {
        retryCount++;
        
        if (retryCount >= maxRetries) {
          console.error(`[Start Safe] ❌ Porta ${port} ainda está em uso após ${maxRetries} tentativas`);
          console.error(`[Start Safe] ⚠️  Pode haver processos protegidos (SSH/Cursor/Replit) usando a porta`);
          console.error(`[Start Safe] 💡 Tente usar: npm run restart-safe`);
          process.exit(1);
        }
        
        // Aguarda mais um pouco antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      
      console.log(`[Start Safe] ✅ Porta ${port} liberada!\n`);
      break;
    } else {
      console.log(`[Start Safe] ✅ Porta ${port} está livre\n`);
      break;
    }
  }
  
  // Inicia o servidor
  await startServerDirect();
}

// Executar se chamado diretamente
const isMainModule = process.argv[1] && (
  process.argv[1].includes('startSafe.ts') || 
  process.argv[1].includes('startSafe.js')
);
if (isMainModule) {
  startSafe().catch(error => {
    console.error(`[Start Safe] ❌ ERRO FATAL:`, error);
    process.exit(1);
  });
}

export { startSafe };
