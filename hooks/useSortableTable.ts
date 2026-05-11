'use client'

import { useState, useMemo } from 'react'

export type SortDirection = 'asc' | 'desc' | null

export interface SortConfig {
  key: string
  direction: SortDirection
}

export function useSortableTable<T extends Record<string, unknown>>(data: T[]) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: null })

  const requestSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: 'asc' }
      if (prev.direction === 'asc') return { key, direction: 'desc' }
      return { key: '', direction: null }
    })
  }

  const sortedData = useMemo(() => {
    if (!sortConfig.direction || !sortConfig.key) return data
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key]
      const bVal = b[sortConfig.key]
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal
      }
      const cmp = String(aVal).localeCompare(String(bVal), 'es')
      return sortConfig.direction === 'asc' ? cmp : -cmp
    })
  }, [data, sortConfig])

  return { sortedData, sortConfig, requestSort }
}
