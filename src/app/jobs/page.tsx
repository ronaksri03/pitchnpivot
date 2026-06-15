'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getClient } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

const C = {
  obsidian: '#0a0a0a', slate: '#1a1a1a', filmLight: '#f0ece4',
  lime: '#c8ff00', magenta: '#ff006e', gray: '#888',
  border: '#2a2a2a', charcoal: '#2d2d2d',
}
const inp: React.CSSProperties = {
  width: '100%', padding: '10px 13px', background: '#1a1a1a',
  border: '1px solid #2a2a2a', borderRadius: 8, color: '#f0ece4',
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
}

type Job = {
  id: string
  manager_id: string
  title: string
  description: string
  location: string
  work_type: string
  employment_type: string
  skills_required: string[]
  pay_type: string
  salary_min: number | null
  salary_max: number | null
  salary_currency: string
  duration_days: number
  closes_at: string
  status: string
  created_at: string
  managers?: { name: string; company: string }
  _application_count?: number
}

type Application = {
  id: string
  job_id: string
  individual_id: string
  video_url: string | null
  cover_note: string | null
  status: string
  submitted_at: string
  profiles?: { first_name: string; last_name: string; job_title: string; username: string }
}

const WORK_TYPES = ['remote', 'hybrid', 'onsite']
const EMP_TYPES = ['full-time', 'part-time', 'contract', 'freelance', 'internship']
const PAY_TYPES = ['paid', 'equity', 'unpaid', 'tbd']
const DURATIONS = [
  { label: '7 days', value: 7 },
  { label: '14 days', value: 14 },
  { label: '30 days', value: 30 },
  { label: '60 days', value: 60 },
]

function daysLeft(closesAt: string) {
  return Math.ceil((new Date(closesAt).getTime() - Date.now()) / 86400000)
}

function DaysLeftBadge({ closesAt }: { closesAt: string }) {
  const d = daysLeft(closesAt)
  const color = d <= 0 ? '#ff6b6b' : d <= 3 ? '#ff9f43' : d <= 7 ? '#ffd700' : C.lime
  const label = d <= 0 ? 'Closed' : d === 1 ? '1 day left' : `${d} days left`
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, border: `1px solid ${color}40`, background: `${color}12`, color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      ⏱ {label}
    </span>
  )
}

function SalaryLabel({ job }: { job: Job }) {
  if (job.pay_type === 'unpaid') return <span style={{ color: C.gray }}>Unpaid</span>
  if (job.pay_type === 'equity') return <span style={{ color: '#7090ff' }}>Equity</span>
  if (job.pay_type === 'tbd') return <span style={{ color: C.gray }}>Pay TBD</span>
  if (job.salary_min && job.salary_max) return <span style={{ color: C.lime, fontWeight: 700 }}>${job.salary_min.toLocaleString()}–${job.salary_max.toLocaleString()} {job.salary_currency}/yr</span>
  if (job.salary_min) return <span style={{ color: C.lime, fontWeight: 700 }}>From ${job.salary_min.toLocaleString()} {job.salary_currency}/yr</span>
  return <span style={{ color: C.lime, fontWeight: 700 }}>Paid</span>
}

