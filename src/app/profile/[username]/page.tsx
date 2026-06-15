'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { getClient } from '@/lib/supabase'
import { Profile, Reel, IndividualProject } from '@/types'

const C = {
  obsidian: '#0a0a0a', slate: '#1a1a1a', filmLight: '#f0ece4',
  lime: '#c8ff00', gray: '#888', border: '#2a2a2a', charcoal: '#2d2d2d',
}

function toEmbedUrl(url: string): string | null {
  if (!url) return null
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1&mute=1&loop=1&controls=0&playsinline=1`
  const loom = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/)
  if (loom) return `https://www.loom.com/embed/${loom[1]}?autoplay=1&hide_owner=true&hide_share=true&hideEmbedTopBar=true`
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1&muted=1&loop=1&background=1`
  return null
}

function initials(p: Profile) {
  return [(p.first_name || ''), (p.last_name || '')].join(' ').trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

function fullName(p: Profile) {
  return [(p.first_name || ''), (p.last_name || '')].join(' ').trim() || p.username || 'Anonymous'
}

export default function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [reels, setReels] = useState<Reel[]>([])
  const [projects, setProjects] = useState<IndividualProject[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const sb = getClient()

  useEffect(() => {
    async function load() {
      const { data: prof } = await sb.from('profiles').select('*').eq('username', username).single()
      if (!prof) { setNotFound(true); setLoading(false); return }
      setProfile(prof)
      const [reelRes, projRes] = await Promise.all([
        sb.from('reels').select('*').eq('user_id', prof.id).eq('visibility', 'public').order('created_at', { ascending: false }),
        sb.from('individual_projects').select('*').eq('user_id', prof.id).eq('visibility', 'public').order('created_at', { ascending: false }),
      ])
      setReels(reelRes.data || [])
      setProjects(projRes.data || [])
      setLoading(false)
    }
    load()
  }, [username])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.obsidian, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: `3px solid ${C.border}`, borderTopColor: C.lime, animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <div style={{ fontSize: 13, color: C.gray, fontFamily: 'monospace' }}>Loading profile…</div>
      </div>
    </div>
  )

  if (notFound || !profile) return (
    <div style={{ minHeight: '100vh', background: C.obsidian, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 48 }}>🎬</div>
      <div style={{ fontSize: 22, fontFamily: 'monospace', fontWeight: 700, color: C.filmLight }}>Profile not found</div>
      <div style={{ fontSize: 14, color: C.gray }}>@{username} doesn't exist.</div>
      <button onClick={() => router.push('/discover')} style={{ marginTop: 8, background: C.lime, color: C.obsidian, border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>← Back to Discover</button>
    </div>
  )

  const embedUrl = profile.intro_video_url ? toEmbedUrl(profile.intro_video_url) : null

  return (
    <div style={{ background: C.obsidian, color: C.filmLight, minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>

      {/* ── CINEMATIC HERO ── */}
      <section style={{ position: 'relative', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>

        {/* Film strip top */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 28, background: C.slate, display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', zIndex: 10, overflow: 'hidden' }}>
          {Array.from({ length: 50 }).map((_, i) => <div key={i} style={{ width: 18, height: 12, borderRadius: 2, background: C.obsidian, flexShrink: 0 }} />)}
        </div>

        {/* Film strip bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 28, background: C.slate, display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', zIndex: 10, overflow: 'hidden' }}>
          {Array.from({ length: 50 }).map((_, i) => <div key={i} style={{ width: 18, height: 12, borderRadius: 2, background: C.obsidian, flexShrink: 0 }} />)}
        </div>

        {/* Video background OR animated gradient */}
        {embedUrl ? (
          <div style={{ position: 'absolute', inset: 0 }}>
            <iframe src={embedUrl} style={{ width: '100%', height: '100%', border: 'none', opacity: 0.45, transform: 'scale(1.1)' }} allow="autoplay; fullscreen" allowFullScreen />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,10,10,0.2) 0%, rgba(10,10,10,0.7) 60%, #0a0a0a 100%)' }} />
          </div>
        ) : (
          <div style={{ position: 'absolute', inset: 0 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0a0a0a 0%, #0d1a00 40%, #001a0d 70%, #0a0a0a 100%)', animation: 'gradientShift 8s ease infinite' }} />
            {/* Animated lime orbs */}
            <div style={{ position: 'absolute', top: '20%', left: '15%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(200,255,0,0.06)', filter: 'blur(80px)', animation: 'float 6s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', bottom: '25%', right: '20%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(200,255,0,0.04)', filter: 'blur(60px)', animation: 'float 8s ease-in-out infinite reverse' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, #0a0a0a 100%)' }} />
            <style>{`
              @keyframes float { 0%,100% { transform: translateY(0px) scale(1) } 50% { transform: translateY(-30px) scale(1.05) } }
              @keyframes gradientShift { 0%,100% { opacity: 1 } 50% { opacity: 0.85 } }
            `}</style>
          </div>
        )}

        {/* Hero content */}
        <div style={{ position: 'relative', zIndex: 5, textAlign: 'center', padding: '60px 24px 0', maxWidth: 800, width: '100%' }}>

          {/* Avatar */}
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: C.lime, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 900, color: C.obsidian, margin: '0 auto 24px', boxShadow: `0 0 0 4px ${C.obsidian}, 0 0 0 6px rgba(200,255,0,0.35), 0 0 60px rgba(200,255,0,0.15)` }}>
            {initials(profile)}
          </div>

          {/* Label */}
          <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.lime, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 12 }}>
            {embedUrl ? '🎬 Video CV' : '✦ Profile'}
          </div>

          {/* Name */}
          <h1 style={{ fontSize: 'clamp(36px, 7vw, 72px)', fontFamily: 'monospace', fontWeight: 700, margin: '0 0 10px', letterSpacing: '-0.02em', lineHeight: 1, textShadow: '0 2px 30px rgba(0,0,0,0.5)' }}>
            {fullName(profile)}
          </h1>

          {/* Job title */}
          {profile.job_title && (
            <p style={{ fontSize: 18, color: '#bbb', margin: '0 0 6px' }}>{profile.job_title}{profile.years_exp && <span style={{ color: C.gray }}> · {profile.years_exp} yrs</span>}</p>
          )}
          {profile.pronouns && <p style={{ fontSize: 13, color: C.gray, margin: '0 0 24px' }}>{profile.pronouns}</p>}

          {/* Badges */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
            {profile.open_to_work && (
              <span style={{ fontSize: 12, fontWeight: 700, padding: '5px 16px', borderRadius: 20, background: 'rgba(200,255,0,0.12)', border: '1px solid rgba(200,255,0,0.4)', color: C.lime }}>✦ Open to work</span>
            )}
            {profile.availability && (
              <span style={{ fontSize: 12, padding: '5px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.07)', border: `1px solid rgba(255,255,255,0.12)`, color: '#ccc', textTransform: 'capitalize' }}>{profile.availability}</span>
            )}
            {profile.work_pref && (
              <span style={{ fontSize: 12, padding: '5px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.07)', border: `1px solid rgba(255,255,255,0.12)`, color: '#ccc', textTransform: 'capitalize' }}>{profile.work_pref}</span>
            )}
          </div>

          {/* Meta pills */}
          <div style={{ display: 'inline-flex', gap: 20, background: 'rgba(255,255,255,0.05)', border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 50, padding: '10px 24px', backdropFilter: 'blur(10px)', flexWrap: 'wrap', justifyContent: 'center' }}>
            {profile.location && <span style={{ fontSize: 13, color: '#bbb' }}>📍 {profile.location}</span>}
            {profile.hourly_rate && <span style={{ fontSize: 13, color: C.lime, fontWeight: 700 }}>💰 {profile.hourly_rate}/hr</span>}
            {profile.college && <span style={{ fontSize: 13, color: '#bbb' }}>🎓 {profile.college}</span>}
          </div>
        </div>

        {/* Stats bottom-left */}
        <div style={{ position: 'absolute', bottom: 48, left: 40, zIndex: 5, display: 'flex', gap: 32 }}>
          {[{ label: 'Projects', value: projects.length }, { label: 'Reels', value: reels.length }].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 30, fontWeight: 800, fontFamily: 'monospace', color: C.lime }}>{s.value}</div>
              <div style={{ fontSize: 11, color: C.gray, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Back button */}
        <button onClick={() => router.push('/discover')} style={{ position: 'absolute', top: 40, left: 24, zIndex: 10, background: 'rgba(255,255,255,0.07)', border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 8, color: '#ccc', padding: '8px 16px', fontSize: 13, cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
          ← Discover
        </button>
      </section>

      {/* ── BODY ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 32, alignItems: 'start' }}>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {profile.bio && (
              <div style={{ background: C.slate, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
                <div style={{ fontSize: 10, fontFamily: 'monospace', color: C.gray, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>About</div>
                <p style={{ margin: 0, fontSize: 13, color: '#bbb', lineHeight: 1.75 }}>{profile.bio}</p>
              </div>
            )}

            {profile.looking_for && (
              <div style={{ background: 'rgba(200,255,0,0.04)', border: '1px solid rgba(200,255,0,0.15)', borderRadius: 14, padding: '18px 20px' }}>
                <div style={{ fontSize: 10, fontFamily: 'monospace', color: C.lime, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>Looking For</div>
                <p style={{ margin: 0, fontSize: 13, color: '#ccc', lineHeight: 1.7 }}>{profile.looking_for}</p>
              </div>
            )}

            {(profile.skills || []).length > 0 && (
              <div style={{ background: C.slate, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
                <div style={{ fontSize: 10, fontFamily: 'monospace', color: C.gray, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>Skills</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {profile.skills.map(s => <span key={s} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', color: C.lime, fontWeight: 500 }}>{s}</span>)}
                </div>
              </div>
            )}

            {(profile.github_url || profile.linkedin_url || profile.portfolio_url || profile.twitter_url || profile.website_url) && (
              <div style={{ background: C.slate, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
                <div style={{ fontSize: 10, fontFamily: 'monospace', color: C.gray, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>Links</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'GitHub', url: profile.github_url, icon: '🐙' },
                    { label: 'LinkedIn', url: profile.linkedin_url, icon: '💼' },
                    { label: 'Portfolio', url: profile.portfolio_url, icon: '🎨' },
                    { label: 'Twitter / X', url: profile.twitter_url, icon: '𝕏' },
                    { label: 'Website', url: profile.website_url, icon: '🌐' },
                  ].filter(l => l.url).map(l => (
                    <a key={l.label} href={l.url!} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.lime, textDecoration: 'none', fontWeight: 500 }}>
                      <span>{l.icon}</span><span>{l.label}</span>
                    </a>
                  ))}
                  {profile.discord_handle && <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.gray }}>💬 {profile.discord_handle}</span>}
                </div>
              </div>
            )}
          </div>

          {/* Main */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

            {/* Projects */}
            {projects.length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontFamily: 'monospace', color: C.gray, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>Projects ({projects.length})</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
                  {projects.map(p => (
                    <div key={p.id} style={{ background: C.slate, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 10, transition: 'border-color 0.2s, transform 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = C.lime; e.currentTarget.style.transform = 'translateY(-2px)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'translateY(0)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{p.title}</div>
                        {p.status && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, flexShrink: 0, textTransform: 'uppercase', background: p.status === 'completed' ? 'rgba(200,255,0,0.1)' : 'rgba(100,150,255,0.1)', border: `1px solid ${p.status === 'completed' ? 'rgba(200,255,0,0.3)' : 'rgba(100,150,255,0.25)'}`, color: p.status === 'completed' ? C.lime : '#7090ff' }}>{p.status}</span>}
                      </div>
                      {p.description && <p style={{ margin: 0, fontSize: 12, color: C.gray, lineHeight: 1.6 }}>{p.description.slice(0, 100)}{p.description.length > 100 ? '…' : ''}</p>}
                      {(p.skills || []).length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {p.skills.slice(0, 3).map(s => <span key={s} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 20, background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.18)', color: C.lime }}>{s}</span>)}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
                        {p.demo_link && <a href={p.demo_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.lime, textDecoration: 'none', fontWeight: 600 }}>🔗 Demo</a>}
                        {p.github_url && <a href={p.github_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.lime, textDecoration: 'none', fontWeight: 600 }}>⌥ GitHub</a>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reels */}
            {reels.length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontFamily: 'monospace', color: C.gray, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>Reels ({reels.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {reels.map(r => (
                    <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: C.slate, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 16px', transition: 'border-color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = C.lime}
                        onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.lime, flexShrink: 0 }}>▶</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: C.filmLight }}>{r.title || 'Reel'}</div>
                          {(r.skills || []).length > 0 && <div style={{ fontSize: 11, color: C.gray, marginTop: 3 }}>{r.skills.slice(0, 3).join(' · ')}</div>}
                        </div>
                        <span style={{ fontSize: 12, color: C.lime }}>→</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {projects.length === 0 && reels.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: C.slate, border: `1px dashed ${C.border}`, borderRadius: 14, color: C.gray }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🎬</div>
                <div style={{ fontSize: 14 }}>No public work yet.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
