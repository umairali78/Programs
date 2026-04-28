import { pgTable, text, timestamp, boolean, integer, index } from 'drizzle-orm/pg-core'

export const queryHistory = pgTable('query_history', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull(),
  query: text('query').notNull(),
  response: text('response'),       // full JSON StructuredQueryResponse
  sources: text('sources'),         // JSON array
  confidence: text('confidence'),   // 'high' | 'medium' | 'low'
  apisUsed: text('apis_used'),      // JSON string[]
  processingMs: integer('processing_ms'),
  isSaved: boolean('is_saved').default(false).notNull(),
  savedName: text('saved_name'),
  shareToken: text('share_token').unique(),
  refreshSchedule: text('refresh_schedule').default('none'),
  nextRefreshAt: timestamp('next_refresh_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (t) => [index('idx_query_history_user').on(t.userId)])

export const savedSearches = pgTable('saved_searches', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  query: text('query').notNull(),
  description: text('description'),
  refreshSchedule: text('refresh_schedule').default('none').notNull(),
  lastRunAt: timestamp('last_run_at', { mode: 'date' }),
  lastResultId: text('last_result_id'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (t) => [index('idx_saved_searches_user').on(t.userId)])
