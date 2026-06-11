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
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [error, setError] = useState('')
  const [skillInput, setSkillInput] = useState('')

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
    intro_video_url: profile.intro_video_url || '',
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
      intro_video_url: form.intro_video_url || null,
    }).eq('id', profile.id).select().single()
    setSaving(false)
    if (err) { setError(err.message); return }
    onSaved(data as Profile)
    onClose()
  }

  const inp: React.CSSProperties = {
    width: '100%', background: '#1a1a1a', border: '1px solid #333',
    borderRadius: '10px', color: '#f0ece4', fontSize: '15px',
    padding: '12px 16px', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'stretch', justifyContent: 'center', padding: '0' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0d0d0d', border: '1px solid #2a2a2a',
          width: '100%', maxWidth: '900px', margin: '24px',
          borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 32px 100px rgba(0,0,0,0.7)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', borderBottom: '1px solid #1e1e1e', flexShrink: 0 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#f0ece4' }}>Edit Profile</h2>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#777' }}>Keep your profile fresh — managers notice</p>
          </div>
          <button onClick={onClose} style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: '#aaa', width: '36px', height: '36px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Scrollable form */}
        <form onSubmit={save} style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '36px' }}>

          {/* Open to work toggle */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: form.open_to_work ? 'rgba(200,255,0,0.06)' : '#111',
            border: `1px solid ${form.open_to_work ? 'rgba(200,255,0,0.25)' : '#2a2a2a'}`,
            borderRadius: '12px', padding: '16px 20px',
          }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: form.open_to_work ? '#c8ff00' : '#f0ece4' }}>
                {form.open_to_work ? '✦ Open to work' : '◉ Not currently looking'}
              </div>
              <div style={{ fontSize: '14px', color: '#777', marginTop: '3px' }}>Managers see this on your profile</div>
            </div>
            <button type="button" onClick={() => set('open_to_work', !form.open_to_work)} style={{
              width: '48px', height: '26px', borderRadius: '13px', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0, background: form.open_to_work ? '#c8ff00' : '#2a2a2a',
            }}>
              <div style={{ position: 'absolute', top: '3px', left: form.open_to_work ? '24px' : '3px', width: '20px', height: '20px', borderRadius: '50%', background: form.open_to_work ? '#0a0a0a' : '#666', transition: 'left 0.2s' }} />
            </button>
          </div>

          {/* Basic Info */}
          <FormSection label="👤 Basic Info">
            <TwoCol>
              <Field label="First name"><input style={inp} placeholder="First name" value={form.first_name} onChange={e => set('first_name', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} /></Field>
              <Field label="Last name"><input style={inp} placeholder="Last name" value={form.last_name} onChange={e => set('last_name', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} /></Field>
            </TwoCol>
            <TwoCol>
              <Field label="Username">
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#666', fontSize: '16px' }}>@</span>
                  <input style={{ ...inp, paddingLeft: '30px' }} placeholder="username" value={form.username} onChange={e => set('username', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
                </div>
              </Field>
              <Field label="Job title"><input style={inp} placeholder="e.g. Full Stack Developer" value={form.job_title} onChange={e => set('job_title', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} /></Field>
            </TwoCol>
            <Field label="Bio">
              <textarea style={{ ...inp, resize: 'vertical', minHeight: '90px' }} placeholder="Tell people who you are…" value={form.bio} onChange={e => set('bio', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
            </Field>
          </FormSection>

          {/* Identity & Location */}
          <FormSection label="📍 Identity & Location">
            <Field label="Pronouns">
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {PRONOUNS_OPTS.map(p => (
                  <PillToggle key={p} active={form.pronouns === p} onClick={() => set('pronouns', form.pronouns === p ? '' : p)}>{p}</PillToggle>
                ))}
              </div>
            </Field>
            <TwoCol>
              <Field label="Location"><input style={inp} placeholder="Mumbai, India" value={form.location} onChange={e => set('location', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} /></Field>
              <Field label="Timezone"><input style={inp} placeholder="IST / GMT+5:30" value={form.timezone} onChange={e => set('timezone', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} /></Field>
            </TwoCol>
          </FormSection>

          {/* Experience */}
          <FormSection label="💼 Experience">
            <TwoCol>
              <Field label="Years of experience"><input style={inp} placeholder="e.g. 3" value={form.years_exp} onChange={e => set('years_exp', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} /></Field>
              <Field label="College / University"><input style={inp} placeholder="IIT Bombay, MIT…" value={form.college} onChange={e => set('college', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} /></Field>
            </TwoCol>
            <Field label="Hourly rate"><input style={inp} placeholder="e.g. $50–100/hr or ₹2000/hr" value={form.hourly_rate} onChange={e => set('hourly_rate', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} /></Field>
            <Field label="Looking for">
              <textarea style={{ ...inp, resize: 'vertical', minHeight: '70px' }} placeholder="Founding engineer roles, AI freelance projects…" value={form.looking_for} onChange={e => set('looking_for', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
            </Field>
          </FormSection>

          {/* Work Preferences */}
          <FormSection label="🏠 Work Preferences">
            <Field label="Work style">
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {WORK_PREFS.map(w => (
                  <PillToggle key={w} active={form.work_pref === w} onClick={() => set('work_pref', form.work_pref === w ? '' : w)}>
                    {w.charAt(0).toUpperCase() + w.slice(1)}
                  </PillToggle>
                ))}
              </div>
            </Field>
            <Field label="Availability">
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {AVAILABILITY_OPTS.map(a => (
                  <PillToggle key={a} active={form.availability === a} onClick={() => set('availability', form.availability === a ? '' : a)}>
                    {a.charAt(0).toUpperCase() + a.slice(1)}
                  </PillToggle>
                ))}
              </div>
            </Field>
          </FormSection>

          {/* Skills */}
          <FormSection label="⚡ Skills">
            <Field label="Add skills">
              <div style={{ display: 'flex', gap: '10px' }}>
                <input style={{ ...inp, flex: 1 }} placeholder="React, Figma, Python… press Enter" value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                  onFocus={focusStyle} onBlur={blurStyle}
                />
                <button type="button" onClick={addSkill} style={{ background: '#c8ff00', color: '#0a0a0a', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '14px', padding: '0 20px', cursor: 'pointer', flexShrink: 0 }}>Add</button>
              </div>
            </Field>
            {form.skills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {form.skills.map(s => (
                  <button key={s} type="button" onClick={() => removeSkill(s)} style={{
                    display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', padding: '6px 12px',
                    borderRadius: '20px', cursor: 'pointer', background: 'rgba(200,255,0,0.08)',
                    border: '1px solid rgba(200,255,0,0.25)', color: '#c8ff00', fontWeight: 500,
                  }}>
                    {s} <span style={{ fontSize: '11px', opacity: 0.7 }}>✕</span>
                  </button>
                ))}
              </div>
            )}
          </FormSection>

          {/* Links */}
          <FormSection label="🔗 Links & Socials">
            <TwoCol>
              <Field label="GitHub"><input style={inp} placeholder="https://github.com/username" value={form.github_url} onChange={e => set('github_url', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} /></Field>
              <Field label="Portfolio"><input style={inp} placeholder="https://yourportfolio.com" value={form.portfolio_url} onChange={e => set('portfolio_url', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} /></Field>
            </TwoCol>
            <TwoCol>
              <Field label="LinkedIn"><input style={inp} placeholder="https://linkedin.com/in/username" value={form.linkedin_url} onChange={e => set('linkedin_url', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} /></Field>
              <Field label="Twitter / X"><input style={inp} placeholder="https://x.com/username" value={form.twitter_url} onChange={e => set('twitter_url', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} /></Field>
            </TwoCol>
            <TwoCol>
              <Field label="Website"><input style={inp} placeholder="https://yoursite.com" value={form.website_url} onChange={e => set('website_url', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} /></Field>
              <Field label="Discord"><input style={inp} placeholder="username or username#1234" value={form.discord_handle} onChange={e => set('discord_handle', e.target.value)} onFocus={focusStyle} onBlur={blurStyle} /></Field>
            </TwoCol>
          </FormSection>

          {error && (
            <div style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.25)', borderRadius: '10px', padding: '12px 16px', fontSize: '14px', color: '#ff7070' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={saving} style={{
            background: saving ? '#222' : '#c8ff00', color: saving ? '#555' : '#0a0a0a',
            border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '16px',
            padding: '16px 20px', cursor: saving ? 'not-allowed' : 'pointer', width: '100%',
          }}>
            {saving ? 'Saving…' : 'Save profile →'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Focus helpers ──
function focusStyle(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = '#c8ff00'
}
function blurStyle(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = '#333'
}

// ── Layout helpers ──
function FormSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase', paddingBottom: '10px', borderBottom: '1px solid #1e1e1e' }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>{children}</div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#aaa' }}>{label}</div>
      {children}
    </div>
  )
}

function PillToggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{
      fontSize: '14px', padding: '7px 16px', borderRadius: '20px', cursor: 'pointer',
      fontWeight: 600, transition: 'all 0.15s', border: '1px solid',
      background: active ? 'rgba(200,255,0,0.1)' : 'transparent',
      borderColor: active ? 'rgba(200,255,0,0.35)' : '#333',
      color: active ? '#c8ff00' : '#888',
    }}>
      {children}
    </button>
  )
}
