'use client'

import { useEffect, useState } from 'react'
import { getClient } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { ManagerProject, IndividualProject, ProjectSubmission } from '@/types'

const PAY_LABEL: Record<string, string> = {
  paid: '💰 Paid', bounty: '🏆 Bounty', equity: '📈 Equity', unpaid: '🤝 Unpaid', tbd: '❓ TBD',
}

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 13px', background: '#111', border: '1px solid #2a2a2a',
  borderRadius: '8px', color: '#f0ece4', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
}

export default function LabPage() {
  const { user, accountType } = useAuth()
  const [openProjects, setOpenProjects] = useState<ManagerProject[]>([])
  const [myProjects, setMyProjects] = useState<IndividualProject[]>([])
  const [mySubmissions, setMySubmissions] = useState<ProjectSubmission[]>([])
  const [tab, setTab] = useState<'browse' | 'mine' | 'submitted'>('browse')
  const [loading, setLoading] = useState(true)

  // Individual own project form
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [timeline, setTimeline] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [skillInput, setSkillInput] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [posting, setPosting] = useState(false)

  // Submit work modal
  const [submitProject, setSubmitProject] = useState<ManagerProject | null>(null)
  const [submitUrl, setSubmitUrl] = useState('')
  const [submitNote, setSubmitNote] = useState('')
  const [submitVideo, setSubmitVideo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const sb = getClient()

  useEffect(() => { loadData() }, [user, accountType])

  async function loadData() {
    setLoading(true)
    const { data, error: projErr } = await sb.from('manager_projects')
      .select('*, managers(name, company)')
      .eq('visibility', 'public').eq('status', 'open')
      .order('created_at', { ascending: false }).limit(50)
    if (!projErr) {
      setOpenProjects((data || []) as ManagerProject[])
    } else {
      console.warn('[lab open projects join error]', projErr.message, '— falling back')
      const { data: plain } = await sb.from('manager_projects')
        .select('*').eq('visibility', 'public').eq('status', 'open')
        .order('created_at', { ascending: false }).limit(50)
      setOpenProjects((plain || []) as ManagerProject[])
    }

    if (user) {
      const [mineRes, subRes] = await Promise.all([
        sb.from('individual_projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        sb.from('project_submissions').select('*, manager_projects(title, pay_type)').eq('individual_id', user.id).order('submitted_at', { ascending: false }),
      ])
      setMyProjects((mineRes.data || []) as IndividualProject[])
      setMySubmissions((subRes.data || []) as ProjectSubmission[])
    }
    setLoading(false)
  }

  async function postIndProject(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setPosting(true)
    await sb.from('individual_projects').insert({
      user_id: user.id, title, description, timeline,
      video_url: videoUrl || null,
      status: 'in-progress', skills, visibility: 'public',
      created_at: new Date().toISOString(),
    })
    setShowForm(false); setTitle(''); setDescription(''); setTimeline(''); setVideoUrl(''); setSkills([])
    await loadData()
    setPosting(false)
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
      video_url: submitVideo || null,
    })
    if (error) {
      setSubmitError(error.code === '23505' ? 'You already submitted work for this project.' : error.message)
    } else {
      setSubmitProject(null); setSubmitUrl(''); setSubmitNote(''); setSubmitVideo('')
      await loadData()
    }
    setSubmitting(false)
  }

  const alreadySubmitted = (projectId: string) =>
    mySubmissions.some(s => s.project_id === projectId)

  const tabs = [
    { key: 'browse', label: 'Open Projects', count: openProjects.length },
    ...(accountType === 'individual' || !accountType ? [
      { key: 'mine', label: 'My Projects', count: myProjects.length },
      { key: 'submitted', label: 'Submitted', count: mySubmissions.length },
    ] : []),
  ] as { key: string; label: string; count: number }[]

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '11px', color: '#c8ff00', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Project Lab</div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f0ece4', margin: 0 }}>Find work. Build things.</h1>
        <p style={{ fontSize: '14px', color: '#666', marginTop: '6px' }}>Browse open projects from managers or post your own.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', borderBottom: '1px solid #1a1a1a', paddingBottom: '0' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as never)} style={{
            padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '13px', fontWeight: 600,
            color: tab === t.key ? '#f0ece4' : '#555',
            borderBottom: tab === t.key ? '2px solid #c8ff00' : '2px solid transparent',
            marginBottom: '-1px', transition: 'color 0.15s',
          }}>
            {t.label}
            <span style={{ marginLeft: '6px', fontSize: '11px', color: tab === t.key ? '#c8ff00' : '#444', fontWeight: 700 }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#555', padding: '40px' }}>Loading…</div>
      ) : tab === 'browse' ? (
        <>
          {openProjects.length === 0 ? (
            <>
          {accountType === 'manager' && (
            <div style={{ background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.2)', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#c8ff00', marginBottom: '2px' }}>You are logged in as a Manager</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Post and manage projects from your Dashboard.</div>
              </div>
              <a href="/dashboard" style={{ padding: '8px 16px', background: '#c8ff00', color: '#0a0a0a', borderRadius: '8px', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>Go to Dashboard →</a>
            </div>
          )}
          <div style={{ textAlign: 'center', color: '#555', padding: '60px 0', fontSize: '14px' }}>No open projects right now.</div>
        </>
          ) : (
            <>
              {accountType === 'manager' && (
                <div style={{ background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.2)', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#c8ff00', marginBottom: '2px' }}>You are logged in as a Manager</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Post and manage your projects from the Dashboard.</div>
                  </div>
                  <a href="/dashboard" style={{ padding: '8px 16px', background: '#c8ff00', color: '#0a0a0a', borderRadius: '8px', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>Go to Dashboard →</a>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {openProjects.map(p => {
                const submitted = alreadySubmitted(p.id)
                const mgr = p.managers as { name?: string; company?: string } | undefined
                return (
                  <div key={p.id} style={{ background: '#0f0f0f', border: `1px solid ${submitted ? 'rgba(200,255,0,0.2)' : '#1e1e1e'}`, borderRadius: '12px', padding: '16px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#f0ece4', marginBottom: '4px' }}>{p.title}</div>
                        {mgr?.name && (
                          <div style={{ fontSize: '12px', color: '#555', marginBottom: '8px' }}>
                            👔 {mgr.name}{mgr.company ? ` · ${mgr.company}` : ''}
                          </div>
                        )}
                        {p.description && <p style={{ fontSize: '13px', color: '#888', margin: '0 0 10px', lineHeight: 1.6 }}>{p.description}</p>}
                        {p.video_url && <a href={p.video_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#c8ff00', textDecoration: 'none', marginBottom: '10px' }}>▶ Watch video</a>}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                          {p.skills_required?.slice(0, 5).map(s => (
                            <span key={s} style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '20px', background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.18)', color: '#c8ff00' }}>{s}</span>
                          ))}
                          {p.timeline && <span style={{ fontSize: '11px', color: '#555' }}>⏱ {p.timeline}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', flexShrink: 0 }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: 'rgba(200,255,0,0.1)', border: '1px solid rgba(200,255,0,0.25)', color: '#c8ff00' }}>
                          {PAY_LABEL[p.pay_type || ''] || '❓'}
                        </span>
                        {!user ? (
                          <a href="/auth" style={{ padding: '7px 14px', background: '#1a1a1a', color: '#c8ff00', border: '1px solid rgba(200,255,0,0.25)', borderRadius: '8px', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}>Sign in to submit →</a>
                        ) : (accountType === 'individual') ? (
                          submitted ? (
                            <span style={{ fontSize: '12px', color: '#c8ff00', fontWeight: 600 }}>✓ Submitted</span>
                          ) : (
                            <button onClick={() => { setSubmitProject(p); setSubmitUrl(''); setSubmitNote(''); setSubmitError('') }}
                              style={{ padding: '7px 14px', background: '#c8ff00', color: '#0a0a0a', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                              Submit Work →
                            </button>
                          )
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            </>
          )}
        </>
      ) : tab === 'mine' ? (
        <>
          <button onClick={() => setShowForm(s => !s)} style={{ padding: '8px 16px', background: showForm ? '#1a1a1a' : '#c8ff00', color: showForm ? '#888' : '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', marginBottom: '16px' }}>
            {showForm ? 'Cancel' : '+ Add my project'}
          </button>
          {showForm && (
            <form onSubmit={postIndProject} style={{ background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '18px', marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input style={inp} placeholder="Project title" value={title} onChange={e => setTitle(e.target.value)} required />
              <textarea style={{ ...inp, resize: 'vertical' } as React.CSSProperties} placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
              <input style={inp} placeholder="Timeline (e.g. 2 weeks)" value={timeline} onChange={e => setTimeline(e.target.value)} />
              <input style={inp} placeholder="Video URL (Loom, YouTube, etc.) — optional" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <input style={{ ...inp, flex: 1 }} placeholder="Add skill, press Enter" value={skillInput} onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (skillInput.trim() && !skills.includes(skillInput.trim())) setSkills(p => [...p, skillInput.trim()]); setSkillInput('') } }} />
                <button type="button" onClick={() => { if (skillInput.trim() && !skills.includes(skillInput.trim())) setSkills(p => [...p, skillInput.trim()]); setSkillInput('') }}
                  style={{ padding: '8px 14px', background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#ccc', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Add</button>
              </div>
              {skills.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {skills.map(s => <span key={s} onClick={() => setSkills(p => p.filter(x => x !== s))} style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '20px', background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', color: '#c8ff00', cursor: 'pointer' }}>{s} ✕</span>)}
                </div>
              )}
              <button type="submit" disabled={posting} style={{ padding: '10px', background: '#c8ff00', color: '#0a0a0a', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                {posting ? 'Posting…' : 'Post project'}
              </button>
            </form>
          )}
          {myProjects.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#555', padding: '40px', fontSize: '14px' }}>No projects yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {myProjects.map(p => (
                <div key={p.id} style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '14px 16px' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#f0ece4', marginBottom: '4px' }}>{p.title}</div>
                  {p.description && <div style={{ fontSize: '13px', color: '#777', marginBottom: '8px' }}>{p.description}</div>}
                  {p.video_url && <a href={p.video_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#c8ff00', textDecoration: 'none', marginBottom: '8px' }}>▶ Watch video</a>}
                  {p.skills?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {p.skills.map(s => <span key={s} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.18)', color: '#c8ff00' }}>{s}</span>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        // Submitted tab
        mySubmissions.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#555', padding: '40px', fontSize: '14px' }}>No submissions yet. Browse open projects to submit work.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {mySubmissions.map(s => {
              const proj = (s as unknown as { manager_projects?: { title?: string; pay_type?: string; managers?: { name?: string; company?: string } } }).manager_projects
              return (
                <div key={s.id} style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#f0ece4', marginBottom: '6px' }}>{proj?.title || 'Project'}</div>
                    {proj?.pay_type && <div style={{ fontSize: '12px', color: '#555', marginBottom: '6px' }}>{proj.pay_type === 'paid' ? '💰 Paid' : proj.pay_type === 'bounty' ? '🏆 Bounty' : proj.pay_type === 'equity' ? '📈 Equity' : proj.pay_type === 'unpaid' ? '🤝 Unpaid' : '❓ TBD'}</div>}
                    {s.note && <div style={{ fontSize: '13px', color: '#777', marginBottom: '6px' }}>{s.note}</div>}
                    {s.submission_url && <a href={s.submission_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#c8ff00', textDecoration: 'none', marginRight: '10px' }}>🔗 View submission</a>}
                    {s.video_url && <a href={s.video_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#c8ff00', textDecoration: 'none' }}>▶ Watch video</a>}
                    <div style={{ fontSize: '11px', color: '#444', marginTop: '6px' }}>{new Date(s.submitted_at).toLocaleDateString()}</div>
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap',
                    background: s.status === 'accepted' ? 'rgba(200,255,0,0.1)' : s.status === 'rejected' ? 'rgba(255,100,100,0.1)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${s.status === 'accepted' ? 'rgba(200,255,0,0.3)' : s.status === 'rejected' ? 'rgba(255,100,100,0.3)' : '#2a2a2a'}`,
                    color: s.status === 'accepted' ? '#c8ff00' : s.status === 'rejected' ? '#ff6b6b' : '#666',
                  }}>
                    {s.status === 'accepted' ? '✓ Accepted' : s.status === 'rejected' ? '✕ Rejected' : '⏳ Pending'}
                  </span>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* Submit Work Modal */}
      {submitProject && (
        <div onClick={e => e.target === e.currentTarget && setSubmitProject(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
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
                <input style={inp} placeholder="https://github.com/you/project" value={submitUrl} onChange={e => setSubmitUrl(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#666', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Note to manager <span style={{ color: '#444' }}>(optional)</span></label>
                <textarea style={{ ...inp, resize: 'vertical' } as React.CSSProperties} placeholder="Describe what you built…" rows={3} value={submitNote} onChange={e => setSubmitNote(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#666', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Video explanation <span style={{ color: '#444' }}>(Loom, YouTube — optional)</span></label>
                <input style={inp} placeholder="https://loom.com/share/..." value={submitVideo} onChange={e => setSubmitVideo(e.target.value)} />
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
