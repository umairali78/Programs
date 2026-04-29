import Anthropic from '@anthropic-ai/sdk'
import { SettingsService } from './settings.service'
import { TeacherService } from './teacher.service'
import { ProgramService } from './program.service'
import { MatchingService } from './matching.service'
import { getRawClient } from '../db'

const MODEL = 'claude-sonnet-4-6'
const OPENAI_DEFAULT_MODEL = 'gpt-4o-mini'

const NGSS_EP_CONTEXT = `
California Science Standards Referenced:
- NGSS Life Science (LS1-LS4): Ecosystems, heredity, biological evolution, natural selection
- NGSS Earth Science (ESS1-ESS3): Earth's systems, Earth and human activity
- NGSS Engineering Design (ETS1)
- EP&C Principle I: Species, ecosystems, and ecological processes are interconnected
- EP&C Principle II: Goods and services vital to well-being are derived from natural world
- EP&C Principle III: Natural systems change over time driven by internal and external factors
- EP&C Principle IV: Decisions affect resources in other places and times
- EP&C Principle V: Humans can affect nature; individuals and societies make choices about this
`.trim()

export interface CopilotMessage {
  role: 'user' | 'assistant'
  content: string
}

export class ClaudeService {
  private settingsSvc = new SettingsService()
  private teacherSvc = new TeacherService()
  private programSvc = new ProgramService()
  private matchingSvc = new MatchingService()

  private async getClient(): Promise<Anthropic | null> {
    const apiKey = process.env.ANTHROPIC_API_KEY || (await this.settingsSvc.get('claude_api_key'))
    if (!apiKey) return null
    return new Anthropic({ apiKey })
  }

