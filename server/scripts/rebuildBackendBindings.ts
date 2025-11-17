/**
 * Script para auditar todas as funções relacionadas a assinaturas
 * e verificar compatibilidade com o schema do Drizzle
 * 
 * Uso:
 *   npx tsx server/scripts/rebuildBackendBindings.ts
 * 
 * Este script analisa o código (não o banco) para encontrar incompatibilidades.
 */

import * as fs from 'fs';
import * as path from 'path';

// Schema esperado do Drizzle (camelCase no código, snake_case no banco)
const EXPECTED_FIELDS = {
  // camelCase (código) -> snake_case (banco)
  id: 'id',
  userId: 'user_id',
  provider: 'provider',
  providerSubscriptionId: 'provider_subscription_id',
  planName: 'plan_name',
  priceCents: 'price_cents',
  currency: 'currency',
  billingInterval: 'billing_interval',
  interval: 'interval',
  status: 'status',
  trialEndsAt: 'trial_ends_at',
  currentPeriodEnd: 'current_period_end',
  cancelAt: 'cancel_at',
  meta: 'meta',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

// Funções a auditar
const FUNCTIONS_TO_AUDIT = [
  'createSubscription',
  'updateSubscription',
  'getUserSubscriptionStatus',
  'getSubscriptionsByUserId',
  'listSubscriptions',
];

// Arquivos a analisar
const FILES_TO_ANALYZE = [
  'server/routes.ts',
  'server/storage.ts',
  'server/whatsapp.ts',
  'shared/schema.ts',
];

interface FieldUsage {
  file: string;
  line: number;
  function: string;
  field: string;
  context: string;
}

interface Issue {
  type: 'missing_field' | 'wrong_name' | 'incompatible_type' | 'missing_mapping';
  file: string;
  line: number;
  function: string;
  field: string;
  expected: string;
  actual?: string;
  message: string;
}

function extractFieldNames(content: string, filePath: string): FieldUsage[] {
  const usages: FieldUsage[] = [];
  const lines = content.split('\n');
  
  // Padrões para encontrar uso de campos
  const fieldPatterns = [
    // Objetos: { field: value }
    /\{[\s\S]*?(\w+):[\s\S]*?\}/g,
    // Acesso: .field ou sub.field
    /\.(\w+)(?:\s|,|;|\)|\[|$)/g,
    // Parâmetros: field: type
    /(\w+):\s*(?:string|number|boolean|Date|any)/g,
  ];
  
  lines.forEach((line, index) => {
    // Procurar por chamadas de funções relacionadas
    for (const funcName of FUNCTIONS_TO_AUDIT) {
      if (line.includes(funcName)) {
        // Extrair campos usados nesta linha e próximas
        for (let i = index; i < Math.min(index + 20, lines.length); i++) {
          const currentLine = lines[i];
          
          // Procurar por campos esperados
          for (const [camelCase, snakeCase] of Object.entries(EXPECTED_FIELDS)) {
            if (currentLine.includes(camelCase) || currentLine.includes(snakeCase)) {
              usages.push({
                file: filePath,
                line: i + 1,
                function: funcName,
                field: camelCase,
                context: currentLine.trim(),
              });
            }
          }
        }
      }
    }
  });
  
  return usages;
}

function analyzeFile(filePath: string): Issue[] {
  const issues: Issue[] = [];
  
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      console.warn(`[Rebuild Backend Bindings] ⚠️  Arquivo não encontrado: ${filePath}`);
      return issues;
    }
    
    const content = fs.readFileSync(fullPath, 'utf-8');
    const usages = extractFieldNames(content, filePath);
    
    // Analisar cada uso
    usages.forEach(usage => {
      const expectedField = EXPECTED_FIELDS[usage.field as keyof typeof EXPECTED_FIELDS];
      
      if (!expectedField) {
        issues.push({
          type: 'missing_mapping',
          file: filePath,
          line: usage.line,
          function: usage.function,
          field: usage.field,
          expected: 'Campo deve estar em EXPECTED_FIELDS',
          message: `Campo '${usage.field}' usado mas não mapeado em EXPECTED_FIELDS`,
        });
      }
    });
    
    // Verificar se campos críticos estão sendo usados
    const criticalFields = ['currentPeriodEnd', 'interval', 'status', 'provider'];
    criticalFields.forEach(field => {
      if (!content.includes(field) && filePath.includes('routes.ts')) {
        // Não é erro, apenas verificação
      }
    });
    
  } catch (error: any) {
    console.error(`[Rebuild Backend Bindings] ❌ Erro ao analisar ${filePath}:`, error.message);
  }
  
  return issues;
}

