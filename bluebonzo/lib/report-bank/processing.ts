import { createHash } from 'crypto'

export const SUPPORTED_REPORT_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
  'text/markdown',
])

export const SUPPORTED_REPORT_EXTENSIONS = /\.(pdf|docx|xlsx|csv|txt|md|markdown)$/i

export interface ExtractedDocument {
  text: string
  pages?: number
}

export interface ReportChunk {
  content: string
  chunkIndex: number
  tokenCount: number
}

export function isSupportedReportFile(file: File): boolean {
  return SUPPORTED_REPORT_MIME_TYPES.has(file.type) || SUPPORTED_REPORT_EXTENSIONS.test(file.name)
}

export function getContentHash(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}

export async function extractReportText(file: File, buffer: Buffer): Promise<ExtractedDocument> {
  const lowerName = file.name.toLowerCase()

  if (file.type === 'application/pdf' || lowerName.endsWith('.pdf')) {
    const { PDFParse } = await import('pdf-parse')
    const parser = new PDFParse({ data: new Uint8Array(buffer) })
    try {
      const result = await parser.getText()
      return { text: normalizeText(result.text), pages: result.total }
    } finally {
      await parser.destroy()
    }
  }

  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || lowerName.endsWith('.docx')) {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return { text: normalizeText(result.value) }
  }

  if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || lowerName.endsWith('.xlsx')) {
    const xlsx = await import('xlsx')
    const workbook = xlsx.read(buffer, { type: 'buffer' })
    const sheets = workbook.SheetNames.map((sheetName) => {
      const sheet = workbook.Sheets[sheetName]
      const csv = xlsx.utils.sheet_to_csv(sheet)
      return `# ${sheetName}\n${csv}`
    })
    return { text: normalizeText(sheets.join('\n\n')) }
  }

  return { text: normalizeText(buffer.toString('utf8')) }
}

export function chunkReportText(text: string): ReportChunk[] {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  const chunks: ReportChunk[] = []
  let current: string[] = []
  let currentTokens = 0
  const targetTokens = 650
  const overlapTokens = 70

  function flush() {
    if (current.length === 0) return
    const content = current.join('\n\n').trim()
    if (!content) return
    chunks.push({
      content,
      chunkIndex: chunks.length,
      tokenCount: estimateTokens(content),
    })

    const words = content.split(/\s+/).filter(Boolean)
    const overlap = words.slice(Math.max(0, words.length - overlapTokens)).join(' ')
    current = overlap ? [overlap] : []
    currentTokens = estimateTokens(overlap)
  }

  for (const paragraph of paragraphs) {
    const tokens = estimateTokens(paragraph)
    if (tokens > targetTokens) {
      flush()
      const words = paragraph.split(/\s+/).filter(Boolean)
      for (let i = 0; i < words.length; i += targetTokens - overlapTokens) {
        const slice = words.slice(i, i + targetTokens).join(' ')
        if (slice) {
          chunks.push({
            content: slice,
            chunkIndex: chunks.length,
            tokenCount: estimateTokens(slice),
          })
        }
      }
      current = []
      currentTokens = 0
      continue
    }

    if (currentTokens + tokens > targetTokens) flush()
    current.push(paragraph)
    currentTokens += tokens
  }

  flush()
  return chunks.length > 0 ? chunks : [{
    content: text.slice(0, 4000),
    chunkIndex: 0,
    tokenCount: estimateTokens(text.slice(0, 4000)),
  }]
}

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length * 1.3))
}

export function inferReportCategory(filename: string, text: string): string {
  const haystack = `${filename} ${text.slice(0, 2000)}`.toLowerCase()
  if (haystack.match(/regulat|efsa|fda|codex|wto|arsenic|novel food/)) return 'regulatory'
  if (haystack.match(/price|pricing|fob|commodity|hydrocolloid/)) return 'pricing'
  if (haystack.match(/trade|export|import|hs code|comtrade/)) return 'trade'
  if (haystack.match(/pubmed|journal|study|research|clinical|abstract/)) return 'scientific'
  if (haystack.match(/market|forecast|cagr|outlook|analysis/)) return 'market'
  return 'company'
}

export function inferTags(filename: string, text: string): string[] {
  const haystack = `${filename} ${text.slice(0, 4000)}`.toLowerCase()
  const tags = [
    'carrageenan', 'agar', 'alginate', 'nori', 'kelp', 'kombu', 'wakame',
    'kappaphycus', 'eucheuma', 'gracilaria', 'gelidium', 'laminaria',
    'eu', 'fda', 'codex', 'wto', 'philippines', 'indonesia', 'china',
  ]
  return tags.filter((tag) => haystack.includes(tag)).slice(0, 8)
}

function normalizeText(text: string): string {
  return text
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
