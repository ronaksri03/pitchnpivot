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

function DiscoverContent() {
  const searchParams = useSearchParams()
  const communityTag = searchParams.get('community')

  const { user, accountType, loading: authLoading } = useAuth()
  const router = useRouter()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [search, setSearch] = useState('')
  const [openOnly, setOpenOnly] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
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

    let query = sb.from('profiles')
      .select('id, username, first_name, last_name, location, skills, open_to_work, job_title, work_pref')
      .limit(100)
    if (openOnly) query = query.eq('open_to_work', true)
    if (mgrIds.length > 0) query = query.not('id', 'in', `(${mgrIds.map((id: string) => `"${id}"`).join(',')})`)

    const { data } = await query
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
        <div className="feed-grid">
          {profiles.map(p => {
            const name = [(p.first_name || ''), (p.last_name || '')].join(' ').trim() || p.username || 'Anonymous'
            const role = [p.job_title, p.location].filter(Boolean).join(' · ')
            return (
              <div key={p.id} className="vcard" onClick={() => user ? setSelectedId(p.id) : window.location.href = '/auth'}>
                <div className="vcard-art" style={{ background: gradientFor(p.skills || []) }}>
                  {emojiFor(p.skills || [])}
                </div>
                <div className="vcard-info">
                  <div className="vcard-av">{initials(name)}</div>
                  <div className="vcard-name">{name}</div>
                  {role && <div className="vcard-role">{role}</div>}
                  <div className="vcard-tags">
                    {(p.skills || []).slice(0, 3).map(s => (
                      <span key={s} className="vtag" style={{ fontSize: '11px' }}>{s}</span>
                    ))}
                    {p.open_to_work && (
                      <span style={{ fontSize: '10px', color: '#c8ff00', padding: '2px 7px', borderRadius: '20px', background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)' }}>
                        Open
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

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
