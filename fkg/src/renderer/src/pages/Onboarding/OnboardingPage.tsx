import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { invoke } from '../../lib/api'
import { useAuthStore } from '../../store/auth.store'

const STEPS = [
  {
    title: 'Welcome',
    caption: 'A guided launch for your studio workspace.',
    eyebrow: 'Step 1'
  },
  {
    title: 'Admin Account',
    caption: 'Create the first owner profile with full control.',
    eyebrow: 'Step 2'
  },
  {
    title: 'Business Profile',
    caption: 'Save the identity that appears across records and invoices.',
    eyebrow: 'Step 3'
  },
  {
    title: 'Go Live',
    caption: 'Access the full system the moment setup finishes.',
    eyebrow: 'Step 4'
  }
]

const FEATURE_PILLS = ['Inventory', 'Customers', 'Work Orders', 'Reports']

const SAMPLE_ADMIN = {
  name: 'Ayesha Khan',
  email: 'admin@fashionkaghar.pk',
  password: 'Atelier#2026'
}

const SAMPLE_BUSINESS = {
  businessName: 'Fashion Ka Ghar Studio',
  phone: '+92 300 1234567',
  address: 'Shop 12, Liberty Market, Main Boulevard, Lahore'
}

export function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [businessName, setBusinessName] = useState('Fashion Ka Ghar')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const applySampleAdmin = () => {
    setName(SAMPLE_ADMIN.name)
    setEmail(SAMPLE_ADMIN.email)
    setPassword(SAMPLE_ADMIN.password)
    setError('')
  }

  const applySampleBusiness = () => {
    setBusinessName(SAMPLE_BUSINESS.businessName)
    setPhone(SAMPLE_BUSINESS.phone)
    setAddress(SAMPLE_BUSINESS.address)
  }

  const goToBusinessStep = () => {
    if (!name || !email || !password) {
      setError('Please complete your admin name, email, and password first.')
      return
    }

    setError('')
    setStep(2)
  }

  const handleCreate = async () => {
    if (!name || !email || !password) {
      setError('Please fill all required fields.')
      setStep(1)
      return
    }

    setError('')
    setLoading(true)

    try {
      const result = await invoke<{ user: any; token: string }>('auth:createAdminUser', {
        name,
        email,
        password
      })

      login(result.user, result.token)

      await invoke('settings:setBulk', {
        business_name: businessName,
        business_phone: phone,
        business_address: address
      })

      setStep(3)
    } catch (err: any) {
      setError(err.message ?? 'Setup failed')
    } finally {
      setLoading(false)
    }
  }

  const currentStep = STEPS[step]

  return (
    <div className="min-h-screen overflow-hidden bg-[#150d14] text-white">
      <div className="relative min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(247,178,103,0.26),_transparent_25%),radial-gradient(circle_at_85%_12%,_rgba(192,57,43,0.36),_transparent_30%),radial-gradient(circle_at_30%_85%,_rgba(123,63,32,0.22),_transparent_24%),linear-gradient(140deg,_#10080e_0%,_#1a0f17_38%,_#321624_100%)]" />
        <div className="auth-orb absolute left-[-4rem] top-20 h-64 w-64 rounded-full bg-[#f7b267]/18 blur-3xl" />
        <div className="auth-orb absolute right-[-7rem] top-16 h-80 w-80 rounded-full bg-[#c0392b]/22 blur-3xl" />
        <div className="auth-orb absolute bottom-[-4rem] left-1/3 h-56 w-56 rounded-full bg-[#7c2d12]/20 blur-3xl" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center gap-10 px-4 py-10 lg:flex-row lg:items-center lg:px-8">
          <section className="auth-panel max-w-2xl">
            <div className="inline-flex items-center rounded-full border border-white/15 bg-white/8 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#f7d08a] backdrop-blur">
              Guided Setup
            </div>

            <h1 className="font-display mt-6 max-w-2xl text-5xl leading-none text-white sm:text-7xl">
              Launch an atelier command center that feels ready before day one.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-white/88 sm:text-lg">
              Create the first admin, lock in your studio identity, and unlock every operational feature in a few steps.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] border border-white/12 bg-white/8 p-6 backdrop-blur">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#f7d08a]">What You Unlock</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {FEATURE_PILLS.map((item) => (
                    <span key={item} className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm text-white/92">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/12 bg-[linear-gradient(145deg,_rgba(255,255,255,0.08),_rgba(255,255,255,0.02))] p-6 backdrop-blur">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#f7d08a]">Experience</p>
                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl bg-white/8 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/70">Design</p>
                    <p className="mt-2 text-lg font-semibold text-white">Branded setup flow</p>
                  </div>
                  <div className="rounded-2xl bg-white/8 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/70">Access</p>
                    <p className="mt-2 text-lg font-semibold text-white">Admin rights fixed for first run</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="auth-panel w-full max-w-3xl">
            <div className="rounded-[32px] border border-white/12 bg-white/92 p-5 text-slate-900 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8">
              <div className="mb-8 flex flex-wrap items-start justify-between gap-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9a3412]">
                    {currentStep.eyebrow}
                  </p>
                  <h2 className="mt-2 text-3xl font-bold text-slate-950">{currentStep.title}</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">{currentStep.caption}</p>
                </div>

                <div className="rounded-[24px] bg-slate-950 px-5 py-4 text-right text-white shadow-lg">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/75">Progress</p>
                  <p className="mt-1 text-2xl font-semibold">{step + 1} / {STEPS.length}</p>
                </div>
              </div>

              <div className="mb-8 grid gap-3 sm:grid-cols-4">
                {STEPS.map((item, index) => {
                  const isActive = index === step
                  const isComplete = index < step

                  return (
                    <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div
                        className={`h-2 rounded-full ${
                          isComplete
                            ? 'bg-[#c0392b]'
                            : isActive
                              ? 'bg-[#f59e0b]'
                              : 'bg-slate-200'
                        }`}
                      />
                        <p className={`mt-3 text-xs font-semibold uppercase tracking-[0.18em] ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>
                          {item.title}
                        </p>
                      </div>
                  )
                })}
              </div>

              {error && (
                <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {error}
                </div>
              )}

              {step === 0 && (
                <div className="space-y-6">
                  <div className="rounded-[30px] bg-[linear-gradient(135deg,_#2a1420_0%,_#4a1d28_55%,_#92511d_100%)] p-6 text-white">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.26em] text-[#fde2a7]">Studio Preview</p>
                        <h3 className="font-display mt-3 text-4xl leading-none">Beautiful outside, organized inside.</h3>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/92">
                        Your first admin account opens the full product experience.
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                      <div className="rounded-2xl bg-white/10 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/75">Operations</p>
                        <p className="mt-2 text-xl font-semibold">Orders & delivery</p>
                      </div>
                      <div className="rounded-2xl bg-white/10 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/75">Production</p>
                        <p className="mt-2 text-xl font-semibold">Fabric & workflow</p>
                      </div>
                      <div className="rounded-2xl bg-white/10 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/75">Insights</p>
                        <p className="mt-2 text-xl font-semibold">Revenue & reports</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={() => setStep(1)}
                      className="inline-flex flex-1 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#c0392b_0%,_#9f2d21_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_32px_rgba(192,57,43,0.24)] transition hover:translate-y-[-1px]"
                    >
                      Start Guided Setup
                    </button>
                    <button
                      onClick={() => navigate('/login')}
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Full Name *</label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#c0392b] focus:bg-white focus:ring-4 focus:ring-[#c0392b]/10"
                        placeholder="Your name"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Email *</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#c0392b] focus:bg-white focus:ring-4 focus:ring-[#c0392b]/10"
                        placeholder={SAMPLE_ADMIN.email}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Password *</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#c0392b] focus:bg-white focus:ring-4 focus:ring-[#c0392b]/10"
                        placeholder={SAMPLE_ADMIN.password}
                      />
                    </div>
                  </div>

                  <div className="rounded-[26px] border border-[#f2d6c8] bg-[#fff5ee] px-5 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a2f25]">Sample Admin Inputs</p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          Fill a clean sample owner profile that also matches the sign-in helper on the login screen.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={applySampleAdmin}
                        className="inline-flex items-center justify-center rounded-2xl bg-[#7f2f21] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#662419]"
                      >
                        Fill Sample Inputs
                      </button>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-[#edd2c3] bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Name</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{SAMPLE_ADMIN.name}</p>
                      </div>
                      <div className="rounded-2xl border border-[#edd2c3] bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Email</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{SAMPLE_ADMIN.email}</p>
                      </div>
                      <div className="rounded-2xl border border-[#edd2c3] bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Password</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{SAMPLE_ADMIN.password}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[26px] border border-amber-200 bg-amber-50 px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">First-Run Access</p>
                    <p className="mt-2 text-sm leading-6 text-amber-900">
                      The setup flow now creates your admin session first, so protected features and saved business settings work immediately.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                    <button
                      onClick={() => setStep(0)}
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={goToBusinessStep}
                      className="inline-flex items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#c0392b_0%,_#9f2d21_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(192,57,43,0.24)] transition hover:translate-y-[-1px]"
                    >
                      Continue to Business Profile
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="grid gap-5">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Business Name</label>
                      <input
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#c0392b] focus:bg-white focus:ring-4 focus:ring-[#c0392b]/10"
                        placeholder={SAMPLE_BUSINESS.businessName}
                      />
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Phone</label>
                        <input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#c0392b] focus:bg-white focus:ring-4 focus:ring-[#c0392b]/10"
                          placeholder={SAMPLE_BUSINESS.phone}
                        />
                      </div>

                      <div className="rounded-[26px] border border-slate-200 bg-slate-50 px-5 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Brand Surface</p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          These details become the base identity for invoices, customer records, and the main settings area.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Address</label>
                      <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#c0392b] focus:bg-white focus:ring-4 focus:ring-[#c0392b]/10"
                        rows={3}
                        placeholder={SAMPLE_BUSINESS.address}
                      />
                    </div>
                  </div>

                  <div className="rounded-[26px] border border-[#d8e3ee] bg-[#f7fafc] px-5 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">Sample Business Inputs</p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          Add a polished sample business identity so you can preview the app with realistic data immediately.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={applySampleBusiness}
                        className="inline-flex items-center justify-center rounded-2xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                      >
                        Fill Business Details
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                    <button
                      onClick={() => setStep(1)}
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleCreate}
                      disabled={loading}
                      className="inline-flex items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#c0392b_0%,_#9f2d21_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_32px_rgba(192,57,43,0.24)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? 'Creating Workspace...' : 'Complete Setup'}
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 text-center">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 shadow-inner">
                    <svg className="h-11 w-11 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-600">Ready to Go</p>
                    <h2 className="font-display mt-3 text-5xl leading-none text-slate-950">Your studio workspace is live.</h2>
                    <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-500">
                      Admin access is active, business details are saved, and the dashboard is now ready to show the full feature set.
                    </p>
                  </div>

                  <div className="grid gap-3 rounded-[30px] bg-slate-950 p-5 text-left text-white sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-white/75">Inventory</p>
                      <p className="mt-2 font-semibold">Track stock and materials</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-white/75">Work Orders</p>
                      <p className="mt-2 font-semibold">Coordinate production flow</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-white/75">Reports</p>
                      <p className="mt-2 font-semibold">Review revenue and performance</p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/dashboard')}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#c0392b_0%,_#9f2d21_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_32px_rgba(192,57,43,0.24)] transition hover:translate-y-[-1px]"
                  >
                    Go to Dashboard
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
