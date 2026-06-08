'use client'

import { useEffect, useState } from 'react'
import { getClient } from '@/lib/supabase'

export default function DebugViewsPage() {
  const [log, setLog] = useState<string[]>([])
  const sb = getClient()

  function line(msg: string) {
    setLog(prev => [...prev, msg])
  }

  useEffect(() => {
    run()
  }, [])

  async function run() {
    line('=== Profile Views Debug ===')

    // 1. Get current user
    const { data: { user }, error: userErr } = await sb.auth.getUser()
    if (userErr || !user) {
      line('❌ Not logged in: ' + (userErr?.message || 'no user'))
      return
    }
    line('✅ Logged in as: ' + user.email)
    line('   user.id: ' + user.id)
    line('   account_type (metadata): ' + (user.user_metadata?.account_type || 'NOT SET'))

    // 2. Check managers table for this user
    const { data: managerRow, error: mgrErr } = await sb
      .from('managers').select('id, name, company').eq('id', user.id).maybeSingle()
    if (mgrErr) line('❌ managers table read error: ' + mgrErr.message + ' [' + mgrErr.code + ']')
    else if (managerRow) line('✅ Found in managers table: ' + JSON.stringify(managerRow))
    else line('⚠️  NOT found in managers table')

    // 3. Pick a target profile to test against
    const { data: profiles, error: profErr } = await sb
      .from('profiles').select('id, first_name, last_name').limit(1)
    if (profErr || !profiles?.length) {
      line('❌ Could not fetch a profile to test against: ' + (profErr?.message || 'no profiles'))
      return
    }
    const target = profiles[0]
    line('📋 Test target profile: ' + target.id + ' (' + [target.first_name, target.last_name].join(' ').trim() + ')')

    // 4. Try the insert
    line('⏳ Attempting profile_views insert...')
    const { data: inserted, error: insertErr } = await sb
      .from('profile_views')
      .insert({ profile_user_id: target.id, manager_id: user.id, viewed_at: new Date().toISOString() })
      .select()
    if (insertErr) {
      line('❌ INSERT FAILED: ' + insertErr.message)
      line('   code: ' + insertErr.code)
      line('   details: ' + insertErr.details)
      line('   hint: ' + insertErr.hint)
    } else {
      line('✅ INSERT SUCCEEDED: ' + JSON.stringify(inserted))
    }

    // 5. Try to read back
    const { data: views, error: viewsErr } = await sb
      .from('profile_views').select('*').eq('profile_user_id', target.id).limit(5)
    if (viewsErr) line('❌ SELECT failed: ' + viewsErr.message)
    else line('📊 Rows in profile_views for this profile: ' + views?.length)

    line('=== Done ===')
  }

  return (
    <div style={{ padding: '40px 24px', maxWidth: '700px', margin: '0 auto' }}>
      <h2 style={{ color: '#c8ff00', marginBottom: '20px', fontFamily: 'monospace' }}>profile_views debug</h2>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: '10px', padding: '20px', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.8' }}>
        {log.length === 0
          ? <span style={{ color: '#555' }}>Running…</span>
          : log.map((l, i) => (
            <div key={i} style={{
              color: l.startsWith('✅') ? '#c8ff00' : l.startsWith('❌') ? '#ff6b6b' : l.startsWith('⚠️') ? '#ffaa00' : '#ccc'
            }}>{l}</div>
          ))
        }
      </div>
      <p style={{ color: '#555', fontSize: '12px', marginTop: '12px' }}>
        Share the output above to diagnose the issue.
      </p>
    </div>
  )
}
