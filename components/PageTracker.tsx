'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export function PageTracker() {
  const pathname = usePathname()

  useEffect(() => {
    let cancelled = false

    const track = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || cancelled) return

      await Promise.all([
        supabase.from('page_views').insert({ page: pathname, user_id: user.id }),
        supabase.rpc('update_last_seen'),
      ])
    }

    void track()
    return () => {
      cancelled = true
    }
  }, [pathname])

  return null
}
