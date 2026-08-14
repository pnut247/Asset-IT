import { readFile } from "fs/promises"
import path from "path"
import mysql from "mysql2/promise"
import { json, errorResponse } from "@/lib/api"
import { query } from "@/lib/db"
import { hashPassword } from "@/lib/auth"
import { isDbConfigured } from "@/lib/db"

/**
 * One-time setup: creates all tables and seeds a default admin + demo data.
 * Safe to run multiple times (uses CREATE TABLE IF NOT EXISTS and skips seeding if users exist).
 *
 * POST /api/setup
 */
export async function POST() {
  if (!isDbConfigured()) {
    return errorResponse("DATABASE_URL is not set. Add it in Project Settings > Vars first.", 503)
  }

  try {
    // Run the DDL using a dedicated connection with multipleStatements enabled.
    const sqlPath = path.join(process.cwd(), "scripts", "001-schema.sql")
    const ddl = await readFile(sqlPath, "utf8")
    const conn = await mysql.createConnection({
      uri: process.env.DATABASE_URL!,
      multipleStatements: true,
    })
    await conn.query(ddl)
    await conn.end()

    // Seed only if there are no users yet.
    const existing = await query<{ c: number }>("SELECT COUNT(*) AS c FROM users")
    if (existing[0].c === 0) {
      await seed()
      return json({ ok: true, message: "Schema created and demo data seeded.", seeded: true })
    }

    return json({ ok: true, message: "Schema is up to date. Existing data left untouched.", seeded: false })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Setup failed"
    console.log("[v0] setup error:", message)
    return errorResponse(message, 500)
  }
}

async function seed() {
  const adminPass = await hashPassword("admin123")
  const staffPass = await hashPassword("staff123")
  const userPass = await hashPassword("user123")

  await query(
    `INSERT INTO users (name, email, password_hash, role, department) VALUES
       (?, ?, ?, 'admin', 'IT'),
       (?, ?, ?, 'staff', 'IT Support'),
       (?, ?, ?, 'user', 'Finance'),
       (?, ?, ?, 'user', 'Marketing')`,
    [
      "System Admin", "admin@company.com", adminPass,
      "Somsak Staff", "staff@company.com", staffPass,
      "Nida User", "user@company.com", userPass,
      "Anan Wong", "anan@company.com", userPass,
    ],
  )

  await query(
    `INSERT INTO assets (tag_id, name, category, serial_number, brand, model, spec, status, location, purchase_date, warranty_expire, price, invoice_po) VALUES
      ('IT-0001','Dell Latitude 5540','Laptop','SN-DL5540-001','Dell','Latitude 5540','i7/16GB/512GB SSD','in_stock','HQ Store Room','2024-01-15','2027-01-15',42000.00,'PO-2024-001'),
      ('IT-0002','MacBook Pro 14','Laptop','SN-MBP14-002','Apple','MacBook Pro 14 M3','M3/18GB/512GB','in_use','Finance Dept','2024-03-10','2026-03-10',78000.00,'PO-2024-014'),
      ('IT-0003','Dell UltraSharp U2723QE','Monitor','SN-U2723-003','Dell','U2723QE 27\"','4K USB-C Hub','in_stock','HQ Store Room','2024-02-20','2027-02-20',18500.00,'PO-2024-008'),
      ('IT-0004','iPhone 15','Phone','SN-IP15-004','Apple','iPhone 15 128GB','128GB','under_repair','Service Center','2024-05-01','2025-05-01',29900.00,'PO-2024-030'),
      ('IT-0005','HP LaserJet Pro','Printer','SN-HPLJ-005','HP','LaserJet Pro M404','Mono Laser','in_stock','2nd Floor','2023-11-11','2025-11-11',8900.00,'PO-2023-120')`,
  )

  // Put asset IT-0002 on loan to Nida User (user id 3)
  await query("UPDATE assets SET assigned_to = 3 WHERE tag_id = 'IT-0002'")
  await query(
    `INSERT INTO assignments (asset_id, user_id, expected_return, status, checkout_by)
     SELECT id, 3, DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'checked_out', 2 FROM assets WHERE tag_id = 'IT-0002'`,
  )

  await query(
    `INSERT INTO software_licenses (software_name, license_key, vendor, total_seats, assigned_seats, purchase_date, expiration_date, price) VALUES
      ('Microsoft 365 Business','M365-XXXX-YYYY-ZZZZ','Microsoft',50,32,'2024-01-01','2025-12-31',180000.00),
      ('Adobe Creative Cloud','ADBE-1111-2222-3333','Adobe',10,8,'2024-02-01','2025-02-01',95000.00),
      ('Figma Organization','FIGMA-ORG-2024','Figma',25,20,'2024-01-15','2025-01-15',45000.00)`,
  )

  await query(
    `INSERT INTO maintenance_logs (asset_id, issue_detail, repair_cost, vendor, repair_date, status, reported_by)
     SELECT id, 'Screen flickering, sent for panel replacement', 3500.00, 'iCare Service Center', CURDATE(), 'in_progress', 2
       FROM assets WHERE tag_id = 'IT-0004'`,
  )
}
