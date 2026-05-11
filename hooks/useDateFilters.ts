'use client'

import { useState, useEffect, useCallback } from 'react'
import type { DateFilters } from '@/lib/types'

const SESSION_KEY = 'synkrise_date_filters'

export function useDateFilters(): [DateFilters, (f: DateFilters) => void] {
  const [filters, setFilters] = useState<DateFilters>({ year: null, month: null, day: null })

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY)
      if (saved) setFilters(JSON.parse(saved) as DateFilters)
    } catch {
      // ignore parse errors
    }
  }, [])

  const update = useCallback((f: DateFilters) => {
    setFilters(f)
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(f))
    } catch {
      // ignore storage errors
    }
  }, [])

  return [filters, update]
}
