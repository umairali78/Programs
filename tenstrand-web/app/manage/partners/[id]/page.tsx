import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PartnerService } from '@/lib/services/partner.service'
import { ArrowLeft } from 'lucide-react'
import { updatePartner } from '../actions'
import { PartnerFormFields } from '../PartnerFormFields'
import { SubmitButton } from '../../SubmitButton'

export default async function EditPartnerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const partnerSvc = new PartnerService()
  const partner = await partnerSvc.get(id)

  if (!partner) notFound()

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/manage/partners" className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Edit Partner</h1>
      </div>

      <form action={updatePartner} className="bg-white rounded-xl border border-app-border p-6 space-y-5">
        <input type="hidden" name="id" value={partner.id} />
        <PartnerFormFields
          defaults={{
            name: partner.name,
            type: partner.type,
            description: partner.description ?? undefined,
            county: partner.county,
            address: partner.address,
            contactEmail: partner.contactEmail,
            website: partner.website,
            status: partner.status ?? 'active',
          }}
        />
        <div className="flex justify-end gap-3 pt-2 border-t border-app-border">
          <Link href="/manage/partners" className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            Cancel
          </Link>
          <SubmitButton label="Save Changes" />
        </div>
      </form>
    </div>
  )
}
