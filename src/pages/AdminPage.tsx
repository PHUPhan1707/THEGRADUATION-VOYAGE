import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { isSupabaseConfigured, STORAGE_KEYS } from '../lib/storage'
import AdminDashboard from '../components/admin/AdminDashboard'
import AdminLogin from '../components/admin/AdminLogin'

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setAuthenticated(import.meta.env.DEV && localStorage.getItem(STORAGE_KEYS.adminSession) === 'authenticated')
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthenticated(!!session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy">
        <div className="w-16 h-16 border-4 border-treasure-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!authenticated) {
    return <AdminLogin onLogin={() => setAuthenticated(true)} />
  }

  return <AdminDashboard />
}
