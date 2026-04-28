'use client'
import { useActionState } from 'react'
import { loginAction } from './actions'
import { Trees, Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/manage/programs'
  const [state, action, isPending] = useActionState(loginAction, { error: '' })

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Admin Password</label>
        <input
          type="password"
          name="password"
          required
          autoFocus
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand bg-white"
          placeholder="Enter admin password"
        />
      </div>
      {state?.error && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand-dark disabled:opacity-50 transition-colors"
      >
        {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        Sign In
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand flex items-center justify-center mb-4">
            <Trees className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Ten Strands Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to manage your content</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-app-border p-6">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