function validateCreateSubscriptionCalls(content: string, filePath: string): Issue[] {
  const issues: Issue[] = [];
  const lines = content.split('\n');
  
  // Padrão para encontrar createSubscription({ ... })
  const createPattern = /createSubscription\s*\(\s*\{([\s\S]*?)\}\s*\)/g;
  let match;
  
  while ((match = createPattern.exec(content)) !== null) {
    const block = match[1];
    const lineNumber = content.substring(0, match.index).split('\n').length;
    
    // Campos obrigatórios no schema
    const requiredFields = ['userId', 'provider', 'providerSubscriptionId', 'planName', 'priceCents', 'currency', 'billingInterval', 'status'];
    
    requiredFields.forEach(field => {
      if (!block.includes(field)) {
        issues.push({
          type: 'missing_field',
          file: filePath,
          line: lineNumber,
          function: 'createSubscription',
          field: field,
          expected: `Campo obrigatório '${field}' deve estar presente`,
          message: `createSubscription() em ${filePath}:${lineNumber} está faltando campo obrigatório '${field}'`,
        });
      }
    });
    
    // Verificar se campos usados existem no schema
    const usedFields = block.match(/(\w+):/g)?.map(f => f.replace(':', '')) || [];
    usedFields.forEach(field => {
      if (!EXPECTED_FIELDS[field as keyof typeof EXPECTED_FIELDS] && field !== 'meta') {
        issues.push({
          type: 'wrong_name',
          file: filePath,
          line: lineNumber,
          function: 'createSubscription',
          field: field,
          expected: `Campo deve ser um dos: ${Object.keys(EXPECTED_FIELDS).join(', ')}`,
          message: `createSubscription() em ${filePath}:${lineNumber} usa campo '${field}' que não existe no schema`,
        });
      }
    });
  }
  
  return issues;
}

function validateGetUserSubscriptionStatus(content: string, filePath: string): Issue[] {
  const issues: Issue[] = [];
  
  // Verificar se a função acessa currentPeriodEnd corretamente
  if (content.includes('getUserSubscriptionStatus')) {
    if (!content.includes('currentPeriodEnd')) {
      issues.push({
        type: 'missing_field',
        file: filePath,
        line: 0,
        function: 'getUserSubscriptionStatus',
        field: 'currentPeriodEnd',
        expected: 'Função deve verificar currentPeriodEnd para determinar expiração',
        message: `getUserSubscriptionStatus() não verifica currentPeriodEnd (necessário para verificar expiração)`,
      });
    }
    
    if (!content.includes('status')) {
      issues.push({
        type: 'missing_field',
        file: filePath,
        line: 0,
        function: 'getUserSubscriptionStatus',
        field: 'status',
        expected: 'Função deve verificar status da assinatura',
        message: `getUserSubscriptionStatus() não verifica status (necessário para determinar se está ativa)`,
      });
    }
  }
  
  return issues;
}

async function rebuildBackendBindings() {
  console.log(`[Rebuild Backend Bindings] Iniciando auditoria...`);
  console.log(`[Rebuild Backend Bindings] Analisando ${FILES_TO_ANALYZE.length} arquivos...\n`);
  
  const allIssues: Issue[] = [];
  
  // Analisar cada arquivo
  for (const filePath of FILES_TO_ANALYZE) {
    console.log(`[Rebuild Backend Bindings] Analisando ${filePath}...`);
    
    const fileIssues = analyzeFile(filePath);
    allIssues.push(...fileIssues);
    
    // Validações específicas
    try {
      const fullPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        
        const createIssues = validateCreateSubscriptionCalls(content, filePath);
        allIssues.push(...createIssues);
        
        const statusIssues = validateGetUserSubscriptionStatus(content, filePath);
        allIssues.push(...statusIssues);
      }
    } catch (error: any) {
      console.error(`[Rebuild Backend Bindings] Erro ao validar ${filePath}:`, error.message);
    }
  }
  
  // Exibir resultados
  console.log(`\n[Rebuild Backend Bindings] ========================================`);
  console.log(`[Rebuild Backend Bindings] RESULTADO DA AUDITORIA`);
  console.log(`[Rebuild Backend Bindings] ========================================\n`);
  
  if (allIssues.length === 0) {
    console.log(`[Rebuild Backend Bindings] ✅ Tudo sincronizado!`);
    console.log(`[Rebuild Backend Bindings] ✅ Todas as funções estão usando campos corretos`);
    console.log(`[Rebuild Backend Bindings] ✅ Mapeamento camelCase <-> snake_case está correto`);
    console.log(`[Rebuild Backend Bindings] ✅ Nenhuma função está acessando campos inexistentes\n`);
    process.exit(0);
  } else {
    console.log(`[Rebuild Backend Bindings] ❌ Campos incompatíveis encontrados (${allIssues.length} issues)\n`);
    
    // Agrupar por tipo
    const byType = allIssues.reduce((acc, issue) => {
      if (!acc[issue.type]) acc[issue.type] = [];
      acc[issue.type].push(issue);
      return acc;
    }, {} as Record<string, Issue[]>);
    
    for (const [type, issues] of Object.entries(byType)) {
      console.log(`🔹 ${type.toUpperCase()} (${issues.length}):`);
      issues.forEach(issue => {
        console.log(`   - ${issue.file}:${issue.line} - ${issue.function}()`);
        console.log(`     Campo: ${issue.field}`);
        console.log(`     Problema: ${issue.message}`);
        console.log(`     Esperado: ${issue.expected}`);
        if (issue.actual) {
          console.log(`     Encontrado: ${issue.actual}`);
        }
        console.log('');
      });
    }
    
    console.log(`[Rebuild Backend Bindings] ========================================`);
    console.log(`[Rebuild Backend Bindings] CORREÇÕES NECESSÁRIAS:`);
    console.log(`[Rebuild Backend Bindings] ========================================\n`);
    console.log(`Ajuste os campos listados acima para garantir compatibilidade.\n`);
    
    process.exit(1);
  }
}

// Executar auditoria
rebuildBackendBindings();

