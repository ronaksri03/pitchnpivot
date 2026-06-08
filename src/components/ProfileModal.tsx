'use client'

import { useEffect, useState } from 'react'
import { getClient } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Profile, Reel, IndividualProject, ManagerProject } from '@/types'

interface Props {
  profileId: string
  onClose: () => void
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const AVAIL_MAP: Record<string, string> = {
  'full-time': '🟢 Full-time', 'part-time': '🟡 Part-time',
  'freelance': '⚡ Freelance', 'contract': '📄 Contract', 'internship': '🎓 Internship',
}
const PREF_MAP: Record<string, string> = {
  'remote': '🌍 Remote', 'onsite': '🏢 On-site', 'hybrid': '🔀 Hybrid', 'flexible': '🔀 Flexible',
}
const STATUS_MAP: Record<string, string> = {
  'completed': '✅ Completed', 'in-progress': '🔨 In Progress', 'idea': '💡 Idea',
}

export default function ProfileModal({ profileId, onClose }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [reels, setReels] = useState<Reel[]>([])
  const [projects, setProjects] = useState<IndividualProject[]>([])
  const [loading, setLoading] = useState(true)
  const [showAssign, setShowAssign] = useState(false)
  const [myProjects, setMyProjects] = useState<ManagerProject[]>([])
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [assignDone, setAssignDone] = useState(false)
  const { user, accountType } = useAuth()
  const sb = getClient()

  useEffect(() => {
    async function load() {
      const [profRes, reelRes, projRes] = await Promise.all([
        sb.from('profiles').select('*').eq('id', profileId).single(),
        sb.from('reels').select('*').eq('user_id', profileId).eq('visibility', 'public').order('created_at', { ascending: false }),
        sb.from('individual_projects').select('*').eq('user_id', profileId).eq('visibility', 'public').order('created_at', { ascending: false }),
      ])
      setProfile(profRes.data)
      setReels(reelRes.data || [])
      setProjects(projRes.data || [])
      setLoading(false)

      // Log profile view — check both metadata and managers table
      const { data: { user } } = await sb.auth.getUser()
      if (user) {
        const isManagerByMeta = user.user_metadata?.account_type === 'manager'
        const { data: managerRow } = await sb.from('managers').select('id').eq('id', user.id).maybeSingle()
        const isManager = isManagerByMeta || !!managerRow
        console.log('[profile_views] user:', user.id, 'isManager:', isManager, 'meta:', user.user_metadata?.account_type)
        if (isManager) {
          const { error: viewErr } = await sb.from('profile_views').insert({
            profile_user_id: profileId,
            manager_id: user.id,
            viewed_at: new Date().toISOString(),
          })
          if (viewErr) console.error('[profile_views insert error]', viewErr.message, viewErr.code, viewErr.details)
          else console.log('[profile_views] view recorded successfully')
        }
      }
    }
    load()
  }, [profileId])

  const p = profile
  const name = p ? ([(p.first_name || ''), (p.last_name || '')].join(' ').trim() || p.username || 'Anonymous') : ''
  const subtitle = p ? [p.job_title, p.years_exp ? `${p.years_exp} yrs exp` : null, p.location ? `📍 ${p.location}` : null].filter(Boolean).join(' · ') : ''

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <button className="modal-close" onClick={onClose} style={{
          position: 'absolute', top: '16px', right: '16px',
          background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888',
          borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer',
          fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>✕</button>
        {(accountType === 'manager') && !loading && p && (
          <div style={{ position: 'absolute', top: '16px', left: '16px' }}>
            {!showAssign ? (
              <button onClick={() => setShowAssign(true)} style={{ padding: '5px 12px', background: 'rgba(200,255,0,0.1)', border: '1px solid rgba(200,255,0,0.3)', color: '#c8ff00', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                + Assign Project
              </button>
            ) : (
              <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '12px', minWidth: '240px' }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px', fontWeight: 600 }}>Assign to {name.split(' ')[0]}</div>
                {assignDone ? (
                  <div style={{ color: '#c8ff00', fontSize: '13px', fontWeight: 600 }}>✓ Assigned!</div>
                ) : myProjects.length === 0 ? (
                  <div style={{ color: '#555', fontSize: '12px' }}>No open projects. Create one in Dashboard.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {myProjects.map(proj => (
                      <button key={proj.id} disabled={assigningId === proj.id} onClick={async () => {
                        setAssigningId(proj.id)
                        await sb.from('manager_projects').update({ assigned_to: profileId, visibility: 'private', status: 'draft' }).eq('id', proj.id)
                        setAssignDone(true)
                        setTimeout(() => { setShowAssign(false); setAssignDone(false); setAssigningId(null) }, 1500)
                      }} style={{ padding: '7px 10px', background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#ccc', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', textAlign: 'left', fontWeight: 500 }}>
                        {assigningId === proj.id ? 'Assigning…' : proj.title}
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={() => setShowAssign(false)} style={{ marginTop: '8px', background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '11px' }}>Cancel</button>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#555' }}>Loading…</div>
        ) : !p ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#555' }}>Profile not found.</div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '50%',
                background: '#c8ff00', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '22px', fontWeight: 700,
                color: '#0a0a0a', flexShrink: 0,
              }}>{initials(name)}</div>
              <div>
                <div style={{ fontSize: '19px', fontWeight: 700, color: '#f0ece4' }}>{name}</div>
                {subtitle && <div style={{ fontSize: '13px', color: '#777', marginTop: '3px' }}>{subtitle}</div>}
                {p.username && <div style={{ fontSize: '12px', color: '#444', marginTop: '2px' }}>@{p.username}</div>}
              </div>
            </div>

            {/* Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
              {p.open_to_work && (
                <span style={{ background: 'rgba(200,255,0,0.12)', border: '1px solid rgba(200,255,0,0.35)', color: '#c8ff00', padding: '3px 10px', borderRadius: '20px', fontSize: '11px' }}>✦ Open to Work</span>
              )}
              {p.availability && AVAIL_MAP[p.availability] && (
                <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid #333', color: '#aaa', padding: '3px 10px', borderRadius: '20px', fontSize: '11px' }}>{AVAIL_MAP[p.availability]}</span>
              )}
              {p.work_pref && PREF_MAP[p.work_pref] && (
                <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid #333', color: '#aaa', padding: '3px 10px', borderRadius: '20px', fontSize: '11px' }}>{PREF_MAP[p.work_pref]}</span>
              )}
            </div>

            {/* Bio */}
            {p.bio && (
              <p style={{ color: '#999', fontSize: '13px', margin: '0 0 14px', lineHeight: 1.65, padding: '12px 14px', background: '#0f0f0f', borderRadius: '10px', borderLeft: '2px solid #c8ff00' }}>
                {p.bio}
              </p>
            )}

            {/* Skills */}
            {p.skills?.length > 0 && (
              <>
                <div className="section-head">Skills</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {p.skills.map(s => <span key={s} className="vtag">{s}</span>)}
                </div>
              </>
            )}

            {/* Links */}
            {(p.github_url || p.portfolio_url || p.linkedin_url) && (
              <>
                <div className="section-head">Links</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {p.github_url && <a href={p.github_url} target="_blank" rel="noopener noreferrer" style={{ color: '#c8ff00', textDecoration: 'none', fontSize: '13px', padding: '6px 12px', border: '1px solid rgba(200,255,0,0.3)', borderRadius: '8px' }}>⌥ GitHub</a>}
                  {p.portfolio_url && <a href={p.portfolio_url} target="_blank" rel="noopener noreferrer" style={{ color: '#c8ff00', textDecoration: 'none', fontSize: '13px', padding: '6px 12px', border: '1px solid rgba(200,255,0,0.3)', borderRadius: '8px' }}>🔗 Portfolio</a>}
                  {p.linkedin_url && <a href={p.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: '#c8ff00', textDecoration: 'none', fontSize: '13px', padding: '6px 12px', border: '1px solid rgba(200,255,0,0.3)', borderRadius: '8px' }}>in LinkedIn</a>}
                </div>
              </>
            )}

            {/* Reels */}
            <div className="section-head">Reels</div>
            {reels.length > 0 ? reels.map(r => (
              <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                background: '#111', border: '1px solid #2a2a2a', borderRadius: '10px',
                padding: '12px 14px', color: '#f0ece4', textDecoration: 'none', marginBottom: '8px',
              }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(200,255,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>▶</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>{r.title || 'Untitled reel'}</div>
                  {r.skills?.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {r.skills.slice(0, 3).map(s => <span key={s} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', color: '#666', border: '1px solid #222' }}>{s}</span>)}
                    </div>
                  )}
                </div>
              </a>
            )) : <div style={{ color: '#555', fontSize: '13px' }}>No public reels yet.</div>}

            {/* Projects */}
            <div className="section-head">Projects</div>
            {projects.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: '10px' }}>
                {projects.map(pr => (
                  <div key={pr.id} style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '110px' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#f0ece4', lineHeight: 1.3 }}>
                      {pr.demo_link ? <a href={pr.demo_link} target="_blank" rel="noopener noreferrer" style={{ color: '#f0ece4', textDecoration: 'none' }}>{pr.title}</a> : pr.title}
                    </div>
                    {pr.description && <div style={{ fontSize: '11px', color: '#666', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{pr.description}</div>}
                    <div style={{ marginTop: 'auto', display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                      {pr.status && STATUS_MAP[pr.status] && <span style={{ fontSize: '10px', color: '#888' }}>{STATUS_MAP[pr.status]}</span>}
                      {pr.skills?.slice(0, 3).map(s => <span key={s} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', color: '#666', border: '1px solid #222' }}>{s}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            ) : <div style={{ color: '#555', fontSize: '13px' }}>No public projects yet.</div>}
          </>
        )}
      </div>
    </div>
  )
}
