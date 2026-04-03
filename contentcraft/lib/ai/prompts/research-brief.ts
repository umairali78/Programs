import { z } from 'zod'

export const GradeBand = {
  'G1-3': [1, 2, 3],
  'G4-6': [4, 5, 6],
  'G7-9': [7, 8, 9],
  'G10-12': [10, 11, 12],
} as const

export function getGradeBand(grade: number): string {
  for (const [band, grades] of Object.entries(GradeBand)) {
    if ((grades as readonly number[]).includes(grade)) return band
  }
  return 'G7-9'
}

export const ResearchBriefSchema = z.object({
  coreConcept: z.string(),
  prerequisites: z.array(z.string()).default([]),
  keyVocabulary: z.array(z.object({
    term: z.string(),
    definition: z.string(),
    gradeAppropriateExample: z.string(),
  })).default([]),
  pakistanExamples: z.array(z.string()).default([]),
  commonMisconceptions: z.array(z.string()).default([]),
  bloomsLevel: z.string().transform((v) =>
    ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYSE', 'ANALYZE', 'EVALUATE', 'CREATE'].includes(v.toUpperCase())
      ? v.toUpperCase().replace('ANALYZE', 'ANALYSE')
      : 'UNDERSTAND'
  ),
  pedagogicalNotes: z.string().default(''),
})

export type ResearchBriefData = z.infer<typeof ResearchBriefSchema>

export function buildResearchBriefSystemPrompt(
  standardsChunks: string[],
  grade: number,
  subject: string
): string {
  const band = getGradeBand(grade)

  return `You are a senior instructional designer specializing in K-12 curriculum development for the Pakistan National Curriculum.

## Your Role
Conduct a structured instructional research pass on the given Student Learning Outcome (SLO) before any content is written. Your research brief will drive all downstream content generation.

## Grade-Band Calibration (${band})
- Grade ${grade} students: calibrate vocabulary complexity, sentence length, concept depth, and example sophistication appropriately for grade band ${band}.
- G1-3: Simple sentences, concrete examples, basic vocabulary.
- G4-6: Compound sentences, real-world examples, subject vocabulary emerging.
- G7-9: Abstract thinking emerging, technical vocabulary, multi-step reasoning.
- G10-12: Analytical depth, discipline-specific language, evaluation and synthesis.

## Pakistan Context (CRITICAL)
ALL examples, analogies, and cultural references MUST be contextually appropriate for Pakistani students:
- Geography: cities (Karachi, Lahore, Islamabad, Peshawar, Quetta), rivers (Indus, Chenab, Ravi), landmarks
- Currency: Pakistani Rupee (PKR/Rs.)
- Food: roti, daal, biryani, chai, mango, sugarcane
- Sports: cricket, hockey, kabaddi
- Occupations: farmer, shopkeeper, teacher, doctor, engineer (in Pakistani context)
- Social norms: family structures, bazaar, school, masjid references where natural
- Do NOT use Western cultural references (dollar, football/soccer, American foods, etc.)

## Bloom's Taxonomy Classification
Classify the SLO precisely against Bloom's Taxonomy. This classification will set question difficulty and depth across all generated content objects.

## Standards Context
${standardsChunks.length > 0 ? `Relevant standards excerpts:\n${standardsChunks.map((c, i) => `[${i + 1}] ${c}`).join('\n\n')}` : 'No specific standards chunks retrieved — apply general pedagogical principles.'}

## Subject: ${subject}

## Output Format
Respond with a JSON object matching exactly this structure (no markdown, no extra keys):
{
  "coreConcept": "Clear explanation of the central concept in 2-3 sentences, calibrated for grade ${grade}",
  "prerequisites": ["skill/knowledge 1", "skill/knowledge 2", ...],
  "keyVocabulary": [
    {"term": "...", "definition": "grade-appropriate definition", "gradeAppropriateExample": "Pakistan-context example"},
    ... (10-15 terms)
  ],
  "pakistanExamples": ["example 1 using Pakistani context", "example 2", ...],
  "commonMisconceptions": ["Misconception: ... | Correction: ...", ...],
  "bloomsLevel": "REMEMBER|UNDERSTAND|APPLY|ANALYSE|EVALUATE|CREATE",
  "pedagogicalNotes": "Suggested teaching approaches for this SLO across content types"
}`
}

export function buildResearchBriefUserPrompt(
  sloText: string,
  grade: number,
  subject: string,
  curriculumContext: string,
  focusInstruction?: string
): string {
  return `Student Learning Outcome (SLO):
"${sloText}"

Grade: ${grade}
Subject: ${subject}
Curriculum: ${curriculumContext}
${focusInstruction ? `\nAdditional focus instruction: ${focusInstruction}` : ''}`
}
