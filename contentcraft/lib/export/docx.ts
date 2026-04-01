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
  return `
=== ContentCraft AI Engine — Export Metadata ===
SLO: ${meta.sloText}
Grade: ${meta.grade}
Subject: ${meta.subject}
Curriculum: ${meta.curriculumContext}
Content Type: ${meta.contentObjectType}
Generated: ${meta.generationDate}
Template Version: ${meta.templateVersion ?? 'N/A'}
Standards Version: ${meta.standardsVersion ?? 'N/A'}
Review Status: ${meta.reviewStatus}
================================================

`
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
    // Use Docxtemplater to fill a Word template
    const zip = new PizZip(templateDocxBuffer)
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true })
    doc.render({ content: fullContent })
    return doc.getZip().generate({ type: 'nodebuffer' }) as Buffer
  }

  // Fallback: generate a minimal DOCX from scratch using simple XML
  return generateMinimalDocx(fullContent)
}

export async function exportBriefAsDocx(brief: ResearchBrief): Promise<Buffer> {
  const vocab = parseJsonField<{ term: string; definition: string; gradeAppropriateExample: string }[]>(brief.keyVocabulary, [])
  const examples = parseJsonField<string[]>(brief.pakistanExamples, [])
  const misconceptions = parseJsonField<string[]>(brief.commonMisconceptions, [])
  const prerequisites = parseJsonField<string[]>(brief.prerequisites, [])

  const content = `
ContentCraft AI Engine — Research Brief
========================================
SLO: ${brief.sloText}
Grade: ${brief.grade} | Subject: ${brief.subject} | Curriculum: ${brief.curriculumContext}
Bloom's Level: ${brief.bloomsLevel ?? 'N/A'}
Generated: ${new Date(brief.createdAt).toLocaleDateString('en-PK')}

CORE CONCEPT
${brief.coreConcept ?? ''}

PREREQUISITES
${prerequisites.map((p) => `• ${p}`).join('\n')}

KEY VOCABULARY (${vocab.length} terms)
${vocab.map((v) => `• ${v.term}: ${v.definition}\n  Example: ${v.gradeAppropriateExample}`).join('\n')}

PAKISTAN CONTEXT EXAMPLES
${examples.map((e) => `• ${e}`).join('\n')}

COMMON MISCONCEPTIONS
${misconceptions.map((m) => `• ${m}`).join('\n')}

PEDAGOGICAL NOTES
${brief.pedagogicalNotes ?? ''}

${brief.userNotes ? `DESIGNER NOTES\n${brief.userNotes}` : ''}
`.trim()

  return generateMinimalDocx(content)
}

function generateMinimalDocx(content: string): Buffer {
  // Minimal valid DOCX structure (flat OPC)
  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const paragraphs = escaped.split('\n').map(
    (line) => `<w:p><w:r><w:t xml:space="preserve">${line}</w:t></w:r></w:p>`
  ).join('\n')

  const wordXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
            xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${paragraphs}<w:sectPr/></w:body>
</w:document>`

  const zip = new PizZip()
  zip.file('word/document.xml', wordXml)
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`)
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`)
  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`)

  return zip.generate({ type: 'nodebuffer' }) as Buffer
}
