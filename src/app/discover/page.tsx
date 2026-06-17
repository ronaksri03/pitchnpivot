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

// Extract YouTube thumbnail from URL
function getYoutubeThumbnail(url: string | null): string | null {
  if (!url) return null
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null
}

// Availability badge color
function availColor(avail: string) {
  const map: Record<string, string> = {
    'full-time': '#c8ff00', 'contract': '#7090ff',
    'freelance': '#ff9f43', 'part-time': '#00f5ff', 'internship': '#ff006e',
  }
  return map[avail] || '#888'
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
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const sb = getClient()

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth')
  }, [authLoading, user, router])

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    // Exclude current user and all managers
    const { data: managerRows } = await sb.from('managers').select('id')
    const managerIds = (managerRows || []).map((m: any) => m.id)
    let query = sb.from('profiles').select('*, reels(id, is_verified)').neq('id', user.id)
    if (managerIds.length > 0) query = query.not('id', 'in', `(${managerIds.join(',')})`)
    const { data } = await query.order('created_at', { ascending: false })
    // Attach verified reel count to each profile
    setProfiles((data || []).map((p: any) => ({
      ...p,
      _verified_count: (p.reels || []).filter((r: any) => r.is_verified).length,
    })))
    setLoading(false)
  }, [user])

  useEffect(() => { if (user) load() }, [load, user])

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
    // Sort: verified reels first, then by created_at
    results.sort((a: any, b: any) => (b._verified_count || 0) - (a._verified_count || 0))
    setFiltered(results)
  }, [profiles, search, availFilter])

  if (authLoading || loading) return (
    <div style={{ minHeight: '100vh', background: C.obsidian, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 56 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: `3px solid ${C.border}`, borderTopColor: C.lime, animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <div style={{ fontSize: 13, color: C.gray, fontFamily: 'monospace' }}>Loading talent…</div>
      </div>
    </div>
  )

  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', color: C.filmLight, fontFamily: 'Inter, sans-serif', paddingTop: 56 }}>

      {/* ── HEADER ── */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '40px 40px 28px' }}>

        {/* Film strip */}
        <div style={{ height: 22, background: C.slate, display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', overflow: 'hidden', marginBottom: 28, marginLeft: -40, marginRight: -40, marginTop: -40 }}>
          {Array.from({ length: 60 }).map((_, i) => <div key={i} style={{ width: 16, height: 10, borderRadius: 2, background: C.obsidian, flexShrink: 0 }} />)}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.lime, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 8 }}>Discover</div>
            <h1 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontFamily: 'monospace', fontWeight: 700, margin: '0 0 6px', lineHeight: 1 }}>Find Talent</h1>
            <p style={{ margin: 0, fontSize: 14, color: C.gray }}>{filtered.length} individual{filtered.length !== 1 ? 's' : ''} · click a card to view their full profile & video CV</p>
          </div>
        </div>

        {/* Search + filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            style={{ maxWidth: 520, width: '100%', padding: '12px 18px', background: C.slate, border: `1px solid ${C.border}`, borderRadius: 12, color: C.filmLight, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            placeholder="Search by name, role, skill, or location…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {AVAIL_OPTIONS.map(o => (
              <button key={o.value} onClick={() => setAvailFilter(o.value)}
                style={{ background: availFilter === o.value ? C.lime : 'transparent', color: availFilter === o.value ? C.obsidian : C.gray, border: `1px solid ${availFilter === o.value ? C.lime : C.border}`, borderRadius: 20, padding: '5px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── GRID ── */}
      <div style={{ padding: '36px 40px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: C.slate, border: `1px dashed ${C.border}`, borderRadius: 16 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 15, color: C.gray }}>No individuals found. Try a different search or filter.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 24 }}>
            {filtered.map(p => {
              const thumbnail = getYoutubeThumbnail(p.intro_video_url)
              const hasVideo = !!p.intro_video_url
              const isHovered = hoveredId === p.id
              const name = fullName(p)

              return (
                <div key={p.id}
                  onClick={() => p.username && router.push(`/profile/${p.username}`)}
                  onMouseEnter={() => setHoveredId(p.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    background: C.slate,
                    border: `1px solid ${isHovered ? C.lime : C.border}`,
                    borderRadius: 18,
                    overflow: 'hidden',
                    cursor: p.username ? 'pointer' : 'default',
                    transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                    transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
                    boxShadow: isHovered ? `0 12px 40px rgba(200,255,0,0.08)` : '0 2px 8px rgba(0,0,0,0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}>

                  {/* ── VIDEO / HERO SECTION ── */}
                  <div style={{ position: 'relative', height: 200, overflow: 'hidden', flexShrink: 0 }}>
                    {thumbnail ? (
                      <>
                        <img src={thumbnail} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isHovered ? 0.7 : 0.55, transition: 'opacity 0.2s' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,10,10,0.1) 0%, rgba(10,10,10,0.85) 100%)' }} />
                      </>
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, #0a0a0a 0%, #0d1a00 50%, #0a0a0a 100%)` }}>
                        {/* Subtle animated orbs */}
                        <div style={{ position: 'absolute', top: '30%', left: '20%', width: 120, height: 120, borderRadius: '50%', background: 'rgba(200,255,0,0.06)', filter: 'blur(40px)' }} />
                        <div style={{ position: 'absolute', bottom: '20%', right: '15%', width: 80, height: 80, borderRadius: '50%', background: 'rgba(200,255,0,0.04)', filter: 'blur(30px)' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(10,10,10,0.9) 100%)' }} />
                      </div>
                    )}

                    {/* Video CV badge */}
                    {hasVideo && (
                      <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(10,10,10,0.75)', border: `1px solid rgba(200,255,0,0.4)`, borderRadius: 20, padding: '4px 10px', backdropFilter: 'blur(6px)' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.lime }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: C.lime, letterSpacing: '0.08em' }}>VIDEO CV</span>
                      </div>
                    )}

                    {/* Open to work badge */}
                    {p.open_to_work && (
                      <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(200,255,0,0.12)', border: `1px solid rgba(200,255,0,0.4)`, borderRadius: 20, padding: '4px 10px', backdropFilter: 'blur(6px)' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: C.lime, letterSpacing: '0.05em' }}>✦ OPEN TO WORK</span>
                      </div>
                    )}

                    {/* Avatar + name overlaid on hero */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 20px 16px', display: 'flex', alignItems: 'flex-end', gap: 14 }}>
                      <div style={{ width: 52, height: 52, borderRadius: '50%', background: C.lime, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: C.obsidian, flexShrink: 0, boxShadow: `0 0 0 3px rgba(10,10,10,0.8)` }}>
                        {initials(p)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: C.filmLight, lineHeight: 1.2, fontFamily: 'monospace', textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}>
                          {name}
                        </div>
                        {p.job_title && (
                          <div style={{ fontSize: 13, color: 'rgba(240,236,228,0.75)', marginTop: 2, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                            {p.job_title}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── BODY SECTION ── */}
                  <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>

                    {/* Meta row */}
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12 }}>
                      {p.location && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.gray }}>
                          <span>📍</span><span>{p.location}</span>
                        </span>
                      )}
                      {p.years_exp && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.gray }}>
                          <span>⏱</span><span>{p.years_exp} yrs exp</span>
                        </span>
                      )}
                      {p.hourly_rate && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.lime, fontWeight: 700 }}>
                          <span>💰</span><span>{p.hourly_rate}/hr</span>
                        </span>
                      )}
                      {p.availability && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: `${availColor(p.availability)}15`, border: `1px solid ${availColor(p.availability)}40`, color: availColor(p.availability), textTransform: 'capitalize' }}>
                          {p.availability}
                        </span>
                      )}
                    </div>

                    {/* Skills */}
                    {(p.skills || []).length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, fontFamily: 'monospace', color: C.charcoal, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Tech Stack</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {p.skills.slice(0, 6).map(s => (
                            <span key={s} style={{ fontSize: 12, padding: '4px 11px', borderRadius: 20, background: 'rgba(200,255,0,0.07)', border: '1px solid rgba(200,255,0,0.2)', color: C.lime, fontWeight: 500 }}>
                              {s}
                            </span>
                          ))}
                          {p.skills.length > 6 && (
                            <span style={{ fontSize: 12, padding: '4px 11px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.gray }}>
                              +{p.skills.length - 6} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* CTA */}
                    <div style={{ marginTop: 'auto', paddingTop: 4, display: 'flex', gap: 10 }}>
                      <button
                        onClick={e => { e.stopPropagation(); p.username && router.push(`/profile/${p.username}`) }}
                        style={{ flex: 1, padding: '10px', background: isHovered ? C.lime : 'rgba(200,255,0,0.08)', color: isHovered ? C.obsidian : C.lime, border: `1px solid ${isHovered ? C.lime : 'rgba(200,255,0,0.25)'}`, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                        {hasVideo ? '🎬 View Profile & Video CV' : '👤 View Full Profile'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
