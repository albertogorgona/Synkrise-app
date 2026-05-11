'use client'

import type { SortConfig } from '@/hooks/useSortableTable'

export function SortIcon({ column, config }: { column: string; config: SortConfig }) {
  if (config.key !== column || config.direction === null) {
    return <span style={{ color: '#CBD5E1', marginLeft: 4, fontSize: 11 }}>↕</span>
  }
  return (
    <span style={{ color: '#1A6FC4', marginLeft: 4, fontSize: 11, transition: 'all 0.15s' }}>
      {config.direction === 'asc' ? '↑' : '↓'}
    </span>
  )
}
