'use server'
import { PartnerService } from '@/lib/services/partner.service'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createPartner(formData: FormData) {
  const svc = new PartnerService()
  await svc.create({
    name: formData.get('name') as string,
    type: formData.get('type') as string,
    description: (formData.get('description') as string) || undefined,
    county: (formData.get('county') as string) || undefined,
    address: (formData.get('address') as string) || undefined,
    contactEmail: (formData.get('contactEmail') as string) || undefined,
    website: (formData.get('website') as string) || undefined,
    status: (formData.get('status') as string) || 'active',
  })
  revalidatePath('/manage/partners')
  redirect('/manage/partners')
}

export async function updatePartner(formData: FormData) {
  const id = formData.get('id') as string
  const svc = new PartnerService()
  await svc.update(id, {
    name: formData.get('name') as string,
    type: formData.get('type') as string,
    description: (formData.get('description') as string) || undefined,
    county: (formData.get('county') as string) || undefined,
    address: (formData.get('address') as string) || undefined,
    contactEmail: (formData.get('contactEmail') as string) || undefined,
    website: (formData.get('website') as string) || undefined,
    status: (formData.get('status') as string) || 'active',
  })
  revalidatePath('/manage/partners')
  redirect('/manage/partners')
}

export async function deletePartner(formData: FormData) {
  const id = formData.get('id') as string
  const svc = new PartnerService()
  await svc.delete(id)
  revalidatePath('/manage/partners')
}
