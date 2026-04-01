import type { GeneratedScript } from '@prisma/client'

export async function exportScriptAsPdf(script: GeneratedScript): Promise<Buffer> {
  const puppeteer = await import('puppeteer')
  const browser = await puppeteer.default.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const meta = script.generationMetadata as Record<string, unknown>

  try {
    const page = await browser.newPage()
    const html = buildPdfHtml(script.scriptText, {
      sloText: (meta.sloText as string) ?? '',
      grade: (meta.grade as number) ?? 0,
      subject: (meta.subject as string) ?? '',
      contentObjectType: script.contentObjectType,
      generationDate: new Date(script.createdAt).toLocaleDateString('en-PK'),
      reviewStatus: script.reviewStatus,
    })
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
      printBackground: true,
    })
    return Buffer.from(pdfBuffer)
  } finally {
    await browser.close()
  }
}

function buildPdfHtml(
  scriptText: string,
  meta: {
    sloText: string
    grade: number
    subject: string
    contentObjectType: string
    generationDate: string
    reviewStatus: string
  }
): string {
  // Convert basic Markdown to HTML (headings, bold, lists)
  const htmlContent = scriptText
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[h|u|l])(.+)$/gm, '<p>$1</p>')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    body { font-family: Inter, Arial, sans-serif; font-size: 12pt; color: #1a1a1a; line-height: 1.6; }
    .metadata { background: #f0f4f8; border-left: 4px solid #2563eb; padding: 12px 16px; margin-bottom: 24px; font-size: 10pt; }
    .metadata h4 { margin: 0 0 8px 0; color: #2563eb; font-size: 11pt; }
    .metadata table { border-collapse: collapse; }
    .metadata td { padding: 2px 12px 2px 0; }
    h1 { color: #1e3a8a; font-size: 18pt; margin-top: 24px; }
    h2 { color: #2563eb; font-size: 14pt; margin-top: 20px; border-bottom: 1px solid #dbeafe; padding-bottom: 4px; }
    h3 { color: #1d4ed8; font-size: 12pt; margin-top: 16px; }
    ul { padding-left: 20px; }
    li { margin-bottom: 4px; }
    p { margin: 8px 0; }
  </style>
</head>
<body>
  <div class="metadata">
    <h4>ContentCraft AI Engine — Export</h4>
    <table>
      <tr><td><strong>Content Type:</strong></td><td>${meta.contentObjectType}</td></tr>
      <tr><td><strong>SLO:</strong></td><td>${meta.sloText}</td></tr>
      <tr><td><strong>Grade / Subject:</strong></td><td>Grade ${meta.grade} — ${meta.subject}</td></tr>
      <tr><td><strong>Generated:</strong></td><td>${meta.generationDate}</td></tr>
      <tr><td><strong>Review Status:</strong></td><td>${meta.reviewStatus}</td></tr>
    </table>
  </div>
  ${htmlContent}
</body>
</html>`
}
