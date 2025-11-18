/**
 * Script seguro para matar processos na porta 5000
 * 
 * PROTEÇÃO CRÍTICA: NUNCA mata processos SSH, Cursor, Replit ou do sistema
 * 
 * Uso:
 *   npx tsx server/scripts/killPortSafe.ts [port]
 * 
 * Exemplo:
 *   npx tsx server/scripts/killPortSafe.ts 5000
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Processos que DEVEM ser protegidos (nunca matar)
const SAFE_PROCESSES = [
  'ssh',
  'cursor',
  'sshd',
  'replit',
  'python',
  'systemd',
  'init',
  'kernel',
  'bash',
  'sh',
  'zsh',
];

// Processos do servidor Express que PODEM ser mortos
const SERVER_PROCESSES = [
  'node dist/index.js',
  'node server/index.ts',
  'tsx server/index.ts',
  'tsx server/scripts',
];

/**
 * Verifica se um processo deve ser protegido
 */
function isSafeProcess(processName: string, commandLine: string): boolean {
  const lowerName = processName.toLowerCase();
  const lowerCmd = commandLine.toLowerCase();
  
  // Verifica se o nome do processo contém algo protegido
  for (const safeProcess of SAFE_PROCESSES) {
    if (lowerName.includes(safeProcess) || lowerCmd.includes(safeProcess)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Verifica se um processo é do servidor Express
 */
function isServerProcess(processName: string, commandLine: string): boolean {
  const lowerName = processName.toLowerCase();
  const lowerCmd = commandLine.toLowerCase();
  
  // Verifica se é um processo do servidor
  for (const serverProcess of SERVER_PROCESSES) {
    if (lowerCmd.includes(serverProcess)) {
      return true;
    }
  }
  
  // Verifica se é node/tsx executando arquivos do servidor
  if ((lowerName.includes('node') || lowerName.includes('tsx')) && 
      (lowerCmd.includes('dist/index.js') || lowerCmd.includes('server/index.ts'))) {
    return true;
  }
  
  return false;
}

/**
 * Obtém informações detalhadas de um processo
 */
async function getProcessInfo(pid: string): Promise<{ name: string; cmd: string; pid: string } | null> {
  try {
    // Tenta obter o nome do processo
    const { stdout: nameOut } = await execAsync(`ps -p ${pid} -o comm= 2>/dev/null || echo ""`);
    const name = nameOut.trim();
    
    // Tenta obter a linha de comando completa
    const { stdout: cmdOut } = await execAsync(`ps -p ${pid} -o args= 2>/dev/null || echo ""`);
    const cmd = cmdOut.trim();
    
    if (!name && !cmd) {
      return null; // Processo não existe mais
    }
    
    return { name, cmd, pid };
  } catch (error) {
    return null;
  }
}

/**
 * Mata um processo de forma segura
 */
async function killProcess(pid: string, reason: string): Promise<boolean> {
  try {
    console.log(`[Kill Port Safe] 🎯 Matando processo ${pid} (${reason})`);
    await execAsync(`kill -9 ${pid} 2>/dev/null`);
    
    // Aguarda um pouco e verifica se o processo foi morto
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      await execAsync(`ps -p ${pid} >/dev/null 2>&1`);
      console.log(`[Kill Port Safe] ⚠️  Processo ${pid} ainda está rodando, tentando novamente...`);
      await execAsync(`kill -9 ${pid} 2>/dev/null`);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch {
      // Processo foi morto com sucesso
    }
    
    console.log(`[Kill Port Safe] ✅ Processo ${pid} morto com sucesso`);
    return true;
  } catch (error: any) {
    console.error(`[Kill Port Safe] ❌ Erro ao matar processo ${pid}:`, error.message);
    return false;
  }
}

/**
 * Detecta processos Node presos (mesmo quando lsof não mostra)
 */
async function findStuckNodeProcesses(port: number): Promise<string[]> {
  const pids: string[] = [];
  
  try {
    // Busca processos Node executando o servidor
    const commands = [
      `ps aux | grep "node dist/index.js" | grep -v grep`,
      `ps aux | grep "node server/index.ts" | grep -v grep`,
      `ps aux | grep "tsx server/index.ts" | grep -v grep`,
      `ps aux | grep "tsx server/scripts" | grep -v grep`,
    ];
    
    for (const cmd of commands) {
      try {
        const { stdout } = await execAsync(cmd);
        const lines = stdout.trim().split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          // Extrai o PID (segunda coluna do ps aux)
          const parts = line.trim().split(/\s+/);
          if (parts.length > 1) {
            const pid = parts[1];
            const fullCmd = line.substring(line.indexOf(parts[10]) || 0);
            
            // Verifica se é do servidor e não é protegido
            if (!isSafeProcess(parts[0] || '', fullCmd) && isServerProcess(parts[0] || '', fullCmd)) {
              if (!pids.includes(pid)) {
                pids.push(pid);
              }
            }
          }
        }
      } catch {
        // Ignora erros (pode não encontrar processos)
      }
    }
  } catch (error) {
    // Ignora erros
  }
  
  return pids;
}

/**
 * Força liberação da porta usando fuser (último recurso)
 */
async function forceKillPort(port: number): Promise<boolean> {
  try {
    console.log(`[Kill Port Safe] 🔧 Tentando forçar liberação da porta ${port} com fuser...`);
    
    // Verifica se fuser está disponível
    try {
      await execAsync(`which fuser`);
    } catch {
      console.log(`[Kill Port Safe] ⚠️  fuser não está disponível, pulando...`);
      return false;
    }
    
    // Tenta matar processos usando a porta com fuser
    // fuser -k mata processos, mas vamos verificar antes
    const { stdout: fuserOut } = await execAsync(`fuser ${port}/tcp 2>/dev/null || echo ""`);
    const fuserPids = fuserOut.trim().split(/\s+/).filter(pid => pid.match(/^\d+$/));
    
    if (fuserPids.length === 0) {
      console.log(`[Kill Port Safe] ℹ️  fuser não encontrou processos na porta ${port}`);
      return false;
    }
    
    console.log(`[Kill Port Safe] 📋 fuser encontrou ${fuserPids.length} processo(s) na porta ${port}`);
    
    // Verifica cada PID antes de matar
    let killedAny = false;
    for (const pid of fuserPids) {
      const processInfo = await getProcessInfo(pid);
      
      if (!processInfo) {
        continue;
      }
      
      const { name, cmd } = processInfo;
      
      // NUNCA mata processos protegidos
      if (isSafeProcess(name, cmd)) {
        console.log(`[Kill Port Safe] 🛡️  PID ${pid} é protegido (${name}) - NÃO SERÁ MORTO`);
        continue;
      }
      
      // Só mata se for do servidor
      if (isServerProcess(name, cmd)) {
        const killed = await killProcess(pid, `Servidor Express (fuser)`);
        if (killed) {
          killedAny = true;
        }
      } else {
        console.log(`[Kill Port Safe] ⚠️  PID ${pid} não é do servidor - NÃO SERÁ MORTO`);
      }
    }
    
    return killedAny;
  } catch (error: any) {
    console.error(`[Kill Port Safe] ❌ Erro ao usar fuser:`, error.message);
    return false;
  }
}

/**
 * Função principal
 */
async function killPortSafe(port: number = 5000): Promise<void> {
  console.log(`[Kill Port Safe] 🔍 Verificando processos na porta ${port}...\n`);
  
  let killedCount = 0;
  let safeCount = 0;
  let unknownCount = 0;
  
  try {
    // Método 1: Tenta lsof
    const { stdout } = await execAsync(`lsof -t -i:${port} 2>/dev/null || echo ""`);
    const lsofPids = stdout.trim().split('\n').filter(pid => pid.trim() !== '');
    
    if (lsofPids.length > 0) {
      console.log(`[Kill Port Safe] 📋 lsof encontrou ${lsofPids.length} processo(s) na porta ${port}\n`);
      
      // Processa cada PID do lsof
      for (const pid of lsofPids) {
        const processInfo = await getProcessInfo(pid);
        
        if (!processInfo) {
          console.log(`[Kill Port Safe] ⚠️  Processo ${pid} não existe mais (já foi morto)`);
          continue;
        }
        
        const { name, cmd } = processInfo;
        console.log(`[Kill Port Safe] 📌 PID ${pid}:`);
        console.log(`   Nome: ${name}`);
        console.log(`   Comando: ${cmd.substring(0, 100)}${cmd.length > 100 ? '...' : ''}`);
        
        // Verifica se é protegido
        if (isSafeProcess(name, cmd)) {
          console.log(`[Kill Port Safe] 🛡️  PROCESSO PROTEGIDO (SSH/Cursor/Replit) - NÃO SERÁ MORTO\n`);
          safeCount++;
          continue;
        }
        
        // Verifica se é do servidor Express
        if (isServerProcess(name, cmd)) {
          const killed = await killProcess(pid, `Servidor Express (${name})`);
          if (killed) {
            killedCount++;
          }
          console.log('');
          continue;
        }
        
        // Processo desconhecido - não mata por segurança
        console.log(`[Kill Port Safe] ⚠️  Processo desconhecido - NÃO SERÁ MORTO por segurança\n`);
        unknownCount++;
      }
    } else {
      console.log(`[Kill Port Safe] ℹ️  lsof não encontrou processos na porta ${port}`);
      console.log(`[Kill Port Safe] 🔍 Buscando processos Node presos...\n`);
      
      // Método 2: Busca processos Node presos
      const stuckPids = await findStuckNodeProcesses(port);
      
      if (stuckPids.length > 0) {
        console.log(`[Kill Port Safe] 📋 Encontrados ${stuckPids.length} processo(s) Node preso(s)\n`);
        
        for (const pid of stuckPids) {
          const processInfo = await getProcessInfo(pid);
          
          if (!processInfo) {
            continue;
          }
          
          const { name, cmd } = processInfo;
          console.log(`[Kill Port Safe] 📌 PID ${pid}:`);
          console.log(`   Nome: ${name}`);
          console.log(`   Comando: ${cmd.substring(0, 100)}${cmd.length > 100 ? '...' : ''}`);
          
          // Verifica se é protegido
          if (isSafeProcess(name, cmd)) {
            console.log(`[Kill Port Safe] 🛡️  PROCESSO PROTEGIDO - NÃO SERÁ MORTO\n`);
            safeCount++;
            continue;
          }
          
          // Só mata se for do servidor
          if (isServerProcess(name, cmd)) {
            const killed = await killProcess(pid, `Servidor Express preso (${name})`);
            if (killed) {
              killedCount++;
            }
            console.log('');
          } else {
            console.log(`[Kill Port Safe] ⚠️  Processo não é do servidor - NÃO SERÁ MORTO\n`);
            unknownCount++;
          }
        }
      } else {
        console.log(`[Kill Port Safe] ℹ️  Nenhum processo Node preso encontrado`);
      }
    }
    
    // Método 3: Se a porta ainda estiver ocupada, tenta fuser (último recurso)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const stillInUse = !(await isPortFree(port));
    if (stillInUse && killedCount === 0) {
      console.log(`\n[Kill Port Safe] ⚠️  Porta ${port} ainda parece estar em uso`);
      console.log(`[Kill Port Safe] 🔧 Tentando forçar liberação...\n`);
      
      const fuserKilled = await forceKillPort(port);
      if (fuserKilled) {
        killedCount++;
      }
    }
    
  } catch (error: any) {
    if (error.message.includes('lsof')) {
      console.log(`[Kill Port Safe] ℹ️  lsof não encontrou processos`);
    } else {
      console.error(`[Kill Port Safe] ❌ ERRO:`, error.message);
    }
  }
  
  // Resumo
  console.log(`[Kill Port Safe] ========================================`);
  console.log(`[Kill Port Safe] RESUMO:`);
  console.log(`   ✅ Processos do servidor mortos: ${killedCount}`);
  console.log(`   🛡️  Processos protegidos: ${safeCount}`);
  console.log(`   ⚠️  Processos desconhecidos: ${unknownCount}`);
  console.log(`[Kill Port Safe] ========================================\n`);
  
  if (killedCount > 0) {
    console.log(`[Kill Port Safe] ✅ Porta ${port} liberada com sucesso!`);
  } else if (safeCount > 0 || unknownCount > 0) {
    console.log(`[Kill Port Safe] ⚠️  Porta ${port} ainda pode estar em uso por processos protegidos ou desconhecidos`);
  } else {
    console.log(`[Kill Port Safe] ✅ Nenhum processo encontrado na porta ${port}`);
  }
}

/**
 * Verifica se a porta está livre
 */
async function isPortFree(port: number): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`lsof -t -i:${port} 2>/dev/null || echo ""`);
    return stdout.trim() === '';
  } catch {
    return true;
  }
}

// Executar se chamado diretamente
const isMainModule = process.argv[1] && (
  process.argv[1].includes('killPortSafe.ts') || 
  process.argv[1].includes('killPortSafe.js')
);
if (isMainModule) {
  const port = parseInt(process.argv[2] || '5000', 10);
  killPortSafe(port).catch(error => {
    console.error(`[Kill Port Safe] ❌ ERRO FATAL:`, error);
    process.exit(1);
  });
}

export { killPortSafe, isPortFree };
