'use client'

import { useState } from 'react'
import { getClient } from '@/lib/supabase'
import { Profile } from '@/types'

const WORK_PREFS = ['remote', 'onsite', 'hybrid', 'flexible']
const AVAILABILITY_OPTS = ['full-time', 'part-time', 'freelance', 'contract', 'internship']
const PRONOUNS_OPTS = ['he/him', 'she/her', 'they/them', 'he/they', 'she/they', 'custom']

interface Props {
  profile: Profile
  onClose: () => void
  onSaved: (p: Profile) => void
}

const half = { flex: 1, minWidth: 0 }

export default function EditProfileModal({ profile, onClose, onSaved }: Props) {
  const sb = getClient()
  const [saving, setSaving] = useState(false)
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
  })

  function set(key: string, val: string | boolean | string[]) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function addSkill() {
    const t = skillInput.trim()
    if (t && !form.skills.includes(t)) set('skills', [...form.skills, t])
    setSkillInput('')
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: '16px',
        padding: '28px', width: '100%', maxWidth: '600px', maxHeight: '90vh',
        overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#f0ece4', margin: 0 }}>Edit Profile</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          <Section label="Basic Info">
            <div style={{ display: 'flex', gap: '8px' }}>
              <input className="inp" style={half} placeholder="First name" value={form.first_name} onChange={e => set('first_name', e.target.value)} />
              <input className="inp" style={half} placeholder="Last name" value={form.last_name} onChange={e => set('last_name', e.target.value)} />
            </div>
            <input className="inp" placeholder="@username" value={form.username} onChange={e => set('username', e.target.value)} />
            <input className="inp" placeholder="Job title (e.g. Full Stack Developer)" value={form.job_title} onChange={e => set('job_title', e.target.value)} />
            <textarea className="inp" placeholder="Bio — tell people who you are" value={form.bio} onChange={e => set('bio', e.target.value)} rows={3} style={{ resize: 'vertical' }} />
          </Section>

          <Section label="Identity & Location">
            <div style={{ display: 'flex', gap: '8px' }}>
              <select className="inp" style={half} value={form.pronouns} onChange={e => set('pronouns', e.target.value)}>
                <option value="">Pronouns</option>
                {PRONOUNS_OPTS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input className="inp" style={half} placeholder="Location (e.g. Mumbai, India)" value={form.location} onChange={e => set('location', e.target.value)} />
            </div>
            <input className="inp" placeholder="Timezone (e.g. IST / GMT+5:30)" value={form.timezone} onChange={e => set('timezone', e.target.value)} />
          </Section>

          <Section label="Experience & Education">
            <div style={{ display: 'flex', gap: '8px' }}>
              <input className="inp" style={half} placeholder="Years of experience" value={form.years_exp} onChange={e => set('years_exp', e.target.value)} />
              <input className="inp" style={half} placeholder="College / University" value={form.college} onChange={e => set('college', e.target.value)} />
            </div>
            <input className="inp" placeholder="Hourly rate (e.g. $50–100/hr)" value={form.hourly_rate} onChange={e => set('hourly_rate', e.target.value)} />
            <textarea className="inp" placeholder="Looking for… (e.g. founding engineer roles, AI freelance projects)" value={form.looking_for} onChange={e => set('looking_for', e.target.value)} rows={2} style={{ resize: 'vertical' }} />
          </Section>

          <Section label="Work Preferences">
            <div style={{ display: 'flex', gap: '8px' }}>
              <select className="inp" style={half} value={form.work_pref} onChange={e => set('work_pref', e.target.value)}>
                <option value="">Work preference</option>
                {WORK_PREFS.map(w => <option key={w} value={w}>{w.charAt(0).toUpperCase() + w.slice(1)}</option>)}
              </select>
              <select className="inp" style={half} value={form.availability} onChange={e => set('availability', e.target.value)}>
                <option value="">Availability</option>
                {AVAILABILITY_OPTS.map(a => <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>)}
              </select>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#888', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.open_to_work} onChange={e => set('open_to_work', e.target.checked)} />
              Open to work / opportunities
            </label>
          </Section>

          <Section label="Skills">
            <div style={{ display: 'flex', gap: '8px' }}>
              <input className="inp" placeholder="Add a skill, press Enter" value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
              />
              <button type="button" className="btn-primary" onClick={addSkill}>Add</button>
            </div>
            {form.skills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {form.skills.map(s => (
                  <span key={s} className="vtag" style={{ cursor: 'pointer' }} onClick={() => set('skills', form.skills.filter(x => x !== s))}>
                    {s} ✕
                  </span>
                ))}
              </div>
            )}
          </Section>

          <Section label="Links & Socials">
            <input className="inp" placeholder="GitHub URL" value={form.github_url} onChange={e => set('github_url', e.target.value)} />
            <input className="inp" placeholder="Portfolio URL" value={form.portfolio_url} onChange={e => set('portfolio_url', e.target.value)} />
            <input className="inp" placeholder="Personal website URL" value={form.website_url} onChange={e => set('website_url', e.target.value)} />
            <input className="inp" placeholder="LinkedIn URL" value={form.linkedin_url} onChange={e => set('linkedin_url', e.target.value)} />
            <input className="inp" placeholder="X / Twitter URL" value={form.twitter_url} onChange={e => set('twitter_url', e.target.value)} />
            <input className="inp" placeholder="Discord handle (e.g. username#1234)" value={form.discord_handle} onChange={e => set('discord_handle', e.target.value)} />
          </Section>

          {error && <div style={{ color: '#ff6b6b', fontSize: '13px' }}>{error}</div>}
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
      {children}
    </div>
  )
}
