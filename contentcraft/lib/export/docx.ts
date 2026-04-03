import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import type { GeneratedScript, ResearchBrief } from '@prisma/client'
import { parseJsonField } from '@/lib/utils/json'

interface ExportMetadata {
  sloText: string
  grade: number
  subject: string
  curriculumContext: string
  generationDate: string
  templateVersion: string | number | null
  standardsVersion: string | number | null
  reviewStatus: string
  contentObjectType: string
}

function getMetadataBlock(meta: ExportMetadata): string {
  return [
    '## ContentCraft Export Metadata',
    '',
    `**SLO:** ${meta.sloText}`,
    `**Grade:** ${meta.grade}  ·  **Subject:** ${meta.subject}  ·  **Content Type:** ${meta.contentObjectType}`,
    `**Generated:** ${meta.generationDate}  ·  **Template:** ${meta.templateVersion ?? 'N/A'}  ·  **Standards:** ${meta.standardsVersion ?? 'N/A'}`,
    `**Review Status:** ${meta.reviewStatus}`,
    '',
    '---',
    '',
  ].join('\n')
}

export async function exportScriptAsDocx(
  script: GeneratedScript,
  templateDocxBuffer?: Buffer
): Promise<Buffer> {
  const meta = parseJsonField<Record<string, unknown>>(script.generationMetadata, {})

  const metadataBlock = getMetadataBlock({
    sloText: (meta.sloText as string) ?? '',
    grade: (meta.grade as number) ?? 0,
    subject: (meta.subject as string) ?? '',
    curriculumContext: (meta.curriculumContext as string) ?? '',
    generationDate: new Date(script.createdAt).toLocaleDateString('en-PK'),
    templateVersion: meta.templateVersion as string | null,
    standardsVersion: meta.standardsVersion as string | null,
    reviewStatus: script.reviewStatus,
    contentObjectType: script.contentObjectType,
  })

  const fullContent = metadataBlock + script.scriptText

  if (templateDocxBuffer) {
    const zip = new PizZip(templateDocxBuffer)
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true })
    doc.render({ content: fullContent })
    return doc.getZip().generate({ type: 'nodebuffer' }) as Buffer
  }

  return generateMinimalDocx(fullContent)
}

export async function exportBriefAsDocx(brief: ResearchBrief): Promise<Buffer> {
  const vocab = parseJsonField<{ term: string; definition: string; gradeAppropriateExample: string }[]>(brief.keyVocabulary, [])
  const examples = parseJsonField<string[]>(brief.pakistanExamples, [])
  const misconceptions = parseJsonField<string[]>(brief.commonMisconceptions, [])
  const prerequisites = parseJsonField<string[]>(brief.prerequisites, [])

  const content = [
    '# ContentCraft AI Engine — Research Brief',
    '',
    `**SLO:** ${brief.sloText}`,
    `**Grade:** ${brief.grade}  ·  **Subject:** ${brief.subject}  ·  **Curriculum:** ${brief.curriculumContext}`,
    `**Bloom's Level:** ${brief.bloomsLevel ?? 'N/A'}  ·  **Generated:** ${new Date(brief.createdAt).toLocaleDateString('en-PK')}`,
    '',
    '---',
    '',
    '## Core Concept',
    '',
    brief.coreConcept ?? '',
    '',
    '## Prerequisites',
    '',
    ...prerequisites.map((p) => `- ${p}`),
    '',
    `## Key Vocabulary (${vocab.length} terms)`,
    '',
    ...vocab.flatMap((v) => [`**${v.term}:** ${v.definition}`, `- *Example: ${v.gradeAppropriateExample}*`, '']),
    '## Pakistan Context Examples',
    '',
    ...examples.map((e) => `- ${e}`),
    '',
    '## Common Misconceptions',
    '',
    ...misconceptions.map((m) => `- ${m}`),
    '',
    '## Pedagogical Notes',
    '',
    brief.pedagogicalNotes ?? '',
    '',
    ...(brief.userNotes ? ['## Designer Notes', '', brief.userNotes] : []),
  ].join('\n').trim()

  return generateMinimalDocx(content)
}

// ─── XML helpers ──────────────────────────────────────────────────────────────

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const run = (t: string) => `<w:r><w:t xml:space="preserve">${t}</w:t></w:r>`
const boldRun = (t: string) => `<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${t}</w:t></w:r>`
const italicRun = (t: string) => `<w:r><w:rPr><w:i/></w:rPr><w:t xml:space="preserve">${t}</w:t></w:r>`

/** Parse inline markdown (bold, italic) into Word XML runs */
function inlineRuns(text: string): string {
  const parts: string[] = []
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g
  let i = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > i) parts.push(run(escapeXml(text.slice(i, m.index))))
    if (m[1] !== undefined) parts.push(boldRun(escapeXml(m[1])))
    else if (m[2] !== undefined) parts.push(italicRun(escapeXml(m[2])))
    i = m.index + m[0].length
  }
  if (i < text.length) parts.push(run(escapeXml(text.slice(i))))
  return parts.join('')
}

/** Create a styled paragraph */
function para(styleId: string, text: string, extraPPr = ''): string {
  return `<w:p><w:pPr><w:pStyle w:val="${styleId}"/>${extraPPr}</w:pPr>${inlineRuns(text)}</w:p>`
}

