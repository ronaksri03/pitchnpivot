'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const C = { obsidian: '#0a0a0a', slate: '#1a1a1a', filmLight: '#f0ece4', lime: '#c8ff00', magenta: '#ff006e', gray: '#888', border: '#2a2a2a', charcoal: '#2d2d2d' };

const PROFILES = [
  { id: 1, name: 'Priya Sharma', role: 'Full Stack Engineer', location: 'San Francisco, CA', rate: 85, exp: 4, skills: ['React', 'Node.js', 'PostgreSQL', 'AWS'], availability: 'Full-time', emoji: '💻' },
  { id: 2, name: 'Marcus Chen', role: 'ML Engineer', location: 'New York, NY', rate: 110, exp: 6, skills: ['Python', 'TensorFlow', 'PyTorch', 'MLOps'], availability: 'Contract', emoji: '🤖' },
  { id: 3, name: 'Sofia Rodriguez', role: 'UI/UX Designer', location: 'Austin, TX', rate: 75, exp: 3, skills: ['Figma', 'React', 'Design Systems', 'Framer'], availability: 'Part-time', emoji: '🎨' },
  { id: 4, name: 'James Okonkwo', role: 'DevOps Engineer', location: 'Remote', rate: 95, exp: 5, skills: ['Kubernetes', 'AWS', 'Terraform', 'Go'], availability: 'Full-time', emoji: '⚙️' },
];

export const DiscoverPage = () => {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [gone, setGone] = useState<Set<number>>(new Set());

  const current = PROFILES.filter((_, i) => !gone.has(i));

  const swipe = (dir: number) => {
    setDirection(dir);
    setGone(prev => new Set([...prev, PROFILES.findIndex((p) => p.id === current[0]?.id)]));
  };

  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', color: C.filmLight, fontFamily: 'Inter, sans-serif', display: 'flex' }}>

      {/* Main card area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, minHeight: '100vh' }}>
        <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.lime, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 8 }}>Discover Talent</div>
        <h2 style={{ fontSize: 28, fontFamily: 'monospace', fontWeight: 700, margin: '0 0 40px', textAlign: 'center' }}>Find Your Next Hire</h2>

        {/* Card Stack */}
        <div style={{ position: 'relative', width: 380, height: 520 }}>
          {current.length === 0 ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: C.slate, borderRadius: 20, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
              <div style={{ fontSize: 16, color: C.gray }}>You've seen everyone!</div>
              <button onClick={() => setGone(new Set())} style={{ marginTop: 20, background: C.lime, color: C.obsidian, border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, cursor: 'pointer' }}>Start Over</button>
            </div>
          ) : (
            current.slice(0, 3).reverse().map((profile, i, arr) => {
              const isTop = i === arr.length - 1;
              return (
                <motion.div
                  key={profile.id}
                  style={{
                    position: 'absolute', inset: 0,
                    background: C.slate,
                    border: `1px solid ${C.border}`,
                    borderRadius: 20,
                    overflow: 'hidden',
                    cursor: isTop ? 'grab' : 'default',
                    scale: 1 - (arr.length - 1 - i) * 0.04,
                    y: (arr.length - 1 - i) * 10,
                    zIndex: i,
                  }}
                  drag={isTop ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={(_, info) => {
                    if (Math.abs(info.offset.x) > 100) swipe(info.offset.x > 0 ? 1 : -1);
                  }}
                >
                  {/* Card header */}
                  <div style={{ height: 200, background: `linear-gradient(135deg, #0a0a0a, #0d1500)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72 }}>
                    {profile.emoji}
                  </div>

                  {/* Card body */}
                  <div style={{ padding: 24 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{profile.name}</div>
                    <div style={{ fontSize: 14, color: C.gray, marginBottom: 16 }}>{profile.role}</div>

                    <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: C.gray }}>📍 {profile.location}</span>
                      <span style={{ fontSize: 12, color: C.gray }}>⏱ {profile.exp} yrs</span>
                      <span style={{ fontSize: 12, color: C.lime, fontWeight: 700 }}>💰 ${profile.rate}/hr</span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                      {profile.skills.map(s => (
                        <span key={s} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', color: C.lime }}>{s}</span>
                      ))}
                    </div>

                    <span style={{ fontSize: 11, padding: '4px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, color: C.gray }}>{profile.availability}</span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Action buttons */}
        {current.length > 0 && (
          <div style={{ display: 'flex', gap: 16, marginTop: 32 }}>
            <button onClick={() => swipe(-1)} style={{ width: 56, height: 56, borderRadius: '50%', background: C.slate, border: `2px solid ${C.magenta}`, color: C.magenta, fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            <button onClick={() => swipe(1)} style={{ width: 56, height: 56, borderRadius: '50%', background: C.slate, border: `2px solid ${C.lime}`, color: C.lime, fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>♥</button>
            <button style={{ width: 56, height: 56, borderRadius: '50%', background: C.slate, border: `2px solid ${C.gray}`, color: C.gray, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✉</button>
          </div>
        )}

        <div style={{ marginTop: 20, fontSize: 12, color: C.charcoal }}>← Swipe or use buttons →</div>
      </div>

      {/* Sidebar filters */}
      <div style={{ width: 260, background: C.slate, borderLeft: `1px solid ${C.border}`, padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.lime, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>Filters</div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: C.gray, marginBottom: 8 }}>Availability</div>
            {['Full-time', 'Part-time', 'Contract'].map(a => (
              <label key={a} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.filmLight, marginBottom: 8, cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: C.lime }} /> {a}
              </label>
            ))}
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: C.gray, marginBottom: 8 }}>Max Rate: $150/hr</div>
            <input type="range" min={20} max={200} defaultValue={150} style={{ width: '100%', accentColor: C.lime }} />
          </div>

          <div>
            <div style={{ fontSize: 12, color: C.gray, marginBottom: 8 }}>Popular Skills</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['React', 'Python', 'Node.js', 'Figma', 'AWS', 'Go'].map(s => (
                <button key={s} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', color: C.lime, cursor: 'pointer' }}>{s}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscoverPage;
