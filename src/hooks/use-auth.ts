import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [supabase.auth])

  return { user }
}
