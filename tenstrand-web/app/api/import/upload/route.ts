import { NextRequest, NextResponse } from 'next/server'
import { CsvImportService } from '@/lib/services/csv-import.service'
import { ensureDatabaseInitialized } from '@/lib/init-db'

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseInitialized()
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const action = formData.get('action') as string

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const csvText = await file.text()
    const csvSvc = new CsvImportService()

    if (action === 'preview') {
      return NextResponse.json(csvSvc.parsePreview(csvText))
    }

    const entity = formData.get('entity') as string
    const columnMap = JSON.parse(formData.get('columnMap') as string ?? '{}')
    const result = await csvSvc.runImport(csvText, entity as any, columnMap)
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
