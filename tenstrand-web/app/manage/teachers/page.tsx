import { TeacherService } from '@/lib/services/teacher.service'

function safeParseArray(val: string | null | undefined): string[] {
  if (!val) return []
  try {
    const parsed = JSON.parse(val)
    return Array.isArray(parsed) ? parsed : [String(parsed)]
  } catch {
    return val.split(',').map((s) => s.trim()).filter(Boolean)
  }
}

export default async function ManageTeachersPage() {
  const teacherSvc = new TeacherService()
  const teachers = await teacherSvc.list()

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Teachers</h1>
        <p className="text-sm text-gray-500 mt-0.5">{teachers.length} teachers — manage via the teacher-facing app at <a href="/teachers" className="text-brand hover:underline">/teachers</a></p>
      </div>

      <div className="bg-white rounded-xl border border-app-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-app-border bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">School</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Grades</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Subjects</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border">
            {teachers.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{t.email ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{t.schoolName ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{safeParseArray(t.gradeLevels).join(', ') || '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs max-w-[220px]">
                  <p className="truncate">{safeParseArray(t.subjects).join(', ') || '—'}</p>
                </td>
              </tr>
            ))}
            {teachers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-400">No teachers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
