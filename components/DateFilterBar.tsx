'use client'

import { useMemo } from 'react'
import type { DateFilters } from '@/lib/types'

const MONTH_SHORT = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

interface DateFilterBarProps {
  dates: string[]         // YYYY-MM-DD strings from module data
  totalCount: number
  filteredCount: number
  filters: DateFilters
  onFilterChange: (f: DateFilters) => void
}

export function DateFilterBar({
  dates,
  totalCount,
  filteredCount,
  filters,
  onFilterChange,
}: DateFilterBarProps) {
  const years = useMemo(() => {
    const set = new Set<number>()
    for (const d of dates) {
      const y = parseInt(d.substring(0, 4))
      if (!isNaN(y) && y > 2000) set.add(y)
    }
    return Array.from(set).sort((a, b) => b - a)
  }, [dates])

  const months = useMemo(() => {
    if (!filters.year) return []
    const set = new Set<number>()
    for (const d of dates) {
      const y = parseInt(d.substring(0, 4))
      const m = parseInt(d.substring(5, 7))
      if (y === filters.year && !isNaN(m)) set.add(m)
    }
    return Array.from(set).sort((a, b) => a - b)
  }, [dates, filters.year])

  const days = useMemo(() => {
    if (!filters.year || !filters.month) return []
    const set = new Set<number>()
    for (const d of dates) {
      if (d.length >= 10) {
        const y = parseInt(d.substring(0, 4))
        const m = parseInt(d.substring(5, 7))
        const day = parseInt(d.substring(8, 10))
        if (y === filters.year && m === filters.month && !isNaN(day)) set.add(day)
      }
    }
    return Array.from(set).sort((a, b) => a - b)
  }, [dates, filters.year, filters.month])

  const hasActiveFilter = filters.year !== null

  if (years.length === 0) return null

  const selectYear = (y: number) => {
    if (filters.year === y) onFilterChange({ year: null, month: null, day: null })
    else onFilterChange({ year: y, month: null, day: null })
  }

  const selectMonth = (m: number) => {
    if (filters.month === m) onFilterChange({ ...filters, month: null, day: null })
    else onFilterChange({ ...filters, month: m, day: null })
  }

  const clearAll = () => onFilterChange({ year: null, month: null, day: null })

  const pill = (active: boolean) => ({
    background: active ? '#1A6FC4' : '#F0F4FA',
    color: active ? '#fff' : '#4A6580',
  })

  return (
    <div
      className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[10px] bg-white px-4 py-3"
      style={{ border: '1px solid #D6E4F0' }}
    >
      {/* Year pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] text-slate font-medium mr-0.5">Año</span>
        {years.map((y) => (
          <button
            key={y}
            onClick={() => selectYear(y)}
            className="text-xs font-medium px-2.5 py-1 rounded-full transition-colors"
            style={pill(filters.year === y)}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Separator */}
      {filters.year && months.length > 0 && (
        <span style={{ width: 1, height: 16, background: '#D6E4F0', display: 'inline-block', flexShrink: 0 }} />
      )}

      {/* Month pills */}
      {filters.year && months.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate font-medium mr-0.5">Mes</span>
          {months.map((m) => (
            <button
              key={m}
              onClick={() => selectMonth(m)}
              className="text-xs font-medium px-2.5 py-1 rounded-full transition-colors"
              style={pill(filters.month === m)}
            >
              {MONTH_SHORT[m]}
            </button>
          ))}
        </div>
      )}

      {/* Separator + Day */}
      {filters.month && days.length > 0 && (
        <>
          <span style={{ width: 1, height: 16, background: '#D6E4F0', display: 'inline-block', flexShrink: 0 }} />
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate font-medium">Día</span>
            <select
              value={filters.day ?? ''}
              onChange={(e) => {
                const v = e.target.value
                onFilterChange({ ...filters, day: v === '' ? null : parseInt(v) })
              }}
              className="text-xs font-medium px-2 py-1 rounded-[6px] outline-none cursor-pointer"
              style={{
                border: '1px solid #D6E4F0',
                background: filters.day ? '#1A6FC4' : '#F0F4FA',
                color: filters.day ? '#fff' : '#4A6580',
              }}
            >
              <option value="">Todos</option>
              {days.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </>
      )}

      {/* Spacer */}
      <div className="flex-1 min-w-4" />

      {/* Record count badge */}
      <span className="text-[11px] text-slate whitespace-nowrap">
        Mostrando{' '}
        <span className="font-semibold text-ink">{filteredCount}</span>
        {' '}de{' '}
        <span className="font-medium">{totalCount}</span>
        {' '}registros
      </span>

      {/* Clear button */}
      {hasActiveFilter && (
        <button
          onClick={clearAll}
          className="text-xs font-medium px-3 py-1 rounded-[6px] whitespace-nowrap transition-colors"
          style={{ background: '#FEF3E2', color: '#F59E0B' }}
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )
}
