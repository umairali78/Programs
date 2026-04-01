import archiver from 'archiver'
import { Readable, PassThrough } from 'stream'
import type { GeneratedScript } from '@prisma/client'
import { exportScriptAsDocx } from './docx'

export async function exportRunAsZip(
  scripts: GeneratedScript[],
  runMetadata: { sloText: string; grade: number; subject: string }
): Promise<Buffer> {
  const archive = archiver('zip', { zlib: { level: 6 } })
  const chunks: Buffer[] = []

  await new Promise<void>((resolve, reject) => {
    archive.on('data', (chunk: Buffer) => chunks.push(chunk))
    archive.on('end', resolve)
    archive.on('error', reject)

    const processScripts = async () => {
      for (const script of scripts) {
        const docxBuffer = await exportScriptAsDocx(script)
        const fileName = `${script.contentObjectType}_v${script.version}.docx`
        archive.append(docxBuffer, { name: fileName })
      }
      archive.finalize()
    }

    processScripts().catch(reject)
  })

  return Buffer.concat(chunks)
}
