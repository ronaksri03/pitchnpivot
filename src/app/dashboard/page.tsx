'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getClient } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

const C = { obsidian: '#0a0a0a', slate: '#1a1a1a', filmLight: '#f0ece4', lime: '#c8ff00', gray: '#888', border: '#2a2a2a', charcoal: '#2d2d2d' }

export default function DashboardPage() {
  const { user, accountType, loading: authLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({ reels: 0, projects: 0, views: 0, submissions: 0, accepted: 0, pending: 0 })
  const [recentViews, setRecentViews] = useState<any[]>([])
  const [recentSubs, setRecentSubs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const sb = getClient()

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth')
    if (!authLoading && accountType === 'manager') router.replace('/lab')
    if (!authLoading && user && accountType === 'individual') load()
  }, [authLoading, user, accountType])

  async function load() {
    if (!user) return
    const [reelsRes, projRes, viewsRes, subsRes] = await Promise.all([
      sb.from('reels').select('id', { count: 'exact' }).eq('user_id', user.id),
      sb.from('individual_projects').select('id', { count: 'exact' }).eq('user_id', user.id),
      sb.from('profile_views').select('*, managers(name, company)').eq('profile_user_id', user.id).order('viewed_at', { ascending: false }).limit(5),
      sb.from('project_submissions').select('*, manager_projects(title)').eq('individual_id', user.id).order('submitted_at', { ascending: false }).limit(10),
    ])
    const subs = subsRes.data || []
    setStats({
      reels: reelsRes.count || 0,
      projects: projRes.count || 0,
      views: viewsRes.data?.length || 0,
      submissions: subs.length,
      accepted: subs.filter((s: any) => s.status === 'accepted').length,
      pending: subs.filter((s: any) => s.status === 'pending').length,
    })
    setRecentViews(viewsRes.data || [])
    setRecentSubs(subs)
    setLoading(false)
  }

  if (authLoading || loading) return (
    <div style={{ minHeight: '100vh', background: C.obsidian, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: `2px solid ${C.border}`, borderTopColor: C.lime, animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  const subStatus: Record<string, { color: string; label: string }> = {
    pending: { color: '#ffc800', label: '⏳ Pending' },
    accepted: { color: C.lime, label: '✓ Accepted' },
    rejected: { color: '#ff6b6b', label: '✕ Rejected' },
  }

  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', color: C.filmLight, fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '40px 40px 32px' }}>
        <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.lime, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 8 }}>Overview</div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontFamily: 'monospace', fontWeight: 700, margin: '0 0 6px' }}>Dashboard</h1>
        <p style={{ margin: 0, fontSize: 13, color: C.gray }}>Your activity at a glance</p>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 40 }}>

        {/* Stats grid */}
        <div>
          <div style={{ fontSize: 10, fontFamily: 'monospace', color: C.gray, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>Stats</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
            {[
              { label: 'Reels', value: stats.reels, color: C.lime, icon: '▶', link: '/profile' },
              { label: 'Projects', value: stats.projects, color: C.lime, icon: '🗂', link: '/portfolio' },
              { label: 'Profile Views', value: stats.views, color: C.filmLight, icon: '👔', link: '/profile' },
              { label: 'Applications', value: stats.submissions, color: C.filmLight, icon: '📤', link: '/discover' },
              { label: 'Accepted', value: stats.accepted, color: C.lime, icon: '✓', link: '/discover' },
              { label: 'Pending', value: stats.pending, color: '#ffc800', icon: '⏳', link: '/discover' },
            ].map(s => (
              <div key={s.label} onClick={() => router.push(s.link)} style={{ background: C.slate, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 22px', cursor: 'pointer', transition: 'border-color 0.2s, transform 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.lime; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'translateY(0)' }}>
                <div style={{ fontSize: 11, color: C.gray, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'monospace', color: s.color, marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: C.gray, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <div style={{ fontSize: 10, fontFamily: 'monospace', color: C.gray, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>Quick Actions</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'Edit Profile', icon: '✎', href: '/profile' },
              { label: 'Browse Projects', icon: '🔍', href: '/discover' },
              { label: 'Add Project', icon: '+', href: '/portfolio' },
            ].map(a => (
              <button key={a.label} onClick={() => router.push(a.href)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.slate, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 18px', color: C.filmLight, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.lime}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                <span style={{ color: C.lime }}>{a.icon}</span> {a.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>

          {/* Recent profile views */}
          <div>
            <div style={{ fontSize: 10, fontFamily: 'monospace', color: C.gray, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>Recent Profile Views</div>
            {recentViews.length === 0
              ? <div style={{ background: C.slate, border: `1px dashed ${C.border}`, borderRadius: 12, padding: '32px 20px', textAlign: 'center', color: C.gray, fontSize: 13 }}>No views yet — share your profile!</div>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {recentViews.map((v, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: C.slate, borderRadius: i === 0 ? '12px 12px 0 0' : i === recentViews.length - 1 ? '0 0 12px 12px' : '0', border: `1px solid ${C.border}`, borderTop: i === 0 ? `1px solid ${C.border}` : 'none' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.charcoal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>👔</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.filmLight }}>{v.managers?.name || 'A manager'}</div>
                      {v.managers?.company && <div style={{ fontSize: 11, color: C.gray }}>{v.managers.company}</div>}
                    </div>
                  </div>
                ))}
              </div>
            }
          </div>

          {/* Recent applications */}
          <div>
            <div style={{ fontSize: 10, fontFamily: 'monospace', color: C.gray, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>Recent Applications</div>
            {recentSubs.length === 0
              ? <div style={{ background: C.slate, border: `1px dashed ${C.border}`, borderRadius: 12, padding: '32px 20px', textAlign: 'center', color: C.gray, fontSize: 13 }}>No applications yet — browse open projects!</div>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {recentSubs.slice(0, 5).map((s, i, arr) => {
                  const st = subStatus[s.status] || subStatus.pending
                  return (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: C.slate, borderRadius: i === 0 ? '12px 12px 0 0' : i === arr.length - 1 ? '0 0 12px 12px' : '0', border: `1px solid ${C.border}`, borderTop: i === 0 ? `1px solid ${C.border}` : 'none' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.filmLight, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(s as any).manager_projects?.title || 'Project'}</div>
                        <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>{new Date(s.submitted_at).toLocaleDateString()}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: st.color, flexShrink: 0 }}>{st.label}</span>
                    </div>
                  )
                })}
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  )
}
