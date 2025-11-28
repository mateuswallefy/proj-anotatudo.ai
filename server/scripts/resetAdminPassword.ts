/**
 * Script para redefinir senha do usuário admin em produção
 * 
 * Uso:
 *   npx tsx server/scripts/resetAdminPassword.ts
 * 
 * Ou em produção:
 *   NODE_ENV=production npx tsx server/scripts/resetAdminPassword.ts
 * 
 * Requisitos:
 *   - DATABASE_URL configurada
 *   - Usuário admin deve existir com email: matheus.wallefy@gmail.com
 */

import { hashPassword } from "../auth.js";
import { storage } from "../storage.js";

const ADMIN_EMAIL = "matheus.wallefy@gmail.com";
const NEW_PASSWORD = "82556682.com";

async function resetAdminPassword() {
  try {
    console.log(`[Reset Admin Password] Iniciando processo...`);
    console.log(`[Reset Admin Password] Email: ${ADMIN_EMAIL}`);
    
    // Verificar se está em produção
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Reset Admin Password] ⚠️  AVISO: Não está em modo production!");
      console.warn("[Reset Admin Password] ⚠️  Para executar em produção, defina NODE_ENV=production");
      // Continuar mesmo assim para permitir testes
    }

    // 1. Buscar usuário pelo email
    console.log(`[Reset Admin Password] Buscando usuário pelo email...`);
    const user = await storage.getUserByEmail(ADMIN_EMAIL);
    
    if (!user) {
      throw new Error(`Usuário com email ${ADMIN_EMAIL} não encontrado no banco de dados.`);
    }

    console.log(`[Reset Admin Password] ✅ Usuário encontrado: ${user.id}`);
    console.log(`[Reset Admin Password] Nome: ${user.firstName || user.email}`);
    console.log(`[Reset Admin Password] Role: ${user.role}`);

    // Verificar se é admin
    if (user.role !== 'admin') {
      console.warn(`[Reset Admin Password] ⚠️  AVISO: Usuário não tem role 'admin' (role atual: ${user.role})`);
      console.warn(`[Reset Admin Password] ⚠️  Continuando mesmo assim...`);
    }

    // 2. Gerar hash bcrypt para a nova senha
    console.log(`[Reset Admin Password] Gerando hash bcrypt para a nova senha...`);
    const passwordHash = await hashPassword(NEW_PASSWORD);
    console.log(`[Reset Admin Password] ✅ Hash gerado com sucesso`);

    // 3. Atualizar apenas o passwordHash, mantendo todos os outros dados
    console.log(`[Reset Admin Password] Atualizando passwordHash no banco de dados...`);
    const updatedUser = await storage.updateUser(user.id, {
      passwordHash: passwordHash,
      // Explicitamente NÃO alterar outros campos
      // metadata, billingStatus, assinatura, id, logs permanecem inalterados
    });

    if (!updatedUser) {
      throw new Error("Falha ao atualizar usuário no banco de dados.");
    }

    // 4. Verificar se a atualização foi bem-sucedida
    const verifyUser = await storage.getUserByEmail(ADMIN_EMAIL);
    if (!verifyUser || !verifyUser.passwordHash) {
      throw new Error("Falha na verificação: passwordHash não foi atualizado corretamente.");
    }

    // 5. Confirmar sucesso
    console.log(`[Reset Admin Password] ✅ Senha redefinida com sucesso`);
    console.log(`[Reset Admin Password] ✅ Usuário ID: ${updatedUser.id}`);
    console.log(`[Reset Admin Password] ✅ Email: ${updatedUser.email}`);
    console.log(`[Reset Admin Password] ✅ Role: ${updatedUser.role}`);
    console.log(`[Reset Admin Password] ✅ Nova senha aplicada: ${NEW_PASSWORD}`);
    console.log(`[Reset Admin Password] ✅ Hash salvo no banco: ${verifyUser.passwordHash.substring(0, 20)}...`);

    // Finalizar processo
    process.exit(0);
  } catch (error: any) {
    console.error("[Reset Admin Password] ❌ ERRO:", error.message);
    console.error("[Reset Admin Password] Stack:", error.stack);
    process.exit(1);
  }
}

// Executar script
resetAdminPassword();

