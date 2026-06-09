'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getClient } from '@/lib/supabase'

type Mode = 'login' | 'signup'
type AccountType = 'individual' | 'manager'

const inp: React.CSSProperties = {
  width: '100%', padding: '11px 14px', background: '#111', border: '1px solid #2a2a2a',
  borderRadius: '8px', color: '#f0ece4', fontSize: '15px', outline: 'none',
  boxSizing: 'border-box',
}
const selectStyle: React.CSSProperties = {
  ...inp,
  cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
  paddingRight: '36px',
}
const label: React.CSSProperties = {
  fontSize: '12px', fontWeight: 600, color: '#666', letterSpacing: '0.05em', marginBottom: '5px', display: 'block',
}

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [accountType, setAccountType] = useState<AccountType>('individual')
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

  const isManager = accountType === 'manager'
  const isSignup = mode === 'signup'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignup) {
        const meta = {
          account_type: accountType,
          first_name: firstName,
          last_name: lastName,
        }
        const { data, error: err } = await sb.auth.signUp({ email, password, options: { data: meta } })
        if (err) throw err

        if (data.user) {
          if (isManager) {
            await sb.from('managers').upsert({
              id: data.user.id,
              name: `${firstName} ${lastName}`.trim(),
              company,
              role,
              created_at: new Date().toISOString(),
            })
            router.replace('/dashboard')
          } else {
            await sb.from('profiles').upsert({
              id: data.user.id,
              username: email.split('@')[0],
              first_name: firstName,
              last_name: lastName,
              created_at: new Date().toISOString(),
            })
            router.replace('/profile')
          }
        }
      } else {
        const { data, error: err } = await sb.auth.signInWithPassword({ email, password })
        if (err) throw err
        const acct = data.user?.user_metadata?.account_type
        if (acct && acct !== accountType) {
          await sb.auth.signOut()
          throw new Error(
            acct === 'manager'
              ? 'This is a manager account. Please select \'Manager\' to sign in.'
              : 'This is an individual account. Please select \'Individual\' to sign in.'
          )
        }
        router.replace(acct === 'manager' ? '/dashboard' : '/profile')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#f0ece4', letterSpacing: '-0.5px' }}>
            pitch<span style={{ color: '#c8ff00' }}>N</span>pivot
          </div>
          <div style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>
            {isSignup ? 'Create your account' : 'Welcome back'}
          </div>
        </div>

        {/* Login / Signup tabs */}
        <div style={{ display: 'flex', background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px', padding: '4px', marginBottom: '24px', gap: '4px' }}>
          {(['login', 'signup'] as Mode[]).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: '8px', borderRadius: '7px', border: 'none',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              background: mode === m ? '#1e1e1e' : 'transparent',
              color: mode === m ? '#f0ece4' : '#555',
              transition: 'all 0.15s',
            }}>
              {m === 'login' ? 'Sign in' : 'Sign up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Account type selector — shown on both login and signup */}
          <div>
            <label style={label}>{isSignup ? 'I am a' : 'Sign in as'}</label>
            <div style={{ position: 'relative' }}>
              <select
                value={accountType}
                onChange={e => setAccountType(e.target.value as AccountType)}
                style={{ ...selectStyle, color: accountType ? '#f0ece4' : '#555' }}
              >
                <option value="individual">Individual — looking for work / projects</option>
                <option value="manager">Manager — hiring or posting projects</option>
              </select>
            </div>
          </div>

          {/* Signup-only fields */}
          {isSignup && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={label}>First name</label>
                <input style={inp} placeholder="Alex" value={firstName} onChange={e => setFirstName(e.target.value)} required />
              </div>
              <div>
                <label style={label}>Last name</label>
                <input style={inp} placeholder="Chen" value={lastName} onChange={e => setLastName(e.target.value)} required />
              </div>
            </div>
          )}

          {/* Manager-specific signup fields */}
          {isSignup && isManager && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={label}>Company</label>
                <input style={inp} placeholder="Acme Inc." value={company} onChange={e => setCompany(e.target.value)} />
              </div>
              <div>
                <label style={label}>Your role</label>
                <input style={inp} placeholder="CTO, Founder…" value={role} onChange={e => setRole(e.target.value)} />
              </div>
            </div>
          )}

          <div>
            <label style={label}>Email</label>
            <input style={inp} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label style={label}>Password</label>
            <input style={inp} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          {error && (
            <div style={{ background: 'rgba(255,100,100,0.08)', border: '1px solid rgba(255,100,100,0.2)', borderRadius: '8px', padding: '10px 12px', color: '#ff6b6b', fontSize: '13px' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px', background: loading ? '#333' : '#c8ff00',
              color: '#0a0a0a', border: 'none', borderRadius: '8px',
              fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '4px', transition: 'background 0.15s',
            }}
          >
            {loading ? 'Please wait…' : isSignup ? `Create ${isManager ? 'manager' : 'individual'} account →` : 'Sign in →'}
          </button>

          <div style={{ textAlign: 'center', fontSize: '12px', color: '#444' }}>
            {isSignup ? 'Already have an account? ' : "Don't have an account? "}
            <button type="button" onClick={() => setMode(isSignup ? 'login' : 'signup')} style={{
              background: 'none', border: 'none', color: '#c8ff00', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
            }}>
              {isSignup ? 'Sign in' : 'Sign up'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
