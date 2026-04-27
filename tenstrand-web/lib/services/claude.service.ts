import Anthropic from '@anthropic-ai/sdk'
import { SettingsService } from './settings.service'
import { TeacherService } from './teacher.service'
import { ProgramService } from './program.service'
import { MatchingService } from './matching.service'

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

  private parseJson(value: string | null | undefined): string[] {
    if (!value) return []
    try { return JSON.parse(value) } catch { return [] }
  }
}
