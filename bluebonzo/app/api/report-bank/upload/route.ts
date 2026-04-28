import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { put } from '@vercel/blob'
import { authOptions } from '@/lib/auth'
import { isDbAvailable } from '@/lib/db/client'
import {
  chunkReportText,
  extractReportText,
  getContentHash,
  inferReportCategory,
  inferTags,
  isSupportedReportFile,
} from '@/lib/report-bank/processing'
import { openai } from '@/lib/openai'

export const maxDuration = 60

const MAX_FILE_SIZE = 50 * 1024 * 1024

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 })
  }

  if (!isSupportedReportFile(file)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File exceeds 50 MB limit' }, { status: 413 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const contentHash = getContentHash(buffer)
  const extracted = await extractReportText(file, buffer)
  if (!extracted.text) {
    return NextResponse.json({ error: 'No extractable text found' }, { status: 422 })
  }

  const chunks = chunkReportText(extracted.text)
  const category = String(formData.get('category') ?? inferReportCategory(file.name, extracted.text))
  const suppliedTags = String(formData.get('tags') ?? '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
  const tags = suppliedTags.length > 0 ? suppliedTags : inferTags(file.name, extracted.text)

  let blobUrl = `local://report-bank/${contentHash}/${file.name}`
  let blobKey = `${contentHash}/${file.name}`

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-')
    const blob = await put(`report-bank/${session.user.id}/${Date.now()}-${safeName}`, buffer, {
      access: 'private',
      contentType: file.type || 'application/octet-stream',
    })
    blobUrl = blob.url
    blobKey = blob.pathname
  }

  const embeddingStatus = await warmEmbeddings(chunks.map((chunk) => chunk.content))

  if (!isDbAvailable()) {
    return NextResponse.json({
      id: `demo-doc-${Date.now()}`,
      name: file.name,
      pages: extracted.pages,
      chunkCount: chunks.length,
      category,
      tags,
      embeddingStatus,
      processingStatus: 'ready',
    })
  }

  try {
    const { db } = await import('@/lib/db/client')
    const { reportBankDocuments, reportBankChunks } = await import('@/lib/db/schema')

    const [document] = await db!.insert(reportBankDocuments).values({
      uploadedById: session.user.id,
      filename: `${contentHash}-${file.name}`,
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      fileSize: file.size,
      blobUrl,
      blobKey,
      tags: JSON.stringify(tags),
      category,
      visibility: String(formData.get('visibility') ?? 'private'),
      processingStatus: 'ready',
      chunkCount: chunks.length,
      isDemo: 0,
    }).returning({ id: reportBankDocuments.id })

    if (chunks.length > 0) {
      await db!.insert(reportBankChunks).values(chunks.map((chunk) => ({
        documentId: document.id,
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
        tokenCount: chunk.tokenCount,
      })))
    }

    return NextResponse.json({
      id: document.id,
      name: file.name,
      pages: extracted.pages,
      chunkCount: chunks.length,
      category,
      tags,
      embeddingStatus,
      processingStatus: 'ready',
    })
  } catch (err) {
    console.error('[report-bank/upload] failed:', err)
    return NextResponse.json({ error: 'Failed to persist report' }, { status: 500 })
  }
}

async function warmEmbeddings(texts: string[]): Promise<'generated' | 'skipped'> {
  if (!openai || texts.length === 0) return 'skipped'

  try {
    await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: texts.slice(0, 20),
    })
    return 'generated'
  } catch (err) {
    console.warn('[report-bank/upload] embedding generation skipped:', err)
    return 'skipped'
  }
}
