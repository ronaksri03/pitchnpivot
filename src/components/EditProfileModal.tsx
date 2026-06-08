'use client'

import { useState } from 'react'
import { getClient } from '@/lib/supabase'
import { Profile } from '@/types'

const WORK_PREFS = ['remote', 'onsite', 'hybrid', 'flexible'] as const
const AVAILABILITY_OPTS = ['full-time', 'part-time', 'freelance', 'contract', 'internship'] as const
const PRONOUNS_OPTS = ['he/him', 'she/her', 'they/them', 'he/they', 'she/they']

interface Props {
  profile: Profile
  onClose: () => void
  onSaved: (p: Profile) => void
}

export default function EditProfileModal({ profile, onClose, onSaved }: Props) {
  const sb = getClient()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [skillInput, setSkillInput] = useState('')
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const [form, setForm] = useState({
    first_name: profile.first_name || '',
    last_name: profile.last_name || '',
    username: profile.username || '',
    job_title: profile.job_title || '',
    bio: profile.bio || '',
    location: profile.location || '',
    timezone: profile.timezone || '',
    pronouns: profile.pronouns || '',
    years_exp: profile.years_exp || '',
    college: profile.college || '',
    hourly_rate: profile.hourly_rate || '',
    looking_for: profile.looking_for || '',
    work_pref: profile.work_pref || '',
    availability: profile.availability || '',
    open_to_work: profile.open_to_work ?? false,
    skills: profile.skills || [],
    github_url: profile.github_url || '',
    portfolio_url: profile.portfolio_url || '',
    linkedin_url: profile.linkedin_url || '',
    twitter_url: profile.twitter_url || '',
    website_url: profile.website_url || '',
    discord_handle: profile.discord_handle || '',
  })

  function set(key: string, val: string | boolean | string[]) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function addSkill() {
    const t = skillInput.trim()
    if (t && !form.skills.includes(t)) set('skills', [...form.skills, t])
    setSkillInput('')
  }

  function removeSkill(s: string) {
    set('skills', form.skills.filter(x => x !== s))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    const { data, error: err } = await sb.from('profiles').update({
      ...form,
      work_pref: form.work_pref || null,
      availability: form.availability || null,
      pronouns: form.pronouns || null,
      timezone: form.timezone || null,
      college: form.college || null,
      hourly_rate: form.hourly_rate || null,
      looking_for: form.looking_for || null,
      twitter_url: form.twitter_url || null,
      website_url: form.website_url || null,
      discord_handle: form.discord_handle || null,
    }).eq('id', profile.id).select().single()
    setSaving(false)
    if (err) { setError(err.message); return }
    onSaved(data as Profile)
    onClose()
  }

  const sections = [
    { id: 'basic', icon: '👤', label: 'Basic Info' },
    { id: 'identity', icon: '📍', label: 'Identity & Location' },
    { id: 'experience', icon: '💼', label: 'Experience' },
    { id: 'work', icon: '🏠', label: 'Work Preferences' },
    { id: 'skills', icon: '⚡', label: 'Skills' },
    { id: 'links', icon: '🔗', label: 'Links & Socials' },
  ]

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0d0d0d', border: '1px solid #222', borderRadius: '18px',
          width: '100%', maxWidth: '640px', maxHeight: '92vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(200,255,0,0.04)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid #1a1a1a', flexShrink: 0,
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#f0ece4' }}>Edit Profile</h2>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#555' }}>Changes are saved immediately</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: '#111', border: '1px solid #222', borderRadius: '8px', color: '#666', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.15s, border-color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f0ece4'; e.currentTarget.style.borderColor = '#333' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#666'; e.currentTarget.style.borderColor = '#222' }}
          >✕</button>
        </div>

        {/* Body: sidebar nav + form */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Nav sidebar */}
          <div style={{ width: '170px', flexShrink: 0, padding: '16px 12px', borderRight: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
            {sections.map(s => (
              <a
                key={s.id}
                href={`#edit-${s.id}`}
                onClick={() => setActiveSection(s.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 10px', borderRadius: '8px', textDecoration: 'none',
                  fontSize: '12px', fontWeight: 600, transition: 'background 0.15s, color 0.15s',
                  background: activeSection === s.id ? 'rgba(200,255,0,0.08)' : 'transparent',
                  color: activeSection === s.id ? '#c8ff00' : '#555',
                  border: `1px solid ${activeSection === s.id ? 'rgba(200,255,0,0.15)' : 'transparent'}`,
                }}
              >
                <span style={{ fontSize: '14px' }}>{s.icon}</span>
                {s.label}
              </a>
            ))}
          </div>

          {/* Scrollable form */}
          <form onSubmit={save} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

            {/* Open to work toggle — always visible at top */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: form.open_to_work ? 'rgba(200,255,0,0.05)' : '#111',
              border: `1px solid ${form.open_to_work ? 'rgba(200,255,0,0.2)' : '#222'}`,
              borderRadius: '10px', padding: '12px 16px',
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: form.open_to_work ? '#c8ff00' : '#f0ece4' }}>
                  {form.open_to_work ? '✦ Open to work' : '◉ Not currently looking'}
                </div>
                <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>Managers can see your availability status</div>
              </div>
              <button
                type="button"
                onClick={() => set('open_to_work', !form.open_to_work)}
                style={{
                  width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer',
                  position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                  background: form.open_to_work ? '#c8ff00' : '#222',
                }}
              >
                <div style={{
                  position: 'absolute', top: '2px',
                  left: form.open_to_work ? '20px' : '2px',
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: form.open_to_work ? '#0a0a0a' : '#555',
                  transition: 'left 0.2s',
                }} />
              </button>
            </div>

            {/* Basic Info */}
            <Section id="edit-basic" label="👤 Basic Info">
              <Row>
                <Field label="First name">
                  <input className="inp" placeholder="First name" value={form.first_name} onChange={e => set('first_name', e.target.value)} />
                </Field>
                <Field label="Last name">
                  <input className="inp" placeholder="Last name" value={form.last_name} onChange={e => set('last_name', e.target.value)} />
                </Field>
              </Row>
              <Field label="Username">
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#555', fontSize: '14px' }}>@</span>
                  <input className="inp" style={{ paddingLeft: '26px' }} placeholder="username" value={form.username} onChange={e => set('username', e.target.value)} />
                </div>
              </Field>
              <Field label="Job title">
                <input className="inp" placeholder="e.g. Full Stack Developer" value={form.job_title} onChange={e => set('job_title', e.target.value)} />
              </Field>
              <Field label="Bio">
                <textarea className="inp" placeholder="Tell people who you are…" value={form.bio} onChange={e => set('bio', e.target.value)} rows={3} style={{ resize: 'vertical' }} />
              </Field>
            </Section>

            {/* Identity & Location */}
            <Section id="edit-identity" label="📍 Identity & Location">
              <Field label="Pronouns">
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {PRONOUNS_OPTS.map(p => (
                    <PillToggle key={p} active={form.pronouns === p} onClick={() => set('pronouns', form.pronouns === p ? '' : p)}>
                      {p}
                    </PillToggle>
                  ))}
                </div>
              </Field>
              <Row>
                <Field label="Location">
                  <input className="inp" placeholder="Mumbai, India" value={form.location} onChange={e => set('location', e.target.value)} />
                </Field>
                <Field label="Timezone">
                  <input className="inp" placeholder="IST / GMT+5:30" value={form.timezone} onChange={e => set('timezone', e.target.value)} />
                </Field>
              </Row>
            </Section>

            {/* Experience */}
            <Section id="edit-experience" label="💼 Experience">
              <Row>
                <Field label="Years of experience">
                  <input className="inp" placeholder="e.g. 3" value={form.years_exp} onChange={e => set('years_exp', e.target.value)} />
                </Field>
                <Field label="College / University">
                  <input className="inp" placeholder="MIT, IIT Delhi…" value={form.college} onChange={e => set('college', e.target.value)} />
                </Field>
              </Row>
              <Field label="Hourly rate">
                <input className="inp" placeholder="e.g. $50–100/hr or ₹2000/hr" value={form.hourly_rate} onChange={e => set('hourly_rate', e.target.value)} />
              </Field>
              <Field label="Looking for">
                <textarea className="inp" placeholder="e.g. Founding engineer roles, AI freelance projects…" value={form.looking_for} onChange={e => set('looking_for', e.target.value)} rows={2} style={{ resize: 'vertical' }} />
              </Field>
            </Section>

            {/* Work Preferences */}
            <Section id="edit-work" label="🏠 Work Preferences">
              <Field label="Work style">
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {WORK_PREFS.map(w => (
                    <PillToggle key={w} active={form.work_pref === w} onClick={() => set('work_pref', form.work_pref === w ? '' : w)}>
                      {w.charAt(0).toUpperCase() + w.slice(1)}
                    </PillToggle>
                  ))}
                </div>
              </Field>
              <Field label="Availability">
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {AVAILABILITY_OPTS.map(a => (
                    <PillToggle key={a} active={form.availability === a} onClick={() => set('availability', form.availability === a ? '' : a)}>
                      {a.charAt(0).toUpperCase() + a.slice(1)}
                    </PillToggle>
                  ))}
                </div>
              </Field>
            </Section>

            {/* Skills */}
            <Section id="edit-skills" label="⚡ Skills">
              <Field label="Add skills">
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    className="inp" style={{ flex: 1 }}
                    placeholder="e.g. React, Figma, Python…"
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                  />
                  <button type="button" onClick={addSkill} style={{
                    background: '#c8ff00', color: '#0a0a0a', border: 'none', borderRadius: '8px',
                    fontWeight: 700, fontSize: '13px', padding: '0 16px', cursor: 'pointer', flexShrink: 0,
                  }}>Add</button>
                </div>
              </Field>
              {form.skills.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {form.skills.map(s => (
                    <button
                      key={s} type="button" onClick={() => removeSkill(s)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        fontSize: '12px', padding: '4px 10px', borderRadius: '20px', cursor: 'pointer',
                        background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)',
                        color: '#a8d400', fontWeight: 500, transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                      {s} <span style={{ fontSize: '10px', opacity: 0.7 }}>✕</span>
                    </button>
                  ))}
                </div>
              )}
            </Section>

            {/* Links */}
            <Section id="edit-links" label="🔗 Links & Socials">
              <Field label="GitHub">
                <input className="inp" placeholder="https://github.com/username" value={form.github_url} onChange={e => set('github_url', e.target.value)} />
              </Field>
              <Field label="Portfolio">
                <input className="inp" placeholder="https://yourportfolio.com" value={form.portfolio_url} onChange={e => set('portfolio_url', e.target.value)} />
              </Field>
              <Field label="LinkedIn">
                <input className="inp" placeholder="https://linkedin.com/in/username" value={form.linkedin_url} onChange={e => set('linkedin_url', e.target.value)} />
              </Field>
              <Field label="Twitter / X">
                <input className="inp" placeholder="https://x.com/username" value={form.twitter_url} onChange={e => set('twitter_url', e.target.value)} />
              </Field>
              <Field label="Website">
                <input className="inp" placeholder="https://yoursite.com" value={form.website_url} onChange={e => set('website_url', e.target.value)} />
              </Field>
              <Field label="Discord">
                <input className="inp" placeholder="username#1234 or username" value={form.discord_handle} onChange={e => set('discord_handle', e.target.value)} />
              </Field>
            </Section>

            {error && (
              <div style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#ff6b6b' }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={saving}
              style={{
                background: saving ? '#333' : '#c8ff00', color: saving ? '#666' : '#0a0a0a',
                border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '14px',
                padding: '13px 20px', cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.15s', width: '100%',
              }}
            >
              {saving ? 'Saving…' : 'Save profile →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ── Helpers ──

function Section({ id, label, children }: { id?: string; label: string; children: React.ReactNode }) {
  return (
    <div id={id} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '1px solid #1a1a1a' }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: '10px' }}>{children}</div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#555' }}>{label}</div>
      {children}
    </div>
  )
}

function PillToggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button" onClick={onClick}
      style={{
        fontSize: '12px', padding: '5px 12px', borderRadius: '20px', cursor: 'pointer',
        fontWeight: 600, transition: 'all 0.15s', border: '1px solid',
        background: active ? 'rgba(200,255,0,0.12)' : 'transparent',
        borderColor: active ? 'rgba(200,255,0,0.3)' : '#2a2a2a',
        color: active ? '#c8ff00' : '#555',
      }}
    >
      {children}
    </button>
  )
}
