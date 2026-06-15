'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getClient } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { IndividualProject } from '@/types'

const C = { obsidian: '#0a0a0a', slate: '#1a1a1a', filmLight: '#f0ece4', lime: '#c8ff00', gray: '#888', border: '#2a2a2a', charcoal: '#2d2d2d' }
const inp: React.CSSProperties = { width: '100%', padding: '10px 13px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#f0ece4', fontSize: 13, outline: 'none', boxSizing: 'border-box' }

export default function PortfolioPage() {
  const { user, accountType, loading: authLoading } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<IndividualProject[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editProject, setEditProject] = useState<IndividualProject | null>(null)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [status, setStatus] = useState<'completed' | 'in-progress' | 'idea'>('completed')
  const [demoLink, setDemoLink] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [skillInput, setSkillInput] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const sb = getClient()

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth')
    if (!authLoading && accountType === 'manager') router.replace('/lab')
    if (!authLoading && user && accountType === 'individual') load()
  }, [authLoading, user, accountType])

  async function load() {
    if (!user) return
    const { data } = await sb.from('individual_projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }

  function openEdit(p: IndividualProject) {
    setEditProject(p); setTitle(p.title); setDesc(p.description || ''); setStatus(p.status || 'completed')
    setDemoLink(p.demo_link || ''); setGithubUrl(p.github_url || ''); setVideoUrl(p.video_url || '')
    setSkills(p.skills || []); setSkillInput(''); setVisibility(p.visibility); setError(''); setShowForm(true)
  }

  function openNew() {
    setEditProject(null); setTitle(''); setDesc(''); setStatus('completed'); setDemoLink(''); setGithubUrl('')
    setVideoUrl(''); setSkills([]); setSkillInput(''); setVisibility('public'); setError(''); setShowForm(true)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !title.trim()) return
    setSaving(true); setError('')
    const payload = { title: title.trim(), description: desc || null, status, demo_link: demoLink || null, github_url: githubUrl || null, video_url: videoUrl || null, skills, visibility }
    const { error: err } = editProject
      ? await sb.from('individual_projects').update(payload).eq('id', editProject.id)
      : await sb.from('individual_projects').insert({ ...payload, user_id: user.id })
    if (err) { setError(err.message); setSaving(false); return }
    setShowForm(false); await load(); setSaving(false)
  }

  async function deleteProject(id: string) {
    if (!confirm('Delete this project?')) return
    await sb.from('individual_projects').delete().eq('id', id)
    await load()
  }

  function addSkill() {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) setSkills(prev => [...prev, skillInput.trim()])
    setSkillInput('')
  }

  const stStyle = (s: string) => ({ completed: { bg: 'rgba(200,255,0,0.1)', border: 'rgba(200,255,0,0.3)', color: '#c8ff00' }, 'in-progress': { bg: 'rgba(100,150,255,0.1)', border: 'rgba(100,150,255,0.3)', color: '#7090ff' }, idea: { bg: 'rgba(255,255,255,0.06)', border: '#2a2a2a', color: '#888' } } as any)[s] || { bg: 'rgba(255,255,255,0.06)', border: '#2a2a2a', color: '#888' }

  if (authLoading || loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #2a2a2a', borderTopColor: '#c8ff00', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#f0ece4', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ borderBottom: '1px solid #2a2a2a', padding: '40px 40px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#c8ff00', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 8 }}>Portfolio</div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontFamily: 'monospace', fontWeight: 700, margin: '0 0 8px' }}>My Projects</h1>
          <div style={{ fontSize: 13, color: '#888' }}>{projects.length} project{projects.length !== 1 ? 's' : ''} · {projects.filter(p => p.visibility === 'public').length} public</div>
        </div>
        <button onClick={openNew} style={{ background: '#c8ff00', color: '#0a0a0a', border: 'none', borderRadius: 10, padding: '10px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>+ Add Project</button>
      </div>

      <div style={{ padding: '32px 40px' }}>
        {projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: '#1a1a1a', border: '1px dashed #2a2a2a', borderRadius: 16 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🗂</div>
            <div style={{ fontSize: 15, color: '#888', marginBottom: 20 }}>No projects yet. Add your first one to showcase your work.</div>
            <button onClick={openNew} style={{ background: '#c8ff00', color: '#0a0a0a', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>+ Add your first project</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
            {projects.map(p => {
              const st = stStyle(p.status || 'idea')
              return (
                <div key={p.id} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 16, padding: 22, display: 'flex', flexDirection: 'column', gap: 12, transition: 'border-color 0.2s, transform 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#c8ff00'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.transform = 'translateY(0)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>{p.title}</div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => openEdit(p)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 14, padding: 2 }}>✎</button>
                      <button onClick={() => deleteProject(p.id)} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: 13, padding: 2 }}>✕</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em', background: st.bg, border: `1px solid ${st.border}`, color: st.color }}>{p.status || 'idea'}</span>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid #2a2a2a', color: '#888' }}>{p.visibility === 'public' ? '🌐 Public' : '🔒 Private'}</span>
                  </div>
                  {p.description && <p style={{ margin: 0, fontSize: 13, color: '#888', lineHeight: 1.6 }}>{p.description.slice(0, 120)}{p.description.length > 120 ? '…' : ''}</p>}
                  {(p.skills || []).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {p.skills.slice(0, 4).map((s: string) => <span key={s} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.18)', color: '#c8ff00' }}>{s}</span>)}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 14, marginTop: 'auto' }}>
                    {p.demo_link && <a href={p.demo_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#c8ff00', textDecoration: 'none', fontWeight: 600 }}>🔗 Demo</a>}
                    {p.github_url && <a href={p.github_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#c8ff00', textDecoration: 'none', fontWeight: 600 }}>⌥ GitHub</a>}
                    {p.video_url && <a href={p.video_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#c8ff00', textDecoration: 'none', fontWeight: 600 }}>▶ Video</a>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showForm && (
        <div onClick={e => e.target === e.currentTarget && setShowForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}>
          <div style={{ background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: 18, padding: 28, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{editProject ? 'Edit Project' : 'Add Project'}</div>
              <button onClick={() => setShowForm(false)} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: '#888', fontWeight: 600, display: 'block', marginBottom: 5 }}>Title *</label>
                <input style={inp} placeholder="My awesome project" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#888', fontWeight: 600, display: 'block', marginBottom: 5 }}>Description</label>
                <textarea style={{ ...inp, resize: 'vertical' } as React.CSSProperties} placeholder="What did you build and why?" value={desc} onChange={e => setDesc(e.target.value)} rows={3} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#888', fontWeight: 600, display: 'block', marginBottom: 5 }}>Status</label>
                  <select style={{ ...inp, appearance: 'none' }} value={status} onChange={e => setStatus(e.target.value as any)}>
                    <option value="completed">Completed</option>
                    <option value="in-progress">In Progress</option>
                    <option value="idea">Idea</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#888', fontWeight: 600, display: 'block', marginBottom: 5 }}>Visibility</label>
                  <select style={{ ...inp, appearance: 'none' }} value={visibility} onChange={e => setVisibility(e.target.value as any)}>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>
              {[{ label: 'Demo Link', val: demoLink, set: setDemoLink, ph: 'https://myapp.com' }, { label: 'GitHub URL', val: githubUrl, set: setGithubUrl, ph: 'https://github.com/you/repo' }, { label: 'Video', val: videoUrl, set: setVideoUrl, ph: 'https://loom.com/share/...' }].map(f => (
                <div key={f.label}>
                  <label style={{ fontSize: 11, color: '#888', fontWeight: 600, display: 'block', marginBottom: 5 }}>{f.label}</label>
                  <input style={inp} placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 11, color: '#888', fontWeight: 600, display: 'block', marginBottom: 5 }}>Skills</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input style={{ ...inp, flex: 1 }} placeholder="Add skill, press Enter" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }} />
                  <button type="button" onClick={addSkill} style={{ padding: '8px 14px', background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#f0ece4', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Add</button>
                </div>
                {skills.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {skills.map((s: string) => <span key={s} onClick={() => setSkills(prev => prev.filter((x: string) => x !== s))} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', color: '#c8ff00', cursor: 'pointer' }}>{s} ✕</span>)}
                  </div>
                )}
              </div>
              {error && <div style={{ color: '#ff6b6b', fontSize: 12 }}>{error}</div>}
              <button type="submit" disabled={saving} style={{ padding: '12px', background: '#c8ff00', color: '#0a0a0a', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{saving ? 'Saving…' : editProject ? 'Save Changes' : 'Add Project'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
