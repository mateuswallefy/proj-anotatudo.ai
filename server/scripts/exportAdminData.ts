/**
 * Script para exportar dados EXATOS do admin original do banco de dados
 * 
 * Uso:
 *   npx tsx server/scripts/exportAdminData.ts
 * 
 * Este script extrai:
 * 1. ID do admin (users.id)
 * 2. Email do admin
 * 3. password_hash (HASH, não a senha)
 * 4. Todos os campos obrigatórios (role, billing_status, created_at, status, etc.)
 */

import { db } from "../db.js";
import { users } from "@shared/schema";
import { eq, or } from "drizzle-orm";

async function exportAdminData() {
  try {
    console.log("=".repeat(80));
    console.log("🔍 BUSCANDO DADOS DO ADMIN ORIGINAL");
    console.log("=".repeat(80));
    console.log("");

    // Buscar admin por email ou role
    const adminEmail = "matheus.wallefy@gmail.com";
    
    console.log(`📧 Buscando admin com email: ${adminEmail}`);
    console.log(`🔑 Buscando também usuários com role='admin'...`);
    console.log("");

    // Buscar por email primeiro
    const [adminByEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    // Se não encontrou por email, buscar por role
    let admin = adminByEmail;
    if (!admin) {
      console.log(`⚠️  Admin não encontrado por email, buscando por role='admin'...`);
      const [adminByRole] = await db
        .select()
        .from(users)
        .where(eq(users.role, 'admin'))
        .limit(1);
      admin = adminByRole;
    }

    if (!admin) {
      console.error("❌ ERRO: Admin não encontrado no banco de dados!");
      console.error("   Verifique se existe um usuário com:");
      console.error(`   - Email: ${adminEmail}`);
      console.error("   - OU role: 'admin'");
      process.exit(1);
    }

    console.log("✅ ADMIN ENCONTRADO!");
    console.log("");
    console.log("=".repeat(80));
    console.log("📋 DADOS EXATOS DO ADMIN ORIGINAL");
    console.log("=".repeat(80));
    console.log("");

    // Exibir todos os campos importantes
    console.log("1️⃣  ID do admin:");
    console.log(`   ${admin.id}`);
    console.log("");

    console.log("2️⃣  Email do admin:");
    console.log(`   ${admin.email || 'NULL'}`);
    console.log("");

    console.log("3️⃣  password_hash (⚠️  HASH, NÃO A SENHA):");
    if (admin.passwordHash) {
      console.log(`   ${admin.passwordHash}`);
      console.log(`   (Tamanho: ${admin.passwordHash.length} caracteres)`);
    } else {
      console.log("   ⚠️  NULL - Admin não tem password_hash!");
    }
    console.log("");

    console.log("4️⃣  Campos obrigatórios e extras:");
    console.log(`   role: ${admin.role || 'NULL'}`);
    console.log(`   status: ${admin.status || 'NULL'}`);
    console.log(`   billing_status: ${admin.billingStatus || 'NULL'}`);
    console.log(`   plano: ${admin.plano || 'NULL'}`);
    console.log(`   created_at: ${admin.createdAt ? admin.createdAt.toISOString() : 'NULL'}`);
    console.log(`   updated_at: ${admin.updatedAt ? admin.updatedAt.toISOString() : 'NULL'}`);
    console.log("");

    console.log("5️⃣  Campos opcionais:");
    console.log(`   first_name: ${admin.firstName || 'NULL'}`);
    console.log(`   last_name: ${admin.lastName || 'NULL'}`);
    console.log(`   telefone: ${admin.telefone || 'NULL'}`);
    console.log(`   whatsapp_number: ${admin.whatsappNumber || 'NULL'}`);
    console.log(`   profile_image_url: ${admin.profileImageUrl || 'NULL'}`);
    console.log(`   plan_label: ${admin.planLabel || 'NULL'}`);
    console.log(`   metadata: ${admin.metadata ? JSON.stringify(admin.metadata, null, 2) : 'NULL'}`);
    console.log("");

    console.log("=".repeat(80));
    console.log("📝 SQL INSERT PARA CRIAR O ADMIN NO NOVO AMBIENTE");
    console.log("=".repeat(80));
    console.log("");

    // Gerar SQL INSERT com todos os campos
    const sqlFields: string[] = [];
    const sqlValues: string[] = [];

    // Campos obrigatórios
    if (admin.id) {
      sqlFields.push("id");
      sqlValues.push(`'${admin.id.replace(/'/g, "''")}'`);
    }
    if (admin.email) {
      sqlFields.push("email");
      sqlValues.push(`'${admin.email.replace(/'/g, "''")}'`);
    }
    if (admin.passwordHash) {
      sqlFields.push("password_hash");
      sqlValues.push(`'${admin.passwordHash.replace(/'/g, "''")}'`);
    }
    if (admin.role) {
      sqlFields.push("role");
      sqlValues.push(`'${admin.role.replace(/'/g, "''")}'`);
    }
    if (admin.status) {
      sqlFields.push("status");
      sqlValues.push(`'${admin.status.replace(/'/g, "''")}'`);
    }
    if (admin.billingStatus) {
      sqlFields.push("billing_status");
      sqlValues.push(`'${admin.billingStatus.replace(/'/g, "''")}'`);
    }
    if (admin.plano) {
      sqlFields.push("plano");
      sqlValues.push(`'${admin.plano.replace(/'/g, "''")}'`);
    }
    if (admin.createdAt) {
      sqlFields.push("created_at");
      sqlValues.push(`'${admin.createdAt.toISOString()}'`);
    }
    if (admin.updatedAt) {
      sqlFields.push("updated_at");
      sqlValues.push(`'${admin.updatedAt.toISOString()}'`);
    }

    // Campos opcionais
    if (admin.firstName) {
      sqlFields.push("first_name");
      sqlValues.push(`'${admin.firstName.replace(/'/g, "''")}'`);
    }
    if (admin.lastName) {
      sqlFields.push("last_name");
      sqlValues.push(`'${admin.lastName.replace(/'/g, "''")}'`);
    }
    if (admin.telefone) {
      sqlFields.push("telefone");
      sqlValues.push(`'${admin.telefone.replace(/'/g, "''")}'`);
    }
    if (admin.whatsappNumber) {
      sqlFields.push("whatsapp_number");
      sqlValues.push(`'${admin.whatsappNumber.replace(/'/g, "''")}'`);
    }
    if (admin.profileImageUrl) {
      sqlFields.push("profile_image_url");
      sqlValues.push(`'${admin.profileImageUrl.replace(/'/g, "''")}'`);
    }
    if (admin.planLabel) {
      sqlFields.push("plan_label");
      sqlValues.push(`'${admin.planLabel.replace(/'/g, "''")}'`);
    }
    if (admin.metadata) {
      sqlFields.push("metadata");
      sqlValues.push(`'${JSON.stringify(admin.metadata).replace(/'/g, "''")}'::jsonb`);
    }

    const sqlInsert = `INSERT INTO users (${sqlFields.join(", ")}) VALUES (${sqlValues.join(", ")});`;

    console.log(sqlInsert);
    console.log("");

    console.log("=".repeat(80));
    console.log("📋 DADOS EM FORMATO JSON (para uso programático)");
    console.log("=".repeat(80));
    console.log("");

    // Exibir JSON completo
    const adminData = {
      id: admin.id,
      email: admin.email,
      passwordHash: admin.passwordHash,
      role: admin.role,
      status: admin.status,
      billingStatus: admin.billingStatus,
      plano: admin.plano,
      createdAt: admin.createdAt?.toISOString(),
      updatedAt: admin.updatedAt?.toISOString(),
      firstName: admin.firstName,
      lastName: admin.lastName,
      telefone: admin.telefone,
      whatsappNumber: admin.whatsappNumber,
      profileImageUrl: admin.profileImageUrl,
      planLabel: admin.planLabel,
      metadata: admin.metadata,
    };

    console.log(JSON.stringify(adminData, null, 2));
    console.log("");

    console.log("=".repeat(80));
    console.log("✅ EXPORTAÇÃO CONCLUÍDA COM SUCESSO!");
    console.log("=".repeat(80));
    console.log("");
    console.log("⚠️  IMPORTANTE:");
    console.log("   - Guarde o password_hash com cuidado!");
    console.log("   - Sem ele, o admin não conseguirá fazer login no novo ambiente.");
    console.log("   - Use o SQL INSERT ou os dados JSON para recriar o admin.");
    console.log("");

    process.exit(0);
  } catch (error: any) {
    console.error("❌ ERRO ao exportar dados do admin:");
    console.error(error);
    console.error("");
    console.error("Stack trace:");
    console.error(error.stack);
    process.exit(1);
  }
}

// Executar
exportAdminData();

