// Script to create users with proper hashed passwords
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import pg from "pg";
const { Pool } = pg;

const scryptAsync = promisify(scrypt);

// Hash function from our auth.ts
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Hash the passwords
    const adminPassword = await hashPassword("admin123");
    const studentPassword = await hashPassword("password");
    
    // Delete existing users to avoid duplicates
    await pool.query("DELETE FROM users WHERE username IN ('admin', '2001086')");
    
    // Insert admin user
    await pool.query(`
      INSERT INTO users (username, password, role, email, student_id, registration_date)
      VALUES ('admin', $1, 'admin', 'admin@example.com', NULL, NOW())
    `, [adminPassword]);
    
    // Insert student user
    await pool.query(`
      INSERT INTO users (username, password, role, email, student_id, registration_date)
      VALUES ('2001086', $1, 'student', 'student@example.com', '2001086', NOW())
    `, [studentPassword]);
    
    console.log("Users created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error creating users:", error);
    process.exit(1);
  }
}

main();