'use client'

import { useEffect, useState } from 'react'
import { getClient } from '@/lib/supabase'

export default function DebugViewsPage() {
  const [log, setLog] = useState<string[]>([])
  const sb = getClient()
  function line(msg: string) { setLog(prev => [...prev, msg]) }

  useEffect(() => { run() }, [])

  async function run() {
    line('=== Profile Views Debug v3 ===')

    const { data: { user } } = await sb.auth.getUser()
    if (!user) { line('❌ Not logged in'); return }
    line('✅ user: ' + user.email + ' / ' + user.id)

    // Test 1: exact query from profile page (with managers join)
    line('')
    line('--- Test 1: with managers join ---')
    const { data: d1, error: e1 } = await sb
      .from('profile_views')
      .select('*, managers(name, company)')
      .eq('profile_user_id', user.id)
      .order('viewed_at', { ascending: false })
      .limit(20)
    if (e1) line('❌ ERROR: ' + e1.message + ' [code:' + e1.code + ']')
    else line('✅ rows returned: ' + d1?.length + ' — ' + JSON.stringify(d1?.[0] ?? null))

    // Test 2: plain select (fallback)
    line('')
    line('--- Test 2: plain select (no join) ---')
    const { data: d2, error: e2 } = await sb
      .from('profile_views')
      .select('*')
      .eq('profile_user_id', user.id)
      .order('viewed_at', { ascending: false })
      .limit(20)
    if (e2) line('❌ ERROR: ' + e2.message + ' [code:' + e2.code + ']')
    else line('✅ rows returned: ' + d2?.length)

    // Test 3: check if FK relationship exists by trying the join differently
    line('')
    line('--- Test 3: check managers table directly ---')
    const { data: d3, error: e3 } = await sb
      .from('managers')
      .select('id, name, company')
      .limit(3)
    if (e3) line('❌ managers SELECT error: ' + e3.message + ' [' + e3.code + ']')
    else line('✅ managers readable: ' + d3?.length + ' rows — ' + JSON.stringify(d3?.[0] ?? null))

    line('')
    line('=== Done ===')
  }

  return (
    <div style={{ padding: '40px 24px', maxWidth: '760px', margin: '0 auto' }}>
      <h2 style={{ color: '#c8ff00', marginBottom: '20px', fontFamily: 'monospace' }}>debug-views v3</h2>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: '10px', padding: '20px', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.8', wordBreak: 'break-all' }}>
        {log.length === 0
          ? <span style={{ color: '#555' }}>Running…</span>
          : log.map((l, i) => (
            <div key={i} style={{ color: l.startsWith('✅') ? '#c8ff00' : l.startsWith('❌') ? '#ff6b6b' : l.startsWith('---') ? '#888' : '#ccc' }}>{l}</div>
          ))}
      </div>
    </div>
  )
}
