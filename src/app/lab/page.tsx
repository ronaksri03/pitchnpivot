'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getClient } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { ManagerProject, IndividualProject, ProjectSubmission } from '@/types'

const C = {
  obsidian: '#0a0a0a', slate: '#1a1a1a', filmLight: '#f0ece4',
  lime: '#c8ff00', gray: '#888', border: '#2a2a2a', charcoal: '#2d2d2d',
}
const inp: React.CSSProperties = {
  width: '100%', padding: '10px 13px', background: '#1a1a1a',
  border: '1px solid #2a2a2a', borderRadius: 8, color: '#f0ece4',
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
}

const PAY_COLORS: Record<string, string> = { paid: C.lime, bounty: '#ffd700', equity: '#7090ff', unpaid: C.gray, tbd: C.gray }
const PAY_LABELS: Record<string, string> = { paid: '💰 Paid', bounty: '🏆 Bounty', equity: '📈 Equity', unpaid: '🤝 Unpaid', tbd: '❓ TBD' }
const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending:  { bg: 'rgba(255,200,0,0.1)',  color: '#ffc800', label: '⏳ Pending'  },
  accepted: { bg: 'rgba(200,255,0,0.1)',  color: C.lime,   label: '✓ Accepted' },
  rejected: { bg: 'rgba(255,100,100,0.1)',color: '#ff6b6b', label: '✕ Rejected' },
}

type SortKey = 'latest' | 'oldest' | 'status' | 'name'

