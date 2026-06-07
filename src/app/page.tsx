'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useEffect } from 'react'
import { COMMUNITY_NAMES, COMMUNITY_EMOJI } from '@/lib/communities'

const COMMUNITIES = Object.keys(COMMUNITY_NAMES)

export default function HomePage() {
  const { user, accountType, loading } = useAuth()
  const router = useRouter()

  // Auto-route returning users
  useEffect(() => {
    if (!loading && user) {
      if (accountType === 'manager') router.replace('/dashboard')
      else router.replace('/profile')
    }
  }, [loading, user, accountType, router])

  if (loading) return null

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Hero */}
      <section style={{
        padding: '80px 24px 60px',
        maxWidth: '900px', margin: '0 auto', width: '100%',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-block', fontSize: '11px', fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: '#c8ff00', marginBottom: '20px',
          padding: '4px 14px', border: '1px solid rgba(200,255,0,0.3)',
          borderRadius: '20px',
        }}>
          Gen Z professional network ✦
        </div>
        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 72px)',
          fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em',
          color: '#f0ece4', margin: '0 0 20px',
        }}>
          CVs &amp; Resumes<br />
          <span style={{ color: '#c8ff00' }}>DON&apos;T GO VIRAL.</span><br />
          YOU DO.
        </h1>
        <p style={{ fontSize: '16px', color: '#666', lineHeight: 1.7, maxWidth: '520px', margin: '0 auto 36px' }}>
          Post a reel. Get discovered. Land real projects — not just job listings.
          Built for builders, designers, founders, and creators.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/auth" style={{
            background: '#c8ff00', color: '#0a0a0a',
            padding: '13px 28px', borderRadius: '10px',
            fontWeight: 800, fontSize: '14px', textDecoration: 'none',
          }}>
            Start for free →
          </Link>
          <Link href="/discover" style={{
            background: 'rgba(255,255,255,0.05)', color: '#f0ece4',
            border: '1px solid #2a2a2a',
            padding: '13px 28px', borderRadius: '10px',
            fontWeight: 600, fontSize: '14px', textDecoration: 'none',
          }}>
            Browse talent
          </Link>
        </div>
      </section>

      {/* 4-box quick nav */}
      <section style={{ padding: '0 24px 40px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'r