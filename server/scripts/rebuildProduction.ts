/**
 * Script para rebuild completo em produção
 * 
 * Este script:
 * 1. Limpa todos os caches e builds antigos
 * 2. Recompila o projeto completamente
 * 3. Garante que Tailwind seja recompilado
 * 4. Verifica se o build foi bem-sucedido
 * 
 * Uso:
 *   npm run rebuild
 *   npm run rebuild:fast
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { rm } from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

/**
 * Limpa todos os caches e builds
 */
async function cleanAll(): Promise<void> {
  console.log('🧹 Limpando builds e caches...\n');
  
  const dirsToClean = [
    'dist',
    '.next',
    'build',
    'public/build',
    '.cache/vite',
    '.cache/tailwindcss',
    'node_modules/.vite',
    'node_modules/.cache',
    '.turbo',
  ];

  for (const dir of dirsToClean) {
    try {
      if (existsSync(dir)) {
        await rm(dir, { recursive: true, force: true });
        console.log(`  ✅ Removido: ${dir}`);
      }
    } catch (error: any) {
      console.warn(`  ⚠️  Erro ao remover ${dir}: ${error.message}`);
    }
  }
  
  console.log('\n✅ Limpeza completa!\n');
}

/**
 * Executa o build do projeto
 */
async function buildProject(): Promise<void> {
  console.log('🔨 Reconstruindo projeto...\n');
  
  try {
    // Build do Vite (frontend + Tailwind)
    console.log('  📦 Compilando frontend (Vite + Tailwind)...');
    const { stdout: viteOutput, stderr: viteError } = await execAsync('npm run build', {
      env: { ...process.env, NODE_ENV: 'production' },
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });
    
    if (viteError && !viteError.includes('warning')) {
      console.error('  ❌ Erro no build do Vite:', viteError);
      throw new Error('Build do Vite falhou');
    }
    
    console.log('  ✅ Frontend compilado com sucesso');
    
    // Verifica se os arquivos foram gerados
    const distPublic = path.join(process.cwd(), 'dist/public');
    const distIndex = path.join(process.cwd(), 'dist/index.js');
    
    if (!existsSync(distPublic)) {
      throw new Error('dist/public não foi criado');
    }
    
    if (!existsSync(distIndex)) {
      throw new Error('dist/index.js não foi criado');
    }
    
    console.log('  ✅ Backend compilado com sucesso');
    console.log('\n✅ Build completo!\n');
    
  } catch (error: any) {
    console.error('\n❌ Erro durante o build:', error.message);
    if (error.stdout) console.log('STDOUT:', error.stdout);
    if (error.stderr) console.error('STDERR:', error.stderr);
    throw error;
  }
}

/**
 * Rebuild completo (limpa tudo e reconstrói)
 */
async function rebuild(fast: boolean = false): Promise<void> {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  🔄 REBUILD COMPLETO DO PROJETO');
  console.log('═══════════════════════════════════════════════════════\n');
  
  try {
    // Limpa builds e caches
    if (!fast) {
      await cleanAll();
    } else {
      console.log('🧹 Limpando builds antigos (modo rápido)...\n');
      const quickClean = [
        'dist',
        '.cache/vite',
        'node_modules/.vite',
      ];
      
      for (const dir of quickClean) {
        try {
          if (existsSync(dir)) {
            await rm(dir, { recursive: true, force: true });
          }
        } catch (error) {
          // Ignora erros em modo rápido
        }
      }
      console.log('✅ Limpeza rápida completa!\n');
    }
    
    // Reconstrói o projeto
    await buildProject();
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('  ✅ REBUILD CONCLUÍDO COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('📁 Build gerado em:');
    console.log('   - dist/public/ (frontend)');
    console.log('   - dist/index.js (backend)\n');
    console.log('🚀 Execute "npm run start:direct" para iniciar o servidor\n');
    
  } catch (error: any) {
    console.error('\n═══════════════════════════════════════════════════════');
    console.error('  ❌ REBUILD FALHOU!');
    console.error('═══════════════════════════════════════════════════════\n');
    console.error('Erro:', error.message);
    console.error('\n💡 Tente executar:');
    console.error('   npm run clean');
    console.error('   npm install');
    console.error('   npm run build\n');
    process.exit(1);
  }
}

// Executar se chamado diretamente
const isMainModule = process.argv[1] && (
  process.argv[1].includes('rebuildProduction.ts') || 
  process.argv[1].includes('rebuildProduction.js')
);

if (isMainModule) {
  const fast = process.argv.includes('--fast');
  rebuild(fast).catch(error => {
    console.error('❌ ERRO FATAL:', error);
    process.exit(1);
  });
}

export { rebuild, cleanAll, buildProject };


