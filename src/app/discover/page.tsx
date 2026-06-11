'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getClient } from '@/lib/supabase'
import { Profile } from '@/types'
import { useAuth } from '@/context/AuthContext'
import { COMMUNITY_SKILLS, COMMUNITY_NAMES } from '@/lib/communities'
import ProfileModal from '@/components/ProfileModal'
import { Suspense } from 'react'

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

function gradientFor(skills: string[]) {
  const s = (skills[0] || '').toLowerCase()
  if (s.includes('python') || s.includes('ml') || s.includes('ai')) return 'linear-gradient(150deg,#0a0a00,#110800)'
  if (s.includes('figma') || s.includes('ui') || s.includes('design')) return 'linear-gradient(150deg,#0a000a,#12000e)'
  if (s.includes('solidity') || s.includes('web3')) return 'linear-gradient(150deg,#00080a,#00100e)'
  if (s.includes('flutter') || s.includes('react native')) return 'linear-gradient(150deg,#00030a,#000814)'
  if (s.includes('unity') || s.includes('game')) return 'linear-gradient(150deg,#08000a,#0d000f)'
  if (s.includes('go') || s.includes('kubernetes')) return 'linear-gradient(150deg,#000a08,#00110e)'
  return 'linear-gradient(150deg,#0a0a0a,#111)'
}

function emojiFor(skills: string[]) {
  const s = (skills[0] || '').toLowerCase()
  if (s.includes('python') || s.includes('ml') || s.includes('ai')) return '🤖'
  if (s.includes('figma') || s.includes('ui')) return '🎨'
  if (s.includes('solidity') || s.includes('web3')) return '⛓'
  if (s.includes('flutter') || s.includes('react native')) return '📱'
  if (s.includes('unity') || s.includes('game')) return '🎮'
  if (s.includes('go') || s.includes('kubernetes')) return '🌐'
  if (s.includes('react') || s.includes('typescript')) return '💻'
  return '🚀'
}

