'use client'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, GraduationCap, Leaf, UserPlus } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'

const GRADE_OPTIONS = ['TK', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
const SUBJECT_OPTIONS = ['Science', 'Environmental Science', 'Climate', 'Biology', 'Earth Science', 'Ecology', 'Agriculture', 'Wetlands', 'Marine Science', 'Mathematics', 'English', 'Social Studies', 'Art']

export function SignupPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)

  const [school, setSchool] = useState('')
  const [county, setCounty] = useState('')
  const [grades, setGrades] = useState<string[]>([])
  const [subjects, setSubjects] = useState<string[]>([])

  const toggleGrade = (g: string) => setGrades((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g])
  const toggleSubject = (s: string) => setSubjects((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { toast.error('Passwords do not match.'); return }
    if (password.length < 6) { toast.error('Password must be at least 6 characters.'); return }
    setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (grades.length === 0) { toast.error('Please select at least one grade level.'); return }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    login(email.trim().toLowerCase(), name.trim())
    toast.success(`Welcome to the Climate Learning Exchange, ${name.split(' ')[0]}!`)
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d3d1f] via-[#1B6B3A] to-[#0f4a27] flex flex-col">
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
              <GraduationCap className="w-8 h-8 text-green-300" />
            </div>
            <h1 className="text-2xl font-bold text-white">Join Climate Learning Exchange</h1>
            <p className="text-white/60 text-sm mt-1">Connect with outdoor education programs near you</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mb-6">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  step >= s ? 'bg-white text-[#1B6B3A] border-white' : 'bg-transparent text-white/40 border-white/30'
                }`}>{s}</div>
                {s < 2 && <div className={`w-12 h-0.5 ${step > s ? 'bg-white' : 'bg-white/30'}`} />}
              </div>
            ))}
          </div>

          {/* Step 1: Account info */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="bg-white rounded-2xl shadow-2xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-gray-900">Create your account</h2>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Umair Ali" required
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">School email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" required
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" required
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Confirm password</label>
                <input type={showPass ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter your password" required
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500" />
              </div>

              <button type="submit"
                className="w-full py-2.5 bg-[#1B6B3A] text-white text-sm font-semibold rounded-xl hover:bg-[#0d4a28] transition-colors">
                Continue →
              </button>

              <p className="text-center text-xs text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="text-[#1B6B3A] font-semibold hover:underline">Sign in</Link>
              </p>
            </form>
          )}

          {/* Step 2: Teaching profile */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-gray-900">Your teaching profile</h2>
              <p className="text-xs text-gray-500 -mt-2">Help us match you with the best outdoor education programs.</p>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">School name</label>
                <input type="text" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="e.g. Hillsdale Academy"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">County</label>
                <input type="text" value={county} onChange={(e) => setCounty(e.target.value)} placeholder="e.g. Alameda"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Grade levels you teach <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-1.5">
                  {GRADE_OPTIONS.map((g) => (
                    <button key={g} type="button" onClick={() => toggleGrade(g)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
                        grades.includes(g) ? 'bg-[#1B6B3A] text-white border-[#1B6B3A]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-green-400'
                      }`}>{g}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Subjects you teach</label>
                <div className="flex flex-wrap gap-1.5">
                  {SUBJECT_OPTIONS.map((s) => (
                    <button key={s} type="button" onClick={() => toggleSubject(s)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
                        subjects.includes(s) ? 'bg-[#1B6B3A] text-white border-[#1B6B3A]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-green-400'
                      }`}>{s}</button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
                  ← Back
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1B6B3A] text-white text-sm font-semibold rounded-xl hover:bg-[#0d4a28] transition-colors disabled:opacity-60">
                  {loading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  {loading ? 'Creating account…' : 'Create Account'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center">
        <p className="text-white/30 text-xs mb-3">Powered by</p>
        <div className="flex items-center justify-center gap-8">
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
          <div className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
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
