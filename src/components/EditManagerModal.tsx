'use client'

import { useState } from 'react'
import { getClient } from '@/lib/supabase'
import { Manager } from '@/types'

interface Props {
  manager: Manager
  onClose: () => void
  onSaved: (m: Manager) => void
}

const COMPANY_SIZES = [
  { value: 'solo', label: 'Solo / Freelancer' },
  { value: 'startup', label: 'Startup (2–20)' },
  { value: 'smb', label: 'SMB (21–200)' },
  { value: 'enterprise', label: 'Enterprise (200+)' },
]

const INDUSTRY_OPTIONS = [
  'SaaS', 'Fintech', 'Gaming', 'Agency', 'E-commerce', 'HealthTech',
  'EdTech', 'Web3 / Crypto', 'AI / ML', 'Media', 'Marketing',
  'Dev Tools', 'Mobile Apps', 'Design Studio', 'Consulting', 'Other',
]

const inp = {
  width: '100%', padding: '11px 14px', background: '#111', border: '1px solid #2a2a2a',
  borderRadius: '8px', color: '#f0ece4', fontSize: '14px', outline: 'none',
  boxSizing: 'border-box' as const,
}
const lbl = {
  fontSize: '12px', fontWeight: 600, color: '#666', letterSpacing: '0.05em',
  marginBottom: '5px', display: 'block',
}

export default function EditManagerModal({ manager, onClose, onSaved }: Props) {
  const [name, setName] = useState(manager.name || '')
  const [role, setRole] = useState(manager.role || '')
  const [company, setCompany] = useState(manager.company || '')
  const [companyDesc, setCompanyDesc] = useState(manager.company_description || '')
  const [companySize, setCompanySize] = useState(manager.company_size || '')
  const [industries, setIndustries] = useState<string[]>(manager.industries || [])
  const [location, setLocation] = useState(manager.location || '')
  const [websiteUrl, setWebsiteUrl] = useState(manager.website_url || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const sb = getClient()

  function toggleIndustry(ind: string) {
    setIndustries(prev => prev.includes(ind) ? prev.filter((x: string) => x !== ind) : [...prev, ind])
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    const { data, error: err } = await sb
      .from('managers')
      .update({
        name,
        role: role || null,
        company: company || null,
        company_description: companyDesc || null,
        company_size: companySize || null,
        industries,
        location: location || null,
        website_url: websiteUrl || null,
      })
      .eq('id', manager.id)
      .select()
      .single()
    setSaving(false)
    if (err) { setError(err.message); return }
    onSaved(data as Manager)
    onClose()
  }

  return (
    <div
      onClick={(e: React.MouseEvent) => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '24px' }}
    >
      <div style={{ background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '16px', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '26px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#c8ff00', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '3px' }}>Manager Profile</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#f0ece4' }}>Edit your profile</div>
          </div>
          <button onClick={onClose} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px' }}>X</button>
        </div>

        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={lbl}>Your name *</label>
              <input style={inp} placeholder="Alex Chen" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <label style={lbl}>Your role</label>
              <input style={inp} placeholder="Founder, CTO, Hiring Manager" value={role} onChange={e => setRole(e.target.value)} />
            </div>
          </div>

          <div>
            <label style={lbl}>Company / Org name</label>
            <input style={inp} placeholder="Acme Inc." value={company} onChange={e => setCompany(e.target.value)} />
          </div>

          <div>
            <label style={lbl}>Company description <span style={{ color: '#444', fontWeight: 400 }}>one-liner</span></label>
            <input style={inp} placeholder="We build AI tools for indie developers." value={companyDesc} onChange={e => setCompanyDesc(e.target.value)} maxLength={120} />
            <div style={{ fontSize: '11px', color: '#3a3a3a', marginTop: '4px', textAlign: 'right' }}>{companyDesc.length}/120</div>
          </div>

          <div>
            <label style={lbl}>Company size</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {COMPANY_SIZES.map(s => (
                <button
                  key={s.value} type="button"
                  onClick={() => setCompanySize(s.value === companySize ? '' : s.value)}
                  style={{
                    padding: '7px 14px', borderRadius: '8px', border: '1px solid', cursor: 'pointer',
                    fontSize: '12px', fontWeight: 600,
                    background: companySize === s.value ? 'rgba(200,255,0,0.1)' : '#111',
                    borderColor: companySize === s.value ? 'rgba(200,255,0,0.4)' : '#2a2a2a',
                    color: companySize === s.value ? '#c8ff00' : '#888',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={lbl}>Industries <span style={{ color: '#444', fontWeight: 400 }}>pick all that apply</span></label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {INDUSTRY_OPTIONS.map(ind => (
                <button
                  key={ind} type="button"
                  onClick={() => toggleIndustry(ind)}
                  style={{
                    padding: '5px 12px', borderRadius: '20px', border: '1px solid', cursor: 'pointer',
                    fontSize: '12px', fontWeight: 600,
                    background: industries.includes(ind) ? 'rgba(200,255,0,0.1)' : '#111',
                    borderColor: industries.includes(ind) ? 'rgba(200,255,0,0.35)' : '#2a2a2a',
                    color: industries.includes(ind) ? '#c8ff00' : '#666',
                  }}
                >
                  {ind}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={lbl}>Location</label>
              <input style={inp} placeholder="San Francisco / Remote" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Website</label>
              <input style={inp} type="url" placeholder="https://yourcompany.com" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} />
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(255,100,100,0.08)', border: '1px solid rgba(255,100,100,0.2)', borderRadius: '8px', padding: '10px 14px', color: '#ff6b6b', fontSize: '13px' }}>
              {error}
            </div>
          )}

          <button
            type="submit" disabled={saving}
            style={{
              padding: '13px', background: saving ? '#1a1a1a' : '#c8ff00',
              color: saving ? '#555' : '#0a0a0a', border: 'none', borderRadius: '10px',
              fontSize: '15px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', marginTop: '4px',
            }}
          >
            {saving ? 'Saving...' : 'Save profile ->'}
          </button>
        </form>
      </div>
    </div>
  )
}
