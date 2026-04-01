import { prisma } from '@/lib/db/client'
import { requireRole } from '@/lib/auth'
import CreateUserForm from './CreateUserForm'

export default async function UsersPage() {
  await requireRole('ADMIN')

  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } })

  const roleBadge: Record<string, string> = {
    ADMIN: 'bg-red-100 text-red-700',
    DESIGNER: 'bg-blue-100 text-blue-700',
    WRITER: 'bg-purple-100 text-purple-700',
    REVIEWER: 'bg-yellow-100 text-yellow-700',
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-sm text-gray-500 mt-1">Manage user accounts and roles.</p>
      </div>

      <CreateUserForm />

      <div className="mt-8 card">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Users ({users.length})</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-4 px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-sm font-semibold text-brand-700">
                {u.name?.[0] ?? u.email[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{u.name ?? '(no name)'}</p>
                <p className="text-xs text-gray-400">{u.email}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleBadge[u.role]}`}>
                {u.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
