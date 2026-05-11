'use client'

import { useState, useEffect, useCallback } from 'react'
import { readKpiGoals, writeKpiGoals, type KpiGoals } from '@/lib/kpiHelpers'

export function useKpiGoals(defaults: KpiGoals = {}): [KpiGoals, (key: string, value: number) => void] {
  const [goals, setGoals] = useState<KpiGoals>(defaults)

  useEffect(() => {
    const stored = readKpiGoals()
    setGoals(prev => ({ ...prev, ...stored }))
  }, [])

  const updateGoal = useCallback((key: string, value: number) => {
    setGoals(prev => {
      const next = { ...prev, [key]: value }
      writeKpiGoals(next)
      return next
    })
  }, [])

  return [goals, updateGoal]
}
