import { storage } from "./storage.js";
import { hashPassword } from "./auth.js";

const ADMIN_EMAIL = "matheus.wallefy@gmail.com";
const ADMIN_PASSWORD = "82556682";

/**
 * Seed admin user in production environment
 * Creates admin user if it doesn't exist
 * Only runs in production (NODE_ENV === "production")
 */
export async function seedAdmin(): Promise<void> {
  // Only run in production
  if (process.env.NODE_ENV !== "production") {
    console.log("[SEED] Skipping admin seed - not in production environment");
    return;
  }

  try {
    console.log("[SEED] Checking for admin user...");

    // Check if admin already exists
    const existingAdmin = await storage.getUserByEmail(ADMIN_EMAIL);
    
    if (existingAdmin) {
      console.log(`[SEED] Admin user already exists: ${ADMIN_EMAIL}`);
      
      // Ensure the existing user has admin role (in case it was changed)
      if (existingAdmin.role !== 'admin') {
        console.log(`[SEED] Updating existing user to admin role...`);
        await storage.updateUser(existingAdmin.id, { role: 'admin' });
        console.log(`[SEED] User role updated to admin`);
      }
      
      return;
    }

    // Admin doesn't exist, create it
    console.log(`[SEED] Creating admin user: ${ADMIN_EMAIL}`);
    
    // Hash the password using the same method as the system
    const passwordHash = await hashPassword(ADMIN_PASSWORD);
    
    // Create admin user
    const adminUser = await storage.createUser({
      email: ADMIN_EMAIL,
      passwordHash,
      role: 'admin',
      status: 'authenticated',
      plano: 'free',
      billingStatus: 'none',
    });

    console.log(`[SEED] Admin user created successfully: ${adminUser.id}`);
    console.log(`[SEED] Email: ${ADMIN_EMAIL}`);
    console.log(`[SEED] Role: ${adminUser.role}`);
    
  } catch (error) {
    console.error("[SEED] Error seeding admin user:", error);
    // Don't throw - allow server to continue even if seed fails
    // This prevents production from failing to start if there's a seed issue
  }
}

