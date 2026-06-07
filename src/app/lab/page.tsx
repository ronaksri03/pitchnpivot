'use client'

import { useEffect, useState } from 'react'
import { getClient } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { ManagerProject, IndividualProject } from '@/types'

const PAY_LABEL: Record<string, string> = {
  paid: '💰 Paid', bounty: '🏆 Bounty', equity: '📈 Equity', unpaid: '🤝 Unpaid', tbd: '❓ TBD',
}

export default function LabPage() {
  const { user, accountType } = useAuth()
  const [openProjects, setOpenProjects] = useState<ManagerProject[]>([])
  const [myProjects, setMyProjects] = useState<IndividualProject[]>([])
  const [tab, setTab] = useState<'browse' | 'mine'>('browse')
  const [loading, setLoading] = useState(true)

  // Post project form state
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [timeline, setTimeline] = useState('')
  const [payType, setPayType] = useState('paid')
  const [skillInput, setSkillInput] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [posting, setPosting] = useState(false)

  const sb = getClient()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data } = await sb.from('manager_projects')
      .select('*, managers(name, company)')
      .eq('visibility', 'public').eq('status', 'open')
      .order('created_at', { ascending: false }).limit(20)
    setOpenProjects((data || []) as ManagerProject[])

    if (user && accountType === 'individual') {
      const { data: mine } = await sb.from('individual_projects')
        .select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      setMyProjects((mine || []) as IndividualProject[])
    }
    setLoading(false)
  }

  async function postIndProject(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setPosting(true)
    await sb.from('individual_projects').insert({
      user_id: user.id, title, description,
      status: 'in-progress', skills, visibility: 'public',
      created_at: new Date().toISOString(),
    })
    setShowForm(false); setTitle(''); setDescription(''); setSkills([])
    await loadData()
    setPosting(false)
  }

  function addSkill(s: string) {
    const t = s.trim()
    if (t && !skills.includes(t)) setSkills(prev => [...prev, t])
    setSkillInput('')
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f0ece4', margin: 0 }}>Project Lab</h1>
        {user && accountType === 'individual' && (
          <button className="btn-primary" onClick={() => setShowForm(s => !s)}>
            {showForm ? 'Cancel' : '+ Post a project'}
          </button>
        )}
      </div>

      {/* Post project form (individuals) */}
      {showForm && (
        <form onSubmit={postIndProject} style={{ background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f0ece4' }}>Post a project</h3>
          <input className="inp" placeholder="Project title" value={title} onChange={e => setTitle(e.target.value)} required />
          <textarea className="inp" placeholder="What did you build? What problem does it solve?" value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <input className="inp" placeholder="Add skill, press Enter" value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput) } }}
            />
            <button type="button" className="btn-primary" onClick={() => addSkill(skillInput)}>Add</button>
          </div>
          {skills.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {skills.map(s => (
                <span key={s} className="vtag" style={{ cursor: 'pointer' }} onClick={() => setSkills(prev => prev.filter(x => x !== s))}>
                  {s} ✕
                </span>
              ))}
            </div>
          )}
          <button className="btn-primary" type="submit" disabled={posting}>{posting ? 'Posting…' : 'Post project'}</button>
        </form>
      )}

      {/* Tabs */}
      {user && accountType === 'individual' && (
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
          {(['browse', 'mine'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '7px 16px', borderRadius: '8px', border: '1px solid',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              borderColor: tab === t ? '#c8ff00' : '#2a2a2a',
              background: tab === t ? 'rgba(200,255,0,0.1)' : 'transparent',
              color: tab === t ? '#c8ff00' : '#555',
            }}>
              {t === 'browse' ? '🔍 Browse projects' : '📁 My projects'}
            </button>
          ))}
        </div>
      )}

      {loading ? <div className="empty-state">Loading…</div> : (
        tab === 'browse' || accountType === 'manager' ? (
          openProjects.length === 0 ? (
            <div className="empty-state">No open projects yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {openProjects.map(p => (
                <div key={p.id} style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: '#f0ece4', marginBottom: '4px' }}>{p.title}</div>
                      <div style={{ fontSize: '12px', color: '#555' }}>
                        {p.managers?.name && `👔 ${p.managers.name}${p.managers.company ? ` · ${p.managers.company}` : ''}`}
                        {p.timeline && ` · ⏱ ${p.timeline}`}
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: 'rgba(200,255,0,0.1)', border: '1px solid rgba(200,255,0,0.25)', color: '#c8ff00', whiteSpace: 'nowrap' }}>
                      {PAY_LABEL[p.pay_type || ''] || p.pay_type}
                    </span>
                  </div>
                  {p.description && <p style={{ fontSize: '13px', color: '#666', margin: '10px 0 0', lineHeight: 1.6 }}>{p.description}</p>}
                  {p.skills_required?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '10px' }}>
                      {p.skills_required.map(s => <span key={s} className="vtag" style={{ fontSize: '11px' }}>{s}</span>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          myProjects.length === 0 ? (
            <div className="empty-state">No projects yet. Post one above!</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '12px' }}>
              {myProjects.map(p => (
                <div key={p.id} style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '14px 16px' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#f0ece4', marginBottom: '6px' }}>{p.title}</div>
                  {p.description && <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.5, marginBottom: '8px' }}>{p.description}</div>}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {p.skills?.slice(0, 3).map(s => <span key={s} className="vtag" style={{ fontSize: '10px' }}>{s}</span>)}
                  </div>
                </div>
              ))}
            </div>
          )
        )
      )}
    </div>
  )
}
