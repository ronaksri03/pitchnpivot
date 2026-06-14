'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';

const C = {
  obsidian: '#0a0a0a', slate: '#1a1a1a', charcoal: '#2d2d2d',
  filmLight: '#f0ece4', lime: '#c8ff00', magenta: '#ff006e',
  cyan: '#00f5ff', gray: '#888', border: '#2a2a2a',
};

export const EnhancedProfile = ({ individual, manager }: { individual: any; manager?: any }) => {
  const [activeTab, setActiveTab] = useState('projects');

  return (
    <div style={{ background: C.obsidian, color: C.filmLight, minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>

      {/* HERO */}
      <section style={{ position: 'relative', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0a0a0a 0%, #0d1500 50%, #0a0a0a 100%)' }} />

        {/* Film strip top */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 32, background: C.slate, display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', zIndex: 10, overflow: 'hidden' }}>
          {Array.from({ length: 30 }).map((_, i) => <div key={i} style={{ width: 20, height: 14, borderRadius: 3, background: C.obsidian, flexShrink: 0 }} />)}
        </div>
        {/* Film strip bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 32, background: C.slate, display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', zIndex: 10, overflow: 'hidden' }}>
          {Array.from({ length: 30 }).map((_, i) => <div key={i} style={{ width: 20, height: 14, borderRadius: 3, background: C.obsidian, flexShrink: 0 }} />)}
        </div>

        <div style={{ position: 'absolute', inset: 0 }}>
          <iframe src={individual.introVideoUrl} style={{ width: '100%', height: '100%', border: 'none', opacity: 0.4 }} allow="autoplay" allowFullScreen />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, #0a0a0a 100%)' }} />
        </div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
          style={{ position: 'relative', zIndex: 5, textAlign: 'center', padding: '0 24px', maxWidth: 800 }}>
          <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.lime, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 16 }}>VIDEO CV</div>
          <h1 style={{ fontSize: 'clamp(40px, 8vw, 80px)', fontFamily: 'monospace', fontWeight: 700, margin: '0 0 12px', letterSpacing: '-0.02em', lineHeight: 1 }}>{individual.name}</h1>
          <p style={{ fontSize: 20, color: C.gray, margin: '0 0 32px' }}>{individual.jobTitle}</p>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: 50, padding: '12px 28px', backdropFilter: 'blur(10px)', marginBottom: 24, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: C.gray }}>📍 {individual.location}</span>
            <span style={{ fontSize: 13, color: C.gray }}>⏱ {individual.yearsExp} yrs exp</span>
            <span style={{ fontSize: 13, color: C.lime, fontWeight: 700 }}>💰 ${individual.hourlyRate}/hr</span>
            <span style={{ fontSize: 13, color: C.gray }}>📅 {individual.availability}</span>
          </div>
          {manager && (
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button style={{ background: C.lime, color: C.obsidian, border: 'none', borderRadius: 8, padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>💬 Message</button>
              <button style={{ background: 'transparent', color: C.filmLight, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>📄 Download CV</button>
            </div>
          )}
        </motion.div>

        <div style={{ position: 'absolute', bottom: 48, left: 40, zIndex: 5, display: 'flex', gap: 32 }}>
          {[{ label: 'Projects', value: individual.projectsCompleted }, { label: 'Profile Views', value: individual.profileViews }].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'monospace', color: C.lime }}>{s.value}</div>
              <div style={{ fontSize: 11, color: C.gray, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* BODY */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px' }}>

        {/* Skills */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.lime, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Stack</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {individual.skills.map((skill: string, i: number) => (
              <span key={i} style={{ background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.25)', color: C.lime, borderRadius: 6, padding: '6px 14px', fontSize: 13, fontWeight: 600 }}>{skill}</span>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 32, background: C.slate, border: `1px solid ${C.border}`, borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {['projects', 'reels', 'about'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: activeTab === tab ? C.obsidian : 'transparent', color: activeTab === tab ? C.filmLight : C.gray, border: 'none', borderRadius: 8, padding: '8px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>{tab}</button>
          ))}
        </div>

        {/* Projects */}
        {activeTab === 'projects' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {[{ title: 'E-Commerce Platform', desc: 'Full-stack Next.js with Stripe integration and real-time inventory.', tags: ['Next.js', 'Stripe', 'PostgreSQL'], status: 'Live' },
              { title: 'AI Dashboard', desc: 'Analytics with ML-powered insights and D3 visualizations.', tags: ['React', 'Python', 'D3.js'], status: 'Live' },
              { title: 'Mobile Banking App', desc: 'React Native with biometric auth and real-time transactions.', tags: ['React Native', 'Node.js', 'AWS'], status: 'In Progress' }
            ].map((p, i) => (
              <motion.div key={i} whileHover={{ y: -4, borderColor: C.lime }} style={{ background: C.slate, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, cursor: 'pointer', transition: 'border-color 0.2s, transform 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{p.title}</div>
                  <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: p.status === 'Live' ? 'rgba(200,255,0,0.1)' : 'rgba(100,150,255,0.1)', border: `1px solid ${p.status === 'Live' ? 'rgba(200,255,0,0.3)' : 'rgba(100,150,255,0.3)'}`, color: p.status === 'Live' ? C.lime : '#7090ff', fontWeight: 700, textTransform: 'uppercase' }}>{p.status}</span>
                </div>
                <p style={{ fontSize: 13, color: C.gray, lineHeight: 1.6, margin: '0 0 14px' }}>{p.desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {p.tags.map(t => <span key={t} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.gray }}>{t}</span>)}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Reels */}
        {activeTab === 'reels' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {[{ title: 'Building a Real-Time Chat', duration: '4:32', views: 1240 },
              { title: 'AWS Lambda + Next.js', duration: '6:15', views: 890 },
              { title: 'PostgreSQL Query Optimization', duration: '3:48', views: 2100 }
            ].map((r, i) => (
              <motion.div key={i} whileHover={{ y: -3 }} style={{ background: C.slate, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}>
                <div style={{ height: 130, background: 'linear-gradient(135deg, #0a0a0a, #0d1500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: C.lime, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: C.obsidian, fontSize: 18, marginLeft: 3 }}>▶</span>
                  </div>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{r.title}</div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: C.gray }}>
                    <span>⏱ {r.duration}</span><span>👁 {r.views.toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* About */}
        {activeTab === 'about' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            <div style={{ background: C.slate, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28 }}>
              <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.gray, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>Bio</div>
              <p style={{ fontSize: 15, lineHeight: 1.75, color: '#bbb', margin: 0 }}>{individual.bio}</p>
            </div>
            <div style={{ background: 'rgba(200,255,0,0.04)', border: '1px solid rgba(200,255,0,0.15)', borderRadius: 14, padding: 28 }}>
              <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.lime, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>Looking For</div>
              <p style={{ fontSize: 15, lineHeight: 1.75, color: '#ccc', margin: 0 }}>{individual.lookingFor}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedProfile;