/** Bullet paragraph with proper hanging indent and bullet character */
function bulletPara(text: string): string {
  return `<w:p><w:pPr><w:pStyle w:val="ListBullet"/><w:ind w:left="720" w:hanging="360"/></w:pPr><w:r><w:t xml:space="preserve">• </w:t></w:r>${inlineRuns(text)}</w:p>`
}

/** Horizontal rule */
const HR = `<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="D1D5DB"/></w:pBdr><w:spacing w:before="120" w:after="120"/></w:pPr></w:p>`

/** Parse a markdown table (array of rows) into Word table XML */
function tableXml(rows: string[][]): string {
  const colCount = Math.max(...rows.map((r) => r.length))
  const colWidth = Math.floor(9360 / colCount)
  const borderAttr = 'w:val="single" w:sz="4" w:space="0" w:color="E5E7EB"'
  const borders = `<w:tblBorders><w:top ${borderAttr}/><w:left ${borderAttr}/><w:bottom ${borderAttr}/><w:right ${borderAttr}/><w:insideH ${borderAttr}/><w:insideV ${borderAttr}/></w:tblBorders>`

  const rowXmls = rows.map((cells, rowIdx) => {
    const isHeader = rowIdx === 0
    const tcXmls = cells.map((cell) => {
      const fill = isHeader ? '<w:shd w:val="clear" w:color="auto" w:fill="EFF6FF"/>' : ''
      const content = isHeader ? boldRun(escapeXml(cell.trim())) : inlineRuns(cell.trim())
      return `<w:tc><w:tcPr><w:tcW w:w="${colWidth}" w:type="dxa"/>${fill}</w:tcPr><w:p>${content}</w:p></w:tc>`
    })
    const trPr = isHeader ? '<w:trPr><w:tblHeader/></w:trPr>' : ''
    return `<w:tr>${trPr}${tcXmls.join('')}</w:tr>`
  })

  return `<w:tbl><w:tblPr><w:tblW w:w="9360" w:type="dxa"/>${borders}</w:tblPr>${rowXmls.join('')}</w:tbl>`
}

/** Convert markdown to an array of Word paragraph/table XML strings */
function markdownToWordXml(markdown: string): string[] {
  const lines = markdown.split('\n')
  const result: string[] = []
  let tableRows: string[][] = []

  const flushTable = () => {
    if (tableRows.length > 0) {
      result.push(tableXml(tableRows))
      tableRows = []
    }
  }

  for (const line of lines) {
    const trimmed = line.trim()

    // Table row detection
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      if (/^\|[\s\-:|]+\|$/.test(trimmed)) continue  // separator row
      tableRows.push(trimmed.slice(1, -1).split('|'))
      continue
    }
    flushTable()

    if (line.startsWith('#### '))       result.push(para('Heading4', line.slice(5)))
    else if (line.startsWith('### '))   result.push(para('Heading3', line.slice(4)))
    else if (line.startsWith('## '))    result.push(para('Heading2', line.slice(3)))
    else if (line.startsWith('# '))     result.push(para('Heading1', line.slice(2)))
    else if (/^---+$/.test(trimmed) || /^===+$/.test(trimmed)) result.push(HR)
    else if (/^[-•*]\s/.test(line))    result.push(bulletPara(line.replace(/^[-•*]\s/, '')))
    else if (/^\d+\.\s/.test(line))    result.push(bulletPara(line.replace(/^\d+\.\s+/, '')))
    else if (trimmed === '')            result.push('<w:p><w:pPr><w:spacing w:after="80"/></w:pPr></w:p>')
    else                                result.push(para('Normal', line))
  }

  flushTable()
  return result
}

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault><w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
      <w:sz w:val="24"/><w:szCs w:val="24"/>
    </w:rPr></w:rPrDefault>
    <w:pPrDefault><w:pPr>
      <w:spacing w:after="160" w:line="276" w:lineRule="auto"/>
    </w:pPr></w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:before="480" w:after="120"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="40"/><w:szCs w:val="40"/><w:color w:val="1E3A8A"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr>
      <w:spacing w:before="320" w:after="80"/>
      <w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="DBEAFE"/></w:pBdr>
    </w:pPr>
    <w:rPr><w:b/><w:sz w:val="32"/><w:szCs w:val="32"/><w:color w:val="2563EB"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:before="240" w:after="60"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="28"/><w:szCs w:val="28"/><w:color w:val="1D4ED8"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading4">
    <w:name w:val="heading 4"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:before="160" w:after="40"/></w:pPr>
    <w:rPr><w:b/><w:i/><w:sz w:val="26"/><w:szCs w:val="26"/><w:color w:val="374151"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="ListBullet">
    <w:name w:val="List Bullet"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:before="40" w:after="40"/></w:pPr>
  </w:style>
</w:styles>`

function generateMinimalDocx(content: string): Buffer {
  const bodyElements = markdownToWordXml(content)

  const wordXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${bodyElements.join('\n    ')}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`

  const zip = new PizZip()
  zip.file('word/document.xml', wordXml)
  zip.file('word/styles.xml', STYLES_XML)
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`)
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`)
  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`)

  return zip.generate({ type: 'nodebuffer' }) as Buffer
}
