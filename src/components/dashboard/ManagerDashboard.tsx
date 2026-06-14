'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';

const C = { obsidian: '#0a0a0a', slate: '#1a1a1a', filmLight: '#f0ece4', lime: '#c8ff00', magenta: '#ff006e', gray: '#888', border: '#2a2a2a', charcoal: '#2d2d2d' };

const PROJECTS = [
  { id: 1, title: 'Senior React Developer', status: 'open', submissions: 12, budget: '$120/hr', deadline: '2 weeks', skills: ['React', 'TypeScript', 'GraphQL'] },
  { id: 2, title: 'ML Engineer (Computer Vision)', status: 'open', submissions: 7, budget: '$140/hr', deadline: '1 month', skills: ['Python', 'PyTorch', 'OpenCV'] },
  { id: 3, title: 'Product Designer', status: 'closed', submissions: 24, budget: '$90/hr', deadline: 'Filled', skills: ['Figma', 'Design Systems', 'UX Research'] },
];

const SUBMISSIONS = [
  { id: 1, projectId: 1, name: 'Priya Sharma', role: 'Full Stack Engineer', status: 'pending', date: '2 days ago', rate: '$85/hr' },
  { id: 2, projectId: 1, name: 'Alex Torres', role: 'Frontend Developer', status: 'accepted', date: '3 days ago', rate: '$95/hr' },
  { id: 3, projectId: 2, name: 'Marcus Chen', role: 'ML Engineer', status: 'pending', date: '1 day ago', rate: '$110/hr' },
];

export const ManagerDashboard = ({ manager }: { manager: any }) => {
  const [expanded, setExpanded] = useState<any>(null);

  const statuses: Record<string, { bg: string; color: string; label: string }> = {
    pending: { bg: 'rgba(255,200,0,0.1)', color: '#ffc800', label: '⏳ Pending' },
    accepted: { bg: 'rgba(200,255,0,0.1)', color: C.lime, label: '✓ Accepted' },
    rejected: { bg: 'rgba(255,100,100,0.1)', color: '#ff6b6b', label: '✕ Rejected' },
  };

  return (
    <div style={{ background: C.obsidian, minHeight: '100vh', color: C.filmLight, fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '32px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.lime, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>Manager Dashboard</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 4px', fontFamily: 'monospace' }}>{manager.company}</h1>
          <div style={{ fontSize: 14, color: C.gray }}>{manager.role}</div>
        </div>
        <button style={{ background: C.lime, color: C.obsidian, border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>+ Post Project</button>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, padding: '28px 40px', borderBottom: `1px solid ${C.border}` }}>
        {[
          { label: 'Active Projects', value: 2, color: C.lime },
          { label: 'Total Submissions', value: 43, color: C.filmLight },
          { label: 'Pending Review', value: 13, color: '#ffc800' },
          { label: 'Accepted', value: 8, color: C.lime },
        ].map(s => (
          <div key={s.label} style={{ background: C.slate, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 24px' }}>
            <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'monospace', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Projects */}
      <div style={{ padding: '28px 40px' }}>
        <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.gray, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>My Projects ({PROJECTS.length})</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {PROJECTS.map(p => {
            const subs = SUBMISSIONS.filter(s => s.projectId === p.id);
            const isOpen = expanded === p.id;

            return (
              <div key={p.id} style={{ background: C.slate, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{p.title}</div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: C.gray, marginBottom: 10, flexWrap: 'wrap' }}>
                      <span>💰 {p.budget}</span>
                      <span>⏱ {p.deadline}</span>
                      <span style={{ color: p.status === 'open' ? C.lime : C.gray }}>● {p.status === 'open' ? 'Open' : 'Closed'}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {p.skills.map(s => <span key={s} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.15)', color: C.lime }}>{s}</span>)}
                    </div>
                  </div>
                  <button onClick={() => setExpanded(isOpen ? null : p.id)}
                    style={{ background: 'none', border: 'none', color: subs.length > 0 ? C.lime : C.gray, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    {subs.length} submissions {isOpen ? '▲' : '▼'}
                  </button>
                </div>

                {isOpen && subs.length > 0 && (
                  <div style={{ borderTop: `1px solid ${C.border}`, padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {subs.map(s => (
                      <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: C.obsidian, borderRadius: 10, gap: 12, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{s.name}</div>
                          <div style={{ fontSize: 12, color: C.gray }}>{s.role} · {s.rate} · {s.date}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: statuses[s.status].bg, color: statuses[s.status].color, fontWeight: 700 }}>
                            {statuses[s.status].label}
                          </span>
                          {s.status === 'pending' && (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button style={{ background: 'rgba(200,255,0,0.1)', border: '1px solid rgba(200,255,0,0.3)', color: C.lime, borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Accept</button>
                              <button style={{ background: 'rgba(255,100,100,0.08)', border: '1px solid rgba(255,100,100,0.25)', color: '#ff6b6b', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Reject</button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
