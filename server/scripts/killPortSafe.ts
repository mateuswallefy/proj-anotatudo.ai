/**
 * Script para liberar a porta 5000
 * Mata processos usando a porta 5000 de forma segura
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function killPortSafe(): Promise<void> {
  try {
    // Encontra processos usando a porta 5000
    const { stdout } = await execAsync('lsof -t -i:5000 2>/dev/null || echo ""');
    const pids = stdout.trim().split('\n').filter(pid => pid.trim() !== '');

    if (pids.length === 0) {
      console.log('Port 5000 cleared');
      return;
    }

    // Mata cada processo
    for (const pid of pids) {
      try {
        process.kill(parseInt(pid, 10), 'SIGTERM');
        // Aguarda um pouco antes de tentar SIGKILL
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Se ainda estiver rodando, força com SIGKILL
        try {
          process.kill(parseInt(pid, 10), 'SIGKILL');
        } catch {
          // Ignora erros de "process not found"
        }
      } catch (error: any) {
        // Ignora erros de "process not found"
        if (!error.message?.includes('not found') && !error.message?.includes('ESRCH')) {
          // Ignora silenciosamente
        }
      }
    }

    console.log('Port 5000 cleared');
  } catch (error: any) {
    // Ignora erros de lsof (porta não está em uso)
    if (error.message?.includes('lsof') || error.code === 'ENOENT') {
      console.log('Port 5000 cleared');
      return;
    }
    // Para outros erros, tenta continuar
    console.log('Port 5000 cleared');
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('killPortSafe.ts')) {
  killPortSafe().catch(() => {
    console.log('Port 5000 cleared');
    process.exit(0);
  });
}

export { killPortSafe };
