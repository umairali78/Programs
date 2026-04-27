import { NextRequest, NextResponse } from 'next/server'
import { PartnerService } from '@/lib/services/partner.service'
import { ProgramService } from '@/lib/services/program.service'
import { TeacherService } from '@/lib/services/teacher.service'
import { MatchingService } from '@/lib/services/matching.service'
import { SettingsService } from '@/lib/services/settings.service'
import { AdminService } from '@/lib/services/admin.service'
import { SeedService } from '@/lib/services/seed.service'
import { ClaudeService } from '@/lib/services/claude.service'
import { CsvImportService } from '@/lib/services/csv-import.service'
import { InsightsService } from '@/lib/services/insights.service'
import { ensureDatabaseInitialized } from '@/lib/init-db'

function ok(data: any) {
  return NextResponse.json(data)
}

function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const channel = slug.join(':')
  let body: any = {}
  try {
    body = await req.json()
  } catch {}

  try {
    await ensureDatabaseInitialized()
    return await dispatch(channel, body)
  } catch (e: any) {
    console.error(`[API] ${channel}:`, e)
    return err(e.message || 'Internal server error', 500)
  }
}

async function dispatch(channel: string, body: any): Promise<NextResponse> {
  const partnerSvc = new PartnerService()
  const programSvc = new ProgramService()
  const teacherSvc = new TeacherService()
  const matchSvc = new MatchingService()
  const settingsSvc = new SettingsService()
  const adminSvc = new AdminService()
  const seedSvc = new SeedService()
  const claudeSvc = new ClaudeService()
  const csvSvc = new CsvImportService()
  const insightsSvc = new InsightsService()

  switch (channel) {
    // ── Partners ──────────────────────────────────────────────────────────────
    case 'partner:list':
      return ok(await partnerSvc.list(body.filters))
    case 'partner:get':
      return ok(await partnerSvc.get(body.id))
    case 'partner:listForMap':
      return ok(await partnerSvc.listForMap())
    case 'partner:create':
      return ok(await partnerSvc.create(body))
    case 'partner:update':
      await partnerSvc.update(body.id, body.updates ?? body)
      return ok(null)
    case 'partner:delete':
      await partnerSvc.delete(body.id)
      return ok(null)

    // ── Programs ──────────────────────────────────────────────────────────────
    case 'program:list':
      return ok(await programSvc.list(body.filters ?? (body.partnerId ? { partnerId: body.partnerId } : undefined)))
    case 'program:get':
      return ok(await programSvc.get(body.id))
    case 'program:create':
      return ok(await programSvc.create(body))
    case 'program:update':
      await programSvc.update(body.id, body.updates ?? body)
      return ok(null)
    case 'program:delete':
      await programSvc.delete(body.id)
      return ok(null)

    // ── Teachers ──────────────────────────────────────────────────────────────
    case 'teacher:list':
      return ok(await teacherSvc.list())
    case 'teacher:get':
      return ok(await teacherSvc.get(body.id))
    case 'teacher:getActive':
      return ok(await teacherSvc.getActive())
    case 'teacher:setActive':
      await teacherSvc.setActive(body.id)
      return ok(null)
    case 'teacher:create':
      return ok(await teacherSvc.create(body))
    case 'teacher:update':
      await teacherSvc.update(body.id, body.updates ?? body)
      return ok(null)

    // ── Matching ──────────────────────────────────────────────────────────────
    case 'match:listForTeacher':
      return ok(await matchSvc.listForTeacher(body.teacherId, body.radiusMiles ?? 20, body.filters))
    case 'match:score':
      return ok(await matchSvc.scoreOne(body.teacherId, body.programId))

    // ── Settings ──────────────────────────────────────────────────────────────
    case 'settings:getAll':
      return ok(await settingsSvc.getAll())
    case 'settings:get':
      return ok(await settingsSvc.get(body.key))
    case 'settings:set':
      await settingsSvc.set(body.key, body.value)
      return ok(null)
    case 'settings:setBulk':
      await settingsSvc.setBulk(body)
      return ok(null)

    // ── Admin ─────────────────────────────────────────────────────────────────
    case 'admin:dbStats':
      return ok(await adminSvc.getDbStats())
    case 'admin:vacuum':
      return ok(await adminSvc.vacuum())
    case 'admin:geocodingStatus':
      return ok(await adminSvc.getGeocodingStatus())
    case 'admin:isDemoLoaded':
      return ok(await seedSvc.isDemoLoaded())
    case 'admin:seedDemo':
      return ok(await seedSvc.loadDemo())
    case 'admin:clearDemo':
      await seedSvc.clearDemo()
      return ok(null)

    // ── CSV Import ────────────────────────────────────────────────────────────
    case 'import:parsePreview':
      return ok(csvSvc.parsePreview(body.csvText))
    case 'import:run':
      return ok(await csvSvc.runImport(body.csvText, body.entity, body.columnMap))
    case 'import:geocodingStatus':
      return ok(await adminSvc.getGeocodingStatus())

    // ── AI ────────────────────────────────────────────────────────────────────
    case 'ai:matchExplanation':
      return ok(await claudeSvc.generateMatchExplanation(body.teacherId, body.programId))
    case 'ai:copilotTurn':
      return ok(await claudeSvc.runCopilotTurn(body.teacherId, body.history, body.message))
    case 'ai:generateDigest':
      return ok(await claudeSvc.generateDigest(body.teacherId))
    case 'ai:rewriteProfile':
      return ok(await claudeSvc.rewritePartnerProfile(body.programId))
    case 'ai:suggestStandards':
      return ok(await claudeSvc.suggestStandards(body.programId))
    case 'ai:extractFromBrochure':
      return ok(await claudeSvc.extractFromBrochure(body.text))

    // ── Insights ──────────────────────────────────────────────────────────────
    case 'insights:overview':
      return ok(await insightsSvc.getOverview())
    case 'insights:programsBySubject':
      return ok(await insightsSvc.getProgramsBySubject())
    case 'insights:programsByGrade':
      return ok(await insightsSvc.getProgramsByGrade())
    case 'insights:partnerTypes':
      return ok(await insightsSvc.getPartnerTypeBreakdown())
    case 'insights:programsForMap':
      return ok(await insightsSvc.getProgramsForMap())
    case 'insights:schoolsForMap':
      return ok(await insightsSvc.getSchoolsForMap())
    case 'insights:teachersWithSchool':
      return ok(await insightsSvc.getTeachersWithSchool())
    case 'insights:nearbyTeachers':
      return ok(await insightsSvc.getNearbyTeachersForProgram(body.programId, body.radiusMiles ?? 30))
    case 'insights:nearbySchools':
      return ok(await insightsSvc.getNearbySchoolsForProgram(body.programId, body.radiusMiles ?? 30))
    case 'insights:topPrograms':
      return ok(await insightsSvc.getTopPrograms(body.limit ?? 5))
    case 'insights:countyCoverage':
      return ok(await insightsSvc.getCountyCoverage())
    case 'insights:districtAnalytics':
      return ok(await insightsSvc.getDistrictAnalytics())
    case 'insights:teacherOpportunity':
      return ok(await insightsSvc.getTeacherOpportunitySummary(body.teacherId, body.radiusMiles ?? 30))

    default:
      return err(`Unknown channel: ${channel}`, 404)
  }
}
