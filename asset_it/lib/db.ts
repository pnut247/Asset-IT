import mysql from "mysql2/promise"

declare global {
  // eslint-disable-next-line no-var
  var __mysqlPool: mysql.Pool | undefined
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL)
}

export function getPool(): mysql.Pool {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    throw new Error("DATABASE_URL is not set. Add your MySQL connection string in Project Settings > Vars.")
  }

  if (!global.__mysqlPool) {
    // เช็คว่าเป็นการต่อแบบ Local หรือไม่
    const isLocal = dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1")

    global.__mysqlPool = mysql.createPool({
      uri: dbUrl,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      namedPlaceholders: true,
      timezone: "Z",
      // เปิด SSL เฉพาะ Cloud / Aiven (ถ้า Local ให้เป็น undefined)
      ssl: isLocal ? undefined : { rejectUnauthorized: false },
    })
  }
  return global.__mysqlPool
}

export async function query<T = any>(sql: string, params?: any[] | Record<string, any>): Promise<T[]> {
  const pool = getPool()
  const [rows] = await pool.query(sql, params)
  return rows as T[]
}

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