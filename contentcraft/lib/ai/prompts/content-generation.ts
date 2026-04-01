import type { ContentObjectType } from '@prisma/client'

export interface GenerationContext {
  researchBrief: Record<string, unknown>
  templateSchema: Record<string, unknown>
  promptLibrary: {
    masterPrompt: string
    structuralRules: string
    outputFormat: string
    qualityCriteria: string
  }
  standardsChunks: string[]
  regenerationInstruction?: string
}

export function buildContentGenerationSystemPrompt(
  coType: ContentObjectType,
  ctx: GenerationContext
): string {
  const { promptLibrary, standardsChunks, templateSchema } = ctx

  return `You are an expert K-12 educational content writer for Pakistan National Curriculum.

## Content Type
You are generating: ${coType} — ${getContentObjectName(coType)}

## Master Prompt
${promptLibrary.masterPrompt}

## Structural Rules
${promptLibrary.structuralRules}

## Output Format
${promptLibrary.outputFormat}

## Quality Criteria
${promptLibrary.qualityCriteria}

## Template Structure (MUST FOLLOW)
The generated content MUST match this section sequence and approximate word counts:
${JSON.stringify(templateSchema, null, 2)}

Deviation from the template structure is a generation failure. Follow section order exactly.

## Standards Guide (Relevant Excerpts)
${standardsChunks.length > 0
  ? standardsChunks.map((c, i) => `[${i + 1}] ${c}`).join('\n\n')
  : 'Apply general K-12 educational standards.'}

## Pakistan Context
All examples, analogies, and cultural references must be appropriate for Pakistani students.
`
}

export function buildContentGenerationUserPrompt(ctx: GenerationContext): string {
  const { researchBrief, regenerationInstruction } = ctx

  return `## Research Brief
${JSON.stringify(researchBrief, null, 2)}

${regenerationInstruction ? `## Revision Instruction\n${regenerationInstruction}\n` : ''}

Generate the complete content script now. Output in well-structured Markdown.`
}

export function buildComplianceCheckPrompt(
  scriptText: string,
  standardsChunks: string[]
): string {
  const system = `You are a standards compliance checker for K-12 educational content.

Check the provided content script against the following standards criteria and return a structured JSON compliance report.

Standards:
${standardsChunks.slice(0, 5).map((c, i) => `[${i + 1}] ${c}`).join('\n\n')}

Respond ONLY with valid JSON in this format:
{
  "results": [
    {"criterion": "criterion name", "status": "pass" | "flag", "note": "explanation if flagged"}
  ]
}`

  return system
}

export function buildTemplateParseSystemPrompt(): string {
  return `You are a document structure analyzer for K-12 educational content templates.

Analyze the provided document text and extract its structural schema.

Respond ONLY with valid JSON in this format:
{
  "sections": [
    {"name": "section name", "order": 1, "targetWordCount": 200, "description": "what goes here"}
  ],
  "toneMarkers": ["formal", "engaging", "age-appropriate"],
  "formatSignals": ["uses callout boxes", "numbered examples", "key term highlights"],
  "wordCountTargets": {
    "total": 1000,
    "introduction": 150,
    "mainContent": 600
  }
}`
}

export function buildImprovementProposalPrompt(
  coType: ContentObjectType,
  feedbackSummary: Record<string, unknown>[],
  currentPromptLibrary: Record<string, unknown>,
  currentTemplateSchema: Record<string, unknown>
): string {
  return `You are analyzing reviewer feedback to suggest improvements to content generation templates and prompts.

Content Object Type: ${coType}

Recent Feedback (${feedbackSummary.length} reviews):
${JSON.stringify(feedbackSummary, null, 2)}

Current Prompt Library:
${JSON.stringify(currentPromptLibrary, null, 2)}

Current Template Schema:
${JSON.stringify(currentTemplateSchema, null, 2)}

Analyze the patterns in the feedback and generate specific, actionable improvement suggestions.

Respond ONLY with valid JSON:
{
  "suggestions": [
    {
      "field": "masterPrompt | structuralRules | templateSection | etc",
      "currentValue": "...",
      "suggestedValue": "...",
      "rationale": "why this change would improve the dimension that's scoring low",
      "evidence": "specific feedback patterns that support this change"
    }
  ]
}`
}

function getContentObjectName(co: ContentObjectType): string {
  const names: Record<ContentObjectType, string> = {
    CO1: 'Model Chapter',
    CO2: 'Reading Material',
    CO3: 'Video Script',
    CO4: 'Assessment',
    CO5: 'Learning Game',
    CO6: 'Dictionary / Glossary',
    CO7: 'Teacher Guide',
  }
  return names[co]
}
