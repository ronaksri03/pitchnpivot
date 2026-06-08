'use client'

import { useEffect, useState } from 'react'
import { getClient } from '@/lib/supabase'

export default function DebugViewsPage() {
  const [log, setLog] = useState<string[]>([])
  const sb = getClient()

  function line(msg: string) { setLog(prev => [...prev, msg]) }

  useEffect(() => { run() }, [])

  async function run() {
    line('=== Profile Views Debug v2 ===')

    const { data: { user } } = await sb.auth.getUser()
    if (!user) { line('❌ Not logged in'); return }
    line('✅ user: ' + user.email + ' / ' + user.id)
    line('   account_type: ' + user.user_metadata?.account_type)

    // All rows in profile_views
    const { data: allViews, error: allErr } = await sb
      .from('profile_views').select('*').order('viewed_at', { ascending: false }).limit(20)
    if (allErr) line('❌ profile_views SELECT error: ' + allErr.message + ' [' + allErr.code + ']')
    else {
      line('📊 Total rows in profile_views visible to this user: ' + (allViews?.length ?? 0))
      allViews?.forEach(v => line('   row: profile_user_id=' + v.profile_user_id + ' manager_id=' + v.manager_id + ' at=' + v.viewed_at))
    }

    // All profiles
    const { data: profiles, error: profErr } = await sb
      .from('profiles').select('id, first_name, last_name, username').limit(10)
    if (profErr) line('❌ profiles error: ' + profErr.message)
    else {
      line('👤 Profiles in DB: ' + (profiles?.length ?? 0))
      profiles?.forEach(p => line('   ' + p.id + ' — ' + [p.first_name, p.last_name].join(' ').trim() + ' (@' + p.username + ')'))
    }

    // Try insert for a real individual (not manager)
    const individuals = profiles?.filter(p => p.id !== user.id) ?? []
    if (individuals.length === 0) {
      line('⚠️  No other profiles found — only the manager\'s own profile exists')
      line('   This means no individuals have signed up yet!')
    } else {
      const target = individuals[0]
      line('📋 Testing insert for individual: ' + target.id)
      const { error: insertErr } = await sb.from('profile_views').insert({
        profile_user_id: target.id,
        manager_id: user.id,
        viewed_at: new Date().toISOString(),
      })
      if (insertErr) line('❌ INSERT failed: ' + insertErr.message + ' [' + insertErr.code + ']')
      else line('✅ INSERT succeeded for individual profile')

      // Read back as if we were the individual
      const { data: readBack, error: readErr } = await sb
        .from('profile_views').select('*').eq('profile_user_id', target.id)
      if (readErr) line('❌ READ BACK failed: ' + readErr.message)
      else line('📊 Rows visible for that individual: ' + (readBack?.length ?? 0))
    }

    line('=== Done ===')
  }

  return (
    <div style={{ padding: '40px 24px', maxWidth: '700px', margin: '0 auto' }}>
      <h2 style={{ color: '#c8ff00', marginBottom: '20px', fontFamily: 'monospace' }}>debug-views v2</h2>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: '10px', padding: '20px', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.8' }}>
        {log.length === 0
          ? <span style={{ color: '#555' }}>Running…</span>
          : log.map((l, i) => (
            <div key={i} style={{ color: l.startsWith('✅') ? '#c8ff00' : l.startsWith('❌') ? '#ff6b6b' : l.startsWith('⚠️') ? '#ffaa00' : '#ccc' }}>{l}</div>
          ))}
      </div>
    </div>
  )
}
