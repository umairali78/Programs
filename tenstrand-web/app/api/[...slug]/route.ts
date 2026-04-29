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
import { InterestService } from '@/lib/services/interest.service'
import { BookmarkService } from '@/lib/services/bookmark.service'
import { ReviewService } from '@/lib/services/review.service'
import { LessonPlanService } from '@/lib/services/lesson-plan.service'
import { ProspectService } from '@/lib/services/prospect.service'
import { ensureDemoDataForHostedDemo } from '@/lib/demo-boot'
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
    if (channel !== 'admin:clearDemo') {
      await ensureDemoDataForHostedDemo()
    }
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
  const interestSvc = new InterestService()
  const bookmarkSvc = new BookmarkService()
  const reviewSvc = new ReviewService()
  const lessonPlanSvc = new LessonPlanService()
  const prospectSvc = new ProspectService()

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

    // ── Interests ─────────────────────────────────────────────────────────────
    case 'interest:express':
      return ok(await interestSvc.express(body.teacherId, body.programId, body.message))
    case 'interest:remove':
      await interestSvc.remove(body.teacherId, body.programId)
      return ok(null)
    case 'interest:listForTeacher':
      return ok(await interestSvc.listForTeacher(body.teacherId))
    case 'interest:listForProgram':
      return ok(await interestSvc.listForProgram(body.programId))
    case 'interest:getSet':
      return ok(await interestSvc.getInterestSet(body.teacherId))
    case 'interest:count':
      return ok(await interestSvc.countForTeacher(body.teacherId))

    // ── Bookmarks ─────────────────────────────────────────────────────────────
    case 'bookmark:add':
      await bookmarkSvc.add(body.teacherId, body.programId)
      return ok(null)
    case 'bookmark:remove':
      await bookmarkSvc.remove(body.teacherId, body.programId)
      return ok(null)
    case 'bookmark:listForTeacher':
      return ok(await bookmarkSvc.listForTeacher(body.teacherId))
    case 'bookmark:getSet':
      return ok(await bookmarkSvc.getSet(body.teacherId))
    case 'bookmark:countForProgram':
      return ok(await bookmarkSvc.countForProgram(body.programId))
    case 'bookmark:peerRecommendations':
      return ok(await bookmarkSvc.getPeerRecommendations(body.teacherId, body.limit ?? 5))

    // ── Reviews ───────────────────────────────────────────────────────────────
    case 'review:create':
      return ok(await reviewSvc.create(body.teacherId, body.programId, body.rating, body.text, body.visitedAt))
    case 'review:listForProgram':
      return ok(await reviewSvc.listForProgram(body.programId))
    case 'review:listForTeacher':
      return ok(await reviewSvc.listForTeacher(body.teacherId))
    case 'review:delete':
      await reviewSvc.delete(body.id)
      return ok(null)
    case 'review:avgRating':
      return ok(await reviewSvc.getAvgRating(body.programId))
    case 'review:spotlight':
      return ok(await reviewSvc.getSpotlightReview())
    case 'review:summarize':
      return ok(await claudeSvc.summarizeReviews(body.reviews))

    // ── Lesson Plans ──────────────────────────────────────────────────────────
    case 'lessonPlan:create':
      return ok(await lessonPlanSvc.create(body))
    case 'lessonPlan:list':
      return ok(await lessonPlanSvc.list(body.teacherId))
    case 'lessonPlan:get':
      return ok(await lessonPlanSvc.get(body.id))
    case 'lessonPlan:delete':
      await lessonPlanSvc.delete(body.id)
      return ok(null)
    case 'lessonPlan:generate':
      return ok(await claudeSvc.generateLessonPlan(body.teacherId, body.programId))

    // ── Prospects ─────────────────────────────────────────────────────────────
    case 'prospect:list':
      return ok(await prospectSvc.list())
    case 'prospect:get':
      return ok(await prospectSvc.get(body.id))
    case 'prospect:create':
      return ok(await prospectSvc.create(body))
    case 'prospect:update':
      await prospectSvc.update(body.id, body.updates ?? body)
      return ok(null)
    case 'prospect:delete':
      await prospectSvc.delete(body.id)
      return ok(null)
    case 'prospect:logOutreach':
      return ok(await prospectSvc.logOutreach(body.prospectId, body.subject, body.body))
    case 'prospect:listOutreach':
      return ok(await prospectSvc.listOutreachForProspect(body.prospectId))
    case 'prospect:generateOutreach':
      return ok(await claudeSvc.generateOutreachEmail(body.prospectId))
    case 'prospect:score':
      return ok(await claudeSvc.scoreProspect(body.prospectId))

    // ── Batch admin ───────────────────────────────────────────────────────────
    case 'admin:generateAllDigests':
      return ok(await claudeSvc.generateAllDigests())

    default:
      return err(`Unknown channel: ${channel}`, 404)
  }
}
