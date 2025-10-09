import { query } from "./database.js";
import { USER_ROLES, VERIFICATION_STATUS, TABLES } from "../enums/enums.js";

/**
 * Check if tables already exist in the database
 */
async function checkTablesExist() {
  try {
    // Check if users table exists
    const [usersTable] = await query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = '${TABLES.USERS}'
    `);

    // Check if user_logins table exists
    const [loginsTable] = await query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'user_logins'
    `);

    return usersTable.count > 0 && loginsTable.count > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Initialize database tables
 * Creates all required tables if they don't exist
 */
export async function initializeDatabase() {
  try {
    // Check if tables already exist
    const tablesExist = await checkTablesExist();

    if (tablesExist) {
      // Tables already exist, no need to initialize
      return true;
    }

    console.log("🔧 Initializing database tables...");

    // Create users table
    await query(`CREATE TABLE IF NOT EXISTS ${TABLES.USERS} (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('${USER_ROLES.USER}','${USER_ROLES.ADMIN}') NOT NULL DEFAULT '${USER_ROLES.USER}',
      is_verified TINYINT(1) NOT NULL DEFAULT ${VERIFICATION_STATUS.UNVERIFIED},
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    // Create user_logins table
    await query(`CREATE TABLE IF NOT EXISTS user_logins (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      logged_in_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES ${TABLES.USERS}(id) ON DELETE CASCADE
    )`);

    console.log("✅ Database tables initialized successfully");
    return true;
  } catch (error) {
    console.error("❌ Failed to initialize database tables:", error.message);
    return false;
  }
}