export default function JobsPage() {
  const { user, accountType, loading: authLoading } = useAuth()
  const router = useRouter()
  const sb = getClient()

  // Shared state
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [workFilter, setWorkFilter] = useState('all')
  const [empFilter, setEmpFilter] = useState('all')

  // Individual state
  const [applied, setApplied] = useState<Set<string>>(new Set())
  const [applyJob, setApplyJob] = useState<Job | null>(null)
  const [coverNote, setCoverNote] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [applying, setApplying] = useState(false)
  const [applyError, setApplyError] = useState('')

  // Manager state
  const [showPostModal, setShowPostModal] = useState(false)
  const [myJobs, setMyJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [applicants, setApplicants] = useState<Application[]>([])
  const [loadingApplicants, setLoadingApplicants] = useState(false)
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState('')

  // Form state
  const [form, setForm] = useState({
    title: '', description: '', location: '', work_type: 'remote',
    employment_type: 'full-time', skills: [] as string[], skillInput: '',
    pay_type: 'paid', salary_min: '', salary_max: '', salary_currency: 'USD',
    duration_days: 30,
  })

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth')
  }, [authLoading, user, router])

  const loadJobs = useCallback(async () => {
    if (!user) return
    setLoading(true)
    if (accountType === 'individual') {
      const { data } = await sb.from('jobs').select('*, managers(name, company)').eq('status', 'open').gt('closes_at', new Date().toISOString()).order('created_at', { ascending: false })
      const { data: apps } = await sb.from('job_applications').select('job_id').eq('individual_id', user.id)
      setJobs(data || [])
      setApplied(new Set((apps || []).map((a: any) => a.job_id)))
    } else {
      const { data } = await sb.from('jobs').select('*, job_applications(count)').eq('manager_id', user.id).order('created_at', { ascending: false })
      setMyJobs((data || []).map((j: any) => ({ ...j, _application_count: j.job_applications?.[0]?.count || 0 })))
    }
    setLoading(false)
  }, [user, accountType])

  useEffect(() => { if (user) loadJobs() }, [loadJobs, user])

  const filtered = jobs.filter(j => {
    const term = search.toLowerCase()
    const matchSearch = !term || j.title.toLowerCase().includes(term) || (j.description || '').toLowerCase().includes(term) || (j.skills_required || []).some(s => s.toLowerCase().includes(term)) || (j.location || '').toLowerCase().includes(term)
    const matchWork = workFilter === 'all' || j.work_type === workFilter
    const matchEmp = empFilter === 'all' || j.employment_type === empFilter
    return matchSearch && matchWork && matchEmp
  })

  // Load applicants for a manager job
  async function loadApplicants(job: Job) {
    setSelectedJob(job)
    setLoadingApplicants(true)
    const { data } = await sb.from('job_applications').select('*, profiles(first_name, last_name, job_title, username)').eq('job_id', job.id).order('submitted_at', { ascending: false })
    setApplicants(data || [])
    setLoadingApplicants(false)
  }

  // Update applicant status
  async function updateAppStatus(appId: string, status: string) {
    await sb.from('job_applications').update({ status }).eq('id', appId)
    setApplicants(prev => prev.map(a => a.id === appId ? { ...a, status } : a))
  }

  // Individual: open apply modal with their video pre-filled
  async function openApplyModal(job: Job) {
    const { data } = await sb.from('profiles').select('intro_video_url').eq('id', user!.id).single()
    setVideoUrl(data?.intro_video_url || '')
    setCoverNote('')
    setApplyError('')
    setApplyJob(job)
  }

  // Individual: submit application
  async function submitApplication(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !applyJob) return
    setApplying(true); setApplyError('')
    const { error } = await sb.from('job_applications').insert({ job_id: applyJob.id, individual_id: user.id, video_url: videoUrl || null, cover_note: coverNote || null })
    if (error) { setApplyError(error.code === '23505' ? 'Already applied.' : error.message); setApplying(false); return }
    setApplied(prev => new Set([...prev, applyJob.id]))
    setApplyJob(null)
    setApplying(false)
  }

  // Manager: post new job
  async function postJob(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !form.title.trim()) return
    setPosting(true); setPostError('')
    const closes_at = new Date(Date.now() + form.duration_days * 86400000).toISOString()
    const { error } = await sb.from('jobs').insert({
      manager_id: user.id,
      title: form.title.trim(),
      description: form.description || null,
      location: form.location || null,
      work_type: form.work_type,
      employment_type: form.employment_type,
      skills_required: form.skills,
      pay_type: form.pay_type,
      salary_min: form.salary_min ? parseInt(form.salary_min) : null,
      salary_max: form.salary_max ? parseInt(form.salary_max) : null,
      salary_currency: form.salary_currency,
      duration_days: form.duration_days,
      closes_at,
      status: 'open',
    })
    if (error) { setPostError(error.message); setPosting(false); return }
    setShowPostModal(false)
    setForm({ title: '', description: '', location: '', work_type: 'remote', employment_type: 'full-time', skills: [], skillInput: '', pay_type: 'paid', salary_min: '', salary_max: '', salary_currency: 'USD', duration_days: 30 })
    await loadJobs()
    setPosting(false)
  }

  // Manager: close a job
  async function closeJob(jobId: string) {
    if (!confirm('Close this job listing?')) return
    await sb.from('jobs').update({ status: 'closed' }).eq('id', jobId)
    await loadJobs()
  }

  if (authLoading || loading) return (
    <div style={{ minHeight: '100vh', background: C.obsidian, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 56 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: `3px solid ${C.border}`, borderTopColor: C.lime, animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <div style={{ fontSize: 13, color: C.gray, fontFamily: 'monospace' }}>Loading jobs…</div>
      </div>
    </div>
  )

  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', color: C.filmLight, fontFamily: 'Inter, sans-serif', paddingTop: 56 }}>

      {/* ── HEADER ── */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '36px 40px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.lime, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 8 }}>Jobs</div>
            <h1 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontFamily: 'monospace', fontWeight: 700, margin: 0, lineHeight: 1 }}>
              {accountType === 'manager' ? 'My Job Listings' : 'Open Positions'}
            </h1>
          </div>
          {accountType === 'manager' && (
            <button onClick={() => setShowPostModal(true)} style={{ background: C.lime, color: C.obsidian, border: 'none', borderRadius: 10, padding: '11px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              + Post a Job
            </button>
          )}
        </div>

        {/* Filters — individuals only */}
        {accountType === 'individual' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input style={{ ...inp, maxWidth: 480 }} placeholder="Search by title, skill, or location…" value={search} onChange={e => setSearch(e.target.value)} />
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {['all', ...WORK_TYPES].map(w => (
                  <button key={w} onClick={() => setWorkFilter(w)} style={{ background: workFilter === w ? C.lime : 'transparent', color: workFilter === w ? C.obsidian : C.gray, border: `1px solid ${workFilter === w ? C.lime : C.border}`, borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>{w === 'all' ? 'All Locations' : w}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['all', ...EMP_TYPES].map(e => (
                  <button key={e} onClick={() => setEmpFilter(e)} style={{ background: empFilter === e ? C.lime : 'transparent', color: empFilter === e ? C.obsidian : C.gray, border: `1px solid ${empFilter === e ? C.lime : C.border}`, borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>{e === 'all' ? 'All Types' : e}</button>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 12, color: C.gray }}>{filtered.length} open position{filtered.length !== 1 ? 's' : ''}</div>
          </div>
        )}

        {/* Manager stats */}
        {accountType === 'manager' && (
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            {[
              { label: 'Active Listings', value: myJobs.filter(j => j.status === 'open').length },
              { label: 'Total Applicants', value: myJobs.reduce((sum, j) => sum + (j._application_count || 0), 0) },
              { label: 'Closed Listings', value: myJobs.filter(j => j.status !== 'open').length },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'monospace', color: C.lime }}>{s.value}</div>
                <div style={{ fontSize: 11, color: C.gray, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── CONTENT ── */}
      <div style={{ padding: '32px 40px' }}>

        {/* ── INDIVIDUAL VIEW ── */}
        {accountType === 'individual' && (
          filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', background: C.slate, border: `1px dashed ${C.border}`, borderRadius: 16 }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
              <div style={{ fontSize: 15, color: C.gray }}>No open positions match your search.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 18 }}>
              {filtered.map(job => {
                const isApplied = applied.has(job.id)
                const mgr = (job as any).managers
                return (
                  <div key={job.id} style={{ background: C.slate, border: `1px solid ${isApplied ? 'rgba(200,255,0,0.3)' : C.border}`, borderRadius: 16, padding: 22, display: 'flex', flexDirection: 'column', gap: 12, transition: 'border-color 0.2s, transform 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; if (!isApplied) e.currentTarget.style.borderColor = C.lime }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = isApplied ? 'rgba(200,255,0,0.3)' : C.border }}>

                    {/* Title + days left */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>{job.title}</div>
                      <DaysLeftBadge closesAt={job.closes_at} />
                    </div>

                    {/* Company */}
                    {mgr && <div style={{ fontSize: 13, color: C.gray, marginTop: -4 }}>{mgr.name}{mgr.company && ` · ${mgr.company}`}</div>}

                    {/* Meta */}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: C.gray }}>
                      {job.location && <span>📍 {job.location}</span>}
                      <span style={{ textTransform: 'capitalize' }}>🏢 {job.work_type}</span>
                      <span style={{ textTransform: 'capitalize' }}>⏱ {job.employment_type}</span>
                    </div>

                    {/* Salary */}
                    <div style={{ fontSize: 13 }}><SalaryLabel job={job} /></div>

                    {/* Description */}
                    {job.description && <p style={{ margin: 0, fontSize: 13, color: '#aaa', lineHeight: 1.6 }}>{job.description.slice(0, 140)}{job.description.length > 140 ? '…' : ''}</p>}

                    {/* Skills */}
                    {(job.skills_required || []).length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {job.skills_required.slice(0, 5).map(s => <span key={s} style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.18)', color: C.lime }}>{s}</span>)}
                        {job.skills_required.length > 5 && <span style={{ fontSize: 11, color: C.gray }}>+{job.skills_required.length - 5}</span>}
                      </div>
                    )}

                    {/* Apply button */}
                    <button onClick={() => !isApplied && openApplyModal(job)} disabled={isApplied}
                      style={{ marginTop: 'auto', padding: '11px', background: isApplied ? 'rgba(200,255,0,0.08)' : C.lime, color: isApplied ? C.lime : C.obsidian, border: isApplied ? '1px solid rgba(200,255,0,0.3)' : 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: isApplied ? 'default' : 'pointer', transition: 'all 0.2s' }}>
                      {isApplied ? '✓ Applied' : 'Apply with Video CV →'}
                    </button>
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* ── MANAGER VIEW ── */}
        {accountType === 'manager' && (
          myJobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', background: C.slate, border: `1px dashed ${C.border}`, borderRadius: 16 }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
              <div style={{ fontSize: 15, color: C.gray, marginBottom: 20 }}>No job listings yet.</div>
              <button onClick={() => setShowPostModal(true)} style={{ background: C.lime, color: C.obsidian, border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>+ Post your first job</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {myJobs.map(job => (
                <div key={job.id} style={{ background: C.slate, border: `1px solid ${job.status === 'open' ? C.border : C.charcoal}`, borderRadius: 14, overflow: 'hidden', opacity: job.status === 'open' ? 1 : 0.6 }}>
                  <div style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>{job.title}</div>
                        {job.status === 'open' ? <DaysLeftBadge closesAt={job.closes_at} /> : <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, color: C.gray, textTransform: 'uppercase' }}>Closed</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: C.gray, flexWrap: 'wrap' }}>
                        {job.location && <span>📍 {job.location}</span>}
                        <span style={{ textTransform: 'capitalize' }}>🏢 {job.work_type}</span>
                        <span style={{ textTransform: 'capitalize' }}>⏱ {job.employment_type}</span>
                        <span><SalaryLabel job={job} /></span>
                      </div>
                      {(job.skills_required || []).length > 0 && (
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
                          {job.skills_required.slice(0, 5).map(s => <span key={s} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.18)', color: C.lime }}>{s}</span>)}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                      <button onClick={() => loadApplicants(job)} style={{ background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.25)', color: C.lime, borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        👥 {job._application_count || 0} applicant{(job._application_count || 0) !== 1 ? 's' : ''}
                      </button>
                      {job.status === 'open' && (
                        <button onClick={() => closeJob(job.id)} style={{ background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.25)', color: '#ff6b6b', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Close</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* ── APPLICANTS PANEL (Manager) ── */}
      {selectedJob && (
        <div onClick={e => e.target === e.currentTarget && setSelectedJob(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}>
          <div style={{ background: '#0f0f0f', border: `1px solid ${C.border}`, borderRadius: 20, width: '100%', maxWidth: 680, maxHeight: '88vh', overflowY: 'auto' }}>
            <div style={{ padding: '24px 28px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, color: C.gray, fontFamily: 'monospace', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Applicants</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{selectedJob.title}</div>
              </div>
              <button onClick={() => setSelectedJob(null)} style={{ background: C.slate, border: `1px solid ${C.border}`, color: C.gray, borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
            <div style={{ padding: '16px 28px 28px' }}>
              {loadingApplicants ? (
                <div style={{ textAlign: 'center', padding: 40, color: C.gray }}>Loading applicants…</div>
              ) : applicants.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: C.gray }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
                  <div>No applicants yet.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {applicants.map(app => {
                    const p = (app as any).profiles
                    const name = p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown' : 'Unknown'
                    const statusColors: Record<string, string> = { pending: '#ffd700', reviewing: '#7090ff', accepted: C.lime, rejected: '#ff6b6b' }
                    return (
                      <div key={app.id} style={{ background: C.slate, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{name}</div>
                            {p?.job_title && <div style={{ fontSize: 12, color: C.gray }}>{p.job_title}</div>}
                            <div style={{ fontSize: 11, color: C.charcoal, marginTop: 4 }}>Applied {new Date(app.submitted_at).toLocaleDateString()}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                            {p?.username && (
                              <a href={`/profile/${p.username}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, color: C.gray, borderRadius: 6, textDecoration: 'none', fontWeight: 600 }}>View Profile →</a>
                            )}
                            {['pending', 'reviewing', 'accepted', 'rejected'].map(s => (
                              <button key={s} onClick={() => updateAppStatus(app.id, s)}
                                style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: `1px solid ${app.status === s ? statusColors[s] + '60' : C.border}`, background: app.status === s ? statusColors[s] + '15' : 'transparent', color: app.status === s ? statusColors[s] : C.gray, cursor: 'pointer', fontWeight: 600, textTransform: 'capitalize' }}>
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Video CV */}
                        {app.video_url && (
                          <div>
                            <div style={{ fontSize: 10, color: C.gray, fontFamily: 'monospace', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Video CV</div>
                            <div style={{ position: 'relative', paddingBottom: '42%', borderRadius: 10, overflow: 'hidden', background: C.obsidian }}>
                              <iframe src={app.video_url.includes('youtube') ? app.video_url.replace('watch?v=', 'embed/') : app.video_url.replace('loom.com/share/', 'loom.com/embed/')} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} allow="autoplay; fullscreen" allowFullScreen />
                            </div>
                          </div>
                        )}

                        {/* Cover note */}
                        {app.cover_note && (
                          <div style={{ background: C.obsidian, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px' }}>
                            <div style={{ fontSize: 10, color: C.gray, fontFamily: 'monospace', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Cover Note</div>
                            <p style={{ margin: 0, fontSize: 13, color: '#bbb', lineHeight: 1.65 }}>{app.cover_note}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── APPLY MODAL (Individual) ── */}
      {applyJob && (
        <div onClick={e => e.target === e.currentTarget && setApplyJob(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}>
          <div style={{ background: '#0f0f0f', border: `1px solid ${C.border}`, borderRadius: 20, width: '100%', maxWidth: 540, maxHeight: '88vh', overflowY: 'auto' }}>
            <div style={{ padding: '24px 28px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, color: C.gray, fontFamily: 'monospace', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Apply for</div>
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 2 }}>{applyJob.title}</div>
                <div style={{ fontSize: 12, color: C.gray }}><DaysLeftBadge closesAt={applyJob.closes_at} /></div>
              </div>
              <button onClick={() => setApplyJob(null)} style={{ background: C.slate, border: `1px solid ${C.border}`, color: C.gray, borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 14, flexShrink: 0 }}>✕</button>
            </div>
            <div style={{ padding: '24px 28px' }}>
              {videoUrl && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, color: C.lime, fontFamily: 'monospace', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>🎬 Your Video CV (auto-attached)</div>
                  <div style={{ position: 'relative', paddingBottom: '42%', borderRadius: 10, overflow: 'hidden', background: C.slate, border: `1px solid rgba(200,255,0,0.2)` }}>
                    <iframe src={videoUrl.includes('youtube') ? videoUrl.replace('watch?v=', 'embed/') : videoUrl.replace('loom.com/share/', 'loom.com/embed/')} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} allow="autoplay" allowFullScreen />
                  </div>
                  <div style={{ fontSize: 11, color: C.gray, marginTop: 6 }}>This is the intro video from your profile. You can replace the URL below.</div>
                </div>
              )}
              {!videoUrl && (
                <div style={{ marginBottom: 16, padding: '12px 14px', background: 'rgba(255,200,0,0.06)', border: '1px solid rgba(255,200,0,0.2)', borderRadius: 8, fontSize: 13, color: '#ffd700' }}>
                  ⚠️ No intro video on your profile yet. Add one in Edit Profile, or paste a link below.
                </div>
              )}
              <form onSubmit={submitApplication} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, color: C.gray, fontWeight: 600, display: 'block', marginBottom: 5 }}>Video CV URL (YouTube, Loom, or Vimeo)</label>
                  <input style={inp} placeholder="https://youtube.com/watch?v=..." value={videoUrl} onChange={e => setVideoUrl(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.gray, fontWeight: 600, display: 'block', marginBottom: 5 }}>Cover note (optional)</label>
                  <textarea style={{ ...inp, resize: 'vertical' } as React.CSSProperties} placeholder={`Tell ${(applyJob as any).managers?.name || 'the manager'} why you are a great fit…`} value={coverNote} onChange={e => setCoverNote(e.target.value)} rows={4} />
                </div>
                {applyError && <div style={{ color: '#ff6b6b', fontSize: 12 }}>{applyError}</div>}
                <button type="submit" disabled={applying} style={{ padding: '12px', background: C.lime, color: C.obsidian, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  {applying ? 'Submitting…' : 'Submit Application →'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── POST JOB MODAL (Manager) ── */}
      {showPostModal && (
        <div onClick={e => e.target === e.currentTarget && setShowPostModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}>
          <div style={{ background: '#0f0f0f', border: `1px solid ${C.border}`, borderRadius: 20, width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '24px 28px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>Post a New Job</div>
              <button onClick={() => setShowPostModal(false)} style={{ background: C.slate, border: `1px solid ${C.border}`, color: C.gray, borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
            <form onSubmit={postJob} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div>
                <label style={{ fontSize: 11, color: C.gray, fontWeight: 600, display: 'block', marginBottom: 5 }}>Job Title *</label>
                <input style={inp} placeholder="e.g. Senior React Developer" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>

              <div>
                <label style={{ fontSize: 11, color: C.gray, fontWeight: 600, display: 'block', marginBottom: 5 }}>Description</label>
                <textarea style={{ ...inp, resize: 'vertical' } as React.CSSProperties} placeholder="Describe the role, responsibilities, and what success looks like…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: C.gray, fontWeight: 600, display: 'block', marginBottom: 5 }}>Location</label>
                  <input style={inp} placeholder="e.g. London, UK" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.gray, fontWeight: 600, display: 'block', marginBottom: 5 }}>Work Type</label>
                  <select style={{ ...inp, appearance: 'none' }} value={form.work_type} onChange={e => setForm(f => ({ ...f, work_type: e.target.value }))}>
                    {WORK_TYPES.map(w => <option key={w} value={w} style={{ textTransform: 'capitalize' }}>{w.charAt(0).toUpperCase() + w.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.gray, fontWeight: 600, display: 'block', marginBottom: 5 }}>Employment Type</label>
                  <select style={{ ...inp, appearance: 'none' }} value={form.employment_type} onChange={e => setForm(f => ({ ...f, employment_type: e.target.value }))}>
                    {EMP_TYPES.map(e => <option key={e} value={e} style={{ textTransform: 'capitalize' }}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.gray, fontWeight: 600, display: 'block', marginBottom: 5 }}>Pay Type</label>
                  <select style={{ ...inp, appearance: 'none' }} value={form.pay_type} onChange={e => setForm(f => ({ ...f, pay_type: e.target.value }))}>
                    {PAY_TYPES.map(p => <option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
              </div>

              {form.pay_type === 'paid' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: C.gray, fontWeight: 600, display: 'block', marginBottom: 5 }}>Salary Min</label>
                    <input style={inp} type="number" placeholder="50000" value={form.salary_min} onChange={e => setForm(f => ({ ...f, salary_min: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: C.gray, fontWeight: 600, display: 'block', marginBottom: 5 }}>Salary Max</label>
                    <input style={inp} type="number" placeholder="80000" value={form.salary_max} onChange={e => setForm(f => ({ ...f, salary_max: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: C.gray, fontWeight: 600, display: 'block', marginBottom: 5 }}>Currency</label>
                    <input style={inp} placeholder="USD" value={form.salary_currency} onChange={e => setForm(f => ({ ...f, salary_currency: e.target.value }))} />
                  </div>
                </div>
              )}

              <div>
                <label style={{ fontSize: 11, color: C.gray, fontWeight: 600, display: 'block', marginBottom: 5 }}>Required Skills</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input style={{ ...inp, flex: 1 }} placeholder="Add skill, press Enter" value={form.skillInput}
                    onChange={e => setForm(f => ({ ...f, skillInput: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (form.skillInput.trim() && !form.skills.includes(form.skillInput.trim())) setForm(f => ({ ...f, skills: [...f.skills, f.skillInput.trim()], skillInput: '' })) } }} />
                  <button type="button" onClick={() => { if (form.skillInput.trim() && !form.skills.includes(form.skillInput.trim())) setForm(f => ({ ...f, skills: [...f.skills, f.skillInput.trim()], skillInput: '' })) }} style={{ padding: '8px 14px', background: C.slate, border: `1px solid ${C.border}`, color: C.filmLight, borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Add</button>
                </div>
                {form.skills.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {form.skills.map(s => <span key={s} onClick={() => setForm(f => ({ ...f, skills: f.skills.filter(x => x !== s) }))} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', color: C.lime, cursor: 'pointer' }}>{s} ✕</span>)}
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: 11, color: C.gray, fontWeight: 600, display: 'block', marginBottom: 8 }}>Listing Duration</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {DURATIONS.map(d => (
                    <button type="button" key={d.value} onClick={() => setForm(f => ({ ...f, duration_days: d.value }))}
                      style={{ flex: 1, padding: '8px', background: form.duration_days === d.value ? C.lime : 'transparent', color: form.duration_days === d.value ? C.obsidian : C.gray, border: `1px solid ${form.duration_days === d.value ? C.lime : C.border}`, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      {d.label}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: C.gray, marginTop: 6 }}>
                  Closes on {new Date(Date.now() + form.duration_days * 86400000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>

              {postError && <div style={{ color: '#ff6b6b', fontSize: 12 }}>{postError}</div>}
              <button type="submit" disabled={posting} style={{ padding: '13px', background: C.lime, color: C.obsidian, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>
                {posting ? 'Posting…' : 'Post Job →'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
