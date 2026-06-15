'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getClient } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Profile } from '@/types'

const C = {
  obsidian: '#0a0a0a', slate: '#1a1a1a', filmLight: '#f0ece4',
  lime: '#c8ff00', gray: '#888', border: '#2a2a2a', charcoal: '#2d2d2d',
}

function initials(p: Profile) {
  return [(p.first_name || ''), (p.last_name || '')]
    .join(' ').trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

function fullName(p: Profile) {
  return [(p.first_name || ''), (p.last_name || '')].join(' ').trim() || p.username || 'Anonymous'
}

const AVAIL_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
]

export default function DiscoverPage() {
  const { user, accountType, loading: authLoading } = useAuth()
  const router = useRouter()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [filtered, setFiltered] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [availFilter, setAvailFilter] = useState('all')
  const sb = getClient()

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth')
    if (!authLoading && accountType === 'manager') router.replace('/lab')
  }, [authLoading, user, accountType, router])

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await sb.from('profiles').select('*').neq('id', user.id).order('created_at', { ascending: false })
    setProfiles(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (user && accountType === 'individual') load()
  }, [load, user, accountType])

  useEffect(() => {
    let results = [...profiles]
    if (search.trim()) {
      const term = search.toLowerCase()
      results = results.filter(p =>
        fullName(p).toLowerCase().includes(term) ||
        (p.job_title || '').toLowerCase().includes(term) ||
        (p.skills || []).some(s => s.toLowerCase().includes(term)) ||
        (p.location || '').toLowerCase().includes(term)
      )
    }
    if (availFilter !== 'all') results = results.filter(p => p.availability === availFilter)
    setFiltered(results)
  }, [profiles, search, availFilter])

  if (authLoading || loading) return (
    <div style={{ minHeight: '100vh', background: C.obsidian, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: `3px solid ${C.border}`, borderTopColor: C.lime, animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <div style={{ fontSize: 13, color: C.gray, fontFamily: 'monospace' }}>Loading talent…</div>
      </div>
    </div>
  )

  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', color: C.filmLight, fontFamily: 'Inter, sans-serif' }}>

      {/* Film strip */}
      <div style={{ height: 24, background: C.slate, display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', overflow: 'hidden' }}>
        {Array.from({ length: 60 }).map((_, i) => <div key={i} style={{ width: 16, height: 10, borderRadius: 2, background: C.obsidian, flexShrink: 0 }} />)}
      </div>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '36px 40px 24px' }}>
        <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.lime, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 8 }}>Discover</div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontFamily: 'monospace', fontWeight: 700, margin: '0 0 22px', lineHeight: 1 }}>Find Talent</h1>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
          <input
            style={{ flex: 1, minWidth: 220, maxWidth: 480, padding: '11px 16px', background: C.slate, border: `1px solid ${C.border}`, borderRadius: 10, color: C.filmLight, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            placeholder="Search by name, role, skill, location…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div style={{ fontSize: 13, color: C.gray }}>{filtered.length} individual{filtered.length !== 1 ? 's' : ''}</div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {AVAIL_OPTIONS.map(o => (
            <button key={o.value} onClick={() => setAvailFilter(o.value)}
              style={{ background: availFilter === o.value ? C.lime : 'transparent', color: availFilter === o.value ? C.obsidian : C.gray, border: `1px solid ${availFilter === o.value ? C.lime : C.border}`, borderRadius: 20, padding: '5px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding: '32px 40px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 15, color: C.gray }}>No individuals found. Try a different search.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
            {filtered.map(p => (
              <div key={p.id}
                onClick={() => router.push(`/profile/${p.username}`)}
                style={{ background: C.slate, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 14, transition: 'border-color 0.2s, transform 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.lime; e.currentTarget.style.transform = 'translateY(-3px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'translateY(0)' }}>

                {/* Avatar + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: C.lime, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: C.obsidian, flexShrink: 0 }}>
                    {initials(p)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fullName(p)}</div>
                    {p.job_title && <div style={{ fontSize: 12, color: C.gray, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.job_title}</div>}
                  </div>
                </div>

                {/* Badges */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {p.open_to_work && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: 'rgba(200,255,0,0.1)', border: '1px solid rgba(200,255,0,0.3)', color: C.lime, textTransform: 'uppercase', letterSpacing: '0.05em' }}>✦ Open to work</span>
                  )}
                  {p.availability && (
                    <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.gray, textTransform: 'capitalize' }}>{p.availability}</span>
                  )}
                </div>

                {/* Meta */}
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: C.gray }}>
                  {p.location && <span>📍 {p.location}</span>}
                  {p.years_exp && <span>⏱ {p.years_exp} yrs</span>}
                  {p.hourly_rate && <span style={{ color: C.lime, fontWeight: 700 }}>💰 {p.hourly_rate}/hr</span>}
                </div>

                {/* Top 3 skills */}
                {(p.skills || []).length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {p.skills.slice(0, 3).map(s => (
                      <span key={s} style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.18)', color: C.lime }}>{s}</span>
                    ))}
                    {p.skills.length > 3 && <span style={{ fontSize: 11, color: C.gray, padding: '2px 4px' }}>+{p.skills.length - 3} more</span>}
                  </div>
                )}

                <div style={{ marginTop: 'auto', fontSize: 12, color: C.lime, fontWeight: 600 }}>View profile →</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
