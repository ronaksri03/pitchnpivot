'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getClient } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Profile, Reel, IndividualProject, ManagerProject, ProfileView } from '@/types'
import EditProfileModal from '@/components/EditProfileModal'

const C = { obsidian: '#0a0a0a', slate: '#1a1a1a', filmLight: '#f0ece4', lime: '#c8ff00', magenta: '#ff006e', gray: '#888', border: '#2a2a2a', charcoal: '#2d2d2d' }

function initials(name: string) { return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?' }
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
  const [submitVideo, setSubmitVideo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitDone, setSubmitDone] = useState<Set<string>>(new Set())

  // Reel management
  const [showReelModal, setShowReelModal] = useState(false)
  const [editReel, setEditReel] = useState<Reel | null>(null)
  const [reelUrl, setReelUrl] = useState('')
  const [reelTitle, setReelTitle] = useState('')
  const [reelSkillInput, setReelSkillInput] = useState('')
  const [reelSkills, setReelSkills] = useState<string[]>([])
  const [reelVisibility, setReelVisibility] = useState<'public' | 'private'>('public')
  const [savingReel, setSavingReel] = useState(false)
  const [reelError, setReelError] = useState('')
  const sb = getClient()

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth')
    if (!authLoading && user && accountType === 'manager') router.replace('/lab')
    if (!authLoading && user && accountType === 'individual') loadAll()
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
    const { data: assignedData } = await sb.from('manager_projects').select('*, managers(name, company)').eq('assigned_to', user.id).order('created_at', { ascending: false })
    setAssigned(assignedData || [])
    const { data: visitsData } = await sb.from('profile_views').select('*, managers(name, company)').eq('profile_user_id', user.id).order('viewed_at', { ascending: false }).limit(20)
    setVisits(visitsData || [])
    setLoading(false)
  }

  // ── Reel CRUD ──
  function openNewReel() {
    setEditReel(null)
    setReelUrl(''); setReelTitle(''); setReelSkills([]); setReelSkillInput(''); setReelVisibility('public'); setReelError('')
    setShowReelModal(true)
  }

  function openEditReel(r: Reel) {
    setEditReel(r)
    setReelUrl(r.url); setReelTitle(r.title || ''); setReelSkills(r.skills || []); setReelSkillInput(''); setReelVisibility(r.visibility); setReelError('')
    setShowReelModal(true)
  }

  async function saveReel(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !reelUrl.trim()) return
    setSavingReel(true); setReelError('')

    // Auto-detect source from URL
    let source = 'other'
    if (reelUrl.includes('youtube') || reelUrl.includes('youtu.be')) source = 'youtube'
    else if (reelUrl.includes('loom')) source = 'loom'
    else if (reelUrl.includes('vimeo')) source = 'vimeo'

    const payload = { url: reelUrl.trim(), title: reelTitle.trim() || null, source, skills: reelSkills, visibility: reelVisibility }

    const { error } = editReel
      ? await sb.from('reels').update(payload).eq('id', editReel.id)
      : await sb.from('reels').insert({ ...payload, user_id: user.id })

    if (error) { setReelError(error.message); setSavingReel(false); return }

    // Refresh reels
    const { data } = await sb.from('reels').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setReels(data || [])
    setShowReelModal(false)
    setSavingReel(false)
  }

  async function deleteReel(id: string) {
    if (!confirm('Delete this reel?')) return
    await sb.from('reels').delete().eq('id', id)
    setReels(prev => prev.filter(r => r.id !== id))
  }

  async function submitWork(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !submitProject) return
    setSubmitting(true); setSubmitError('')
    const { error } = await sb.from('project_submissions').insert({ project_id: submitProject.id, individual_id: user.id, submission_url: submitUrl || null, note: submitNote || null, video_url: submitVideo || null })
    if (error) { setSubmitError(error.code === '23505' ? 'Already submitted.' : error.message) }
    else { setSubmitDone(prev => new Set(prev).add(submitProject.id)); setSubmitProject(null); setSubmitUrl(''); setSubmitNote(''); setSubmitVideo('') }
    setSubmitting(false)
  }

  if (authLoading || loading) return (
    <div style={{ minHeight: '100vh', background: C.obsidian, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: `2px solid ${C.border}`, borderTopColor: C.lime, animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <div style={{ fontSize: 14, color: C.gray }}>Loading…</div>
      </div>
    </div>
  )
  if (!user || accountType !== 'individual') return null

  const meta = user.user_metadata || {}
  const name = [(profile?.first_name || meta.first_name || ''), (profile?.last_name || meta.last_name || '')].join(' ').trim() || user.email?.split('@')[0] || 'You'

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'reels', label: 'Reels', count: reels.length },
    { key: 'projects', label: 'Projects', count: projects.length },
    { key: 'assigned', label: 'Assigned', count: assigned.length },
    { key: 'visitors', label: 'Visitors', count: visits.length },
  ]

  return (
    <div style={{ background: C.obsidian, color: C.filmLight, minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', minHeight: '60vh', display: 'flex', alignItems: 'flex-end', overflow: 'hidden', paddingBottom: 40 }}>
        {/* Film strip top */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 28, background: C.slate, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', zIndex: 10, overflow: 'hidden' }}>
          {Array.from({ length: 40 }).map((_, i) => <div key={i} style={{ width: 18, height: 12, borderRadius: 2, background: C.obsidian, flexShrink: 0 }} />)}
        </div>

        {/* Background */}
        {profile?.intro_video_url ? (
          <div style={{ position: 'absolute', inset: 0 }}>
            <iframe src={profile.intro_video_url.includes('youtube') ? profile.intro_video_url.replace('watch?v=', 'embed/') : profile.intro_video_url} style={{ width: '100%', height: '100%', border: 'none', opacity: 0.35 }} allow="autoplay" allowFullScreen />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,10,10,0.3) 0%, #0a0a0a 100%)' }} />
          </div>
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0a0a0a 0%, #0d1500 60%, #0a0a0a 100%)' }} />
        )}

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 5, width: '100%', maxWidth: 1100, margin: '0 auto', padding: '60px 32px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 28, flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{ width: 96, height: 96, borderRadius: '50%', background: C.lime, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 900, color: C.obsidian, boxShadow: `0 0 0 3px ${C.obsidian}, 0 0 0 5px rgba(200,255,0,0.4)`, flexShrink: 0 }}>
              {initials(name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                {profile?.pronouns && <span style={{ fontSize: 12, color: C.gray, background: C.slate, border: `1px solid ${C.border}`, borderRadius: 20, padding: '2px 10px' }}>{profile.pronouns}</span>}
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20, background: profile?.open_to_work ? 'rgba(200,255,0,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${profile?.open_to_work ? 'rgba(200,255,0,0.35)' : C.border}`, color: profile?.open_to_work ? C.lime : C.gray }}>
                  {profile?.open_to_work ? '✦ Open to work' : '○ Not looking'}
                </span>
              </div>
              <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontFamily: 'monospace', fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{name}</h1>
              {profile?.job_title && <div style={{ fontSize: 16, color: '#bbb', marginBottom: 8 }}>{profile.job_title}{profile.years_exp && <span style={{ color: C.gray }}> · {profile.years_exp} yrs exp</span>}</div>}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: C.gray }}>
                {profile?.location && <span>📍 {profile.location}</span>}
                {profile?.availability && <span>📅 {profile.availability}</span>}
                {profile?.hourly_rate && <span style={{ color: C.lime, fontWeight: 700 }}>💰 {profile.hourly_rate}/hr</span>}
              </div>
            </div>
            <button onClick={() => setShowEdit(true)} style={{ background: 'rgba(255,255,255,0.07)', border: `1px solid ${C.border}`, borderRadius: 10, color: C.filmLight, fontSize: 13, fontWeight: 600, padding: '10px 18px', cursor: 'pointer', flexShrink: 0 }}>✎ Edit Profile</button>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 40, marginTop: 32, paddingTop: 24, borderTop: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
            {[{ label: 'Reels', value: reels.length }, { label: 'Projects', value: projects.length }, { label: 'Profile Views', value: visits.length }, { label: 'Assigned', value: assigned.length }].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'monospace', color: C.lime }}>{s.value}</div>
                <div style={{ fontSize: 11, color: C.gray, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BODY ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px', display: 'grid', gridTemplateColumns: '260px 1fr', gap: 32, alignItems: 'start' }}>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {profile?.bio && (
            <div style={{ background: C.slate, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ fontSize: 10, fontFamily: 'monospace', color: C.gray, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>About</div>
              <p style={{ margin: 0, fontSize: 13, color: '#bbb', lineHeight: 1.75 }}>{profile.bio}</p>
            </div>
          )}
          {profile?.looking_for && (
            <div style={{ background: 'rgba(200,255,0,0.04)', border: '1px solid rgba(200,255,0,0.15)', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ fontSize: 10, fontFamily: 'monospace', color: C.lime, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>Looking For</div>
              <p style={{ margin: 0, fontSize: 13, color: '#ccc', lineHeight: 1.7 }}>{profile.looking_for}</p>
            </div>
          )}
          {(profile?.skills?.length ?? 0) > 0 && (
            <div style={{ background: C.slate, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ fontSize: 10, fontFamily: 'monospace', color: C.gray, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>Skills</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {profile!.skills.map(s => <span key={s} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', color: C.lime, fontWeight: 500 }}>{s}</span>)}
              </div>
            </div>
          )}
          {profile && (profile.github_url || profile.linkedin_url || profile.portfolio_url || profile.twitter_url || profile.website_url) && (
            <div style={{ background: C.slate, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ fontSize: 10, fontFamily: 'monospace', color: C.gray, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>Links</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[{ label: 'GitHub', url: profile.github_url, icon: '🐙' }, { label: 'LinkedIn', url: profile.linkedin_url, icon: '💼' }, { label: 'Portfolio', url: profile.portfolio_url, icon: '🎨' }, { label: 'Twitter', url: profile.twitter_url, icon: '𝕏' }, { label: 'Website', url: profile.website_url, icon: '🌐' }].filter(l => l.url).map(l => (
                  <a key={l.label} href={l.url!} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.lime, textDecoration: 'none', fontWeight: 500 }}>
                    <span>{l.icon}</span><span>{l.label}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main content */}
        <div>
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 2, marginBottom: 24, background: C.slate, border: `1px solid ${C.border}`, borderRadius: 12, padding: 4 }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, border: 'none', cursor: 'pointer', borderRadius: 8, padding: '9px 6px', fontSize: 13, fontWeight: 600, transition: 'all 0.15s', background: tab === t.key ? C.obsidian : 'transparent', color: tab === t.key ? C.filmLight : C.gray }}>
                {t.label}{t.count > 0 && <span style={{ marginLeft: 6, fontSize: 11, padding: '1px 6px', borderRadius: 20, background: tab === t.key ? 'rgba(200,255,0,0.15)' : 'rgba(255,255,255,0.07)', color: tab === t.key ? C.lime : C.gray }}>{t.count}</span>}
              </button>
            ))}
          </div>

          {/* Reels */}
          {tab === 'reels' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Add Reel button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={openNewReel} style={{ background: C.lime, color: C.obsidian, border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  + Add Reel
                </button>
              </div>

              {reels.length === 0
                ? <Empty icon="▶" text="No reels yet. Add your first reel to get discovered." />
                : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {reels.map(r => (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 14, background: C.slate, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 18px', transition: 'border-color 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = C.lime)}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>

                      {/* Play icon */}
                      <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', flexShrink: 0 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: C.lime }}>▶</div>
                      </a>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.filmLight, marginBottom: 4 }}>{r.title || 'Untitled reel'}</div>
                        {(r.skills || []).length > 0 && (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {r.skills.slice(0, 4).map(s => (
                              <span key={s} style={{ fontSize: 11, padding: '1px 8px', borderRadius: 20, background: 'rgba(200,255,0,0.07)', border: '1px solid rgba(200,255,0,0.18)', color: C.lime }}>{s}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Visibility + actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <span style={{ fontSize: 12, color: C.gray }}>{r.visibility === 'private' ? '🔒' : '🌐'}</span>
                        <button onClick={() => openEditReel(r)} style={{ background: 'none', border: 'none', color: C.gray, cursor: 'pointer', fontSize: 14, padding: '2px 4px' }} title="Edit">✎</button>
                        <button onClick={() => deleteReel(r.id)} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: 13, padding: '2px 4px' }} title="Delete">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              }
            </div>
          )}

          {/* Projects */}
          {tab === 'projects' && (projects.length === 0
            ? <Empty icon="🗂" text="No projects yet. Showcase your work to stand out." />
            : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
              {projects.map(p => (
                <div key={p.id} style={{ background: C.slate, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 10, transition: 'border-color 0.2s, transform 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.lime; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'translateY(0)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.filmLight, lineHeight: 1.35 }}>{p.title}</div>
                    {p.status && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.05em', background: p.status === 'completed' ? 'rgba(200,255,0,0.1)' : p.status === 'in-progress' ? 'rgba(100,150,255,0.1)' : 'rgba(255,255,255,0.06)', border: `1px solid ${p.status === 'completed' ? 'rgba(200,255,0,0.3)' : p.status === 'in-progress' ? 'rgba(100,150,255,0.25)' : C.border}`, color: p.status === 'completed' ? C.lime : p.status === 'in-progress' ? '#7090ff' : C.gray }}>{p.status}</span>}
                  </div>
                  {p.description && <p style={{ margin: 0, fontSize: 12, color: C.gray, lineHeight: 1.6 }}>{p.description.slice(0, 100)}{p.description.length > 100 ? '…' : ''}</p>}
                  {p.skills?.length > 0 && <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 'auto' }}>{p.skills.slice(0, 3).map(s => <span key={s} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.charcoal}`, color: C.gray }}>{s}</span>)}</div>}
                  {p.demo_link && <a href={p.demo_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.lime, textDecoration: 'none', fontWeight: 600 }} onClick={e => e.stopPropagation()}>🔗 View demo →</a>}
                </div>
              ))}
            </div>
          )}

          {/* Assigned */}
          {tab === 'assigned' && (assigned.length === 0
            ? <Empty icon="📋" text="No projects assigned to you yet." />
            : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
              {assigned.map(p => (
                <div key={p.id} style={{ background: C.slate, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.filmLight }}>{p.title}</div>
                    {submitDone.has(p.id)
                      ? <span style={{ fontSize: 11, color: C.lime, fontWeight: 700 }}>✓ Submitted</span>
                      : <button onClick={() => { setSubmitProject(p); setSubmitUrl(''); setSubmitNote(''); setSubmitError('') }} style={{ fontSize: 12, padding: '4px 12px', background: 'rgba(200,255,0,0.1)', border: '1px solid rgba(200,255,0,0.25)', color: C.lime, borderRadius: 6, cursor: 'pointer', fontWeight: 600, flexShrink: 0 }}>Submit →</button>}
                  </div>
                  {(p as any).managers?.name && <div style={{ fontSize: 12, color: C.gray }}>{(p as any).managers.name}{(p as any).managers.company && ` · ${(p as any).managers.company}`}</div>}
                  <span style={{ alignSelf: 'flex-start', fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(200,255,0,0.1)', border: '1px solid rgba(200,255,0,0.25)', color: C.lime }}>{p.pay_type || 'tbd'}</span>
                </div>
              ))}
            </div>
          )}

          {/* Visitors */}
          {tab === 'visitors' && (visits.length === 0
            ? <Empty icon="👔" text="No profile views yet. Share your profile to get noticed." />
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {visits.map((v, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: C.slate, borderRadius: i === 0 ? '12px 12px 0 0' : i === visits.length - 1 ? '0 0 12px 12px' : '0', border: `1px solid ${C.border}`, borderTop: i === 0 ? `1px solid ${C.border}` : 'none' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: C.charcoal, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>👔</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.filmLight }}>{(v as any).managers?.name || 'A manager'}</div>
                    {(v as any).managers?.company && <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>{(v as any).managers.company}</div>}
                  </div>
                  <div style={{ fontSize: 12, color: C.gray }}>{v.viewed_at ? timeAgo(v.viewed_at) : ''}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Reel Modal ── */}
      {showReelModal && (
        <div onClick={e => e.target === e.currentTarget && setShowReelModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 24 }}>
          <div style={{ background: '#0f0f0f', border: `1px solid ${C.border}`, borderRadius: 18, padding: 28, width: '100%', maxWidth: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.filmLight }}>{editReel ? 'Edit Reel' : 'Add New Reel'}</div>
              <button onClick={() => setShowReelModal(false)} style={{ background: C.slate, border: `1px solid ${C.border}`, color: C.gray, borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
            <form onSubmit={saveReel} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: C.gray, fontWeight: 600, display: 'block', marginBottom: 5 }}>Video URL * (YouTube, Loom, or Vimeo)</label>
                <input style={{ width: '100%', padding: '10px 13px', background: C.slate, border: `1px solid ${C.border}`, borderRadius: 8, color: C.filmLight, fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }}
                  placeholder="https://youtube.com/watch?v=..." value={reelUrl} onChange={e => setReelUrl(e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: 11, color: C.gray, fontWeight: 600, display: 'block', marginBottom: 5 }}>Title</label>
                <input style={{ width: '100%', padding: '10px 13px', background: C.slate, border: `1px solid ${C.border}`, borderRadius: 8, color: C.filmLight, fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }}
                  placeholder="e.g. Building a Real-Time Chat App" value={reelTitle} onChange={e => setReelTitle(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: C.gray, fontWeight: 600, display: 'block', marginBottom: 5 }}>Skills shown in this reel</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input style={{ flex: 1, padding: '10px 13px', background: C.slate, border: `1px solid ${C.border}`, borderRadius: 8, color: C.filmLight, fontSize: 13, outline: 'none' }}
                    placeholder="Add skill, press Enter" value={reelSkillInput} onChange={e => setReelSkillInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (reelSkillInput.trim() && !reelSkills.includes(reelSkillInput.trim())) { setReelSkills(prev => [...prev, reelSkillInput.trim()]); setReelSkillInput('') } } }} />
                  <button type="button" onClick={() => { if (reelSkillInput.trim() && !reelSkills.includes(reelSkillInput.trim())) { setReelSkills(prev => [...prev, reelSkillInput.trim()]); setReelSkillInput('') } }}
                    style={{ padding: '8px 14px', background: C.slate, border: `1px solid ${C.border}`, color: C.filmLight, borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Add</button>
                </div>
                {reelSkills.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {reelSkills.map(s => (
                      <span key={s} onClick={() => setReelSkills(prev => prev.filter(x => x !== s))}
                        style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', color: C.lime, cursor: 'pointer' }}>
                        {s} ✕
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label style={{ fontSize: 11, color: C.gray, fontWeight: 600, display: 'block', marginBottom: 8 }}>Visibility</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['public', 'private'] as const).map(v => (
                    <button type="button" key={v} onClick={() => setReelVisibility(v)}
                      style={{ flex: 1, padding: '9px', background: reelVisibility === v ? C.lime : 'transparent', color: reelVisibility === v ? C.obsidian : C.gray, border: `1px solid ${reelVisibility === v ? C.lime : C.border}`, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                      {v === 'public' ? '🌐 Public' : '🔒 Private'}
                    </button>
                  ))}
                </div>
              </div>
              {reelError && <div style={{ color: '#ff6b6b', fontSize: 12 }}>{reelError}</div>}
              <button type="submit" disabled={savingReel} style={{ padding: '12px', background: C.lime, color: C.obsidian, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>
                {savingReel ? 'Saving…' : editReel ? 'Save Changes' : 'Add Reel'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showEdit && profile && <EditProfileModal profile={profile} onClose={() => setShowEdit(false)} onSaved={p => setProfile(p)} />}

      {/* Submit Work Modal */}
      {submitProject && (
        <div onClick={e => e.target === e.currentTarget && setSubmitProject(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 24 }}>
          <div style={{ background: '#0f0f0f', border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, width: '100%', maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 10, color: C.gray, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Submit Work</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.filmLight, marginTop: 2 }}>{submitProject.title}</div>
              </div>
              <button onClick={() => setSubmitProject(null)} style={{ background: C.slate, border: `1px solid ${C.border}`, color: C.gray, borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 13 }}>✕</button>
            </div>
            <form onSubmit={submitWork} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[{ label: 'Submission link', val: submitUrl, set: setSubmitUrl, ph: 'https://github.com/you/project' }, { label: 'Note to manager', val: submitNote, set: setSubmitNote, ph: 'Describe what you built…' }, { label: 'Video explanation (Loom, YouTube)', val: submitVideo, set: setSubmitVideo, ph: 'https://loom.com/share/...' }].map(f => (
                <div key={f.label}>
                  <label style={{ fontSize: 11, color: C.gray, fontWeight: 600, display: 'block', marginBottom: 5 }}>{f.label}</label>
                  <input style={{ width: '100%', padding: '10px 13px', background: C.slate, border: `1px solid ${C.border}`, borderRadius: 8, color: C.filmLight, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)} />
                </div>
              ))}
              {submitError && <div style={{ color: '#ff6b6b', fontSize: 12 }}>{submitError}</div>}
              <button type="submit" disabled={submitting} style={{ padding: 11, background: C.lime, color: C.obsidian, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>{submitting ? 'Submitting…' : 'Submit Work →'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '56px 20px', background: C.slate, border: `1px dashed ${C.border}`, borderRadius: 12 }}>
      <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 14, color: C.gray, maxWidth: 280, margin: '0 auto', lineHeight: 1.65 }}>{text}</div>
    </div>
  )
}
