'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function NavBar() {
  const { user, accountType, displayName, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const router = useRouter()

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', height: '56px',
      background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #1a1a1a',
    }}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '18px', fontWeight: 800, color: '#c8ff00', letterSpacing: '-0.02em' }}>
          pitch<span style={{ color: '#f0ece4' }}>N</span>pivot
        </span>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <NavLink href="/discover">Discover</NavLink>
        <NavLink href="/lab">Project Lab</NavLink>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {!user ? (
          <Link href="/auth" style={{
            background: '#c8ff00', color: '#0a0a0a', padding: '8px 18px',
            borderRadius: '8px', fontWeight: 700, fontSize: '13px', textDecoration: 'none',
          }}>
            Get started →
          </Link>
        ) : (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
              }}
            >
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: '#c8ff00', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#0a0a0a',
              }}>
                {initials(displayName)}
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#f0ece4' }}>{displayName}</span>
              <span style={{
                fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                padding: '2px 8px', borderRadius: '20px',
                ...(accountType === 'manager'
                  ? { background: 'rgba(200,255,0,0.12)', border: '1px solid rgba(200,255,0,0.35)', color: '#c8ff00' }
                  : { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.18)', color: '#aaa' }
                ),
              }}>
                {accountType === 'manager' ? 'Manager' : 'Individual'}
              </span>
            </button>

            {open && (
              <div style={{
                position: 'absolute', right: 0, top: '44px',
                background: '#111', border: '1px solid #222', borderRadius: '10px',
                minWidth: '160px', padding: '6px', zIndex: 100,
              }}>
                {accountType === 'manager' ? (
                  <DropItem onClick={() => { router.push('/dashboard'); setOpen(false) }}>📊 My Dashboard</DropItem>
                ) : (
                  <DropItem onClick={() => { router.push('/profile'); setOpen(false) }}>👤 My Profile</DropItem>
                )}
                <div style={{ height: '1px', background: '#1e1e1e', margin: '4px 0' }} />
                <DropItem onClick={() => { signOut(); setOpen(false) }}>🚪 Sign out</DropItem>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={{
      fontSize: '13px', fontWeight: 500, color: '#888', textDecoration: 'none',
      padding: '6px 12px', borderRadius: '8px', transition: 'color 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.color = '#f0ece4')}
      onMouseLeave={e => (e.currentTarget.style.color = '#888')}
    >
      {children}
    </Link>
  )
}

function DropItem({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', background: 'none', border: 'none',
      color: '#ccc', fontSize: '13px', padding: '8px 12px', borderRadius: '7px',
      cursor: 'pointer',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = '#1a1a1a')}
      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
    >
      {children}
    </button>
  )
}
