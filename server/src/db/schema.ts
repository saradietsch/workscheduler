import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core'

export const oauthTokens = pgTable('oauth_tokens', {
  provider: text('provider').primaryKey(), // 'google' | 'asana'
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at'),
})

export const taskEstimates = pgTable('task_estimates', {
  asanaTaskId: text('asana_task_id').primaryKey(),
  estimatedMinutes: integer('estimated_minutes').notNull(),
  source: text('source').notNull(), // 'ai' | 'manual'
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const suggestedBlocks = pgTable('suggested_blocks', {
  id: text('id').primaryKey(),
  asanaTaskId: text('asana_task_id').notNull(),
  start: timestamp('start').notNull(),
  end: timestamp('end').notNull(),
  status: text('status').notNull(), // 'suggested' | 'accepted' | 'dismissed'
  googleEventId: text('google_event_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
