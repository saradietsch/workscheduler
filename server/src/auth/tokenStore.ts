import { eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { oauthTokens } from '../db/schema.js'

type Provider = 'google' | 'asana' | 'microsoft'

interface StoredTokens {
  accessToken: string
  refreshToken?: string
  expiresAt?: number
}

async function getTokens(provider: Provider): Promise<StoredTokens | null> {
  const [row] = await db.select().from(oauthTokens).where(eq(oauthTokens.provider, provider))
  if (!row) return null
  return {
    accessToken: row.accessToken,
    refreshToken: row.refreshToken ?? undefined,
    expiresAt: row.expiresAt?.getTime(),
  }
}

async function setTokens(provider: Provider, tokens: StoredTokens) {
  await db
    .insert(oauthTokens)
    .values({
      provider,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt ? new Date(tokens.expiresAt) : null,
    })
    .onConflictDoUpdate({
      target: oauthTokens.provider,
      set: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt ? new Date(tokens.expiresAt) : null,
      },
    })
}

export const tokenStore = {
  getGoogleTokens: () => getTokens('google'),
  setGoogleTokens: (tokens: StoredTokens) => setTokens('google', tokens),
  getAsanaTokens: () => getTokens('asana'),
  setAsanaTokens: (tokens: StoredTokens) => setTokens('asana', tokens),
  getMicrosoftTokens: () => getTokens('microsoft'),
  setMicrosoftTokens: (tokens: StoredTokens) => setTokens('microsoft', tokens),
}
