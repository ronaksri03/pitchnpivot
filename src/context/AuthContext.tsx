'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { getClient } from '@/lib/supabase'
import { AccountType } from '@/types'

interface AuthContextValue {
  user: User | null
  accountType: AccountType | null
  displayName: string
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  accountType: null,
  displayName: '',
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const sb = getClient()

  useEffect(() => {
    sb.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const accountType: AccountType | null = user
    ? (user.user_metadata?.account_type === 'manager' ? 'manager' : 'individual')
    : null

  const displayName = user
    ? (user.user_metadata?.first_name || user.user_metadata?.name || user.email?.split('@')[0] || 'You')
    : ''

  const signOut = async () => {
    await sb.auth.signOut()
    setUser(null)
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider value={{ user, accountType, displayName, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
