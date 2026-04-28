'use server'
import { ProgramService } from '@/lib/services/program.service'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

const GRADE_LEVELS = ['TK', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
const SUBJECTS = ['Life Science', 'Earth Science', 'Agriculture', 'Water', 'Biodiversity', 'Climate Justice', 'Indigenous Ecological Knowledge']
const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter']

function parseMultiSelect(formData: FormData, key: string, allowed: string[]): string[] {
  return allowed.filter((v) => formData.get(`${key}:${v}`) === 'on')
}

function parseOptionalNumber(formData: FormData, key: string): number | undefined {
  const val = formData.get(key) as string
  const n = parseFloat(val)
  return isNaN(n) ? undefined : n
}

export async function createProgram(formData: FormData) {
  const svc = new ProgramService()
  await svc.create({
    partnerId: formData.get('partnerId') as string,
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || undefined,
    gradeLevels: parseMultiSelect(formData, 'grade', GRADE_LEVELS),
    subjects: parseMultiSelect(formData, 'subject', SUBJECTS),
    season: parseMultiSelect(formData, 'season', SEASONS),
    cost: parseOptionalNumber(formData, 'cost'),
    maxStudents: parseOptionalNumber(formData, 'maxStudents'),
    durationMins: parseOptionalNumber(formData, 'durationMins'),
  })
  revalidatePath('/manage/programs')
  redirect('/manage/programs')
}

export async function updateProgram(formData: FormData) {
  const id = formData.get('id') as string
  const svc = new ProgramService()
  await svc.update(id, {
    partnerId: formData.get('partnerId') as string,
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || undefined,
    gradeLevels: parseMultiSelect(formData, 'grade', GRADE_LEVELS),
    subjects: parseMultiSelect(formData, 'subject', SUBJECTS),
    season: parseMultiSelect(formData, 'season', SEASONS),
    cost: parseOptionalNumber(formData, 'cost'),
    maxStudents: parseOptionalNumber(formData, 'maxStudents'),
    durationMins: parseOptionalNumber(formData, 'durationMins'),
  })
  revalidatePath('/manage/programs')
  redirect('/manage/programs')
}

export async function deleteProgram(formData: FormData) {
  const id = formData.get('id') as string
  const svc = new ProgramService()
  await svc.delete(id)
  revalidatePath('/manage/programs')
}
