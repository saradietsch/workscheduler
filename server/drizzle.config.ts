import { defineConfig } from 'drizzle-kit'

try {
  process.loadEnvFile()
} catch {
  // no .env file present
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