export default function LabPage() {
  const { user, accountType, loading: authLoading } = useAuth()
  const router = useRouter()
  const sb = getClient()

  /* ── shared ── */
  const [loading, setLoading] = useState(true)

  /* ── individual ── */
  const [openProjects, setOpenProjects]     = useState<ManagerProject[]>([])
  const [myProjects, setMyProjects]         = useState<IndividualProject[]>([])
  const [mySubmissions, setMySubmissions]   = useState<ProjectSubmission[]>([])
  const [indTab, setIndTab]                 = useState<'browse'|'mine'|'submitted'>('browse')
  const [alreadySubmitted, setAlreadySubmitted] = useState<Set<string>>(new Set())

  // individual project form
  const [showIndForm, setShowIndForm]   = useState(false)
  const [editIndId, setEditIndId]       = useState<string|null>(null)
  const [indTitle, setIndTitle]         = useState('')
  const [indDesc, setIndDesc]           = useState('')
  const [indStatus, setIndStatus]       = useState<'completed'|'in-progress'|'idea'>('completed')
  const [indDemoLink, setIndDemoLink]   = useState('')
  const [indSkillInput, setIndSkillInput] = useState('')
  const [indSkills, setIndSkills]       = useState<string[]>([])

  // submit work modal
  const [submitProject, setSubmitProject] = useState<ManagerProject|null>(null)
  const [submitUrl, setSubmitUrl]         = useState('')
  const [submitNote, setSubmitNote]       = useState('')
  const [submitVideo, setSubmitVideo]     = useState('')
  const [submitting, setSubmitting]       = useState(false)
  const [submitError, setSubmitError]     = useState('')
  const [submitReelId, setSubmitReelId]   = useState<string|null>(null)
  const [myReelsForSubmit, setMyReelsForSubmit] = useState<any[]>([])

  /* ── manager ── */
  const [mgrProjects, setMgrProjects]     = useState<ManagerProject[]>([])
  const [mgrTab, setMgrTab]               = useState<'projects'|'post'>('projects')
  const [selectedProject, setSelectedProject] = useState<ManagerProject|null>(null)
  const [submissions, setSubmissions]     = useState<any[]>([])
  const [loadingSubs, setLoadingSubs]     = useState(false)
  const [verifyingId, setVerifyingId]     = useState<string|null>(null)
  const [verifyNote, setVerifyNote]       = useState('')
  const [verifyingSub, setVerifyingSub]   = useState<any|null>(null)
  const [verifyReels, setVerifyReels]     = useState<any[]>([])
  const [selectedVerifyReel, setSelectedVerifyReel] = useState<string|null>(null)
  const [sortKey, setSortKey]             = useState<SortKey>('latest')
  const [statusFilter, setStatusFilter]   = useState<'all'|'pending'|'accepted'|'rejected'>('all')

  // post project form
  const [postTitle, setPostTitle]         = useState('')
  const [postDesc, setPostDesc]           = useState('')
  const [postTimeline, setPostTimeline]   = useState('')
  const [postPayType, setPostPayType]     = useState<'paid'|'unpaid'|'bounty'|'equity'|'tbd'>('paid')
  const [postVisibility, setPostVisibility] = useState<'public'|'private'>('public')
  const [postSkillInput, setPostSkillInput] = useState('')
  const [postSkills, setPostSkills]       = useState<string[]>([])
  const [posting, setPosting]             = useState(false)
  const [postError, setPostError]         = useState('')
  const [postSuccess, setPostSuccess]     = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth')
  }, [authLoading, user, router])

  /* ── load data ── */
  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    if (accountType === 'manager') {
      const { data } = await sb.from('manager_projects').select('*').eq('manager_id', user.id).order('created_at', { ascending: false })
      setMgrProjects((data || []) as ManagerProject[])
    } else {
      const { data: open } = await sb.from('manager_projects').select('*, managers(name, company)').eq('status', 'open').eq('visibility', 'public').order('created_at', { ascending: false })
      setOpenProjects((open || []) as ManagerProject[])
      const [mineRes, subRes] = await Promise.all([
        sb.from('individual_projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        sb.from('project_submissions').select('*, manager_projects(title, pay_type)').eq('individual_id', user.id).order('submitted_at', { ascending: false }),
      ])
      setMyProjects((mineRes.data || []) as IndividualProject[])
      setMySubmissions((subRes.data || []) as ProjectSubmission[])
      setAlreadySubmitted(new Set((subRes.data || []).map((s: any) => s.project_id)))
    }
    setLoading(false)
  }, [user, accountType])

  useEffect(() => { loadData() }, [loadData])

  /* ── manager: load submissions for a project ── */
  async function loadSubmissions(project: ManagerProject) {
    setSelectedProject(project)
    setLoadingSubs(true)
    const { data: apps } = await sb.from('project_submissions').select('*').eq('project_id', project.id)
    if (apps && apps.length > 0) {
      const ids = apps.map((a: any) => a.individual_id)
      const { data: profiles } = await sb.from('profiles').select('id, first_name, last_name, job_title, username').in('id', ids)
      const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p]))
      setSubmissions(apps.map((a: any) => ({ ...a, profile: profileMap[a.individual_id] || null })))
    } else {
      setSubmissions([])
    }
    setLoadingSubs(false)
  }

  /* ── manager: post project ── */
  async function postProject(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !postTitle.trim()) return
    setPosting(true); setPostError(''); setPostSuccess(false)
    const { error } = await sb.from('manager_projects').insert({
      manager_id: user.id, title: postTitle.trim(), description: postDesc || null,
      timeline: postTimeline || null, pay_type: postPayType,
      skills_required: postSkills, visibility: postVisibility, status: 'open',
    })
    if (error) { setPostError(error.message); setPosting(false); return }
    setPostTitle(''); setPostDesc(''); setPostTimeline(''); setPostSkills([]); setPostSkillInput(''); setPostSuccess(true)
    await loadData()
    setPosting(false)
    setTimeout(() => { setMgrTab('projects'); setPostSuccess(false) }, 1200)
  }

  /* ── manager: update submission status ── */
  async function updateStatus(subId: string, status: string) {
    await sb.from('project_submissions').update({ status }).eq('id', subId)
    setSubmissions(prev => prev.map(s => s.id === subId ? { ...s, status } : s))
  }

  /* ── manager: toggle project status ── */
  async function toggleProjectStatus(p: ManagerProject) {
    const newStatus = p.status === 'open' ? 'closed' : 'open'
    await sb.from('manager_projects').update({ status: newStatus }).eq('id', p.id)
    setMgrProjects(prev => prev.map(x => x.id === p.id ? { ...x, status: newStatus } : x))
    if (selectedProject?.id === p.id) setSelectedProject(prev => prev ? { ...prev, status: newStatus } : null)
  }

  /* ── individual: post own project ── */
  async function saveIndProject(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !indTitle.trim()) return
    const payload = { title: indTitle.trim(), description: indDesc || null, status: indStatus, skills: indSkills, visibility: 'public' as const, demo_link: indDemoLink || null }
    const { data, error } = editIndId
      ? await sb.from('individual_projects').update(payload).eq('id', editIndId).select().single()
      : await sb.from('individual_projects').insert({ ...payload, user_id: user.id }).select().single()
    if (error || !data) return
    setMyProjects(prev => editIndId ? prev.map(p => p.id === editIndId ? data : p) : [data, ...prev])
    setShowIndForm(false); setEditIndId(null); setIndTitle(''); setIndDesc(''); setIndSkills([]); setIndDemoLink('')
  }

  /* ── individual: submit work ── */
  async function submitWork(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !submitProject) return
    setSubmitting(true); setSubmitError('')
    const { error } = await sb.from('project_submissions').insert({
      project_id: submitProject.id, individual_id: user.id,
      submission_url: submitUrl || null, note: submitNote || null,
      video_url: submitVideo || (myReelsForSubmit.find((r:any)=>r.id===submitReelId)?.url) || null,
      reel_id: submitReelId || null,
    })
    if (error) { setSubmitError(error.code === '23505' ? 'Already submitted.' : error.message); setSubmitting(false); return }
    setAlreadySubmitted(prev => new Set([...prev, submitProject.id]))
    setSubmitProject(null); setSubmitUrl(''); setSubmitNote(''); setSubmitVideo('')
    setSubmitting(false)
    loadData()
  }

  /* ── manager: verify a reel ── */
  async function openVerifyModal(sub: any) {
    // Fetch the individual's public reels
    const { data } = await sb.from('reels')
      .select('id, title, url, skills, is_verified, visibility')
      .eq('user_id', sub.individual_id)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
    setVerifyReels(data || [])
    // Pre-select attached reel if any
    setSelectedVerifyReel(sub.reel_id || (data?.[0]?.id ?? null))
    setVerifyNote('')
    setVerifyingSub(sub)
  }

  async function verifyReel() {
    if (!verifyingSub || !selectedVerifyReel) return
    setVerifyingId(verifyingSub.id)
    await sb.from('reels').update({
      is_verified: true,
      verified_by: user!.id,
      verified_at: new Date().toISOString(),
      verification_note: verifyNote || null,
      verified_project_title: selectedProject?.title || null,
    }).eq('id', selectedVerifyReel)
    setSubmissions(prev => prev.map(s =>
      s.id === verifyingSub.id ? { ...s, reel_verified: true, reel_id: selectedVerifyReel } : s
    ))
    setVerifyReels(prev => prev.map(r => r.id === selectedVerifyReel ? { ...r, is_verified: true } : r))
    setVerifyingSub(null)
    setVerifyNote('')
    setSelectedVerifyReel(null)
    setVerifyingId(null)
  }

  /* ── sorted/filtered submissions ── */
  const sortedSubs = [...submissions]
    .filter(s => statusFilter === 'all' || s.status === statusFilter)
    .sort((a, b) => {
      if (sortKey === 'latest') return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
      if (sortKey === 'oldest') return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
      if (sortKey === 'status') return (a.status || '').localeCompare(b.status || '')
      if (sortKey === 'name') {
        const na = `${a.profile?.first_name || ''} ${a.profile?.last_name || ''}`.trim()
        const nb = `${b.profile?.first_name || ''} ${b.profile?.last_name || ''}`.trim()
        return na.localeCompare(nb)
      }
      return 0
    })

  if (authLoading || loading) return (
    <div style={{ minHeight: '100vh', background: C.obsidian, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 56 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: `3px solid ${C.border}`, borderTopColor: C.lime, animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <div style={{ fontSize: 13, color: C.gray, fontFamily: 'monospace' }}>Loading…</div>
      </div>
    </div>
  )

  /* ════════════════════════════════════════════════ MANAGER VIEW */
  if (accountType === 'manager') return (
    <div style={{ background: C.obsidian, minHeight: '100vh', color: C.filmLight, fontFamily: 'Inter, sans-serif', paddingTop: 56 }}>
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '36px 40px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.lime, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 8 }}>Project Lab</div>
            <h1 style={{ fontSize: 'clamp(24px, 4vw, 44px)', fontFamily: 'monospace', fontWeight: 700, margin: 0 }}>Manage Projects</h1>
          </div>
          <button onClick={() => { setMgrTab('post'); setPostSuccess(false) }} style={{ background: C.lime, color: C.obsidian, border: 'none', borderRadius: 10, padding: '11px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>+ Post Project</button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 32, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Open Projects', value: mgrProjects.filter(p => p.status === 'open').length },
            { label: 'Closed Projects', value: mgrProjects.filter(p => p.status === 'closed').length },
            { label: 'Total Projects', value: mgrProjects.length },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'monospace', color: C.lime }}>{s.value}</div>
              <div style={{ fontSize: 11, color: C.gray, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2 }}>
          {[{ key: 'projects', label: 'My Projects' }, { key: 'post', label: '+ Post New' }].map(t => (
            <button key={t.key} onClick={() => setMgrTab(t.key as any)}
              style={{ padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: mgrTab === t.key ? C.filmLight : C.gray, borderBottom: mgrTab === t.key ? `2px solid ${C.lime}` : '2px solid transparent', marginBottom: -1 }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '32px 40px', display: 'grid', gridTemplateColumns: selectedProject ? '1fr 1fr' : '1fr', gap: 24 }}>

        {/* ── MY PROJECTS ── */}
        {mgrTab === 'projects' && (
          <div>
            {mgrProjects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: C.slate, border: `1px dashed ${C.border}`, borderRadius: 14 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
                <div style={{ fontSize: 15, color: C.gray, marginBottom: 20 }}>No projects yet.</div>
                <button onClick={() => setMgrTab('post')} style={{ background: C.lime, color: C.obsidian, border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>Post your first project</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {mgrProjects.map(p => {
                  const isSelected = selectedProject?.id === p.id
                  return (
                    <div key={p.id}
                      style={{ background: isSelected ? 'rgba(200,255,0,0.04)' : C.slate, border: `1px solid ${isSelected ? 'rgba(200,255,0,0.4)' : C.border}`, borderRadius: 14, padding: '16px 20px', cursor: 'pointer', transition: 'all 0.15s' }}
                      onClick={() => loadSubmissions(p)}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = C.lime }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = C.border }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <div style={{ fontSize: 15, fontWeight: 700 }}>{p.title}</div>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: p.status === 'open' ? 'rgba(200,255,0,0.1)' : 'rgba(255,255,255,0.06)', border: `1px solid ${p.status === 'open' ? 'rgba(200,255,0,0.3)' : C.border}`, color: p.status === 'open' ? C.lime : C.gray, textTransform: 'uppercase' }}>{p.status}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 14, fontSize: 12, color: C.gray, flexWrap: 'wrap' }}>
                            {p.timeline && <span>⏱ {p.timeline}</span>}
                            {p.pay_type && <span style={{ color: PAY_COLORS[p.pay_type] }}>{PAY_LABELS[p.pay_type]}</span>}
                            <span>👁 {p.visibility}</span>
                          </div>
                          {(p.skills_required || []).length > 0 && (
                            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
                              {p.skills_required.slice(0, 4).map(s => <span key={s} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.18)', color: C.lime }}>{s}</span>)}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                          <button onClick={e => { e.stopPropagation(); toggleProjectStatus(p) }}
                            style={{ fontSize: 11, padding: '5px 12px', borderRadius: 6, border: `1px solid ${p.status === 'open' ? 'rgba(255,107,107,0.3)' : 'rgba(200,255,0,0.3)'}`, background: p.status === 'open' ? 'rgba(255,107,107,0.08)' : 'rgba(200,255,0,0.08)', color: p.status === 'open' ? '#ff6b6b' : C.lime, cursor: 'pointer', fontWeight: 700 }}>
                            {p.status === 'open' ? 'Close' : 'Reopen'}
                          </button>
                          <span style={{ fontSize: 12, color: isSelected ? C.lime : C.gray, padding: '5px 10px', fontWeight: 600 }}>
                            {isSelected ? 'Viewing ▸' : 'Submissions →'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── POST PROJECT FORM ── */}
        {mgrTab === 'post' && (
          <div style={{ background: C.slate, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, maxWidth: 560 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 22 }}>Post a New Project</div>
            <form onSubmit={postProject} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: C.gray, fontWeight: 600, display: 'block', marginBottom: 5 }}>Title *</label>
                <input style={inp} placeholder="e.g. Build a landing page" value={postTitle} onChange={e => setPostTitle(e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: 11, color: C.gray, fontWeight: 600, display: 'block', marginBottom: 5 }}>Description</label>
                <textarea style={{ ...inp, resize: 'vertical' } as React.CSSProperties} rows={4} placeholder="What needs to be built? What does success look like?" value={postDesc} onChange={e => setPostDesc(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: C.gray, fontWeight: 600, display: 'block', marginBottom: 5 }}>Timeline</label>
                  <input style={inp} placeholder="e.g. 2 weeks" value={postTimeline} onChange={e => setPostTimeline(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.gray, fontWeight: 600, display: 'block', marginBottom: 5 }}>Pay Type</label>
                  <select style={{ ...inp, appearance: 'none' }} value={postPayType} onChange={e => setPostPayType(e.target.value as any)}>
                    {['paid','bounty','equity','unpaid','tbd'].map(p => <option key={p} value={p}>{PAY_LABELS[p]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: C.gray, fontWeight: 600, display: 'block', marginBottom: 5 }}>Skills Required</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input style={{ ...inp, flex: 1 }} placeholder="Add skill, press Enter" value={postSkillInput} onChange={e => setPostSkillInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (postSkillInput.trim() && !postSkills.includes(postSkillInput.trim())) { setPostSkills(p => [...p, postSkillInput.trim()]); setPostSkillInput('') } } }} />
                  <button type="button" onClick={() => { if (postSkillInput.trim() && !postSkills.includes(postSkillInput.trim())) { setPostSkills(p => [...p, postSkillInput.trim()]); setPostSkillInput('') } }}
                    style={{ padding: '8px 14px', background: C.obsidian, border: `1px solid ${C.border}`, color: C.filmLight, borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Add</button>
                </div>
                {postSkills.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {postSkills.map(s => <span key={s} onClick={() => setPostSkills(p => p.filter(x => x !== s))} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', color: C.lime, cursor: 'pointer' }}>{s} ✕</span>)}
                  </div>
                )}
              </div>
              <div>
                <label style={{ fontSize: 11, color: C.gray, fontWeight: 600, display: 'block', marginBottom: 8 }}>Visibility</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['public', 'private'] as const).map(v => (
                    <button type="button" key={v} onClick={() => setPostVisibility(v)} style={{ flex: 1, padding: '9px', background: postVisibility === v ? C.lime : 'transparent', color: postVisibility === v ? C.obsidian : C.gray, border: `1px solid ${postVisibility === v ? C.lime : C.border}`, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                      {v === 'public' ? '🌐 Public' : '🔒 Private'}
                    </button>
                  ))}
                </div>
              </div>
              {postError && <div style={{ color: '#ff6b6b', fontSize: 12 }}>{postError}</div>}
              {postSuccess && <div style={{ color: C.lime, fontSize: 13, fontWeight: 600 }}>✓ Project posted! Redirecting…</div>}
              <button type="submit" disabled={posting} style={{ padding: '12px', background: C.lime, color: C.obsidian, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>
                {posting ? 'Posting…' : 'Post Project →'}
              </button>
            </form>
          </div>
        )}

        {/* ── SUBMISSIONS PANEL ── */}
        {selectedProject && (
          <div style={{ background: C.slate, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            {/* Panel header */}
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.gray, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Submissions</div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{selectedProject.title}</div>
                <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>{sortedSubs.length} of {submissions.length} shown</div>
              </div>
              <button onClick={() => setSelectedProject(null)} style={{ background: C.obsidian, border: `1px solid ${C.border}`, color: C.gray, borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 13, flexShrink: 0 }}>✕</button>
            </div>

            {/* Sort + filter */}
            <div style={{ padding: '12px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {(['all','pending','accepted','rejected'] as const).map(f => (
                  <button key={f} onClick={() => setStatusFilter(f)}
                    style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, border: `1px solid ${statusFilter === f ? C.lime : C.border}`, background: statusFilter === f ? 'rgba(200,255,0,0.1)' : 'transparent', color: statusFilter === f ? C.lime : C.gray, cursor: 'pointer', fontWeight: 600, textTransform: 'capitalize' }}>
                    {f}
                  </button>
                ))}
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: C.gray }}>Sort:</span>
                <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}
                  style={{ fontSize: 11, background: C.obsidian, border: `1px solid ${C.border}`, color: C.filmLight, borderRadius: 6, padding: '4px 8px', outline: 'none', cursor: 'pointer' }}>
                  <option value="latest">Latest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="status">By status</option>
                  <option value="name">By name</option>
                </select>
              </div>
            </div>

            {/* Submissions list */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '12px 22px 22px' }}>
              {loadingSubs ? (
                <div style={{ textAlign: 'center', padding: 40, color: C.gray }}>Loading submissions…</div>
              ) : submissions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
                  <div style={{ fontSize: 14, color: C.gray }}>No submissions yet.</div>
                </div>
              ) : sortedSubs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: C.gray, fontSize: 13 }}>No submissions match this filter.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {sortedSubs.map(sub => {
                    const p = sub.profile
                    const name = p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown' : 'Unknown'
                    const st = STATUS_STYLE[sub.status] || STATUS_STYLE.pending
                    return (
                      <div key={sub.id} style={{ background: C.obsidian, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{name}</div>
                            {p?.job_title && <div style={{ fontSize: 12, color: C.gray }}>{p.job_title}</div>}
                            <div style={{ fontSize: 11, color: C.charcoal, marginTop: 3 }}>
                              {new Date(sub.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                            {p?.username && (
                              <a href={`/profile/${p.username}`} target="_blank" rel="noopener noreferrer"
                                style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.gray, borderRadius: 6, textDecoration: 'none', fontWeight: 600 }}>
                                Profile →
                              </a>
                            )}
                            {(['pending','accepted','rejected'] as const).map(s => (
                              <button key={s} onClick={() => updateStatus(sub.id, s)}
                                style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: `1px solid ${sub.status === s ? STATUS_STYLE[s].color + '60' : C.border}`, background: sub.status === s ? STATUS_STYLE[s].bg : 'transparent', color: sub.status === s ? STATUS_STYLE[s].color : C.gray, cursor: 'pointer', fontWeight: 700, textTransform: 'capitalize' }}>
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>

                        {sub.video_url && (
                          <div style={{ position: 'relative', paddingBottom: '36%', borderRadius: 8, overflow: 'hidden', background: C.slate, marginBottom: 10 }}>
                            <iframe src={sub.video_url.includes('youtube') ? sub.video_url.replace('watch?v=', 'embed/') : sub.video_url.replace('loom.com/share/', 'loom.com/embed/')}
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} allow="autoplay" allowFullScreen />
                          </div>
                        )}

                        {sub.submission_url && (
                          <a href={sub.submission_url} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: 12, color: C.lime, textDecoration: 'none', fontWeight: 600, display: 'block', marginBottom: 6 }}>🔗 View Submission →</a>
                        )}

                        {sub.note && (
                          <div style={{ background: C.slate, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#bbb', lineHeight: 1.65 }}>
                            {sub.note}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  /* ════════════════════════════════════════════════ INDIVIDUAL VIEW */
  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', color: C.filmLight, fontFamily: 'Inter, sans-serif', paddingTop: 56 }}>
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '36px 40px 0' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.lime, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 8 }}>Project Lab</div>
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 44px)', fontFamily: 'monospace', fontWeight: 700, margin: '0 0 6px' }}>Find work. Build things.</h1>
          <p style={{ margin: 0, fontSize: 14, color: C.gray }}>Browse open projects from managers or post your own.</p>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {[
            { key: 'browse',    label: 'Browse Projects', count: openProjects.length },
            { key: 'mine',      label: 'My Projects',     count: myProjects.length   },
            { key: 'submitted', label: 'Submitted',        count: mySubmissions.length},
          ].map(t => (
            <button key={t.key} onClick={() => setIndTab(t.key as any)}
              style={{ padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: indTab === t.key ? C.filmLight : C.gray, borderBottom: indTab === t.key ? `2px solid ${C.lime}` : '2px solid transparent', marginBottom: -1 }}>
              {t.label}
              <span style={{ marginLeft: 6, fontSize: 11, color: indTab === t.key ? C.lime : C.charcoal, fontWeight: 700 }}>{t.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '32px 40px' }}>

        {/* ── BROWSE ── */}
        {indTab === 'browse' && (
          openProjects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: C.slate, border: `1px dashed ${C.border}`, borderRadius: 14 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
              <div style={{ color: C.gray, fontSize: 14 }}>No open projects right now. Check back soon.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
              {openProjects.map(p => {
                const done = alreadySubmitted.has(p.id)
                const mgr = (p as any).managers
                return (
                  <div key={p.id} style={{ background: C.slate, border: `1px solid ${done ? 'rgba(200,255,0,0.25)' : C.border}`, borderRadius: 16, padding: 22, display: 'flex', flexDirection: 'column', gap: 12, transition: 'border-color 0.2s' }}
                    onMouseEnter={e => { if (!done) e.currentTarget.style.borderColor = C.lime }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = done ? 'rgba(200,255,0,0.25)' : C.border }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{p.title}</div>
                      {p.pay_type && <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: `${PAY_COLORS[p.pay_type]}15`, border: `1px solid ${PAY_COLORS[p.pay_type]}40`, color: PAY_COLORS[p.pay_type], flexShrink: 0 }}>{PAY_LABELS[p.pay_type]}</span>}
                    </div>
                    {mgr && <div style={{ fontSize: 12, color: C.gray }}>by {mgr.name}{mgr.company ? ` · ${mgr.company}` : ''}</div>}
                    {p.description && <p style={{ margin: 0, fontSize: 13, color: '#aaa', lineHeight: 1.6 }}>{p.description.slice(0, 120)}{p.description.length > 120 ? '…' : ''}</p>}
                    {p.timeline && <div style={{ fontSize: 12, color: C.gray }}>⏱ {p.timeline}</div>}
                    {(p.skills_required || []).length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {p.skills_required.slice(0, 4).map(s => <span key={s} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.18)', color: C.lime }}>{s}</span>)}
                      </div>
                    )}
                    <button onClick={() => { if (!done) { setSubmitProject(p); setSubmitUrl(''); setSubmitNote(''); setSubmitVideo(''); setSubmitError('') } }} disabled={done}
                      style={{ marginTop: 'auto', padding: '10px', background: done ? 'rgba(200,255,0,0.08)' : C.lime, color: done ? C.lime : C.obsidian, border: done ? '1px solid rgba(200,255,0,0.25)' : 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: done ? 'default' : 'pointer' }}>
                      {done ? '✓ Submitted' : 'Submit Work →'}
                    </button>
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* ── MY PROJECTS ── */}
        {indTab === 'mine' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowIndForm(true); setEditIndId(null); setIndTitle(''); setIndDesc(''); setIndSkills([]); setIndDemoLink('') }}
                style={{ background: C.lime, color: C.obsidian, border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>+ Add Project</button>
            </div>
            {myProjects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: C.slate, border: `1px dashed ${C.border}`, borderRadius: 14 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🗂</div>
                <div style={{ color: C.gray, fontSize: 14 }}>No projects yet.</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                {myProjects.map(p => (
                  <div key={p.id} style={{ background: C.slate, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{p.title}</div>
                      <button onClick={() => { setShowIndForm(true); setEditIndId(p.id); setIndTitle(p.title); setIndDesc(p.description || ''); setIndStatus(p.status || 'completed'); setIndSkills(p.skills || []); setIndDemoLink(p.demo_link || '') }}
                        style={{ background: 'none', border: 'none', color: C.gray, cursor: 'pointer', fontSize: 14, flexShrink: 0 }}>✎</button>
                    </div>
                    {p.description && <p style={{ margin: 0, fontSize: 12, color: C.gray, lineHeight: 1.6 }}>{p.description.slice(0, 80)}{p.description.length > 80 ? '…' : ''}</p>}
                    {(p.skills || []).length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {p.skills.slice(0, 3).map(s => <span key={s} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 20, background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.18)', color: C.lime }}>{s}</span>)}
                      </div>
                    )}
                    {p.demo_link && <a href={p.demo_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.lime, textDecoration: 'none', fontWeight: 600 }}>🔗 Demo →</a>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SUBMITTED ── */}
        {indTab === 'submitted' && (
          mySubmissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: C.slate, border: `1px dashed ${C.border}`, borderRadius: 14 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📤</div>
              <div style={{ color: C.gray, fontSize: 14 }}>No submissions yet. Browse projects and submit your work.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {mySubmissions.map(s => {
                const proj = (s as any).manager_projects
                const st = STATUS_STYLE[s.status] || STATUS_STYLE.pending
                return (
                  <div key={s.id} style={{ background: C.slate, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{proj?.title || 'Project'}</div>
                      <div style={{ fontSize: 12, color: C.gray }}>{new Date(s.submitted_at).toLocaleDateString()}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: st.bg, color: st.color, border: `1px solid ${st.color}40` }}>{st.label}</span>
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>

      {/* ── INDIVIDUAL PROJECT FORM MODAL ── */}
      {showIndForm && (
        <div onClick={e => e.target === e.currentTarget && setShowIndForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}>
          <div style={{ background: '#0f0f0f', border: `1px solid ${C.border}`, borderRadius: 18, padding: 28, width: '100%', maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{editIndId ? 'Edit Project' : 'Add Project'}</div>
              <button onClick={() => setShowIndForm(false)} style={{ background: C.slate, border: `1px solid ${C.border}`, color: C.gray, borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
            <form onSubmit={saveIndProject} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={{ fontSize: 11, color: C.gray, fontWeight: 600, display: 'block', marginBottom: 5 }}>Title *</label><input style={inp} value={indTitle} onChange={e => setIndTitle(e.target.value)} required /></div>
              <div><label style={{ fontSize: 11, color: C.gray, fontWeight: 600, display: 'block', marginBottom: 5 }}>Description</label><textarea style={{ ...inp, resize: 'vertical' } as React.CSSProperties} rows={3} value={indDesc} onChange={e => setIndDesc(e.target.value)} /></div>
              <div><label style={{ fontSize: 11, color: C.gray, fontWeight: 600, display: 'block', marginBottom: 5 }}>Demo Link</label><input style={inp} placeholder="https://..." value={indDemoLink} onChange={e => setIndDemoLink(e.target.value)} /></div>
              <div>
                <label style={{ fontSize: 11, color: C.gray, fontWeight: 600, display: 'block', marginBottom: 5 }}>Skills</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input style={{ ...inp, flex: 1 }} placeholder="Add skill, press Enter" value={indSkillInput} onChange={e => setIndSkillInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (indSkillInput.trim() && !indSkills.includes(indSkillInput.trim())) { setIndSkills(p => [...p, indSkillInput.trim()]); setIndSkillInput('') } } }} />
                  <button type="button" onClick={() => { if (indSkillInput.trim()) { setIndSkills(p => [...p, indSkillInput.trim()]); setIndSkillInput('') } }} style={{ padding: '8px 14px', background: C.slate, border: `1px solid ${C.border}`, color: C.filmLight, borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Add</button>
                </div>
                {indSkills.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>{indSkills.map(s => <span key={s} onClick={() => setIndSkills(p => p.filter(x => x !== s))} style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', color: C.lime, cursor: 'pointer' }}>{s} ✕</span>)}</div>}
              </div>
              <button type="submit" style={{ padding: '11px', background: C.lime, color: C.obsidian, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>{editIndId ? 'Save Changes' : 'Add Project'}</button>
            </form>
          </div>
        </div>
      )}

      {/* ── SUBMIT WORK MODAL ── */}
      {submitProject && (
        <div onClick={e => e.target === e.currentTarget && setSubmitProject(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}>
          <div style={{ background: '#0f0f0f', border: `1px solid ${C.border}`, borderRadius: 18, padding: 28, width: '100%', maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
              <div>
                <div style={{ fontSize: 11, color: C.gray, fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Submit Work</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{submitProject.title}</div>
              </div>
              <button onClick={() => setSubmitProject(null)} style={{ background: C.slate, border: `1px solid ${C.border}`, color: C.gray, borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
            <form onSubmit={submitWork} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Reel selector */}
              {myReelsForSubmit.length > 0 && (
                <div>
                  <label style={{ fontSize: 11, color: C.gray, fontWeight: 600, display: 'block', marginBottom: 8 }}>Attach a Reel as your Video Walkthrough</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {myReelsForSubmit.map((r:any) => (
                      <div key={r.id} onClick={() => setSubmitReelId(submitReelId===r.id ? null : r.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: submitReelId===r.id ? 'rgba(200,255,0,0.07)' : C.obsidian, border: `1px solid ${submitReelId===r.id ? C.lime : C.border}`, borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s' }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${submitReelId===r.id ? C.lime : C.charcoal}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {submitReelId===r.id && <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.lime }} />}
                        </div>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(200,255,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.lime, fontSize: 10, flexShrink: 0 }}>▶</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: submitReelId===r.id ? C.filmLight : '#bbb', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title || 'Untitled reel'}</div>
                          {r.skills?.length > 0 && <div style={{ fontSize: 11, color: C.gray }}>{r.skills.slice(0,3).join(' · ')}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                  {submitReelId && <div style={{ fontSize: 11, color: C.lime, marginTop: 6 }}>✓ Reel attached — manager can verify it after reviewing your work</div>}
                </div>
              )}

              {[
                { label: 'Submission link', val: submitUrl, set: setSubmitUrl, ph: 'https://github.com/you/project' },
                { label: 'Note to manager (optional)', val: submitNote, set: setSubmitNote, ph: 'Describe what you built…' },
                { label: 'Video walkthrough URL (optional)', val: submitVideo, set: setSubmitVideo, ph: 'https://loom.com/share/...' },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ fontSize: 11, color: C.gray, fontWeight: 600, display: 'block', marginBottom: 5 }}>{f.label}</label>
                  <input style={inp} placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)} />
                </div>
              ))}
              {submitError && <div style={{ color: '#ff6b6b', fontSize: 12 }}>{submitError}</div>}
              <button type="submit" disabled={submitting} style={{ padding: '11px', background: C.lime, color: C.obsidian, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>
                {submitting ? 'Submitting…' : 'Submit Work →'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── VERIFY REEL MODAL ── */}
      {verifyingSub && (
        <div onClick={e => e.target === e.currentTarget && setVerifyingSub(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 24 }}>
          <div style={{ background: '#0f0f0f', border: '1px solid rgba(255,200,0,0.3)', borderRadius: 18, padding: 28, width: '100%', maxWidth: 520, maxHeight: '88vh', overflowY: 'auto' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: '#ffd700', fontFamily: 'monospace', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>✦ Verify a Reel</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.filmLight }}>
                  {verifyingSub.profile ? `${verifyingSub.profile.first_name || ''} ${verifyingSub.profile.last_name || ''}`.trim() : 'Individual'}
                </div>
                <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>Select which reel to verify for <strong style={{ color: C.filmLight }}>{selectedProject?.title}</strong></div>
              </div>
              <button onClick={() => setVerifyingSub(null)} style={{ background: C.slate, border: `1px solid ${C.border}`, color: C.gray, borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 13, flexShrink: 0 }}>✕</button>
            </div>

            {/* Reel picker */}
            {verifyReels.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', background: C.slate, border: `1px dashed ${C.border}`, borderRadius: 10, marginBottom: 16, color: C.gray, fontSize: 13 }}>
                This individual has no public reels yet.
              </div>
            ) : (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: C.gray, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Their Public Reels</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {verifyReels.map((r: any) => (
                    <div key={r.id} onClick={() => !r.is_verified && setSelectedVerifyReel(r.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: selectedVerifyReel === r.id ? 'rgba(255,200,0,0.07)' : C.obsidian, border: `1px solid ${r.is_verified ? 'rgba(255,200,0,0.25)' : selectedVerifyReel === r.id ? 'rgba(255,200,0,0.5)' : C.border}`, borderRadius: 10, cursor: r.is_verified ? 'default' : 'pointer', transition: 'all 0.15s', opacity: r.is_verified ? 0.6 : 1 }}>
                      {/* Radio */}
                      <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${selectedVerifyReel === r.id ? '#ffd700' : C.charcoal}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {selectedVerifyReel === r.id && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ffd700' }} />}
                      </div>
                      {/* Play */}
                      <div style={{ width: 32, height: 32, borderRadius: 7, background: 'rgba(255,200,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffd700', fontSize: 10, flexShrink: 0 }}>▶</div>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.filmLight, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title || 'Untitled reel'}</div>
                        {r.skills?.length > 0 && <div style={{ fontSize: 11, color: C.gray, marginTop: 1 }}>{r.skills.slice(0,3).join(' · ')}</div>}
                      </div>
                      {r.is_verified && <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 20, background: 'rgba(255,200,0,0.1)', border: '1px solid rgba(255,200,0,0.3)', color: '#ffd700', flexShrink: 0 }}>✦ VERIFIED</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Note */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 11, color: C.gray, fontWeight: 600, display: 'block', marginBottom: 6 }}>Verification note (optional — shown publicly on their reel)</label>
              <textarea style={{ width: '100%', padding: '10px 13px', background: C.slate, border: `1px solid ${C.border}`, borderRadius: 8, color: C.filmLight, fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' } as React.CSSProperties}
                rows={3} placeholder="e.g. Delivered clean, well-documented code and explained their approach clearly."
                value={verifyNote} onChange={e => setVerifyNote(e.target.value)} />
            </div>

            {/* Confirm */}
            <div style={{ background: 'rgba(255,200,0,0.04)', border: '1px solid rgba(255,200,0,0.12)', borderRadius: 8, padding: '10px 12px', marginBottom: 16, fontSize: 12, color: '#bbb', lineHeight: 1.6 }}>
              By verifying, you confirm this individual completed real work on <strong style={{ color: C.filmLight }}>{selectedProject?.title}</strong> and this reel accurately demonstrates their contribution. This is permanently recorded.
            </div>

            <button onClick={verifyReel} disabled={!!verifyingId || !selectedVerifyReel || verifyReels.find((r:any)=>r.id===selectedVerifyReel)?.is_verified}
              style={{ width: '100%', padding: '13px', background: selectedVerifyReel ? '#ffd700' : C.charcoal, color: C.obsidian, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 800, cursor: selectedVerifyReel ? 'pointer' : 'not-allowed', opacity: selectedVerifyReel ? 1 : 0.5 }}>
              {verifyingId ? 'Verifying…' : '✦ Verify & Attach to Reel'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}