  private async completeText(systemPrompt: string | null, userPrompt: string, maxTokens: number): Promise<string | null> {
    const provider = await this.settingsSvc.get('ai_provider')
    if (provider === 'openai') {
      const apiKey = process.env.OPENAI_API_KEY || (await this.settingsSvc.get('openai_api_key'))
      if (!apiKey) return null
      const model = (await this.settingsSvc.get('openai_model')) || OPENAI_DEFAULT_MODEL
      const messages = [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: userPrompt },
      ]
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
      })
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new Error(body || `OpenAI request failed with ${res.status}`)
      }
      const json = await res.json()
      return json.choices?.[0]?.message?.content ?? null
    }

    const client = await this.getClient()
    if (!client) return null
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages: [{ role: 'user', content: userPrompt }]
    })
    const text = msg.content[0]
    return text.type === 'text' ? text.text : null
  }

  async generateMatchExplanation(teacherId: string, programId: string): Promise<string | null> {
    const teacher = await this.teacherSvc.get(teacherId)
    const program = await this.programSvc.get(programId)
    if (!teacher || !program) return null

    const score = await this.matchingSvc.scoreOne(teacherId, programId)
    const gradeLevels = this.parseJson(teacher.gradeLevels)
    const subjects = this.parseJson(teacher.subjects)

    try {
      return await this.completeText(
        'You are a helpful assistant for Ten Strands Climate Learning Exchange, connecting K-12 teachers with outdoor environmental education programs in California.',
        `Write a 1-2 sentence explanation of why this program matches this teacher. Be specific and enthusiastic.\n\nTeacher profile:\n- Grade levels: ${gradeLevels.join(', ') || 'Not specified'}\n- Subjects: ${subjects.join(', ') || 'Not specified'}\n\nProgram:\n- Title: ${program.title}\n- Description: ${program.description || 'No description'}\n- Match score: ${Math.round(score * 100)}%\n\nWrite only the explanation, no preamble.`,
        200
      )
    } catch { return null }
  }

  async runCopilotTurn(teacherId: string, history: CopilotMessage[], userMessage: string): Promise<string> {
    const teacher = await this.teacherSvc.get(teacherId)
    const nearbyPrograms = teacher?.lat && teacher?.lng
      ? await this.matchingSvc.listForTeacher(teacherId, 20)
      : []

    const programSummary = nearbyPrograms.slice(0, 20)
      .map((p) => `- "${p.title}" by ${p.partnerName} (${p.distanceMiles}mi, ${p.gradeLevels.join('/')}, $${p.cost})`)
      .join('\n')

    const systemPrompt = `You are an AI assistant for the Ten Strands Climate Learning Exchange, helping K-12 teachers in California find outdoor environmental education programs.\n\nTeacher profile:\n- Grade levels: ${this.parseJson(teacher?.gradeLevels).join(', ') || 'Not set'}\n- Subjects: ${this.parseJson(teacher?.subjects).join(', ') || 'Not set'}\n- Zip: ${teacher?.zip || 'Not set'}\n\nNearby programs (within 20 miles):\n${programSummary || 'No programs found nearby'}\n\nYou can answer questions about programs, help plan field trips, suggest curriculum connections, and generate pre-visit lesson plan outlines. Be friendly and practical.`

    try {
      const transcript = history.map((m) => `${m.role === 'user' ? 'Teacher' : 'Assistant'}: ${m.content}`).join('\n')
      const text = await this.completeText(systemPrompt, `${transcript ? `${transcript}\n\n` : ''}Teacher: ${userMessage}`, 800)
      return text ?? 'AI is unavailable. Please add your Claude or OpenAI API key in Settings.'
    } catch (err: any) {
      return `Error communicating with AI: ${err.message}`
    }
  }

  async generateDigest(teacherId: string): Promise<string | null> {
    const teacher = await this.teacherSvc.get(teacherId)
    if (!teacher) return null

    const matches = await this.matchingSvc.listForTeacher(teacherId, 30)
    const topPrograms = matches.slice(0, 8)

    const programList = topPrograms.map((p, i) =>
      `${i + 1}. ${p.title} by ${p.partnerName} — ${p.distanceMiles}mi away, ${p.gradeLevels.join('/')}, Cost: $${p.cost || 0}`
    ).join('\n')

    try {
      return await this.completeText(
        'You are a copywriter for Ten Strands Climate Learning Exchange. Write personalized teacher digests in HTML format (no full page, just inner content). Use warm, encouraging language.',
        `Generate a "Your Outdoor Classroom" monthly digest email for this teacher.\n\nTeacher profile:\n- Grade levels: ${this.parseJson(teacher.gradeLevels).join(', ') || 'Not specified'}\n- Subjects: ${this.parseJson(teacher.subjects).join(', ') || 'Not specified'}\n\nTop nearby programs:\n${programList || 'No nearby programs found'}\n\nFormat as HTML with sections: 1. Personalized greeting 2. New nearby programs highlight (top 3) 3. Seasonal spotlight 4. Quick curriculum connection tip 5. Call to action\n\nUse inline styles for email compatibility. Keep it concise and actionable.`,
        1500
      )
    } catch { return null }
  }

  async rewritePartnerProfile(programId: string): Promise<string | null> {
    const program = await this.programSvc.get(programId)
    if (!program) return null

    try {
      return await this.completeText(null, `You are an outdoor education copywriter. Rewrite this program description for a teacher audience. Make it engaging, specific about learning outcomes, and highlight curriculum connections. Aim for ~150 words.\n\nOriginal description:\n${program.description || 'No description provided'}\n\nProgram title: ${program.title}\nGrade levels: ${this.parseJson(program.gradeLevels).join(', ')}\nSubjects: ${this.parseJson(program.subjects).join(', ')}\n\nWrite only the new description, no preamble.`, 400)
    } catch { return null }
  }

  async suggestStandards(programId: string): Promise<{ code: string; desc: string; framework: string }[] | null> {
    const program = await this.programSvc.get(programId)
    if (!program) return null

    try {
      const text = await this.completeText(NGSS_EP_CONTEXT, `Based on this program, suggest 3-5 California science standards (NGSS and/or EP&Cs) that best apply.\n\nProgram: ${program.title}\nDescription: ${program.description || 'No description'}\nGrade levels: ${this.parseJson(program.gradeLevels).join(', ')}\nSubjects: ${this.parseJson(program.subjects).join(', ')}\n\nRespond with a JSON array only, no other text:\n[{"code": "LS1-1", "desc": "Short description of standard", "framework": "NGSS"}, ...]`, 500)
      if (!text) return null
      const raw = text.trim()
      const jsonStr = raw.startsWith('[') ? raw : raw.slice(raw.indexOf('['))
      return JSON.parse(jsonStr)
    } catch { return null }
  }

  async extractFromBrochure(text: string): Promise<{ title?: string; description?: string; gradeLevels?: string[]; subjects?: string[]; cost?: number } | null> {
    try {
      const responseText = await this.completeText(null, `Extract program information from this text. Return JSON only, no other text.\n\nText:\n${text}\n\nReturn this exact JSON structure (use null for missing fields):\n{\n  "title": "Program name",\n  "description": "Program description",\n  "gradeLevels": ["K", "1", "2"],\n  "subjects": ["Life Science", "Earth Science"],\n  "cost": 5.00\n}\n\nGrade levels should be from: TK, K, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12\nSubjects should be from: Life Science, Earth Science, Agriculture, Water, Biodiversity, Climate Justice, Indigenous Ecological Knowledge`, 600)
      if (!responseText) return null
      const raw = responseText.trim()
      const jsonStr = raw.startsWith('{') ? raw : raw.slice(raw.indexOf('{'))
      return JSON.parse(jsonStr)
    } catch { return null }
  }

  async generateLessonPlan(teacherId: string, programId: string): Promise<string | null> {
    const teacher = await this.teacherSvc.get(teacherId)
    const program = await this.programSvc.get(programId)
    if (!teacher || !program) return null

    const grades = this.parseJson(teacher.gradeLevels)
    const subjects = this.parseJson(teacher.subjects)

    try {
      return await this.completeText(
        `You are an experienced California K-12 educator. Generate structured pre-visit lesson plans that connect outdoor programs to classroom curricula. Use California NGSS and EP&C standards.`,
        `Generate a pre-visit lesson plan for this outdoor program visit.\n\nTeacher:\n- Grade levels: ${grades.join(', ') || 'Not specified'}\n- Subjects: ${subjects.join(', ') || 'Not specified'}\n\nProgram:\n- Title: ${program.title}\n- Partner: ${(program as any).partnerName || ''}\n- Description: ${program.description || 'No description'}\n- Grade levels: ${this.parseJson(program.gradeLevels).join(', ')}\n- Subjects: ${this.parseJson(program.subjects).join(', ')}\n\nFormat the lesson plan with these sections:\n## Learning Objectives\n## Background Knowledge\n## Pre-Visit Activities (2-3 activities)\n## Vocabulary\n## Standards Connections (NGSS/EP&Cs)\n## Discussion Questions\n\nMake it practical and ready to use. About 400 words.`,
        1200
      )
    } catch { return null }
  }

  async generateOutreachEmail(prospectId: string): Promise<{ subject: string; body: string } | null> {
    const client = getRawClient()
    const prospectResult = await client.execute({
      sql: `SELECT pp.*,
              (SELECT COUNT(*) FROM schools s WHERE s.county = pp.county) as nearby_schools,
              (SELECT COUNT(*) FROM programs p JOIN partners pt ON pt.id = p.partner_id WHERE pt.county = pp.county) as existing_programs
            FROM partner_prospects pp WHERE pp.id = ?`,
      args: [prospectId],
    })
    const prospect = prospectResult.rows[0] as any
    if (!prospect) return null

    try {
      const text = await this.completeText(
        `You are a partnership outreach specialist for Ten Strands, California's outdoor environmental education network. Write warm, personalized outreach emails to invite community organizations to join the Climate Learning Exchange.`,
        `Write a personalized outreach email to invite this organization to join the Ten Strands Climate Learning Exchange.\n\nOrganization:\n- Name: ${prospect.name}\n- Type: ${prospect.type || 'Environmental organization'}\n- County: ${prospect.county || 'California'}\n- Notes: ${prospect.notes || 'None'}\n\nContext:\n- Nearby schools in their county: ${prospect.nearby_schools || 'many'}\n- Existing programs in that county: ${prospect.existing_programs || 'few'}\n\nFormat as JSON: {"subject": "Email subject line", "body": "Full email body text (plain text, no HTML)"}\n\nThe email should: mention their specific county/region, highlight teacher demand for programs like theirs, explain benefits of joining (visibility to teachers, free listing, support). Keep under 250 words. Sign off as "The Ten Strands Team".`,
        800
      )
      if (!text) return null
      const raw = text.trim()
      const jsonStr = raw.startsWith('{') ? raw : raw.slice(raw.indexOf('{'))
      return JSON.parse(jsonStr)
    } catch { return null }
  }

  async summarizeReviews(reviews: { rating: number; text: string }[]): Promise<string | null> {
    if (reviews.length === 0) return null
    const reviewTexts = reviews.map((r) => `[${r.rating}/5] ${r.text}`).join('\n')
    try {
      return await this.completeText(
        'Summarize teacher reviews of outdoor education programs. Be objective and highlight key themes.',
        `Summarize these teacher reviews in 2 sentences. Highlight the most common positive themes and any concerns.\n\nReviews:\n${reviewTexts}\n\nWrite only the 2-sentence summary.`,
        300
      )
    } catch { return null }
  }

  async generateAllDigests(): Promise<{ teacherId: string; success: boolean }[]> {
    const client = getRawClient()
    const teachersResult = await client.execute({ sql: `SELECT id FROM teachers ORDER BY name`, args: [] })
    const results: { teacherId: string; success: boolean }[] = []
    const now = Math.floor(Date.now() / 1000)

    for (const row of teachersResult.rows as any[]) {
      try {
        const digest = await this.generateDigest(row.id)
        if (digest) {
          const reportId = `rpt_${row.id}_${now}`
          await client.execute({
            sql: `INSERT OR REPLACE INTO reports (id, recipient_type, recipient_id, report_type, generated_at, content_json)
                  VALUES (?, 'teacher', ?, 'monthly_digest', ?, ?)`,
            args: [reportId, row.id, now, JSON.stringify({ html: digest })],
          })
          results.push({ teacherId: row.id, success: true })
        } else {
          results.push({ teacherId: row.id, success: false })
        }
      } catch {
        results.push({ teacherId: row.id, success: false })
      }
    }
    return results
  }

  async scoreProspect(prospectId: string): Promise<number | null> {
    const client = getRawClient()
    const result = await client.execute({
      sql: `SELECT pp.*,
              (SELECT COUNT(*) FROM partners pt WHERE pt.county = pp.county AND pt.status = 'active') as partner_count,
              (SELECT COUNT(*) FROM schools s WHERE s.county = pp.county) as school_count
            FROM partner_prospects pp WHERE pp.id = ?`,
      args: [prospectId],
    })
    const prospect = result.rows[0] as any
    if (!prospect) return null

    try {
      const text = await this.completeText(
        'You are a partnership analyst. Score prospective environmental education partners on a scale of 1-10.',
        `Score this prospective partner organization from 1-10 based on their potential value to the Ten Strands Climate Learning Exchange.\n\nProspect:\n- Name: ${prospect.name}\n- Type: ${prospect.type || 'Unknown'}\n- County: ${prospect.county || 'Unknown'}\n- Existing active partners in county: ${prospect.partner_count || 0}\n- Schools in county: ${prospect.school_count || 0}\n- Notes: ${prospect.notes || 'None'}\n\nScoring criteria:\n- Higher score if county has few existing partners (fill a gap)\n- Higher score if county has many schools (high impact potential)\n- Higher score for specific program types (wetlands, agriculture)\n- Lower score if info is incomplete\n\nRespond with ONLY a number from 1-10, nothing else.`,
        20
      )
      if (!text) return null
      const score = parseFloat(text.trim())
      return isNaN(score) ? null : Math.min(10, Math.max(1, score))
    } catch { return null }
  }

  async discoverProspects(coverageGaps: { county: string; programs: number; schools: number; title1Pct: number; burden: number }[]): Promise<{ name: string; type: string; county: string; rationale: string; scoreEstimate: number; sourceHint: string }[] | null> {
    const gapSummary = coverageGaps.slice(0, 8).map(g =>
      `${g.county} County: ${g.programs} programs, ${g.schools} schools, ${g.title1Pct}% Title I, burden score ${g.burden}/100`
    ).join('\n')

    try {
      const text = await this.completeText(
        `You are a partnership development specialist for Ten Strands, California's outdoor environmental education network. You identify community-based organizations that could become Climate Learning Exchange partners.`,
        `Based on coverage gaps in California counties, suggest 6 specific types of organizations to prospect as new CBP partners.

Coverage gaps (high-priority counties):
${gapSummary}

Suggest organizations from these source types:
- State parks/nature reserves
- County farm bureaus & ag programs
- Nonprofits (wetlands, conservation, urban ecology)
- University extension programs
- Indigenous cultural orgs with land stewardship programs
- Water districts with education programs

Respond with a JSON array only:
[{
  "name": "Example Organization Name",
  "type": "wetlands|agriculture|urban_ecology|climate_justice|indigenous_knowledge|general",
  "county": "County name",
  "rationale": "Why this org would be valuable — 1 sentence mentioning the county gap",
  "scoreEstimate": 7,
  "sourceHint": "Where to find them, e.g., CA State Parks directory, nonprofit registry"
}]`,
        900
      )
      if (!text) return null
      const raw = text.trim()
      const jsonStr = raw.startsWith('[') ? raw : raw.slice(raw.indexOf('['))
      return JSON.parse(jsonStr)
    } catch { return null }
  }

  async onboardingTurn(history: CopilotMessage[], userMessage: string, collectedData: Record<string, string>): Promise<{ reply: string; updatedData: Record<string, string>; complete: boolean }> {
    const fields = ['orgName', 'description', 'programs', 'gradeLevels', 'subjects', 'county', 'address', 'contactEmail', 'website']
    const missing = fields.filter(f => !collectedData[f])

    const systemPrompt = `You are a friendly onboarding specialist for Ten Strands Climate Learning Exchange. You help community-based environmental education organizations join as partners.

Your job: have a natural conversation to collect these details:
1. Organization name (orgName)
2. What the org does / description (description)
3. What educational programs they offer (programs)
4. Grade levels they serve (gradeLevels — e.g., 4,5,6)
5. Subject focus areas (subjects — from: Life Science, Earth Science, Agriculture, Water, Biodiversity, Climate Justice, Indigenous Ecological Knowledge)
6. County they operate in (county)
7. Physical address (address)
8. Contact email (contactEmail)
9. Website URL (website)

Collected so far: ${JSON.stringify(collectedData)}
Still needed: ${missing.join(', ')}

Ask for ONE piece of information at a time in a friendly, conversational way. If you have all the info, say "Great! I have everything I need to create your profile." and set complete to true.

Always respond with valid JSON: {"reply": "your message", "updatedData": {}, "complete": false}
Extract any info from the user's message and add it to updatedData. Only include fields you extracted from THIS message.`

    try {
      const transcript = history.map(m => `${m.role === 'user' ? 'CBP' : 'Assistant'}: ${m.content}`).join('\n')
      const text = await this.completeText(
        systemPrompt,
        `${transcript ? transcript + '\n\n' : ''}CBP: ${userMessage}`,
        600
      )
      if (!text) return { reply: 'AI is unavailable. Please configure an API key in Settings.', updatedData: {}, complete: false }
      const raw = text.trim()
      const jsonStr = raw.startsWith('{') ? raw : raw.slice(raw.indexOf('{'))
      return JSON.parse(jsonStr)
    } catch {
      return { reply: 'Sorry, I had trouble understanding that. Could you try again?', updatedData: {}, complete: false }
    }
  }

  async buildPartnerProfileFromOnboarding(data: Record<string, string>): Promise<{ name: string; description: string; type: string; gradeLevels: string[]; subjects: string[]; county: string; address: string; contactEmail: string; website: string } | null> {
    try {
      const text = await this.completeText(
        'You extract and normalize partner profile data from onboarding interview notes.',
        `Based on this onboarding interview data, produce a clean partner profile JSON.

Interview data: ${JSON.stringify(data)}

Valid types: wetlands, agriculture, urban_ecology, climate_justice, indigenous_knowledge, general
Valid subjects: Life Science, Earth Science, Agriculture, Water, Biodiversity, Climate Justice, Indigenous Ecological Knowledge
Valid grade levels: TK, K, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12

Respond with JSON only:
{
  "name": "...",
  "description": "2-3 sentences, engaging, teacher-focused",
  "type": "...",
  "gradeLevels": ["4","5","6"],
  "subjects": ["Life Science"],
  "county": "...",
  "address": "...",
  "contactEmail": "...",
  "website": "..."
}`,
        600
      )
      if (!text) return null
      const raw = text.trim()
      return JSON.parse(raw.startsWith('{') ? raw : raw.slice(raw.indexOf('{')))
    } catch { return null }
  }

  private parseJson(value: string | null | undefined): string[] {
    if (!value) return []
    try { return JSON.parse(value) } catch { return [] }
  }
}
