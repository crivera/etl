import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import { env } from '@/env'
import * as schema from './schema'

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined
}

const conn =
  globalForDb.conn ??
  postgres(env.DATABASE_URL, {
    prepare: false,
    // ssl: {
    //   rejectUnauthorized: false,
    // },
    // max: 20,
    // idle_timeout: 10, // Idle connection timeout in seconds
    // max_lifetime: 60 * 60, // Maximum lifetime of a connection in seconds,
  })
if (env.NODE_ENV !== 'production') globalForDb.conn = conn

export const db = drizzle(conn, { schema })

// function parsePostgresUrl(url: string) {
//   const regex =
//     /^postgres(?:ql)?:\/\/(?<user>[^:]+):(?<password>[^@]+)@(?<host>[^:/]+)(?::(?<port>\d+))?\/(?<database>[^?]+)(?:\?sslmode=(?<sslmode>\w+))?$/
//   const match = url.match(regex)

//   if (!match || !match.groups) {
//     throw new Error('Invalid PostgreSQL connection string')
//   }

//   return {
//     user: match.groups.user,
//     password: match.groups.password,
//     host: match.groups.host,
//     port: match.groups.port ? Number.parseInt(match.groups.port, 10) : 5432, // Default to 5432 if port is not provided
//     database: match.groups.database,
//     ssl: match.groups.sslmode === 'require', // Converts "sslmode=require" to ssl: true
//   }
// }
