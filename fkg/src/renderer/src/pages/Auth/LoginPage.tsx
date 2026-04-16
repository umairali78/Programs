import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { invoke } from '../../lib/api'
import { useAuthStore } from '../../store/auth.store'

const HIGHLIGHTS = [
  {
    label: 'Live Operations',
    text: 'Track work orders, customer updates, and delivery status in one place.'
  },
  {
    label: 'Inventory Pulse',
    text: 'Monitor fabric, products, and vendor activity without jumping between screens.'
  },
  {
    label: 'Decision Ready',
    text: 'Get revenue, production, and performance visibility as soon as you sign in.'
  }
]

const SAMPLE_CREDENTIALS = {
  email: 'admin@fashionkaghar.pk',
  password: 'Atelier#2026'
}

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const applySampleCredentials = () => {
    setEmail(SAMPLE_CREDENTIALS.email)
    setPassword(SAMPLE_CREDENTIALS.password)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await invoke<{ user: any; token: string }>('auth:login', { email, password })
      login(result.user, result.token)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#170f15] text-white">
      <div className="relative min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(247,178,103,0.24),_transparent_28%),radial-gradient(circle_at_75%_10%,_rgba(192,57,43,0.35),_transparent_28%),linear-gradient(145deg,_#12090e_0%,_#1c0f17_38%,_#311220_100%)]" />
        <div className="auth-orb absolute left-[-5rem] top-20 h-56 w-56 rounded-full bg-[#f7b267]/20 blur-3xl" />
        <div className="auth-orb absolute right-[-4rem] top-24 h-72 w-72 rounded-full bg-[#7c2d12]/25 blur-3xl" />
        <div className="auth-orb absolute bottom-[-3rem] left-1/3 h-48 w-48 rounded-full bg-[#c0392b]/20 blur-3xl" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center gap-10 px-4 py-10 lg:flex-row lg:items-center lg:px-8">
          <section className="auth-panel max-w-2xl">
            <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#f7d08a] backdrop-blur">
              Fashion Ka Ghar Management System
            </div>

            <h1 className="font-display mt-6 max-w-2xl text-5xl leading-none text-white sm:text-7xl">
              Run the atelier with clarity, pace, and presence.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-white/88 sm:text-lg">
              Sign in to your operations hub for tailoring workflows, sales tracking, staff oversight, and client management.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {HIGHLIGHTS.map((item) => (
                <div key={item.label} className="rounded-[26px] border border-white/12 bg-white/8 p-5 backdrop-blur">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#f7d08a]">{item.label}</p>
                  <p className="mt-3 text-sm leading-6 text-white/88">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-4 text-sm text-white/88">
              <div className="rounded-full border border-white/12 bg-white/8 px-4 py-2">Work Orders</div>
              <div className="rounded-full border border-white/12 bg-white/8 px-4 py-2">Inventory</div>
              <div className="rounded-full border border-white/12 bg-white/8 px-4 py-2">Payments</div>
              <div className="rounded-full border border-white/12 bg-white/8 px-4 py-2">Reports</div>
            </div>
          </section>

          <section className="auth-panel w-full max-w-md">
            <div className="rounded-[30px] border border-white/18 bg-[linear-gradient(180deg,_rgba(77,29,38,0.92)_0%,_rgba(37,16,24,0.96)_100%)] p-6 text-white shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f3a56a]">Welcome Back</p>
                  <h2 className="mt-2 text-3xl font-bold text-white">Sign In</h2>
                  <p className="mt-2 text-sm leading-6 text-white/82">
                    Use your admin or staff credentials to access the dashboard.
                  </p>
                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#4a1d28_0%,_#c0392b_100%)] text-xl font-bold text-white shadow-lg">
                  FKG
                </div>
              </div>

              {error && (
                <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white/88">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#c0392b] focus:bg-white focus:ring-4 focus:ring-[#c0392b]/10"
                    placeholder="admin@fashionkaghar.pk"
                    required
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="block text-sm font-semibold text-white/88">Password</label>
                    <span className="text-xs uppercase tracking-[0.18em] text-white/72">Secure Access</span>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#c0392b] focus:bg-white focus:ring-4 focus:ring-[#c0392b]/10"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#c0392b_0%,_#9f2d21_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(192,57,43,0.25)] transition hover:translate-y-[-1px] hover:shadow-[0_20px_38px_rgba(192,57,43,0.3)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Signing In...' : 'Enter Dashboard'}
                </button>
              </form>

              <div className="mt-5 rounded-[26px] border border-[#f2d6c8] bg-[#fff5ee] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a2f25]">Sample Sign-In</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      Use the sample values below after creating the first admin during setup.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={applySampleCredentials}
                    className="inline-flex items-center justify-center rounded-2xl bg-[#7f2f21] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#662419]"
                  >
                    Fill Sample Inputs
                  </button>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="min-w-0 rounded-2xl border border-[#edd2c3] bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Email</p>
                    <p className="mt-1 break-all text-xs font-semibold leading-5 text-slate-900 sm:text-sm">
                      {SAMPLE_CREDENTIALS.email}
                    </p>
                  </div>
                  <div className="min-w-0 rounded-2xl border border-[#edd2c3] bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Password</p>
                    <p className="mt-1 break-all text-xs font-semibold leading-5 text-slate-900 sm:text-sm">
                      {SAMPLE_CREDENTIALS.password}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[26px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">First Time Here?</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  If this installation has not been configured yet, open the guided setup and create the first admin account.
                </p>
                <button
                  onClick={() => navigate('/onboarding')}
                  className="mt-4 inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
                >
                  Open Guided Setup
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
