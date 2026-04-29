export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { PartnerService } from '@/lib/services/partner.service'
import { Plus, Pencil } from 'lucide-react'
import { deletePartner } from './actions'
import { DeleteButton } from '../DeleteButton'

export default async function ManagePartnersPage() {
  const partnerSvc = new PartnerService()
  const partners = await partnerSvc.list()

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Partners</h1>
          <p className="text-sm text-gray-500 mt-0.5">{partners.length} partners in database</p>
        </div>
        <Link
          href="/manage/partners/new"
          className="flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Partner
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-app-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-app-border bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Type</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">County</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Contact</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border">
            {partners.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900 max-w-xs">
                  <p className="truncate">{p.name}</p>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs capitalize">{p.type}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{p.county ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs truncate max-w-[160px]">{p.contactEmail ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <Link
                      href={`/manage/partners/${p.id}`}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-brand hover:bg-brand-light transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                    <DeleteButton action={deletePartner} id={p.id} confirmMessage="Delete this partner and all their programs?" />
                  </div>
                </td>
              </tr>
            ))}
            {partners.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">
                  No partners yet. <Link href="/manage/partners/new" className="text-brand hover:underline">Add the first one.</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
