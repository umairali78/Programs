'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus } from 'lucide-react'

export default function CreateUserForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('DESIGNER')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to create user')
    } else {
      setName(''); setEmail(''); setPassword('')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="card p-5">
      <h2 className="font-semibold text-gray-900 mb-4">Create User</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label">Password</label>
          <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </div>
        <div>
          <label className="label">Role</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="ADMIN">Admin</option>
            <option value="DESIGNER">Instructional Designer</option>
            <option value="WRITER">Content Writer</option>
            <option value="REVIEWER">Reviewer</option>
          </select>
        </div>
        {error && <p className="col-span-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}
        <div className="col-span-2">
          <button type="submit" className="btn-primary" disabled={loading}>
            <UserPlus className="w-4 h-4" />
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  )
}
