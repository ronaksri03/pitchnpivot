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
  const { user, accountType, loading: authLoading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [reels, setReels] = useState<Reel[]>([])
  const [projects, setProjects] = useState<IndividualProject[]>([])
  const [assigned, setAssigned] = useState<ManagerProject[]>([])
  const [visits, setVisits] = useState<ProfileView[]>([])
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [tab, setTab] = useState<Tab>('reels')
  const [submitProject, setSubmitProject] = useState<ManagerProject | null>(null)
  const [submitUrl, setSubmitUrl] = useState('')
  const [submitNote, setSubmitNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitDone, setSubmitDone] = useState<string | null>(null) // projectId of done submission
  const sb = getClient()

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth')
    if (!authLoading && user && accountType === 'manager') router.replace('/dashboard')
    if (!authLoading && user && accountType !== 'manager') loadAll()
  }, [authLoading, user, accountType])

  async function loadAll() {
    if (!user) return
    const [profRes, reelRes, projRes] = await Promise.all([
      sb.from('profiles').select('*').eq('id', user.id).single(),
      sb.from('reels').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      sb.from('individual_projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])
    setProfile(profRes.data)
    setReels(reelRes.data || [])
    setProjects(projRes.data || [])

    // Fetch assigned projects — try with managers join, fall back to plain
    const { data: assignedWithMgr, error: assignedErr } = await sb
      .from('manager_projects')
      .select('*, managers(name, company)')
      .eq('assigned_to', user.id)
      .order('created_at', { ascending: false })
    if (!assignedErr) {
      setAssigned(assignedWithMgr || [])
    } else {
      console.warn('[assigned join error]', assignedErr.message)
      const { data: assignedPlain } = await sb
        .from('manager_projects')
        .select('*')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false })
      setAssigned(assignedPlain || [])
    }

    // Fetch visits — try with managers join first, fall back to plain select
    const { data: visitsWithMgr, error: visitsErr } = await sb
      .from('profile_views')
      .select('*, managers(name, company)')
      .eq('profile_user_id', user.id)
      .order('viewed_at', { ascending: false })
      .limit(20)
    if (!visitsErr) {
      setVisits(visitsWithMgr || [])
    } else {
      console.warn('[profile_views join error]', visitsErr.message, '— falling back to plain select')
      const { data: visitsPlain } = await sb
        .from('profile_views')
        .select('*')
        .eq('profile_user_id', user.id)
        .order('viewed_at', { ascending: false })
        .limit(20)
      setVisits(visitsPlain || [])
    }
    setLoading(false)
  }

  async function submitWork(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !submitProject) return
    setSubmitting(true); setSubmitError('')
    const { error } = await sb.from('project_submissions').insert({
      project_id: submitProject.id,
      individual_id: user.id,
      submission_url: submitUrl || null,
      note: submitNote || null,
    })
    if (error) {
      setSubmitError(error.code === '23505' ? 'You already submitted work for this project.' : error.message)
    } else {
      setSubmitDone(submitProject.id)
      setSubmitProject(null); setSubmitUrl(''); setSubmitNote('')
    }
    setSubmitting(false)
  }

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #333', borderTopColor: '#c8ff00', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <div style={{ fontSize: '15px', color: '#888' }}>Loading your profile…</div>
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
        background: 'linear-gradient(135deg, #111 0%, #141414 60%, #0d1a00 100%)',
        borderBottom: '1px solid #2a2a2a',
      }}>
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,255,0,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '44px 28px 36px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>

            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: '92px', height: '92px', borderRadius: '50%',
                background: '#c8ff00',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '32px', fontWeight: 900, color: '#0a0a0a',
                boxShadow: '0 0 0 3px #0a0a0a, 0 0 0 5px rgba(200,255,0,0.3), 0 0 32px rgba(200,255,0,0.1)',
              }}>
                {initials(name)}
              </div>
              <div style={{ position: 'absolute', bottom: '4px', right: '4px', width: '16px', height: '16px', borderRadius: '50%', background: profile?.open_to_work ? '#c8ff00' : '#333', border: '2px solid #0a0a0a' }} />
            </div>

            {/* Name + meta */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: '#f0ece4', letterSpacing: '-0.02em' }}>
                  {name}
                </h1>
                {profile?.pronouns && (
                  <span style={{ fontSize: '13px', color: '#aaa', background: '#1a1a1a', border: '1px solid #333', borderRadius: '20px', padding: '2px 10px' }}>
                    {profile.pronouns}
                  </span>
                )}
                <span style={{
                  fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px',
                  background: profile?.open_to_work ? 'rgba(200,255,0,0.12)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${profile?.open_to_work ? 'rgba(200,255,0,0.35)' : '#333'}`,
                  color: profile?.open_to_work ? '#c8ff00' : '#888',
                }}>
                  {profile?.open_to_work ? '✦ Open to work' : '○ Not looking'}
                </span>
              </div>

              {profile?.job_title && (
                <div style={{ fontSize: '17px', color: '#bbb', marginBottom: '8px', fontWeight: 500 }}>
                  {profile.job_title}
                  {profile.years_exp && <span style={{ color: '#777', fontWeight: 400 }}> · {profile.years_exp} yrs exp</span>}
                </div>
              )}

              <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', fontSize: '14px', color: '#888' }}>
                {profile?.location && <span>📍 {profile.location}</span>}
                {profile?.timezone && <span>🕐 {profile.timezone}</span>}
                {profile?.college && <span>🎓 {profile.college}</span>}
                {profile?.username && <span style={{ color: '#666' }}>@{profile.username}</span>}
              </div>
            </div>

            {/* Edit button */}
            <button
              onClick={() => setShowEdit(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(255,255,255,0.07)', border: '1px solid #333',
                borderRadius: '10px', color: '#ddd', fontSize: '14px',
                fontWeight: 600, padding: '10px 18px', cursor: 'pointer',
                transition: 'border-color 0.2s, color 0.2s', flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#c8ff00'; e.currentTarget.style.color = '#c8ff00' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#ddd' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit profile
            </button>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '32px', marginTop: '28px', paddingTop: '22px', borderTop: '1px solid #222' }}>
            {[
              { label: 'Reels', value: reels.length },
              { label: 'Projects', value: projects.length },
              { label: 'Profile views', value: visits.length },
              { label: 'Assigned', value: assigned.length },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#f0ece4', letterSpacing: '-0.02em' }}>{s.value}</div>
                <div style={{ fontSize: '13px', color: '#777', marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '32px 28px', display: 'grid', gridTemplateColumns: '280px 1fr', gap: '28px', alignItems: 'start' }}>

        {/* ── LEFT SIDEBAR ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>

          {profile?.bio && (
            <SideCard>
              <SideLabel>About</SideLabel>
              <p style={{ margin: 0, fontSize: '14px', color: '#bbb', lineHeight: 1.75 }}>{profile.bio}</p>
            </SideCard>
          )}

          {profile?.looking_for && (
            <SideCard accent>
              <SideLabel accent>Looking for</SideLabel>
              <p style={{ margin: 0, fontSize: '14px', color: '#ccc', lineHeight: 1.7 }}>{profile.looking_for}</p>
            </SideCard>
          )}

          {(profile?.work_pref || profile?.availability || profile?.hourly_rate) && (
            <SideCard>
              <SideLabel>Work</SideLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {profile?.work_pref && <Detail icon="🏠" label={cap(profile.work_pref)} />}
                {profile?.availability && <Detail icon="📅" label={cap(profile.availability)} />}
                {profile?.hourly_rate && <Detail icon="💰" label={profile.hourly_rate} />}
              </div>
            </SideCard>
          )}

          {(profile?.skills?.length ?? 0) > 0 && (
            <SideCard>
              <SideLabel>Skills</SideLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {profile!.skills.map(s => (
                  <span key={s} style={{
                    fontSize: '13px', padding: '4px 11px', borderRadius: '20px',
                    background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)',
                    color: '#c8ff00', fontWeight: 500,
                  }}>{s}</span>
                ))}
              </div>
            </SideCard>
          )}

          {profile && (profile.github_url || profile.portfolio_url || profile.linkedin_url || profile.twitter_url || profile.website_url || profile.discord_handle) && (
            <SideCard>
              <SideLabel>Links</SideLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {profile.github_url && <SocialLink icon="🐙" label="GitHub" url={profile.github_url} />}
                {profile.portfolio_url && <SocialLink icon="🎨" label="Portfolio" url={profile.portfolio_url} />}
                {profile.linkedin_url && <SocialLink icon="💼" label="LinkedIn" url={profile.linkedin_url} />}
                {profile.twitter_url && <SocialLink icon="𝕏" label="Twitter / X" url={profile.twitter_url} />}
                {profile.website_url && <SocialLink icon="🌐" label="Website" url={profile.website_url} />}
                {profile.discord_handle && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#aaa' }}>
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
          <div style={{ display: 'flex', gap: '2px', marginBottom: '20px', background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '4px' }}>
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  flex: 1, border: 'none', cursor: 'pointer', borderRadius: '8px',
                  padding: '10px 6px', fontSize: '14px', fontWeight: 600,
                  transition: 'all 0.15s',
                  background: tab === t.key ? '#1e1e1e' : 'transparent',
                  color: tab === t.key ? '#f0ece4' : '#777',
                  boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.5)' : 'none',
                }}
              >
                {t.label}
                {t.count > 0 && (
                  <span style={{
                    marginLeft: '7px', fontSize: '12px', fontWeight: 700,
                    padding: '2px 7px', borderRadius: '20px',
                    background: tab === t.key ? 'rgba(200,255,0,0.15)' : 'rgba(255,255,255,0.07)',
                    color: tab === t.key ? '#c8ff00' : '#666',
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
                      display: 'flex', alignItems: 'center', gap: '16px',
                      background: '#111', border: '1px solid #222', borderRadius: '12px',
                      padding: '16px 18px', transition: 'border-color 0.2s, transform 0.15s', cursor: 'pointer',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#222'; e.currentTarget.style.transform = 'translateY(0)' }}
                    >
                      <div style={{
                        width: '48px', height: '48px', borderRadius: '10px', flexShrink: 0,
                        background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '20px', color: '#c8ff00',
                      }}>▶</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#f0ece4', marginBottom: '6px' }}>
                          {r.title || 'Untitled reel'}
                        </div>
                        {r.skills?.length > 0 && (
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                            {r.skills.slice(0, 4).map(s => (
                              <span key={s} style={{ fontSize: '12px', padding: '2px 9px', borderRadius: '20px', background: 'rgba(255,255,255,0.06)', border: '1px solid #333', color: '#aaa' }}>{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666', flexShrink: 0 }}>
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
              : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
                {projects.map(p => (
                  <div key={p.id} style={{
                    background: '#111', border: '1px solid #222', borderRadius: '12px',
                    padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px',
                    transition: 'border-color 0.2s, transform 0.15s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#222'; e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#f0ece4', lineHeight: 1.35 }}>{p.title}</div>
                      {p.status && (
                        <span style={{
                          fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', flexShrink: 0,
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                          background: p.status === 'completed' ? 'rgba(200,255,0,0.1)' : p.status === 'in-progress' ? 'rgba(100,150,255,0.1)' : 'rgba(255,255,255,0.06)',
                          border: `1px solid ${p.status === 'completed' ? 'rgba(200,255,0,0.3)' : p.status === 'in-progress' ? 'rgba(100,150,255,0.25)' : '#333'}`,
                          color: p.status === 'completed' ? '#c8ff00' : p.status === 'in-progress' ? '#7090ff' : '#888',
                        }}>{p.status}</span>
                      )}
                    </div>
                    {p.description && (
                      <p style={{ margin: 0, fontSize: '13px', color: '#999', lineHeight: 1.6 }}>
                        {p.description.slice(0, 100)}{p.description.length > 100 ? '…' : ''}
                      </p>
                    )}
                    {p.skills?.length > 0 && (
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: 'auto' }}>
                        {p.skills.slice(0, 3).map(s => (
                          <span key={s} style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid #2a2a2a', color: '#aaa' }}>{s}</span>
                        ))}
                      </div>
                    )}
                    {p.demo_link && (
                      <a href={p.demo_link} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: '13px', color: '#c8ff00', textDecoration: 'none', fontWeight: 600 }}
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
              : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
                {assigned.map(p => (
                  <div key={p.id} style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#f0ece4' }}>{p.title}</div>
                      {submitDone === p.id ? (
                        <span style={{ fontSize: '11px', color: '#c8ff00', fontWeight: 700 }}>✓ Submitted</span>
                      ) : (
                        <button onClick={() => { setSubmitProject(p); setSubmitUrl(''); setSubmitNote(''); setSubmitError('') }}
                          style={{ fontSize: '12px', padding: '5px 12px', background: 'rgba(200,255,0,0.1)', border: '1px solid rgba(200,255,0,0.25)', color: '#c8ff00', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                          Submit Work →
                        </button>
                      )}
                    </div>
                    {(p as unknown as { managers?: { name?: string; company?: string } }).managers?.name && (
                      <div style={{ fontSize: '13px', color: '#888' }}>
                        {(p as unknown as { managers?: { name?: string; company?: string } }).managers?.name}
                        {(p as unknown as { managers?: { name?: string; company?: string } }).managers?.company && ` · ${(p as unknown as { managers?: { name?: string; company?: string } }).managers?.company}`}
                      </div>
                    )}
                    <span style={{ alignSelf: 'flex-start', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(200,255,0,0.1)', border: '1px solid rgba(200,255,0,0.25)', color: '#c8ff00' }}>{p.pay_type || 'tbd'}</span>
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
                    padding: '16px 18px', background: '#111',
                    borderRadius: i === 0 ? '12px 12px 0 0' : i === visits.length - 1 ? '0 0 12px 12px' : '0',
                    border: '1px solid #222', borderTop: i === 0 ? '1px solid #222' : 'none',
                  }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0, background: '#1a1a1a', border: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>👔</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#f0ece4' }}>
                        {(v as unknown as { managers?: { name?: string; company?: string } }).managers?.name || 'A manager'}
                      </div>
                      {(v as unknown as { managers?: { name?: string; company?: string } }).managers?.company && (
                        <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>
                          {(v as unknown as { managers?: { name?: string; company?: string } }).managers?.company}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>{v.viewed_at ? timeAgo(v.viewed_at) : ''}</div>
                  </div>
                ))}
              </div>
          )}
        </div>
      </div>

      {showEdit && profile && (
        <EditProfileModal profile={profile} onClose={() => setShowEdit(false)} onSaved={(p) => setProfile(p)} />
      )}

      {/* Submit Work Modal */}
      {submitProject && (
        <div onClick={e => e.target === e.currentTarget && setSubmitProject(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '24px' }}>
          <div style={{ background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Submit Work</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#f0ece4', marginTop: '2px' }}>{submitProject.title}</div>
              </div>
              <button onClick={() => setSubmitProject(null)} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '14px' }}>✕</button>
            </div>
            <form onSubmit={submitWork} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#666', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Submission link</label>
                <input style={{ width: '100%', padding: '10px 13px', background: '#111', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#f0ece4', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const }} placeholder="https://github.com/you/project" value={submitUrl} onChange={e => setSubmitUrl(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#666', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Note to manager <span style={{ color: '#444' }}>(optional)</span></label>
                <textarea style={{ width: '100%', padding: '10px 13px', background: '#111', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#f0ece4', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const, resize: 'vertical' }} placeholder="Describe what you built…" rows={3} value={submitNote} onChange={e => setSubmitNote(e.target.value)} />
              </div>
              {submitError && <div style={{ color: '#ff6b6b', fontSize: '13px' }}>{submitError}</div>}
              <button type="submit" disabled={submitting} style={{ padding: '11px', background: '#c8ff00', color: '#0a0a0a', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                {submitting ? 'Submitting…' : 'Submit Work →'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }

function SideCard({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div style={{
      background: accent ? 'rgba(200,255,0,0.04)' : '#111',
      border: `1px solid ${accent ? 'rgba(200,255,0,0.15)' : '#222'}`,
      borderRadius: '12px', padding: '16px 18px',
      display: 'flex', flexDirection: 'column', gap: '10px',
      marginBottom: '8px',
    }}>
      {children}
    </div>
  )
}

function SideLabel({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent ? '#c8ff00' : '#666' }}>
      {children}
    </div>
  )
}

function Detail({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#bbb' }}>
      <span>{icon}</span><span>{label}</span>
    </div>
  )
}

function SocialLink({ icon, label, url }: { icon: string; label: string; url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#c8ff00', textDecoration: 'none', fontWeight: 500 }}
      onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
    >
      <span>{icon}</span><span>{label}</span>
    </a>
  )
}

function EmptyTab({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 20px', background: '#111', border: '1px dashed #222', borderRadius: '12px' }}>
      <div style={{ fontSize: '30px', marginBottom: '12px' }}>{icon}</div>
      <div style={{ fontSize: '15px', color: '#666', maxWidth: '280px', margin: '0 auto', lineHeight: 1.65 }}>{text}</div>
    </div>
  )
}
