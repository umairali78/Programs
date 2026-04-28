import { pgTable, text, timestamp, integer, index } from 'drizzle-orm/pg-core'

export const reportBankDocuments = pgTable('report_bank_documents', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  uploadedById: text('uploaded_by_id').notNull(),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  fileSize: integer('file_size').notNull(),
  blobUrl: text('blob_url').notNull(),
  blobKey: text('blob_key').notNull(),
  tags: text('tags'),            // JSON string[]
  category: text('category'),   // 'regulatory', 'market', 'scientific', 'pricing', 'company'
  visibility: text('visibility').default('private').notNull(),
  processingStatus: text('processing_status').default('pending').notNull(),
  chunkCount: integer('chunk_count').default(0).notNull(),
  isDemo: integer('is_demo').default(0).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
})

// Chunks stored with raw SQL for vector column (pgvector)
// We define this table without the vector column here (added via migration SQL)
export const reportBankChunks = pgTable('report_bank_chunks', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  documentId: text('document_id').notNull().references(() => reportBankDocuments.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  chunkIndex: integer('chunk_index').notNull(),
  pageNumber: integer('page_number'),
  tokenCount: integer('token_count'),
  // embedding vector(3072) added via migration SQL
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (t) => [index('idx_chunks_document').on(t.documentId)])
