import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = 'https://vzwnptawdkjyiaeefoxd.supabase.co'
const supabaseAnonKey = 'sb_publishable_bK65tyHj1NDejK5Wtu-OBQ_yxdoch9-'

// Browser client — use in Client Components
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Singleton for client-side use
let _client: ReturnType<typeof createClient> | null = null
export function getClient() {
  if (!_client) _client = createClient()
  return _client
}