function embedUrl(url: string): string | null {
  try {
    if (url.includes('loom.com/share/')) return url.replace('loom.com/share/', 'loom.com/embed/')
    if (url.includes('loom.com/embed/')) return url
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
    if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1`
  } catch { /* noop */ }
  return null
}

function DiscoverContent() {
  const searchParams = useSearchParams()
  const communityTag = searchParams.get('community')

  const { user, accountType, loading: authLoading } = useAuth()
  const router = useRouter()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [search, setSearch] = useState('')
  const [openOnly, setOpenOnly] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [videoPreview, setVideoPreview] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const sb = getClient()

  // Managers are redirected — discover is for individuals
  useEffect(() => {
    if (!authLoading && accountType === 'manager') {
      router.replace('/dashboard')
    }
  }, [authLoading, accountType, router])

  const loadProfiles = useCallback(async () => {
    setLoading(true)

    // Exclude any profile IDs that are managers (edge case: dual-row accounts)
    const { data: mgrRows } = await sb.from('managers').select('id')
    const mgrIds = (mgrRows || []).map((m: { id: string }) => m.id)

    const baseSelect = 'id, username, first_name, last_name, location, skills, open_to_work, job_title, work_pref, years_exp, availability, hourly_rate, looking_for, github_url, portfolio_url, pronouns, intro_video_url'
    const fallbackSelect = 'id, username, first_name, last_name, location, skills, open_to_work, job_title, work_pref, years_exp, availability, hourly_rate, looking_for, github_url, portfolio_url, pronouns'

    let query = sb.from('profiles').select(baseSelect).limit(100)
    if (openOnly) query = query.eq('open_to_work', true)
    if (mgrIds.length > 0) query = query.not('id', 'in', `(${mgrIds.map((id: string) => `"${id}"`).join(',')})`)

    let { data, error: qErr } = await query

    // Fallback: intro_video_url column may not exist yet
    if (qErr) {
      let q2 = sb.from('profiles').select(fallbackSelect).limit(100)
      if (openOnly) q2 = q2.eq('open_to_work', true)
      if (mgrIds.length > 0) q2 = q2.not('id', 'in', `(${mgrIds.map((id: string) => `"${id}"`).join(',')})`)
      const { data: d2 } = await q2
      data = d2
    }

    let results: Profile[] = (data || []) as Profile[]

    // Determine active search terms (community or manual)
    const activeSearch = communityTag
      ? (COMMUNITY_SKILLS[communityTag] || communityTag)
      : search

    const terms = activeSearch.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)

    if (terms.length > 0) {
      results = results.filter(p => {
        const pSkills = (p.skills || []).map(s => s.toLowerCase())
        const text = [p.username, p.first_name, p.last_name, p.location, p.job_title].filter(Boolean).join(' ').toLowerCase()
        return terms.some(term =>
          pSkills.some(skill => skill.includes(term) || term.includes(skill)) ||
          (terms.length === 1 && text.includes(term))
        )
      })
    }

    setProfiles(results.slice(0, 24))
    setLoading(false)
  }, [search, openOnly, communityTag])

  useEffect(() => {
    loadProfiles()
  }, [loadProfiles])

  const communityLabel = communityTag ? COMMUNITY_NAMES[communityTag] || communityTag : null

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f0ece4', marginBottom: '24px' }}>
        Discover Talent
      </h1>

      {/* Search bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          className="inp"
          style={{ flex: 1, minWidth: '200px' }}
          placeholder="Search by skill, role, or location…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          disabled={!!communityTag}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#888', cursor: 'pointer' }}>
          <input type="checkbox" checked={openOnly} onChange={e => setOpenOnly(e.target.checked)} />
          Open to work only
        </label>
      </div>

      {/* Community filter label */}
      {communityLabel && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <span style={{ background: 'rgba(200,255,0,0.12)', border: '1px solid rgba(200,255,0,0.3)', color: '#c8ff00', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
            {communityLabel}
          </span>
          <span style={{ color: '#555', fontSize: '12px' }}>Members with matching skills</span>
          <a href="/discover" style={{ fontSize: '12px', color: '#555', textDecoration: 'none' }}>✕ Clear</a>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : profiles.length === 0 ? (
        <div className="empty-state">No profiles found. Try a different search.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {profiles.map(p => {
            const name = [(p.first_name || ''), (p.last_name || '')].join(' ').trim() || p.username || 'Anonymous'
            const hasVideo = !!(p as Profile & { intro_video_url?: string | null }).intro_video_url
            const pFull = p as Profile & { intro_video_url?: string | null; years_exp?: string | null; availability?: string | null; hourly_rate?: string | null; looking_for?: string | null }
            return (
              <div key={p.id} onClick={() => user ? setSelectedId(p.id) : window.location.href = '/auth'} style={{
                background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: '16px',
                overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.2s, transform 0.15s',
                position: 'relative',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#333'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#1e1e1e'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}
              >
                {/* Art header */}
                <div style={{ height: '80px', background: gradientFor(p.skills || []), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', position: 'relative' }}>
                  {emojiFor(p.skills || [])}
                  {hasVideo && (
                    <button onClick={e => { e.stopPropagation(); setVideoPreview(p as Profile) }} style={{
                      position: 'absolute', right: '10px', top: '10px',
                      background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(200,255,0,0.4)',
                      color: '#c8ff00', borderRadius: '20px', padding: '4px 10px',
                      fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                    }}>▶ Intro</button>
                  )}
                  {p.open_to_work && (
                    <span style={{
                      position: 'absolute', left: '10px', top: '10px',
                      fontSize: '10px', fontWeight: 700, color: '#c8ff00',
                      background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(200,255,0,0.35)',
                      borderRadius: '20px', padding: '3px 8px',
                    }}>● Open to work</span>
                  )}
                </div>

                {/* Body */}
                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Avatar + name row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
                      border: '2px solid #2a2a2a', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#c8ff00',
                    }}>{initials(name)}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: '#f0ece4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                      {p.job_title && <div style={{ fontSize: '12px', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.job_title}</div>}
                    </div>
                  </div>

                  {/* Meta row */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {p.location && <span style={{ fontSize: '11px', color: '#666' }}>📍 {p.location}</span>}
                    {p.work_pref && <span style={{ fontSize: '11px', color: '#666' }}>· {p.work_pref}</span>}
                    {pFull.years_exp && <span style={{ fontSize: '11px', color: '#666' }}>· {pFull.years_exp} yrs exp</span>}
                  </div>

                  {/* Availability + rate */}
                  {(pFull.availability || pFull.hourly_rate) && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {pFull.availability && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#111', border: '1px solid #2a2a2a', color: '#aaa' }}>{pFull.availability}</span>}
                      {pFull.hourly_rate && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#111', border: '1px solid #2a2a2a', color: '#aaa' }}>💰 {pFull.hourly_rate}/hr</span>}
                    </div>
                  )}

                  {/* Looking for */}
                  {pFull.looking_for && <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{pFull.looking_for}</div>}

                  {/* Skills */}
                  {(p.skills || []).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {(p.skills || []).slice(0, 4).map(s => (
                        <span key={s} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.18)', color: '#c8ff00' }}>{s}</span>
                      ))}
                      {(p.skills || []).length > 4 && <span style={{ fontSize: '11px', color: '#555' }}>+{(p.skills || []).length - 4}</span>}
                    </div>
                  )}

                  {/* Links row */}
                  <div style={{ display: 'flex', gap: '10px', paddingTop: '4px', borderTop: '1px solid #1a1a1a' }}>
                    {(p as Profile).github_url && <span style={{ fontSize: '11px', color: '#555' }}>GitHub ✓</span>}
                    {(p as Profile).portfolio_url && <span style={{ fontSize: '11px', color: '#555' }}>Portfolio ✓</span>}
                    <span style={{ fontSize: '11px', color: '#333', marginLeft: 'auto' }}>View profile →</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Video preview modal */}
      {videoPreview && (() => {
        const vp = videoPreview as Profile & { intro_video_url?: string | null }
        const embed = vp.intro_video_url ? embedUrl(vp.intro_video_url) : null
        const vpName = [(vp.first_name || ''), (vp.last_name || '')].join(' ').trim() || vp.username || 'Anonymous'
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}
            onClick={() => setVideoPreview(null)}>
            <div style={{ background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: '20px', width: '100%', maxWidth: '640px', overflow: 'hidden' }}
              onClick={e => e.stopPropagation()}>
              {embed ? (
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                  <iframe src={embed} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} allow="autoplay; fullscreen" allowFullScreen />
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#555' }}>Video unavailable</div>
              )}
              <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '16px', color: '#f0ece4' }}>{vpName}</div>
                  {vp.job_title && <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>{vp.job_title}</div>}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setVideoPreview(null)} style={{ padding: '8px 16px', background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Close</button>
                  <button onClick={() => { setSelectedId(vp.id); setVideoPreview(null) }} style={{ padding: '8px 16px', background: '#c8ff00', border: 'none', color: '#0a0a0a', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>View full profile →</button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Profile modal */}
      {selectedId && (
        <ProfileModal profileId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={<div className="empty-state">Loading…</div>}>
      <DiscoverContent />
    </Suspense>
  )
}
