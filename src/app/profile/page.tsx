'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getClient } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Profile, Reel, IndividualProject, ManagerProject, ProfileView } from '@/types'

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

function timeAgo(ts: string) {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [reels, setReels] = useState<Reel[]>([])
  const [projects, setProjects] = useState<IndividualProject[]>([])
  const [assigned, setAssigned] = useState<ManagerProject[]>([])
  const [visits, setVisits] = useState<ProfileView[]>([])
  const [loading, setLoading] = useState(true)
  const sb = getClient()

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth')
    if (user) loadAll()
  }, [authLoading, user])

  async function loadAll() {
    if (!user) return
    const [profRes, reelRes, projRes, assignedRes, visitRes] = await Promise.all([
      sb.from('profiles').select('*').eq('id', user.id).single(),
      sb.from('reels').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      sb.from('individual_projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      sb.from('manager_projects').select('*, managers(name, company)').eq('assigned_to', user.id).order('created_at', { ascending: false }),
      sb.from('profile_views').select('*, managers(name, company)').eq('profile_user_id', user.id).order('viewed_at', { ascending: false }).limit(20),
    ])
    setProfile(profRes.data)
    setReels(reelRes.data || [])
    setProjects(projRes.data || [])
    setAssigned(assignedRes.data || [])
    setVisits(visitRes.data || [])
    setLoading(false)
  }

  if (authLoading || loading) return <div className="empty-state" style={{ paddingTop: '80px' }}>Loading…</div>
  if (!user) return null

  const meta = user.user_metadata || {}
  const name = [(profile?.first_name || meta.first_name || ''), (profile?.last_name || meta.last_name || '')].join(' ').trim() || user.email?.split('@')[0] || 'You'

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#c8ff00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: 700, color: '#0a0a0a', flexShrink: 0 }}>
          {initials(name)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#f0ece4' }}>{name}</div>
          {profile?.job_title && <div style={{ fontSize: '14px', color: '#888', marginTop: '2px' }}>{profile.job_title}{profile.years_exp ? ` · ${profile.years_exp} yrs` : ''}{profile.location ? ` · 📍 ${profile.location}` : ''}</div>}
          {profile?.username && <div style={{ fontSize: '13px', color: '#444', marginTop: '2px' }}>@{profile.username}</div>}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', background: profile?.open_to_work ? 'rgba(200,255,0,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${profile?.open_to_work ? 'rgba(200,255,0,0.3)' : '#2a2a2a'}`, color: profile?.open_to_work ? '#c8ff00' : '#555' }}>
            {profile?.open_to_work ? '✦ Open to Work' : '◉ Not looking'}
          </span>
        </div>
      </div>

      {/* Bio */}
      {profile?.bio && (
        <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '16px 18px', marginBottom: '24px', fontSize: '14px', color: '#999', lineHeight: 1.65, borderLeft: '2px solid #c8ff00' }}>
          {profile.bio}
        </div>
      )}

      {/* Skills */}
      {profile?.skills?.length > 0 && (
        <Section title="Skills">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {profile.skills.map(s => <span key={s} className="vtag">{s}</span>)}
          </div>
        </Section>
      )}

      {/* Manager visits */}
      <Section title={`👔 Managers who visited your profile (${visits.length})`}>
        {visits.length === 0 ? (
          <div style={{ color: '#444', fontSize: '13px' }}>No visits yet.</div>
        ) : visits.map((v, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #111' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>👔</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#f0ece4' }}>{(v as unknown as { managers?: { name?: string; company?: string } }).managers?.name || 'A manager'}</div>
              <div style={{ fontSize: '12px', color: '#555' }}>{(v as unknown as { managers?: { name?: string; company?: string } }).managers?.company || ''}</div>
            </div>
            <div style={{ fontSize: '11px', color: '#444' }}>{v.viewed_at ? timeAgo(v.viewed_at) : ''}</div>
          </div>
        ))}
      </Section>

      {/* Assigned projects */}
      {assigned.length > 0 && (
        <Section title="📋 Projects assigned to me">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '10px' }}>
            {assigned.map(p => (
              <div key={p.id} style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '100px' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#f0ece4', lineHeight: 1.3 }}>{p.title}</div>
                {(p as unknown as { managers?: { name?: string; company?: string } }).managers?.name && <div style={{ fontSize: '11px', color: '#666' }}>{(p as unknown as { managers?: { name?: string; company?: string } }).managers?.name}</div>}
                <div style={{ marginTop: 'auto' }}>
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(200,255,0,0.1)', border: '1px solid rgba(200,255,0,0.25)', color: '#c8ff00' }}>{p.pay_type}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Reels */}
      <Section title={`▶ Reels (${reels.length})`}>
        {reels.length === 0 ? <div style={{ color: '#444', fontSize: '13px' }}>No reels yet.</div> : reels.map(r => (
          <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#111', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '12px 14px', color: '#f0ece4', textDecoration: 'none', marginBottom: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(200,255,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>▶</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>{r.title || 'Untitled reel'}</div>
              {r.skills?.length > 0 && <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>{r.skills.slice(0, 3).map(s => <span key={s} className="vtag" style={{ fontSize: '10px' }}>{s}</span>)}</div>}
            </div>
          </a>
        ))}
      </Section>

      {/* Projects */}
      <Section title={`🗂 My Projects (${projects.length})`}>
        {projects.length === 0 ? <div style={{ color: '#444', fontSize: '13px' }}>No projects posted yet.</div> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '10px' }}>
            {projects.map(p => (
              <div key={p.id} style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#f0ece4' }}>{p.title}</div>
                {p.description && <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.5 }}>{p.description.slice(0, 80)}{p.description.length > 80 ? '…' : ''}</div>}
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: 'auto' }}>
                  {p.skills?.slice(0, 3).map(s => <span key={s} className="vtag" style={{ fontSize: '10px' }}>{s}</span>)}
                </div>
                {p.demo_link && <a href={p.demo_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#c8ff00', textDecoration: 'none' }}>🔗 View demo</a>}
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #1a1a1a' }}>
        {title}
      </div>
      {children}
    </div>
  )
}
