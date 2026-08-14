import mysql from "mysql2/promise"

// A single pooled connection reused across hot reloads / serverless invocations.
declare global {
  // eslint-disable-next-line no-var
  var __mysqlPool: mysql.Pool | undefined
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL)
}

export function getPool(): mysql.Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Add your MySQL connection string in Project Settings > Vars.")
  }

  if (!global.__mysqlPool) {
    global.__mysqlPool = mysql.createPool({
      uri: process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      namedPlaceholders: true,
      timezone: "Z",
      // 🟢 เพิ่มรองรับ SSL สำหรับ Aiven บน Vercel
      ssl: {
        rejectUnauthorized: false,
      },
    })
  }
  return global.__mysqlPool
}

/**
 * Run a parameterized query. Always use `?` placeholders (or :named with an object)
 * to prevent SQL injection.
 */
export async function query<T = any>(sql: string, params?: any[] | Record<string, any>): Promise<T[]> {
  const pool = getPool()
  const [rows] = await pool.query(sql, params)
  return rows as T[]
}

/**
 * Run work inside a transaction. The callback receives a dedicated connection.
 * The transaction is committed on success and rolled back on any thrown error.
 */
export async function withTransaction<T>(fn: (conn: mysql.PoolConnection) => Promise<T>): Promise<T> {
  const pool = getPool()
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const result = await fn(conn)
    await conn.commit()
    return result
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}