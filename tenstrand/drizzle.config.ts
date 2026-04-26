import type { Config } from 'drizzle-kit'

export default {
  schema: './src/main/db/schema/index.ts',
  out: './src/main/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './dev.db'
  }
} satisfies Config
