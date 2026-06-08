'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getClient } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Profile, Reel, IndividualProject, ManagerProject, ProfileView } from '@/types'
import EditProfileModal from '@/components/EditProfileModal'

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

function timeAgo(ts: string) {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

type Tab = 'reels' | 'projects' | 'assigned' | 'visitors'

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [reels, setReels] = useState<Reel[]>([])
  const [projects, setProjects] = useState<IndividualProject[]>([])
  const [assigned, setAssigned] = useState<ManagerProject[]>([])
  const [visits, setVisits] = useState<ProfileView[]>([])
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [tab, setTab] = useState<Tab>('reels')
  const sb = getClient()

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth')
    if (user) loadAll()
  }, [authLoading, user])

  async function loadAll() {
    if (!user) return
    const [profRes, reelRes, projRes, assignedRes, visitRes] = await Promise.all([
      sb.from('profiles').select('*').eq('id', user.id).single(),
      sb.from('reels').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      sb.from('individual_projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      sb.from('manager_projects').select('*, managers(name, company)').eq('assigned_to', user.id).order('created_at', { ascending: false }),
      sb.from('profile_views').select('*, managers(name, company)').eq('profile_user_id', user.id).order('viewed_at', { ascending: false }).limit(20),
    ])
    setProfile(profRes.data)
    setReels(reelRes.data || [])
    setProjects(projRes.data || [])
    setAssigned(assignedRes.data || [])
    setVisits(visitRes.data || [])
    setLoading(false)
  }

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #1e1e1e', borderTopColor: '#c8ff00', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <div style={{ fontSize: '13px', color: '#444' }}>Loading your profile…</div>
        </div>
      </div>
    )
  }
  if (!user) return null

  const meta = user.user_metadata || {}
  const name = [(profile?.first_name || meta.first_name || ''), (profile?.last_name || meta.last_name || '')].join(' ').trim() || user.email?.split('@')[0] || 'You'

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'reels', label: 'Reels', count: reels.length },
    { key: 'projects', label: 'Projects', count: projects.length },
    { key: 'assigned', label: 'Assigned', count: assigned.length },
    { key: 'visitors', label: 'Visitors', count: visits.length },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>

      {/* ── HERO BANNER ── */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #0f0f0f 0%, #111 50%, #0d1a00 100%)',
        borderBottom: '1px solid #1a1a1a',
      }}>
        {/* Accent glow */}
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,255,0,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px 36px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>

            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: '88px', height: '88px', borderRadius: '50%',
                background: '#c8ff00',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '30px', fontWeight: 900, color: '#0a0a0a',
                boxShadow: '0 0 0 3px #0a0a0a, 0 0 0 5px rgba(200,255,0,0.25), 0 0 30px rgba(200,255,0,0.12)',
              }}>
                {initials(name)}
              </div>
              {/* Online-ish status dot */}
              <div style={{
                position: 'absolute', bottom: '4px', right: '4px',
                width: '14px', height: '14px', borderRadius: '50%',
                background: profile?.open_to_work ? '#c8ff00' : '#2a2a2a',
                border: '2px solid #0a0a0a',
              }} />
            </div>

            {/* Name + meta */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 900, color: '#f0ece4', letterSpacing: '-0.02em' }}>
                  {name}
                </h1>
                {profile?.pronouns && (
                  <span style={{ fontSize: '11px', color: '#555', background: '#111', border: '1px solid #222', borderRadius: '20px', padding: '2px 8px' }}>
                    {profile.pronouns}
                  </span>
                )}
                <span style={{
                  fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px',
                  background: profile?.open_to_work ? 'rgba(200,255,0,0.1)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${profile?.open_to_work ? 'rgba(200,255,0,0.3)' : '#222'}`,
                  color: profile?.open_to_work ? '#c8ff00' : '#444',
                }}>
                  {profile?.open_to_work ? '✦ Open to work' : '○ Not looking'}
                </span>
              </div>

              {profile?.job_title && (
                <div style={{ fontSize: '15px', color: '#888', marginBottom: '6px' }}>
                  {profile.job_title}
                  {profile.years_exp && <span style={{ color: '#555' }}> · {profile.years_exp} yrs exp</span>}
                </div>
              )}

              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '12px', color: '#555' }}>
                {profile?.location && <span>📍 {profile.location}</span>}
                {profile?.timezone && <span>🕐 {profile.timezone}</span>}
                {profile?.college && <span>🎓 {profile.college}</span>}
                {profile?.username && <span style={{ color: '#444' }}>@{profile.username}</span>}
              </div>
            </div>

            {/* Edit button */}
            <button
              onClick={() => setShowEdit(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid #2a2a2a',
                borderRadius: '8px', color: '#f0ece4', fontSize: '13px',
                fontWeight: 600, padding: '9px 16px', cursor: 'pointer',
                transition: 'border-color 0.2s, background 0.2s', flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#c8ff00'; e.currentTarget.style.color = '#c8ff00' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#f0ece4' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit profile
            </button>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '28px', marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #1a1a1a' }}>
            {[
              { label: 'Reels', value: reels.length },
              { label: 'Projects', value: projects.length },
              { label: 'Profile views', value: visits.length },
              { label: 'Assigned', value: assigned.length },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#f0ece4', letterSpacing: '-0.02em' }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: '#555', marginTop: '1px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '260px 1fr', gap: '28px', alignItems: 'start' }}>

        {/* ── LEFT SIDEBAR ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>

          {/* Bio */}
          {profile?.bio && (
            <SideCard>
              <SideLabel>About</SideLabel>
              <p style={{ margin: 0, fontSize: '13px', color: '#888', lineHeight: 1.7 }}>{profile.bio}</p>
            </SideCard>
          )}

          {/* Looking for */}
          {profile?.looking_for && (
            <SideCard accent>
              <SideLabel accent>Looking for</SideLabel>
              <p style={{ margin: 0, fontSize: '13px', color: '#999', lineHeight: 1.65 }}>{profile.looking_for}</p>
            </SideCard>
          )}

          {/* Work details */}
          {(profile?.work_pref || profile?.availability || profile?.hourly_rate) && (
            <SideCard>
              <SideLabel>Work</SideLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {profile?.work_pref && <Detail icon="🏠" label={cap(profile.work_pref)} />}
                {profile?.availability && <Detail icon="📅" label={cap(profile.availability)} />}
                {profile?.hourly_rate && <Detail icon="💰" label={profile.hourly_rate} />}
              </div>
            </SideCard>
          )}

          {/* Skills */}
          {(profile?.skills?.length ?? 0) > 0 && (
            <SideCard>
              <SideLabel>Skills</SideLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {profile!.skills.map(s => (
                  <span key={s} style={{
                    fontSize: '11px', padding: '3px 9px', borderRadius: '20px',
                    background: 'rgba(200,255,0,0.07)', border: '1px solid rgba(200,255,0,0.18)',
                    color: '#a8d400', fontWeight: 500,
                  }}>{s}</span>
                ))}
              </div>
            </SideCard>
          )}

          {/* Links */}
          {profile && (profile.github_url || profile.portfolio_url || profile.linkedin_url || profile.twitter_url || profile.website_url || profile.discord_handle) && (
            <SideCard>
              <SideLabel>Links</SideLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {profile.github_url && <SocialLink icon="🐙" label="GitHub" url={profile.github_url} />}
                {profile.portfolio_url && <SocialLink icon="🎨" label="Portfolio" url={profile.portfolio_url} />}
                {profile.linkedin_url && <SocialLink icon="💼" label="LinkedIn" url={profile.linkedin_url} />}
                {profile.twitter_url && <SocialLink icon="𝕏" label="Twitter / X" url={profile.twitter_url} />}
                {profile.website_url && <SocialLink icon="🌐" label="Website" url={profile.website_url} />}
                {profile.discord_handle && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#666' }}>
                    <span>💬</span><span>{profile.discord_handle}</span>
                  </div>
                )}
              </div>
            </SideCard>
          )}
        </div>

        {/* ── RIGHT: TABS ── */}
        <div>
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: '2px', marginBottom: '20px', background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '4px' }}>
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  flex: 1, border: 'none', cursor: 'pointer', borderRadius: '7px',
                  padding: '8px 6px', fontSize: '12px', fontWeight: 600,
                  transition: 'all 0.15s',
                  background: tab === t.key ? '#1a1a1a' : 'transparent',
                  color: tab === t.key ? '#f0ece4' : '#555',
                  boxShadow: tab === t.key ? '0 1px 3px rgba(0,0,0,0.4)' : 'none',
                }}
              >
                {t.label}
                {t.count > 0 && (
                  <span style={{
                    marginLeft: '6px', fontSize: '10px', fontWeight: 700,
                    padding: '1px 6px', borderRadius: '20px',
                    background: tab === t.key ? 'rgba(200,255,0,0.15)' : 'rgba(255,255,255,0.06)',
                    color: tab === t.key ? '#c8ff00' : '#444',
                  }}>{t.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Reels */}
          {tab === 'reels' && (
            reels.length === 0
              ? <EmptyTab icon="▶" text="No reels yet. Add your first reel to get discovered." />
              : <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {reels.map(r => (
                  <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: '12px',
                      padding: '14px 16px', transition: 'border-color 0.2s, transform 0.15s',
                      cursor: 'pointer',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a1a1a'; e.currentTarget.style.transform = 'translateY(0)' }}
                    >
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
                        background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '18px', color: '#c8ff00',
                      }}>▶</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#f0ece4', marginBottom: '4px' }}>
                          {r.title || 'Untitled reel'}
                        </div>
                        {r.skills?.length > 0 && (
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {r.skills.slice(0, 4).map(s => (
                              <span key={s} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid #222', color: '#666' }}>{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: '#444', flexShrink: 0 }}>
                        {r.visibility === 'private' ? '🔒 Private' : '🌐 Public'}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
          )}

          {/* Projects */}
          {tab === 'projects' && (
            projects.length === 0
              ? <EmptyTab icon="🗂" text="No projects yet. Showcase your work to stand out." />
              : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                {projects.map(p => (
                  <div key={p.id} style={{
                    background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: '12px',
                    padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px',
                    transition: 'border-color 0.2s, transform 0.15s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a1a1a'; e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#f0ece4', lineHeight: 1.3 }}>{p.title}</div>
                      {p.status && (
                        <span style={{
                          fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '20px', flexShrink: 0,
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                          background: p.status === 'completed' ? 'rgba(200,255,0,0.1)' : p.status === 'in-progress' ? 'rgba(100,150,255,0.1)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${p.status === 'completed' ? 'rgba(200,255,0,0.25)' : p.status === 'in-progress' ? 'rgba(100,150,255,0.2)' : '#222'}`,
                          color: p.status === 'completed' ? '#c8ff00' : p.status === 'in-progress' ? '#7090ff' : '#555',
                        }}>{p.status}</span>
                      )}
                    </div>
                    {p.description && (
                      <p style={{ margin: 0, fontSize: '12px', color: '#666', lineHeight: 1.55 }}>
                        {p.description.slice(0, 100)}{p.description.length > 100 ? '…' : ''}
                      </p>
                    )}
                    {p.skills?.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: 'auto' }}>
                        {p.skills.slice(0, 3).map(s => (
                          <span key={s} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', background: 'rgba(255,255,255,0.04)', border: '1px solid #1e1e1e', color: '#666' }}>{s}</span>
                        ))}
                      </div>
                    )}
                    {p.demo_link && (
                      <a href={p.demo_link} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: '11px', color: '#c8ff00', textDecoration: 'none', fontWeight: 600 }}
                        onClick={e => e.stopPropagation()}>
                        🔗 View demo →
                      </a>
                    )}
                  </div>
                ))}
              </div>
          )}

          {/* Assigned */}
          {tab === 'assigned' && (
            assigned.length === 0
              ? <EmptyTab icon="📋" text="No projects assigned to you yet." />
              : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                {assigned.map(p => (
                  <div key={p.id} style={{
                    background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: '12px',
                    padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px',
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#f0ece4' }}>{p.title}</div>
                    {(p as unknown as { managers?: { name?: string; company?: string } }).managers?.name && (
                      <div style={{ fontSize: '12px', color: '#555' }}>
                        {(p as unknown as { managers?: { name?: string; company?: string } }).managers?.name}
                        {(p as unknown as { managers?: { name?: string; company?: string } }).managers?.company && ` · ${(p as unknown as { managers?: { name?: string; company?: string } }).managers?.company}`}
                      </div>
                    )}
                    <span style={{
                      alignSelf: 'flex-start', fontSize: '10px', fontWeight: 700, padding: '3px 9px',
                      borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em',
                      background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', color: '#a8d400',
                    }}>{p.pay_type || 'tbd'}</span>
                  </div>
                ))}
              </div>
          )}

          {/* Visitors */}
          {tab === 'visitors' && (
            visits.length === 0
              ? <EmptyTab icon="👔" text="No profile views yet. Share your profile to get noticed." />
              : <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {visits.map((v, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 16px', background: '#0f0f0f',
                    borderRadius: i === 0 ? '12px 12px 0 0' : i === visits.length - 1 ? '0 0 12px 12px' : '0',
                    border: '1px solid #1a1a1a', borderTop: i === 0 ? '1px solid #1a1a1a' : 'none',
                  }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                      background: '#111', border: '1px solid #222',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                    }}>👔</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#f0ece4' }}>
                        {(v as unknown as { managers?: { name?: string; company?: string } }).managers?.name || 'A manager'}
                      </div>
                      {(v as unknown as { managers?: { name?: string; company?: string } }).managers?.company && (
                        <div style={{ fontSize: '11px', color: '#555', marginTop: '1px' }}>
                          {(v as unknown as { managers?: { name?: string; company?: string } }).managers?.company}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#444' }}>{v.viewed_at ? timeAgo(v.viewed_at) : ''}</div>
                  </div>
                ))}
              </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {showEdit && profile && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEdit(false)}
          onSaved={(p) => setProfile(p)}
        />
      )}

      {/* Responsive: stack on mobile */}
      <style>{`
        @media (max-width: 680px) {
          .profile-body { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

// ── Tiny helpers ──

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }

function SideCard({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div style={{
      background: accent ? 'rgba(200,255,0,0.03)' : '#0f0f0f',
      border: `1px solid ${accent ? 'rgba(200,255,0,0.12)' : '#1a1a1a'}`,
      borderRadius: '12px', padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: '10px',
      marginBottom: '8px',
    }}>
      {children}
    </div>
  )
}

function SideLabel({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div style={{
      fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
      color: accent ? '#c8ff00' : '#444',
    }}>{children}</div>
  )
}

function Detail({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#777' }}>
      <span>{icon}</span><span>{label}</span>
    </div>
  )
}

function SocialLink({ icon, label, url }: { icon: string; label: string; url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      fontSize: '12px', color: '#c8ff00', textDecoration: 'none', fontWeight: 500,
      transition: 'opacity 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
    >
      <span>{icon}</span><span>{label}</span>
    </a>
  )
}

function EmptyTab({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{
      textAlign: 'center', padding: '60px 20px',
      background: '#0f0f0f', border: '1px dashed #1e1e1e', borderRadius: '12px',
    }}>
      <div style={{ fontSize: '28px', marginBottom: '10px' }}>{icon}</div>
      <div style={{ fontSize: '13px', color: '#444', maxWidth: '260px', margin: '0 auto', lineHeight: 1.6 }}>{text}</div>
    </div>
  )
}
