'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getClient } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Manager, ManagerProject } from '@/types'

const PAY_LABEL: Record<string, string> = {
  paid: '💰 Paid', bounty: '🏆 Bounty', equity: '📈 Equity', unpaid: '🤝 Unpaid', tbd: '❓ TBD',
}

export default function DashboardPage() {
  const { user, accountType, loading: authLoading } = useAuth()
  const router = useRouter()
  const [manager, setManager] = useState<Manager | null>(null)
  const [projects, setProjects] = useState<ManagerProject[]>([])
  const [loading, setLoading] = useState(true)

  // Post project form
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
    setProjects((projRes.data || []) as ManagerProject[])
    setLoading(false)
  }

  async function postProject(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setPosting(true); setPostError('')

    let assigneeId: string | null = null
    if (assignee.trim()) {
      const { data: ap } = await sb.from('profiles').select('id').eq('username', assignee.trim()).single()
      if (!ap) { setPostError(`Username @${assignee.trim()} not found`); setPosting(false); return }
      assigneeId = ap.id
    }

    await sb.from('manager_projects').insert({
      manager_id: user.id, title, description, timeline, pay_type: payType,
      skills_required: skills, visibility, assigned_to: assigneeId,
      status: visibility === 'private' ? 'draft' : 'open',
      created_at: new Date().toISOString(),
    })

    setShowForm(false); setTitle(''); setDescription(''); setTimeline(''); setSkills([]); setAssignee('')
    await loadAll()
    setPosting(false)
  }

  function addSkill(s: string) {
    const t = s.trim()
    if (t && !skills.includes(t)) setSkills(prev => [...prev, t])
    setSkillInput('')
  }

  if (authLoading || loading) return <div className="empty-state" style={{ paddingTop: '80px' }}>Loading…</div>
  if (!user || accountType !== 'manager') return null

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '12px', color: '#c8ff00', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Manager Dashboard</div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f0ece4', margin: 0 }}>
          {manager?.name || user.email?.split('@')[0]}
        </h1>
        {manager?.company && <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>{manager.role ? `${manager.role} · ` : ''}{manager.company}</div>}
      </div>

      {/* Post project button */}
      <button className="btn-primary" onClick={() => setShowForm(s => !s)} style={{ marginBottom: '24px' }}>
        {showForm ? 'Cancel' : '+ Post a project'}
      </button>

      {/* Post form */}
      {showForm && (
        <form onSubmit={postProject} style={{ background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f0ece4' }}>New project</h3>
          <input className="inp" placeholder="Project title" value={title} onChange={e => setTitle(e.target.value)} required />
          <textarea className="inp" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input className="inp" style={{ flex: 1 }} placeholder="Timeline (e.g. 2 weeks)" value={timeline} onChange={e => setTimeline(e.target.value)} />
            <select className="inp" style={{ flex: 1 }} value={payType} onChange={e => setPayType(e.target.value)}>
              <option value="paid">💰 Paid</option>
              <option value="bounty">🏆 Bounty</option>
              <option value="equity">📈 Equity</option>
              <option value="unpaid">🤝 Unpaid</option>
              <option value="tbd">❓ TBD</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input className="inp" placeholder="Add required skill, press Enter" value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput) } }}
            />
            <button type="button" className="btn-primary" onClick={() => addSkill(skillInput)}>Add</button>
          </div>
          {skills.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {skills.map(s => <span key={s} className="vtag" style={{ cursor: 'pointer' }} onClick={() => setSkills(p => p.filter(x => x !== s))}>{s} ✕</span>)}
            </div>
          )}
          <input className="inp" placeholder="Assign to @username (optional)" value={assignee} onChange={e => setAssignee(e.target.value)} />
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '13px', color: '#888', display: 'flex', gap: '6px', alignItems: 'center', cursor: 'pointer' }}>
              <input type="checkbox" checked={visibility === 'private'} onChange={e => setVisibility(e.target.checked ? 'private' : 'public')} />
              Private / direct assign
            </label>
          </div>
          {postError && <div style={{ color: '#ff6b6b', fontSize: '13px' }}>{postError}</div>}
          <button className="btn-primary" type="submit" disabled={posting}>{posting ? 'Posting…' : 'Post project'}</button>
        </form>
      )}

      {/* Projects list */}
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px', paddingBottom: '6px', borderBottom: '1px solid #1a1a1a' }}>
        My Projects ({projects.length})
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">No projects posted yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {projects.map(p => (
            <div key={p.id} style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#f0ece4', marginBottom: '4px' }}>{p.title}</div>
                <div style={{ fontSize: '12px', color: '#555' }}>
                  {p.timeline && `⏱ ${p.timeline}`}
                  {p.assigned_to ? ' · → Assigned' : ' · → Public'}
                </div>
                {p.skills_required?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                    {p.skills_required.slice(0, 4).map(s => <span key={s} className="vtag" style={{ fontSize: '10px' }}>{s}</span>)}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: 'rgba(200,255,0,0.1)', border: '1px solid rgba(200,255,0,0.25)', color: '#c8ff00' }}>
                  {PAY_LABEL[p.pay_type || ''] || p.pay_type}
                </span>
                <span style={{ fontSize: '10px', color: p.visibility === 'private' ? '#555' : '#666', padding: '2px 8px', borderRadius: '20px', background: '#111', border: '1px solid #222' }}>
                  {p.visibility === 'private' ? '🔒 Private' : '🌐 Public'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
