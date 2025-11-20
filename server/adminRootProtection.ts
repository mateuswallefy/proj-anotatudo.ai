import { storage } from "./storage.js";
import { db } from "./db.js";
import { users } from "@shared/schema";
import { eq, and, count } from "drizzle-orm";

/**
 * Email do admin-root protegido
 */
export const ADMIN_ROOT_EMAIL = "matheus.wallefy@gmail.com";

/**
 * Hash da senha do admin-root (senha padrão)
 */
export const ADMIN_ROOT_PASSWORD_HASH = "$2b$10$GSJAuUEGn0.NyWhSsF8gne45m9LZb9.MLGPRGBTRCG7w/jEVAFu6e";

/**
 * Verifica se um email é o admin-root
 */
export function isAdminRoot(email: string | null | undefined): boolean {
  return email === ADMIN_ROOT_EMAIL;
}

/**
 * Verifica se um usuário é o admin-root
 */
export function isAdminRootUser(user: { email: string | null } | null | undefined): boolean {
  return user?.email === ADMIN_ROOT_EMAIL;
}

/**
 * Verifica se pode deletar um usuário
 * Retorna { canDelete: boolean, reason?: string }
 */
export async function canDeleteUser(userId: string): Promise<{ canDelete: boolean; reason?: string }> {
  const user = await storage.getUser(userId);
  
  if (!user) {
    return { canDelete: false, reason: "Usuário não encontrado" };
  }

  // Bloquear delete do admin-root
  if (isAdminRootUser(user)) {
    return { canDelete: false, reason: "O admin-root não pode ser excluído." };
  }

  // Verificar se é o último admin
  const adminCount = await getAdminCount();
  if (adminCount <= 1) {
    // Se só existe 1 admin e é admin, não pode deletar
    if (user.role === 'admin') {
      return { canDelete: false, reason: "Não é possível excluir o último admin do sistema." };
    }
  }

  return { canDelete: true };
}

/**
 * Conta quantos admins existem no sistema
 */
export async function getAdminCount(): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.role, 'admin'));
  
  return result[0]?.count || 0;
}

/**
 * Verifica se pode atualizar campos protegidos do admin-root
 * Retorna { canUpdate: boolean, reason?: string }
 */
export function canUpdateAdminRootFields(
  userId: string,
  userEmail: string | null | undefined,
  updates: {
    role?: string;
    status?: string;
    plano?: string;
    billingStatus?: string;
    passwordHash?: string;
  }
): { canUpdate: boolean; reason?: string } {
  // Verificar se é o admin-root
  if (!isAdminRootUser({ email: userEmail })) {
    return { canUpdate: true };
  }

  // Verificar se está tentando alterar campos protegidos
  const protectedFields: string[] = [];
  
  if (updates.role !== undefined) {
    protectedFields.push('role');
  }
  if (updates.status !== undefined) {
    protectedFields.push('status');
  }
  if (updates.plano !== undefined) {
    protectedFields.push('plano');
  }
  if (updates.billingStatus !== undefined) {
    protectedFields.push('billingStatus');
  }
  if (updates.passwordHash !== undefined) {
    protectedFields.push('password');
  }

  if (protectedFields.length > 0) {
    return {
      canUpdate: false,
      reason: "O admin-root não pode ter permissões alteradas."
    };
  }

  return { canUpdate: true };
}

/**
 * Verifica e recria o admin-root se não existir
 * Esta função deve ser chamada na inicialização do servidor
 */
export async function ensureAdminRootExists(): Promise<void> {
  try {
    console.log("[ADMIN-ROOT] Verificando existência do admin-root...");
    
    const existingAdmin = await storage.getUserByEmail(ADMIN_ROOT_EMAIL);
    
    if (existingAdmin) {
      console.log(`[ADMIN-ROOT] ✅ Admin-root encontrado: ${ADMIN_ROOT_EMAIL}`);
      
      // Garantir que o admin-root tem os campos corretos
      const needsUpdate: any = {};
      
      if (existingAdmin.role !== 'admin') {
        needsUpdate.role = 'admin';
      }
      if (existingAdmin.status !== 'authenticated') {
        needsUpdate.status = 'authenticated';
      }
      if (existingAdmin.plano !== 'premium') {
        needsUpdate.plano = 'premium';
      }
      if (existingAdmin.billingStatus !== 'active') {
        needsUpdate.billingStatus = 'active';
      }
      
      if (Object.keys(needsUpdate).length > 0) {
        console.log(`[ADMIN-ROOT] ⚠️  Corrigindo campos do admin-root...`);
        await storage.updateUser(existingAdmin.id, needsUpdate);
        console.log(`[ADMIN-ROOT] ✅ Campos corrigidos`);
      }
      
      return;
    }

    // Admin-root não existe, criar
    console.log(`[ADMIN-ROOT] ⚠️  Admin-root não encontrado. Criando...`);
    
    const adminUser = await storage.createUser({
      email: ADMIN_ROOT_EMAIL,
      passwordHash: ADMIN_ROOT_PASSWORD_HASH,
      role: 'admin',
      status: 'authenticated',
      plano: 'premium',
      billingStatus: 'active',
    });

    console.log(`[ADMIN-ROOT] ✅ Admin-root criado com sucesso!`);
    console.log(`[ADMIN-ROOT] ID: ${adminUser.id}`);
    console.log(`[ADMIN-ROOT] Email: ${ADMIN_ROOT_EMAIL}`);
    console.log(`[ADMIN-ROOT] Role: ${adminUser.role}`);
    console.log(`[ADMIN-ROOT] Status: ${adminUser.status}`);
    console.log(`[ADMIN-ROOT] Plano: ${adminUser.plano}`);
    console.log(`[ADMIN-ROOT] Billing Status: ${adminUser.billingStatus}`);
    
  } catch (error: any) {
    console.error("[ADMIN-ROOT] ❌ ERRO CRÍTICO ao verificar/criar admin-root:", error);
    console.error("[ADMIN-ROOT] Detalhes do erro:", {
      message: error.message,
      stack: error.stack,
    });
    // Não lançar erro - permitir que o servidor inicie mesmo se houver problema
    // Mas logar como erro crítico
  }
}

