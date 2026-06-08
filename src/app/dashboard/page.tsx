'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getClient } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Manager, ManagerProject, ProjectSubmission } from '@/types'

const PAY_LABEL: Record<string, string> = {
  paid: '💰 Paid', bounty: '🏆 Bounty', equity: '📈 Equity', unpaid: '🤝 Unpaid', tbd: '❓ TBD',
}

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 13px', background: '#111', border: '1px solid #2a2a2a',
  borderRadius: '8px', color: '#f0ece4', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
}

export default function DashboardPage() {
  const { user, accountType, loading: authLoading } = useAuth()
  const router = useRouter()
  const [manager, setManager] = useState<Manager | null>(null)
  const [projects, setProjects] = useState<ManagerProject[]>([])
  const [submissions, setSubmissions] = useState<Record<string, ProjectSubmission[]>>({})
  const [expandedProject, setExpandedProject] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Create form
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [timeline, setTimeline] = useState('')
  const [payType, setPayType] = useState('paid')
  const [skillInput, setSkillInput] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [assignee, setAssignee] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState('')

  // Edit state
  const [editId, setEditId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editTimeline, setEditTimeline] = useState('')
  const [editPayType, setEditPayType] = useState('paid')
  const [editSkillInput, setEditSkillInput] = useState('')
  const [editSkills, setEditSkills] = useState<string[]>([])
  const [editVisibility, setEditVisibility] = useState<'public' | 'private'>('public')
  const [editAssignee, setEditAssignee] = useState('')
  const [editStatus, setEditStatus] = useState<'open' | 'closed' | 'draft'>('open')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const sb = getClient()

  useEffect(() => {
    if (!authLoading && (!user || accountType !== 'manager')) router.replace('/auth')
    if (user && accountType === 'manager') loadAll()
  }, [authLoading, user, accountType])

  async function loadAll() {
    if (!user) return
    const [mgrRes, projRes] = await Promise.all([
      sb.from('managers').select('*').eq('id', user.id).single(),
      sb.from('manager_projects').select('*').eq('manager_id', user.id).order('created_at', { ascending: false }),
    ])
    setManager(mgrRes.data)
    const projs = (projRes.data || []) as ManagerProject[]
    setProjects(projs)
    setLoading(false)

    const allIds = projs.map(p => p.id)
    if (allIds.length > 0) {
      const { data: subs } = await sb
        .from('project_submissions')
        .select('*, profiles(first_name, last_name, username, job_title)')
        .in('project_id', allIds)
        .order('submitted_at', { ascending: false })
      const grouped: Record<string, ProjectSubmission[]> = {}
      ;(subs || []).forEach(s => {
        if (!grouped[s.project_id]) grouped[s.project_id] = []
        grouped[s.project_id].push(s as ProjectSubmission)
      })
      setSubmissions(grouped)
    }
  }

  function startEdit(p: ManagerProject) {
    setEditId(p.id)
    setEditTitle(p.title)
    setEditDesc(p.description || '')
    setEditTimeline(p.timeline || '')
    setEditPayType(p.pay_type || 'paid')
    setEditSkills(p.skills_required || [])
    setEditSkillInput('')
    setEditVisibility(p.visibility)
    setEditStatus(p.status)
    setEditAssignee('')
    setSaveError('')
    setExpandedProject(null)
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editId) return
    setSaving(true); setSaveError('')

    let assigneeId: string | null | undefined = undefined
    if (editAssignee.trim()) {
      const term = editAssignee.trim().replace(/^@/, '')
      const { data: ap } = await sb.from('profiles').select('id').eq('username', term).maybeSingle()
      if (!ap) { setSaveError(`Username @${term} not found`); setSaving(false); return }
      assigneeId = ap.id
    }

    const updates: Partial<ManagerProject> = {
      title: editTitle, description: editDesc || null,
      timeline: editTimeline || null, pay_type: editPayType as ManagerProject['pay_type'],
      skills_required: editSkills, visibility: editVisibility, status: editStatus,
    }
    if (assigneeId !== undefined) updates.assigned_to = assigneeId

    const { error } = await sb.from('manager_projects').update(updates).eq('id', editId)
    if (error) { setSaveError(error.message); setSaving(false); return }
    setEditId(null)
    await loadAll()
    setSaving(false)
  }

  async function postProject(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setPosting(true); setPostError('')

    let assigneeId: string | null = null
    if (visibility === 'private' && assignee.trim()) {
      const term = assignee.trim().replace(/^@/, '')
      const { data: ap } = await sb.from('profiles').select('id').eq('username', term).maybeSingle()
      if (!ap) { setPostError(`Username @${term} not found.`); setPosting(false); return }
      assigneeId = ap.id
    }

    await sb.from('manager_projects').insert({
      manager_id: user.id, title, description, timeline, pay_type: payType,
      skills_required: skills, visibility, assigned_to: assigneeId,
      status: 'open', created_at: new Date().toISOString(),
    })
    setShowForm(false); setTitle(''); setDescription(''); setTimeline('')
    setSkills([]); setSkillInput(''); setAssignee(''); setVisibility('public')
    await loadAll()
    setPosting(false)
  }

  async function updateSubmissionStatus(subId: string, status: 'accepted' | 'rejected') {
    await sb.from('project_submissions').update({ status }).eq('id', subId)
    await loadAll()
  }

  if (authLoading || loading) return <div style={{ padding: '80px', textAlign: 'center', color: '#555' }}>Loading…</div>
  if (!user || accountType !== 'manager') return null

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '11px', color: '#c8ff00', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Manager Dashboard</div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f0ece4', margin: 0 }}>{manager?.name || user.email?.split('@')[0]}</h1>
        {manager?.company && <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>{manager.role ? `${manager.role} · ` : ''}{manager.company}</div>}
      </div>

      <button onClick={() => setShowForm(s => !s)} style={{
        padding: '10px 18px', background: showForm ? '#1a1a1a' : '#c8ff00',
        color: showForm ? '#888' : '#0a0a0a', border: '1px solid #2a2a2a',
        borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginBottom: '24px',
      }}>{showForm ? 'Cancel' : '+ Post a project'}</button>

      {/* Create form */}
      {showForm && (
        <form onSubmit={postProject} style={{ background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: '14px', padding: '22px', marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '13px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f0ece4' }}>New project</h3>
          <div style={{ display: 'flex', background: '#111', border: '1px solid #222', borderRadius: '8px', padding: '3px', gap: '3px' }}>
            {(['public', 'private'] as const).map(v => (
              <button key={v} type="button" onClick={() => setVisibility(v)} style={{ flex: 1, padding: '7px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: visibility === v ? '#1e1e1e' : 'transparent', color: visibility === v ? '#f0ece4' : '#555', fontSize: '13px', fontWeight: 600 }}>
                {v === 'public' ? '🌐 Public' : '🔒 Private'}
              </button>
            ))}
          </div>
          <input style={inp} placeholder="Project title *" value={title} onChange={e => setTitle(e.target.value)} required />
          <textarea style={{ ...inp, resize: 'vertical' } as React.CSSProperties} placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <input style={inp} placeholder="Timeline" value={timeline} onChange={e => setTimeline(e.target.value)} />
            <select style={{ ...inp, appearance: 'none' }} value={payType} onChange={e => setPayType(e.target.value)}>
              {Object.entries(PAY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input style={{ ...inp, flex: 1 }} placeholder="Required skill, press Enter" value={skillInput} onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (skillInput.trim() && !skills.includes(skillInput.trim())) setSkills(p => [...p, skillInput.trim()]); setSkillInput('') } }} />
            <button type="button" onClick={() => { if (skillInput.trim() && !skills.includes(skillInput.trim())) setSkills(p => [...p, skillInput.trim()]); setSkillInput('') }}
              style={{ padding: '8px 14px', background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#ccc', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Add</button>
          </div>
          {skills.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {skills.map(s => <span key={s} onClick={() => setSkills(p => p.filter(x => x !== s))} style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '20px', background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', color: '#c8ff00', cursor: 'pointer' }}>{s} ✕</span>)}
            </div>
          )}
          {visibility === 'private' && <input style={inp} placeholder="Assign to @username" value={assignee} onChange={e => setAssignee(e.target.value)} />}
          {postError && <div style={{ color: '#ff6b6b', fontSize: '13px' }}>{postError}</div>}
          <button type="submit" disabled={posting} style={{ padding: '11px', background: '#c8ff00', color: '#0a0a0a', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
            {posting ? 'Posting…' : `Post ${visibility} project`}
          </button>
        </form>
      )}

      {/* Edit modal */}
      {editId && (
        <div onClick={e => e.target === e.currentTarget && setEditId(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
          <div style={{ background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#f0ece4' }}>Edit project</div>
              <button onClick={() => setEditId(null)} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '14px' }}>✕</button>
            </div>
            <form onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
              {/* Visibility */}
              <div style={{ display: 'flex', background: '#111', border: '1px solid #222', borderRadius: '8px', padding: '3px', gap: '3px' }}>
                {(['public', 'private'] as const).map(v => (
                  <button key={v} type="button" onClick={() => setEditVisibility(v)} style={{ flex: 1, padding: '7px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: editVisibility === v ? '#1e1e1e' : 'transparent', color: editVisibility === v ? '#f0ece4' : '#555', fontSize: '13px', fontWeight: 600 }}>
                    {v === 'public' ? '🌐 Public' : '🔒 Private'}
                  </button>
                ))}
              </div>
              <input style={inp} placeholder="Title *" value={editTitle} onChange={e => setEditTitle(e.target.value)} required />
              <textarea style={{ ...inp, resize: 'vertical' } as React.CSSProperties} placeholder="Description" value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input style={inp} placeholder="Timeline" value={editTimeline} onChange={e => setEditTimeline(e.target.value)} />
                <select style={{ ...inp, appearance: 'none' }} value={editPayType} onChange={e => setEditPayType(e.target.value)}>
                  {Object.entries(PAY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              {/* Skills */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input style={{ ...inp, flex: 1 }} placeholder="Add skill, press Enter" value={editSkillInput} onChange={e => setEditSkillInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (editSkillInput.trim() && !editSkills.includes(editSkillInput.trim())) setEditSkills(p => [...p, editSkillInput.trim()]); setEditSkillInput('') } }} />
                <button type="button" onClick={() => { if (editSkillInput.trim() && !editSkills.includes(editSkillInput.trim())) setEditSkills(p => [...p, editSkillInput.trim()]); setEditSkillInput('') }}
                  style={{ padding: '8px 14px', background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#ccc', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Add</button>
              </div>
              {editSkills.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {editSkills.map(s => <span key={s} onClick={() => setEditSkills(p => p.filter(x => x !== s))} style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '20px', background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', color: '#c8ff00', cursor: 'pointer' }}>{s} ✕</span>)}
                </div>
              )}
              {/* Status */}
              <div>
                <label style={{ fontSize: '12px', color: '#666', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Status</label>
                <select style={{ ...inp, appearance: 'none' }} value={editStatus} onChange={e => setEditStatus(e.target.value as ManagerProject['status'])}>
                  <option value="open">🟢 Open</option>
                  <option value="draft">📝 Draft</option>
                  <option value="closed">🔴 Closed</option>
                </select>
              </div>
              {/* Reassign */}
              <div>
                <label style={{ fontSize: '12px', color: '#666', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Reassign to @username <span style={{ color: '#444' }}>(leave blank to keep current)</span></label>
                <input style={inp} placeholder="@username" value={editAssignee} onChange={e => setEditAssignee(e.target.value)} />
              </div>
              {saveError && <div style={{ color: '#ff6b6b', fontSize: '13px' }}>{saveError}</div>}
              <button type="submit" disabled={saving} style={{ padding: '11px', background: '#c8ff00', color: '#0a0a0a', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Projects list */}
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px', paddingBottom: '8px', borderBottom: '1px solid #1a1a1a' }}>
        My Projects ({projects.length})
      </div>

      {projects.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#555', padding: '40px', fontSize: '14px' }}>No projects yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {projects.map(p => {
            const subs = submissions[p.id] || []
            const isExpanded = expandedProject === p.id
            return (
              <div key={p.id} style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#f0ece4', marginBottom: '4px' }}>{p.title}</div>
                    <div style={{ fontSize: '12px', color: '#555', marginBottom: '6px' }}>
                      {p.timeline && `⏱ ${p.timeline} · `}
                      {p.visibility === 'private' ? '🔒 Private' : '🌐 Public'}
                      {p.assigned_to && ' · Assigned'}
                      {' · '}
                      <span style={{ color: p.status === 'open' ? '#4caf50' : p.status === 'closed' ? '#f44336' : '#888' }}>
                        {p.status === 'open' ? '🟢 Open' : p.status === 'closed' ? '🔴 Closed' : '📝 Draft'}
                      </span>
                    </div>
                    {p.skills_required?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {p.skills_required.slice(0, 4).map(s => <span key={s} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.18)', color: '#c8ff00' }}>{s}</span>)}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end', flexShrink: 0 }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: 'rgba(200,255,0,0.1)', border: '1px solid rgba(200,255,0,0.25)', color: '#c8ff00' }}>
                      {PAY_LABEL[p.pay_type || ''] || p.pay_type}
                    </span>
                    <button onClick={() => startEdit(p)} style={{ fontSize: '12px', color: '#888', background: '#111', border: '1px solid #222', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontWeight: 600 }}>
                      ✎ Edit
                    </button>
                    <button onClick={() => setExpandedProject(isExpanded ? null : p.id)} style={{ fontSize: '12px', color: subs.length > 0 ? '#c8ff00' : '#555', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}>
                      {subs.length} submission{subs.length !== 1 ? 's' : ''} {isExpanded ? '▲' : '▼'}
                    </button>
                  </div>
                </div>

                {/* Submissions panel */}
                {isExpanded && subs.length > 0 && (
                  <div style={{ borderTop: '1px solid #1a1a1a', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {subs.map(s => {
                      const prof = (s as unknown as { profiles?: { first_name?: string; last_name?: string; username?: string; job_title?: string } }).profiles
                      return (
                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', padding: '10px 12px', background: '#111', borderRadius: '8px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#f0ece4' }}>
                              {prof ? `${prof.first_name || ''} ${prof.last_name || ''}`.trim() || `@${prof.username}` : 'Unknown'}
                            </div>
                            {prof?.job_title && <div style={{ fontSize: '11px', color: '#555', marginBottom: '4px' }}>{prof.job_title}</div>}
                            {s.note && <div style={{ fontSize: '12px', color: '#777', marginBottom: '4px' }}>{s.note}</div>}
                            {s.submission_url && <a href={s.submission_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#c8ff00', textDecoration: 'none' }}>🔗 View work</a>}
                            <div style={{ fontSize: '11px', color: '#444', marginTop: '4px' }}>{new Date(s.submitted_at).toLocaleDateString()}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {s.status === 'pending' ? (
                              <>
                                <button onClick={() => updateSubmissionStatus(s.id, 'accepted')} style={{ padding: '5px 12px', background: 'rgba(200,255,0,0.1)', border: '1px solid rgba(200,255,0,0.3)', color: '#c8ff00', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Accept</button>
                                <button onClick={() => updateSubmissionStatus(s.id, 'rejected')} style={{ padding: '5px 12px', background: 'rgba(255,100,100,0.08)', border: '1px solid rgba(255,100,100,0.25)', color: '#ff6b6b', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Reject</button>
                              </>
                            ) : (
                              <span style={{ fontSize: '12px', fontWeight: 600, color: s.status === 'accepted' ? '#c8ff00' : '#ff6b6b' }}>
                                {s.status === 'accepted' ? '✓ Accepted' : '✕ Rejected'}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
