'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getClient } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { ManagerProject } from '@/types'

const C = { obsidian: '#0a0a0a', slate: '#1a1a1a', filmLight: '#f0ece4', lime: '#c8ff00', gray: '#888', border: '#2a2a2a', charcoal: '#2d2d2d' }

const PAY_COLORS: Record<string, string> = { paid: C.lime, bounty: '#ffd700', equity: '#7090ff', unpaid: C.gray, tbd: C.gray }
const PAY_LABELS: Record<string, string> = { paid: '💰 Paid', bounty: '🏆 Bounty', equity: '📈 Equity', unpaid: '🤝 Unpaid', tbd: '❓ TBD' }

export default function DiscoverPage() {
  const { user, accountType, loading: authLoading } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<ManagerProject[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<ManagerProject | null>(null)
  const [submitUrl, setSubmitUrl] = useState('')
  const [submitNote, setSubmitNote] = useState('')
  const [submitVideo, setSubmitVideo] = useState('')
  const [submitError, setSubmitError] = useState('')
  const sb = getClient()

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth')
    if (!authLoading && accountType === 'manager') router.replace('/auth')
  }, [authLoading, user, accountType, router])

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    let q = sb.from('manager_projects').select('*, managers(name, company)').eq('status', 'open').eq('visibility', 'public').order('created_at', { ascending: false })
    const { data } = await q
    let results = (data || []) as ManagerProject[]
    if (search.trim()) {
      const term = search.toLowerCase()
      results = results.filter(p => p.title.toLowerCase().includes(term) || (p.skills_required || []).some(s => s.toLowerCase().includes(term)) || (p.description || '').toLowerCase().includes(term))
    }
    // Check which ones user already submitted
    const { data: subs } = await sb.from('project_submissions').select('project_id').eq('individual_id', user.id)
    setSubmitted(new Set((subs || []).map((s: any) => s.project_id)))
    setProjects(results)
    setLoading(false)
  }, [user, search])

  useEffect(() => { if (user && accountType === 'individual') load() }, [load, user, accountType])

  async function applyToProject(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !selected) return
    setSubmitting(true); setSubmitError('')
    const { error } = await sb.from('project_submissions').insert({ project_id: selected.id, individual_id: user.id, submission_url: submitUrl || null, note: submitNote || null, video_url: submitVideo || null })
    if (error) { setSubmitError(error.code === '23505' ? 'Already applied.' : error.message); setSubmitting(false); return }
    setSubmitted(prev => new Set([...prev, selected.id]))
    setSelected(null); setSubmitUrl(''); setSubmitNote(''); setSubmitVideo('')
    setSubmitting(false)
  }

  if (authLoading || loading) return (
    <div style={{ minHeight: '100vh', background: C.obsidian, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: `2px solid ${C.border}`, borderTopColor: C.lime, animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <div style={{ fontSize: 14, color: C.gray }}>Loading projects…</div>
      </div>
    </div>
  )

  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', color: C.filmLight, fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '40px 40px 28px' }}>
        <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.lime, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 8 }}>Discover</div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontFamily: 'monospace', fontWeight: 700, margin: '0 0 20px' }}>Open Projects</h1>
        <input
          style={{ width: '100%', maxWidth: 480, padding: '11px 16px', background: C.slate, border: `1px solid ${C.border}`, borderRadius: 10, color: C.filmLight, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          placeholder="Search by title, skill, or keyword…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ marginTop: 12, fontSize: 12, color: C.gray }}>{projects.length} open project{projects.length !== 1 ? 's' : ''} available</div>
      </div>

      {/* Grid */}
      <div style={{ padding: '32px 40px' }}>
        {projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: C.gray }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 15 }}>No projects found. Try a different search.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
            {projects.map(p => {
              const done = submitted.has(p.id)
              const mgr = (p as any).managers
              return (
                <div key={p.id} style={{ background: C.slate, border: `1px solid ${done ? 'rgba(200,255,0,0.3)' : C.border}`, borderRadius: 16, padding: 22, display: 'flex', flexDirection: 'column', gap: 12, transition: 'border-color 0.2s, transform 0.15s' }}
                  onMouseEnter={e => { if (!done) e.currentTarget.style.borderColor = C.lime; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = done ? 'rgba(200,255,0,0.3)' : C.border; e.currentTarget.style.transform = 'translateY(0)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.35 }}>{p.title}</div>
                    <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: `${PAY_COLORS[p.pay_type || 'tbd']}18`, border: `1px solid ${PAY_COLORS[p.pay_type || 'tbd']}40`, color: PAY_COLORS[p.pay_type || 'tbd'], fontWeight: 700, flexShrink: 0 }}>{PAY_LABELS[p.pay_type || 'tbd']}</span>
                  </div>

                  {mgr && <div style={{ fontSize: 12, color: C.gray }}>{mgr.name}{mgr.company && ` · ${mgr.company}`}</div>}

                  {p.description && <p style={{ margin: 0, fontSize: 13, color: '#aaa', lineHeight: 1.6 }}>{p.description.slice(0, 120)}{p.description.length > 120 ? '…' : ''}</p>}

                  {p.timeline && <div style={{ fontSize: 12, color: C.gray }}>⏱ {p.timeline}</div>}

                  {(p.skills_required || []).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {p.skills_required.slice(0, 4).map(s => <span key={s} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.18)', color: C.lime }}>{s}</span>)}
                    </div>
                  )}

                  {p.video_url && (
                    <a href={p.video_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.lime, textDecoration: 'none', fontWeight: 600 }}>▶ Watch project video</a>
                  )}

                  <button onClick={() => { if (!done) { setSelected(p); setSubmitUrl(''); setSubmitNote(''); setSubmitError('') } }}
                    disabled={done}
                    style={{ marginTop: 'auto', padding: '10px', background: done ? 'rgba(200,255,0,0.08)' : C.lime, color: done ? C.lime : C.obsidian, border: done ? '1px solid rgba(200,255,0,0.3)' : 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: done ? 'default' : 'pointer', transition: 'all 0.2s' }}>
                    {done ? '✓ Applied' : 'Apply Now →'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Apply Modal */}
      {selected && (
        <div onClick={e => e.target === e.currentTarget && setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}>
          <div style={{ background: '#0f0f0f', border: `1px solid ${C.border}`, borderRadius: 18, padding: 28, width: '100%', maxWidth: 520 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
              <div>
                <div style={{ fontSize: 10, color: C.gray, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Apply to Project</div>
                <div style={{ fontSize: 17, fontWeight: 700 }}>{selected.title}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: C.slate, border: `1px solid ${C.border}`, color: C.gray, borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
            <form onSubmit={applyToProject} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Your work / portfolio link', val: submitUrl, set: setSubmitUrl, ph: 'https://github.com/you/project' },
                { label: 'Note to manager (optional)', val: submitNote, set: setSubmitNote, ph: 'Tell them why you are a great fit…' },
                { label: 'Video pitch (Loom, YouTube – optional)', val: submitVideo, set: setSubmitVideo, ph: 'https://loom.com/share/...' },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ fontSize: 11, color: C.gray, fontWeight: 600, display: 'block', marginBottom: 6 }}>{f.label}</label>
                  <input style={{ width: '100%', padding: '10px 14px', background: C.slate, border: `1px solid ${C.border}`, borderRadius: 8, color: C.filmLight, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)} />
                </div>
              ))}
              {submitError && <div style={{ color: '#ff6b6b', fontSize: 12 }}>{submitError}</div>}
              <button type="submit" disabled={submitting} style={{ padding: '12px', background: C.lime, color: C.obsidian, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{submitting ? 'Submitting…' : 'Submit Application →'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
