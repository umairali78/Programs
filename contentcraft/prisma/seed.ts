/**
 * Database seed script — creates the first Admin user and default prompt library.
 * Run with: npx prisma db seed
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { stringifyJsonField } from '@/lib/utils/json'

const prisma = new PrismaClient()

const DEFAULT_PROMPTS: Record<string, {
  masterPrompt: string
  structuralRules: string
  outputFormat: string
  qualityCriteria: string
}> = {
  CO1: {
    masterPrompt: `You are writing a Model Chapter — the primary instructional text for a Pakistan National Curriculum lesson. This is the core content students will read and learn from. Write in clear, engaging prose appropriate to the grade level. Use Pakistani cultural context throughout. The chapter must fully address the SLO and build conceptual understanding step by step.`,
    structuralRules: `Structure the chapter as follows:
1. Learning Objectives (bullet list of 3-4 measurable outcomes)
2. Introduction / Hook (1-2 paragraphs with a Pakistan-context story or scenario)
3. Core Concept Explanation (3-5 paragraphs, progressively deeper)
4. Worked Examples (2-3 examples using Pakistani context: cities, rupees, cricket, food)
5. Concept Check Questions (3 questions at varying Bloom's levels)
6. Summary (key points in bullet form)
7. Key Terms Glossary (define all bold terms used)`,
    outputFormat: `Output in well-structured Markdown. Use ## for main sections, **bold** for key terms, > blockquotes for important definitions. Keep paragraphs short (3-4 sentences). Use numbered lists for steps and bullet lists for features/properties.`,
    qualityCriteria: `- All examples use Pakistani context (no Western references)
- Vocabulary matches grade band complexity
- SLO is fully addressed by end of chapter
- Bloom's taxonomy level is reflected in depth
- Concept Check Questions include at least one higher-order question
- No factual errors
- Engaging tone appropriate for the grade level`,
  },
  CO2: {
    masterPrompt: `You are writing Reading Material — a supplementary reading passage for Pakistan National Curriculum students. This is an informational text that reinforces and extends the core lesson concept. Write in a journalistic or narrative style, more engaging than a textbook. Use real-world Pakistani stories, profiles, or scenarios to make the content come alive.`,
    structuralRules: `Structure the reading as follows:
1. Title (engaging, topic-relevant)
2. Lead Paragraph (hook with a compelling Pakistan-context scenario)
3. Background / Context (1-2 paragraphs explaining the broader topic)
4. Main Content (3-4 paragraphs with facts, examples, and Pakistan references)
5. Real-World Application (how this applies in Pakistani daily life or future careers)
6. Think About It (2-3 reflection questions for students)
7. Vocabulary Box (5-8 key terms with definitions)`,
    outputFormat: `Output in Markdown. Use an engaging, story-like tone. Avoid textbook monotony. Use short paragraphs. Include **bold** for key terms. Use > blockquotes for interesting facts or quotes. Include a clear vocabulary box at the end.`,
    qualityCriteria: `- Reads like an interesting article, not a textbook
- Contains at least 3 Pakistan-specific references
- Vocabulary complexity matches grade level
- Think About It questions promote critical thinking
- Factually accurate
- Builds on but does not merely repeat the Model Chapter content`,
  },
  CO3: {
    masterPrompt: `You are writing a Video Script — a narration script paired with visual direction notes for an educational video aligned to the Pakistan National Curriculum. The narration should be conversational and engaging, like a knowledgeable teacher talking directly to students. Write as if you are creating the script for a professional educational YouTube channel for Pakistani students.`,
    structuralRules: `Structure the video script as follows:
1. [SCENE 1 — HOOK] Opening hook (15-20 seconds, engaging question or scenario)
2. [SCENE 2 — INTRODUCTION] Introduce topic and learning objectives (30 seconds)
3. [SCENE 3-6 — CORE CONTENT] Main instructional segments (60-90 seconds each, 3-4 segments)
4. [SCENE 7 — EXAMPLE] Worked example with Pakistan context (45-60 seconds)
5. [SCENE 8 — SUMMARY] Recap key points (30 seconds)
6. [SCENE 9 — OUTRO] Call to action / next steps (15 seconds)

For each scene, provide:
NARRATOR: [spoken text]
VISUAL: [what should appear on screen]`,
    outputFormat: `Output in Markdown with clear scene markers. Use:
## [SCENE N — TITLE]
**NARRATOR:** spoken text here
**VISUAL:** description of what appears on screen

Keep narrator lines conversational. Visual descriptions should be specific (e.g., "Animation of water molecules", "Map of Pakistan highlighting the Indus River").`,
    qualityCriteria: `- Total script length suitable for 5-8 minute video
- Narrator text is conversational, not textbook-style
- Visual directions are specific and achievable
- Pakistan context used in examples
- Each scene transition is smooth
- Bloom's level reflected in content depth
- No Western cultural references in examples`,
  },
  CO4: {
    masterPrompt: `You are creating an Assessment — a comprehensive question bank with answer keys for Pakistan National Curriculum evaluation. Create questions at multiple Bloom's Taxonomy levels. All questions must be fair, unambiguous, and directly aligned to the SLO. Use Pakistani context in scenarios and examples.`,
    structuralRules: `Structure the assessment as follows:
1. Section A — Multiple Choice Questions (8-10 MCQs with 4 options each, mark correct answer)
2. Section B — Short Answer Questions (4-5 questions, expected answer length: 2-4 sentences)
3. Section C — Long Answer / Application Questions (2-3 questions requiring paragraph responses)
4. Section D — Higher Order Thinking (1-2 questions at Evaluate/Create Bloom's level)
5. Answer Key (complete answers for all sections with marking guidance)
6. Marking Scheme (total marks and distribution)`,
    outputFormat: `Output in Markdown. Use clear section headers. For MCQs, mark correct answer with ✓. For short/long answers, provide model answers in the Answer Key. Include total marks prominently. Use Pakistani names, cities, and contexts in question scenarios.`,
    qualityCriteria: `- Questions directly assess the SLO
- MCQ distractors are plausible but clearly wrong
- Questions span at least 3 Bloom's levels
- No ambiguous questions
- Answer key is complete and accurate
- Pakistani names and contexts used (Ahmed, Fatima, Karachi, Lahore, PKR)
- Mark allocation is appropriate and clearly stated`,
  },
  CO5: {
    masterPrompt: `You are designing a Learning Game brief — a gamified learning activity brief for Pakistan National Curriculum students. Design an engaging, educational game that reinforces the SLO through play. The game should be practical to implement in a classroom or as a digital activity. Think about quiz games, board games, card games, or simple digital interactive formats that work for Pakistani school contexts.`,
    structuralRules: `Structure the learning game brief as follows:
1. Game Title (catchy, relevant name)
2. Learning Objective (single clear SLO-aligned outcome)
3. Target Grade & Subject
4. Game Overview (2-3 sentences describing the game concept)
5. Materials Needed (list of required resources)
6. Setup Instructions (step-by-step)
7. How to Play (numbered rules)
8. Educational Mechanics (how the game reinforces learning)
9. Winning Condition
10. Variations / Differentiation (easier and harder versions)
11. Sample Game Content (5-10 sample questions/cards/scenarios)`,
    outputFormat: `Output in Markdown with clear sections. Make instructions unambiguous. Sample content should use Pakistani context. Include both a classroom version and a digital version if possible.`,
    qualityCriteria: `- Game is fun and engaging, not just a quiz in disguise
- Directly reinforces the SLO
- Practical for Pakistani classroom context
- Sample content uses Pakistani names, places, and scenarios
- Rules are clear and unambiguous
- Differentiation options included
- Appropriate for the grade level`,
  },
  CO6: {
    masterPrompt: `You are creating a Dictionary/Glossary — a comprehensive grade-appropriate vocabulary reference for Pakistan National Curriculum students. Each entry must define terms clearly at the right grade level, provide Pakistani-context examples, and help students remember and use the vocabulary. This will be used as a reference document throughout the unit.`,
    structuralRules: `Structure the glossary as follows:
1. Introduction (1 paragraph explaining how to use the glossary)
2. Alphabetical Term Entries, each containing:
   - Term (bold)
   - Part of Speech (noun, verb, adjective, etc.)
   - Grade-appropriate Definition (1-2 sentences, no circular definitions)
   - Pakistan-Context Example Sentence
   - Related Terms (cross-references)
   - Memory Tip (optional, for difficult terms)
3. Topic Word Map (visual grouping of related terms by concept cluster)
4. Practice Activities (2-3 vocabulary exercises)`,
    outputFormat: `Output in Markdown. Each entry follows this format:
### **[TERM]** *(part of speech)*
**Definition:** Clear, grade-appropriate definition.
**Example:** Pakistani context sentence.
**Related:** term1, term2
**Tip:** Memory device (if applicable)

Minimum 15 terms. Arrange alphabetically. Include a word map section at the end.`,
    qualityCriteria: `- All key terms from the SLO are included
- Definitions are at correct grade-level complexity
- Every example uses Pakistani context
- No circular definitions
- Minimum 15 terms included
- Practice activities reinforce vocabulary retention
- Related terms cross-references are accurate`,
  },
  CO7: {
    masterPrompt: `You are writing a Teacher Guide — a comprehensive pedagogical support document for Pakistan National Curriculum teachers delivering this lesson. This guide helps teachers understand the content deeply, anticipate student difficulties, and deliver effective lessons. Write for a practicing teacher who may not be a subject specialist. Include practical classroom management tips relevant to Pakistani school contexts.`,
    structuralRules: `Structure the teacher guide as follows:
1. Lesson Overview (SLO, grade, subject, estimated time)
2. Content Background for Teachers (deeper explanation beyond student level)
3. Common Student Misconceptions and How to Address Them
4. Lesson Plan Structure:
   a. Warm-Up Activity (5-10 min)
   b. Direct Instruction Notes (key points to emphasize)
   c. Guided Practice Activity
   d. Independent Practice
   e. Closing / Exit Ticket
5. Differentiation Strategies (for struggling and advanced students)
6. Discussion Prompts and Questioning Techniques
7. Assessment Guidance (how to use assessment items, rubrics)
8. Cross-Curricular Connections
9. Additional Resources and References`,
    outputFormat: `Output in Markdown with clear section headers. Use practical, direct language. Include specific teacher talk examples (e.g., "Ask students: 'What do you already know about...?'"). Use Pakistani classroom context. Avoid jargon. Make instructions actionable.`,
    qualityCriteria: `- Content background section goes deeper than student level
- All known misconceptions from research brief are addressed
- Lesson plan is feasible within a standard Pakistani school period (40-45 min)
- Differentiation includes both support and extension
- Discussion prompts use Bloom's taxonomy
- Pakistani cultural context used in examples
- Practical and immediately usable by a classroom teacher`,
  },
}

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const existing = await prisma.user.findUnique({ where: { email: 'admin@contentcraft.app' } })
  let adminId: string

  if (!existing) {
    const hashed = await bcrypt.hash('Admin1234!', 12)
    const admin = await prisma.user.create({
      data: {
        email: 'admin@contentcraft.app',
        name: 'System Admin',
        password: hashed,
        role: 'ADMIN',
      },
    })
    adminId = admin.id
    console.log('Created admin user: admin@contentcraft.app / Admin1234!')
  } else {
    adminId = existing.id
    console.log('Admin user already exists')
  }

  // Seed default system config
  const defaults: Record<string, unknown> = {
    improvementTriggerThreshold: 3.5,
    improvementCycleCount: 10,
    maxSloHistory: 10,
    subjects: [
      'Mathematics', 'Science', 'English', 'Urdu',
      'Social Studies', 'Islamiat', 'Computer Science', 'Pakistan Studies',
      'Biology', 'Chemistry', 'Physics', 'Geography', 'History', 'Economics',
    ],
    grades: Array.from({ length: 12 }, (_, i) => i + 1),
  }
  for (const [key, value] of Object.entries(defaults)) {
    await prisma.systemConfig.upsert({
      where: { key },
      update: {},
      create: { key, value: stringifyJsonField({ value }) },
    })
  }
  console.log('Seeded system config defaults')

  // Seed default prompt library for all CO types
  for (const [coType, prompts] of Object.entries(DEFAULT_PROMPTS)) {
    const existing = await prisma.promptLibrary.findFirst({
      where: { contentObjectType: coType, isActive: true },
    })
    if (!existing) {
      await prisma.promptLibrary.create({
        data: {
          contentObjectType: coType,
          version: 1,
          isActive: true,
          masterPrompt: prompts.masterPrompt,
          structuralRules: prompts.structuralRules,
          outputFormat: prompts.outputFormat,
          qualityCriteria: prompts.qualityCriteria,
          updatedById: adminId,
        },
      })
      console.log(`Created default prompt library for ${coType}`)
    } else {
      console.log(`Prompt library for ${coType} already exists (v${existing.version})`)
    }
  }

  // Seed default content template schemas for all CO types (no file, just schema)
  const defaultTemplateSchemas: Record<string, object> = {
    CO1: {
      sections: [
        { name: 'Learning Objectives', order: 1, targetWordCount: 80, description: 'Measurable learning outcomes' },
        { name: 'Introduction', order: 2, targetWordCount: 150, description: 'Hook with Pakistan-context scenario' },
        { name: 'Core Concept', order: 3, targetWordCount: 400, description: 'Progressive concept explanation' },
        { name: 'Worked Examples', order: 4, targetWordCount: 250, description: 'Pakistan-context worked examples' },
        { name: 'Concept Check', order: 5, targetWordCount: 120, description: '3 check questions' },
        { name: 'Summary', order: 6, targetWordCount: 100, description: 'Key points recap' },
        { name: 'Key Terms', order: 7, targetWordCount: 150, description: 'Glossary of bold terms' },
      ],
      toneMarkers: ['educational', 'engaging', 'grade-appropriate', 'culturally-relevant'],
      formatSignals: ['uses headers', 'bold key terms', 'bullet lists for features', 'numbered lists for steps'],
      wordCountTargets: { total: 1250, introduction: 150, coreContent: 400, examples: 250 },
    },
    CO2: {
      sections: [
        { name: 'Title', order: 1, targetWordCount: 10, description: 'Engaging topic title' },
        { name: 'Lead Paragraph', order: 2, targetWordCount: 100, description: 'Compelling Pakistan-context hook' },
        { name: 'Background', order: 3, targetWordCount: 150, description: 'Broader topic context' },
        { name: 'Main Content', order: 4, targetWordCount: 350, description: 'Facts, examples, Pakistan references' },
        { name: 'Real-World Application', order: 5, targetWordCount: 120, description: 'Pakistani daily life/career application' },
        { name: 'Think About It', order: 6, targetWordCount: 80, description: 'Reflection questions' },
        { name: 'Vocabulary Box', order: 7, targetWordCount: 120, description: '5-8 key terms with definitions' },
      ],
      toneMarkers: ['journalistic', 'narrative', 'engaging', 'accessible'],
      formatSignals: ['bold key terms', 'blockquotes for facts', 'vocabulary box at end'],
      wordCountTargets: { total: 930, mainContent: 350, vocabulary: 120 },
    },
    CO3: {
      sections: [
        { name: 'Scene 1 - Hook', order: 1, targetWordCount: 60, description: 'Opening hook (15-20 sec)' },
        { name: 'Scene 2 - Introduction', order: 2, targetWordCount: 100, description: 'Topic + objectives (30 sec)' },
        { name: 'Scene 3-6 - Core Content', order: 3, targetWordCount: 500, description: 'Main segments (60-90 sec each)' },
        { name: 'Scene 7 - Example', order: 4, targetWordCount: 150, description: 'Worked Pakistan-context example (45 sec)' },
        { name: 'Scene 8 - Summary', order: 5, targetWordCount: 80, description: 'Key points recap (30 sec)' },
        { name: 'Scene 9 - Outro', order: 6, targetWordCount: 40, description: 'Call to action (15 sec)' },
      ],
      toneMarkers: ['conversational', 'direct', 'engaging', 'teacher-like'],
      formatSignals: ['NARRATOR: prefix', 'VISUAL: prefix', 'scene headers', 'clear transitions'],
      wordCountTargets: { total: 930, coreContent: 500 },
    },
    CO4: {
      sections: [
        { name: 'Section A - MCQ', order: 1, targetWordCount: 300, description: '8-10 multiple choice questions' },
        { name: 'Section B - Short Answer', order: 2, targetWordCount: 200, description: '4-5 short answer questions' },
        { name: 'Section C - Long Answer', order: 3, targetWordCount: 150, description: '2-3 paragraph response questions' },
        { name: 'Section D - HOTS', order: 4, targetWordCount: 100, description: '1-2 higher order thinking questions' },
        { name: 'Answer Key', order: 5, targetWordCount: 300, description: 'Complete answers + marking guidance' },
        { name: 'Marking Scheme', order: 6, targetWordCount: 50, description: 'Total marks distribution' },
      ],
      toneMarkers: ['clear', 'unambiguous', 'formal', 'assessment-appropriate'],
      formatSignals: ['section labels', 'mark allocation', 'MCQ with ✓ on answer', 'answer key at end'],
      wordCountTargets: { total: 1100, mcq: 300, answerKey: 300 },
    },
    CO5: {
      sections: [
        { name: 'Game Title & Overview', order: 1, targetWordCount: 80, description: 'Title and game concept' },
        { name: 'Learning Objective', order: 2, targetWordCount: 40, description: 'SLO-aligned outcome' },
        { name: 'Materials & Setup', order: 3, targetWordCount: 150, description: 'Required resources and setup steps' },
        { name: 'How to Play', order: 4, targetWordCount: 200, description: 'Clear numbered game rules' },
        { name: 'Educational Mechanics', order: 5, targetWordCount: 100, description: 'How game reinforces learning' },
        { name: 'Variations', order: 6, targetWordCount: 100, description: 'Easier and harder versions' },
        { name: 'Sample Content', order: 7, targetWordCount: 200, description: '5-10 sample questions/cards' },
      ],
      toneMarkers: ['fun', 'engaging', 'clear', 'motivating'],
      formatSignals: ['numbered rules', 'bullet lists', 'sample content box'],
      wordCountTargets: { total: 870, rules: 200, sampleContent: 200 },
    },
    CO6: {
      sections: [
        { name: 'Introduction', order: 1, targetWordCount: 60, description: 'How to use the glossary' },
        { name: 'Glossary Entries', order: 2, targetWordCount: 600, description: 'Minimum 15 alphabetical entries' },
        { name: 'Topic Word Map', order: 3, targetWordCount: 80, description: 'Visual concept clusters' },
        { name: 'Practice Activities', order: 4, targetWordCount: 150, description: '2-3 vocabulary exercises' },
      ],
      toneMarkers: ['clear', 'reference-style', 'grade-appropriate'],
      formatSignals: ['bold terms', 'structured entries', 'alphabetical order', 'cross-references'],
      wordCountTargets: { total: 890, entries: 600, perEntry: 40 },
    },
    CO7: {
      sections: [
        { name: 'Lesson Overview', order: 1, targetWordCount: 80, description: 'SLO, grade, subject, time' },
        { name: 'Content Background', order: 2, targetWordCount: 200, description: 'Deeper content for teachers' },
        { name: 'Common Misconceptions', order: 3, targetWordCount: 150, description: 'Student errors + corrections' },
        { name: 'Lesson Plan', order: 4, targetWordCount: 400, description: 'Warm-up, instruction, practice, close' },
        { name: 'Differentiation', order: 5, targetWordCount: 150, description: 'Support and extension strategies' },
        { name: 'Discussion Prompts', order: 6, targetWordCount: 100, description: 'Questioning techniques' },
        { name: 'Assessment Guidance', order: 7, targetWordCount: 100, description: 'How to use assessment items' },
        { name: 'Cross-Curricular Links', order: 8, targetWordCount: 80, description: 'Connections to other subjects' },
      ],
      toneMarkers: ['practical', 'teacher-focused', 'actionable', 'supportive'],
      formatSignals: ['clear section headers', 'teacher talk examples', 'bullet lists', 'timing guidance'],
      wordCountTargets: { total: 1260, lessonPlan: 400, contentBackground: 200 },
    },
  }

  for (const [coType, schema] of Object.entries(defaultTemplateSchemas)) {
    const existing = await prisma.contentTemplate.findFirst({
      where: { contentObjectType: coType },
      orderBy: { version: 'desc' },
    })
    if (!existing) {
      await prisma.contentTemplate.create({
        data: {
          contentObjectType: coType,
          version: 1,
          isActive: true,
          storagePath: 'default',
          fileName: `default-template-${coType}.json`,
          parsedSchema: stringifyJsonField(schema),
          parseStatus: 'parsed',
          uploadedById: adminId,
        },
      })
      console.log(`Created default template for ${coType}`)
    } else if (!existing.isActive || !existing.parsedSchema || existing.parsedSchema === 'null') {
      // Activate and fill schema if missing
      await prisma.contentTemplate.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          parsedSchema: stringifyJsonField(schema),
          parseStatus: 'parsed',
        },
      })
      console.log(`Updated template for ${coType} (v${existing.version})`)
    } else {
      console.log(`Template for ${coType} already exists (v${existing.version})`)
    }
  }

  console.log('Done.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
