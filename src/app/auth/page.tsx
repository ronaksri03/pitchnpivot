'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getClient } from '@/lib/supabase'

type Mode = 'login-individual' | 'login-manager' | 'signup-individual' | 'signup-manager'

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login-individual')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const sb = getClient()

  const isManager = mode.includes('manager')
  const isSignup = mode.includes('signup')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignup) {
        const meta = isManager
          ? { account_type: 'manager', first_name: firstName, last_name: lastName }
          : { account_type: 'individual', first_name: firstName, last_name: lastName }

        const { data, error: err } = await sb.auth.signUp({ email, password, options: { data: meta } })
        if (err) throw err

        if (data.user) {
          if (isManager) {
            await sb.from('managers').upsert({ id: data.user.id, name: `${firstName} ${lastName}`.trim(), company, role, created_at: new Date().toISOString() })
            router.replace('/dashboard')
          } else {
            await sb.from('profiles').upsert({ id: data.user.id, username: email.split('@')[0], first_name: firstName, last_name: lastName, created_at: new Date().toISOString() })
            router.replace('/profile')
          }
        }
      } else {
        const { data, error: err } = await sb.auth.signInWithPassword({ email, password })
        if (err) throw err
        const acct = data.user?.user_metadata?.account_type
        router.replace(acct === 'manager' ? '/dashboard' : '/profile')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '440px', margin: '60px auto', padding: '0 24px' }}>
      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
        {(['login-individual', 'login-manager', 'signup-individual', 'signup-manager'] as Mode[]).map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: '6px 14px', borderRadius: '8px', border: '1px solid',
            fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            borderColor: mode === m ? '#c8ff00' : '#2a2a2a',
            background: mode === m ? 'rgba(200,255,0,0.1)' : 'transparent',
            color: mode === m ? '#c8ff00' : '#555',
          }}>
            {m.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#f0ece4', marginBottom: '24px' }}>
        {isSignup ? `Sign up as ${isManager ? 'Manager' : 'Individual'}` : `Sign in as ${isManager ? 'Manager' : 'Individual'}`}
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {isSignup && (
          <>
            <input className="inp" placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} required />
            <input className="inp" placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} required />
            {isManager && (
              <>
                <input className="inp" placeholder="Company" value={company} onChange={e => setCompany(e.target.value)} />
                <input className="inp" placeholder="Your role (e.g. CTO, Founder)" value={role} onChange={e => setRole(e.target.value)} />
              </>
            )}
          </>
        )}
        <input className="inp" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input className="inp" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />

        {error && <div style={{ color: '#ff6b6b', fontSize: '13px' }}>{error}</div>}

        <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: '4px' }}>
          {loading ? 'Please wait…' : (isSignup ? 'Create account →' : 'Sign in →')}
        </button>
      </form>
    </div>
  )
}
