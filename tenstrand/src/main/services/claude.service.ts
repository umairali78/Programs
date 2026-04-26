import Anthropic from '@anthropic-ai/sdk'
import { SettingsService } from './settings.service'
import { TeacherService } from './teacher.service'
import { ProgramService } from './program.service'
import { PartnerService } from './partner.service'
import { MatchingService } from './matching.service'

const MODEL = 'claude-sonnet-4-6'

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
  private partnerSvc = new PartnerService()
  private matchingSvc = new MatchingService()

  private async getClient(): Promise<Anthropic | null> {
    const apiKey = await this.settingsSvc.get('claude_api_key')
    if (!apiKey) return null
    return new Anthropic({ apiKey })
  }

  async generateMatchExplanation(teacherId: string, programId: string): Promise<string | null> {
    const client = await this.getClient()
    if (!client) return null

    const teacher = await this.teacherSvc.get(teacherId)
    const program = await this.programSvc.get(programId)
    if (!teacher || !program) return null

    const score = await this.matchingSvc.scoreOne(teacherId, programId)
    const gradeLevels = this.parseJson(teacher.gradeLevels)
    const subjects = this.parseJson(teacher.subjects)

    try {
      const msg = await client.messages.create({
        model: MODEL,
        max_tokens: 200,
        system: [
          {
            type: 'text',
            text: `You are a helpful assistant for Ten Strands Climate Learning Exchange, connecting K-12 teachers with outdoor environmental education programs in California.`,
            // @ts-ignore
            cache_control: { type: 'ephemeral' }
          }
        ],
        messages: [
          {
            role: 'user',
            content: `Write a 1-2 sentence explanation of why this program matches this teacher. Be specific and enthusiastic.

Teacher profile:
- Grade levels: ${gradeLevels.join(', ') || 'Not specified'}
- Subjects: ${subjects.join(', ') || 'Not specified'}

Program:
- Title: ${program.title}
- Description: ${program.description || 'No description'}
- Match score: ${Math.round(score * 100)}%

Write only the explanation, no preamble.`
          }
        ]
      })

      const text = msg.content[0]
      return text.type === 'text' ? text.text : null
    } catch {
      return null
    }
  }

  async runCopilotTurn(
    teacherId: string,
    history: CopilotMessage[],
    userMessage: string
  ): Promise<string> {
    const client = await this.getClient()
    if (!client) return 'AI is unavailable. Please add your Claude API key in Settings.'

    const teacher = await this.teacherSvc.get(teacherId)
    const radiusMiles = 20

    const nearbyPrograms = teacher?.lat && teacher?.lng
      ? await this.matchingSvc.listForTeacher(teacherId, radiusMiles)
      : []

    const programSummary = nearbyPrograms
      .slice(0, 20)
      .map((p) => `- "${p.title}" by ${p.partnerName} (${p.distanceMiles}mi, ${p.gradeLevels.join('/')}, $${p.cost})`)
      .join('\n')

    const systemPrompt = `You are an AI assistant for the Ten Strands Climate Learning Exchange, helping K-12 teachers in California find outdoor environmental education programs.

Teacher profile:
- Grade levels: ${this.parseJson(teacher?.gradeLevels).join(', ') || 'Not set'}
- Subjects: ${this.parseJson(teacher?.subjects).join(', ') || 'Not set'}
- Zip: ${teacher?.zip || 'Not set'}

Nearby programs (within ${radiusMiles} miles):
${programSummary || 'No programs found nearby'}

You can answer questions about programs, help plan field trips, suggest curriculum connections, and generate pre-visit lesson plan outlines. Be friendly and practical. If the user asks about specific programs not in the list, acknowledge you can only see local data.`

    const messages: Anthropic.MessageParam[] = [
      ...history.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
      { role: 'user', content: userMessage }
    ]

    try {
      const msg = await client.messages.create({
        model: MODEL,
        max_tokens: 800,
        system: [
          {
            type: 'text',
            text: systemPrompt,
            // @ts-ignore
            cache_control: { type: 'ephemeral' }
          }
        ],
        messages
      })

      const text = msg.content[0]
      return text.type === 'text' ? text.text : 'No response generated.'
    } catch (err: any) {
      return `Error communicating with AI: ${err.message}`
    }
  }

  async generateDigest(teacherId: string): Promise<string | null> {
    const client = await this.getClient()
    if (!client) return null

    const teacher = await this.teacherSvc.get(teacherId)
    if (!teacher) return null

    const matches = await this.matchingSvc.listForTeacher(teacherId, 30)
    const topPrograms = matches.slice(0, 8)

    const programList = topPrograms
      .map(
        (p, i) =>
          `${i + 1}. ${p.title} by ${p.partnerName} — ${p.distanceMiles}mi away, ${p.gradeLevels.join('/')}, Cost: $${p.cost || 0}`
      )
      .join('\n')

    try {
      const msg = await client.messages.create({
        model: MODEL,
        max_tokens: 1500,
        system: [
          {
            type: 'text',
            text: `You are a copywriter for Ten Strands Climate Learning Exchange. Write personalized teacher digests in HTML format (no full page, just inner content). Use warm, encouraging language.`,
            // @ts-ignore
            cache_control: { type: 'ephemeral' }
          }
        ],
        messages: [
          {
            role: 'user',
            content: `Generate a "Your Outdoor Classroom" monthly digest email for this teacher.

Teacher profile:
- Grade levels: ${this.parseJson(teacher.gradeLevels).join(', ') || 'Not specified'}
- Subjects: ${this.parseJson(teacher.subjects).join(', ') || 'Not specified'}

Top nearby programs this month:
${programList || 'No nearby programs found'}

Format as HTML with sections:
1. Personalized greeting
2. New nearby programs highlight (top 3)
3. Seasonal spotlight (current season programs)
4. Quick curriculum connection tip
5. Call to action

Use inline styles for email compatibility. Keep it concise and actionable.`
          }
        ]
      })

      const text = msg.content[0]
      return text.type === 'text' ? text.text : null
    } catch {
      return null
    }
  }

  async rewritePartnerProfile(programId: string): Promise<string | null> {
    const client = await this.getClient()
    if (!client) return null

    const program = await this.programSvc.get(programId)
    if (!program) return null

    try {
      const msg = await client.messages.create({
        model: MODEL,
        max_tokens: 400,
        messages: [
          {
            role: 'user',
            content: `You are an outdoor education copywriter. Rewrite this program description for a teacher audience. Make it engaging, specific about learning outcomes, and highlight curriculum connections. Aim for ~150 words.

Original description:
${program.description || 'No description provided'}

Program title: ${program.title}
Grade levels: ${this.parseJson(program.gradeLevels).join(', ')}
Subjects: ${this.parseJson(program.subjects).join(', ')}

Write only the new description, no preamble.`
          }
        ]
      })

      const text = msg.content[0]
      return text.type === 'text' ? text.text : null
    } catch {
      return null
    }
  }

  async suggestStandards(
    programId: string
  ): Promise<{ code: string; desc: string; framework: string }[] | null> {
    const client = await this.getClient()
    if (!client) return null

    const program = await this.programSvc.get(programId)
    if (!program) return null

    try {
      const msg = await client.messages.create({
        model: MODEL,
        max_tokens: 500,
        system: [
          {
            type: 'text',
            text: NGSS_EP_CONTEXT,
            // @ts-ignore
            cache_control: { type: 'ephemeral' }
          }
        ],
        messages: [
          {
            role: 'user',
            content: `Based on this program, suggest 3-5 California science standards (NGSS and/or EP&Cs) that best apply.

Program: ${program.title}
Description: ${program.description || 'No description'}
Grade levels: ${this.parseJson(program.gradeLevels).join(', ')}
Subjects: ${this.parseJson(program.subjects).join(', ')}

Respond with a JSON array only, no other text:
[{"code": "LS1-1", "desc": "Short description of standard", "framework": "NGSS"}, ...]`
          }
        ]
      })

      const text = msg.content[0]
      if (text.type !== 'text') return null

      const raw = text.text.trim()
      const jsonStr = raw.startsWith('[') ? raw : raw.slice(raw.indexOf('['))
      return JSON.parse(jsonStr)
    } catch {
      return null
    }
  }

  async extractFromBrochure(
    text: string
  ): Promise<{
    title?: string
    description?: string
    gradeLevels?: string[]
    subjects?: string[]
    cost?: number
  } | null> {
    const client = await this.getClient()
    if (!client) return null

    try {
      const msg = await client.messages.create({
        model: MODEL,
        max_tokens: 600,
        messages: [
          {
            role: 'user',
            content: `Extract program information from this text. Return JSON only, no other text.

Text:
${text}

Return this exact JSON structure (use null for missing fields):
{
  "title": "Program name",
  "description": "Program description",
  "gradeLevels": ["K", "1", "2"],
  "subjects": ["Life Science", "Earth Science"],
  "cost": 5.00
}

Grade levels should be from: TK, K, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
Subjects should be from: Life Science, Earth Science, Agriculture, Water, Biodiversity, Climate Justice, Indigenous Ecological Knowledge`
          }
        ]
      })

      const responseText = msg.content[0]
      if (responseText.type !== 'text') return null

      const raw = responseText.text.trim()
      const jsonStr = raw.startsWith('{') ? raw : raw.slice(raw.indexOf('{'))
      return JSON.parse(jsonStr)
    } catch {
      return null
    }
  }

  private parseJson(value: string | null | undefined): string[] {
    if (!value) return []
    try {
      return JSON.parse(value)
    } catch {
      return []
    }
  }
}
