'use client'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Leaf, LogIn, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'

const DEMO = { email: 'umair.ali@hillsdaleacademy.edu', password: 'demo123', name: 'Umair Ali' }

const MOCK_USERS: Record<string, { name: string; password: string }> = {
  [DEMO.email]: { name: DEMO.name, password: DEMO.password },
}

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    const user = MOCK_USERS[email.trim().toLowerCase()]
    if (!user || user.password !== password) {
      toast.error('Invalid email or password.')
      setLoading(false)
      return
    }
    login(email.trim().toLowerCase(), user.name)
    toast.success(`Welcome back, ${user.name.split(' ')[0]}!`)
    navigate('/', { replace: true })
  }

  const fillDemo = () => {
    setEmail(DEMO.email)
    setPassword(DEMO.password)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d3d1f] via-[#1B6B3A] to-[#0f4a27] flex flex-col">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute top-1/2 -left-24 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-white/5" />
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 mb-4">
              <Leaf className="w-8 h-8 text-green-300" />
            </div>
            <h1 className="text-2xl font-bold text-white">Climate Learning Exchange</h1>
            <p className="text-white/60 text-sm mt-1">Sign in to your teacher account</p>
          </div>

          {/* Demo credentials callout */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-400/20 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">Try the Demo Account</p>
                <p className="text-xs text-white/70 mt-0.5 mb-2">Explore the full platform as a real teacher profile with pre-loaded data.</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-white/50 w-16 shrink-0">Teacher</span>
                    <span className="text-xs font-semibold text-white">Umair Ali</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-white/50 w-16 shrink-0">Email</span>
                    <span className="text-xs font-mono text-green-300">{DEMO.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-white/50 w-16 shrink-0">Password</span>
                    <span className="text-xs font-mono text-green-300">{DEMO.password}</span>
                  </div>
                </div>
                <button
                  onClick={fillDemo}
                  className="mt-3 text-xs font-semibold text-amber-300 hover:text-amber-200 underline underline-offset-2"
                >
                  Fill demo credentials →
                </button>
              </div>
            </div>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu"
                required
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#1B6B3A] text-white text-sm font-semibold rounded-xl hover:bg-[#0d4a28] transition-colors disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

            <p className="text-center text-xs text-gray-500">
              New to Climate Learning Exchange?{' '}
              <Link to="/signup" className="text-[#1B6B3A] font-semibold hover:underline">Create an account</Link>
            </p>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center">
        <p className="text-white/30 text-xs mb-3">Powered by</p>
        <div className="flex items-center justify-center gap-8">
          {/* Ten Strands logo */}
          <div className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-green-300" />
            </div>
            <div>
              <p className="text-white text-xs font-bold leading-tight">Ten Strands</p>
              <p className="text-white/50 text-[9px] leading-tight">Climate Education</p>
            </div>
          </div>

          <div className="w-px h-8 bg-white/20" />

          {/* Knowledge Platform logo */}
          <div className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-white text-xs font-bold leading-tight">Knowledge Platform</p>
              <p className="text-white/50 text-[9px] leading-tight">Education Technology</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
