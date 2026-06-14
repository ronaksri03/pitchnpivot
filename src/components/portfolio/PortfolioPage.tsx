'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';

const C = { obsidian: '#0a0a0a', slate: '#1a1a1a', filmLight: '#f0ece4', lime: '#c8ff00', gray: '#888', border: '#2a2a2a', charcoal: '#2d2d2d' };

const PROJECTS = [
  { id: 1, title: 'E-Commerce Platform', category: 'Web', desc: 'Full-stack Next.js shop with Stripe, real-time inventory, and 99.9% uptime serving 10k+ users.', skills: ['Next.js', 'Stripe', 'PostgreSQL', 'Redis'], emoji: '🛒', impact: '$2.4M revenue processed', views: 1240, saves: 89 },
  { id: 2, title: 'AI Analytics Dashboard', category: 'AI/ML', desc: 'ML-powered dashboard with predictive insights, D3 visualizations, and real-time data streaming.', skills: ['React', 'Python', 'TensorFlow', 'D3.js'], emoji: '🤖', impact: '40% reduction in decision time', views: 2100, saves: 156 },
  { id: 3, title: 'Mobile Banking App', category: 'Mobile', desc: 'React Native app with biometric auth, real-time transactions, and sub-100ms response times.', skills: ['React Native', 'Node.js', 'AWS', 'Plaid'], emoji: '📱', impact: '50k active users', views: 890, saves: 67 },
  { id: 4, title: 'Design System', category: 'Design', desc: 'Comprehensive design system with 200+ components, dark/light modes, and WCAG AA compliance.', skills: ['Figma', 'React', 'Storybook', 'TypeScript'], emoji: '🎨', impact: '60% faster design cycles', views: 3200, saves: 210 },
];

const CATEGORIES = ['All', 'Web', 'Mobile', 'Design', 'AI/ML'];

export const PortfolioPage = () => {
  const [cat, setCat] = useState('All');
  const [selected, setSelected] = useState<any>(null);

  const filtered = PROJECTS.filter(p => cat === 'All' || p.category === cat);

  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', color: C.filmLight, fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '40px 40px 32px' }}>
        <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.lime, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 8 }}>Portfolio</div>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontFamily: 'monospace', fontWeight: 700, margin: '0 0 24px' }}>Selected Work</h1>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 40, marginBottom: 28, flexWrap: 'wrap' }}>
          {[{ label: 'Projects', value: '12' }, { label: 'Clients', value: '8' }, { label: 'Years', value: '4' }].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'monospace', color: C.lime }}>{s.value}</div>
              <div style={{ fontSize: 11, color: C.gray, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{ background: cat === c ? C.lime : 'transparent', color: cat === c ? C.obsidian : C.gray, border: `1px solid ${cat === c ? C.lime : C.border}`, borderRadius: 20, padding: '6px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>{c}</button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding: '32px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {filtered.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              onClick={() => setSelected(p)}
              whileHover={{ y: -6 }}
              style={{ background: C.slate, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.2s' }}>
              <div style={{ height: 160, background: 'linear-gradient(135deg, #0a0a0a, #0d1500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60 }}>{p.emoji}</div>
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{p.title}</div>
                  <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', color: C.lime, fontWeight: 700 }}>{p.category}</span>
                </div>
                <p style={{ fontSize: 13, color: C.gray, lineHeight: 1.6, margin: '0 0 14px' }}>{p.desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                  {p.skills.slice(0, 3).map(s => <span key={s} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.gray }}>{s}</span>)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.charcoal }}>
                  <span>👁 {p.views}</span><span>🔖 {p.saves}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={e => e.stopPropagation()}
            style={{ background: C.slate, border: `1px solid ${C.border}`, borderRadius: 20, width: '100%', maxWidth: 600, overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ height: 200, background: 'linear-gradient(135deg, #0a0a0a, #0d1500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>{selected.emoji}</div>
            <div style={{ padding: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{selected.title}</h2>
                <button onClick={() => setSelected(null)} style={{ background: C.charcoal, border: 'none', color: C.gray, width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 16 }}>✕</button>
              </div>
              <p style={{ fontSize: 15, color: C.gray, lineHeight: 1.7, marginBottom: 20 }}>{selected.desc}</p>
              <div style={{ background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.15)', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: C.lime, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Impact</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{selected.impact}</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {selected.skills.map((s: string) => <span key={s} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', color: C.lime }}>{s}</span>)}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PortfolioPage;
