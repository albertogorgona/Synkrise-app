'use client'

import { useState } from 'react'

type CardPeriod = 'week' | 'month' | 'year'

const PERIOD_LABELS: Record<CardPeriod, string> = { week: 'Sem', month: 'Mes', year: 'Año' }
const PERIOD_VS: Record<CardPeriod, string> = { week: 'sem. ant.', month: 'mes ant.', year: 'año ant.' }

export interface DeltaByPeriod {
  week: number
  month: number
  year: number
}

interface KPICardProps {
  label: string
  value: string
  delta: number
  deltaLabel?: string
  progress?: number
  variant?: 'default' | 'teal' | 'red' | 'amber'
  periodLabel?: string
  // Period toggle
  deltaByPeriod?: DeltaByPeriod
  showPeriodToggle?: boolean
  // Goal distance
  goalValue?: number
  currentValue?: number
  goalFormat?: 'currency' | 'percent' | 'number'
  // Set true for metrics where lower is better (e.g. bajo stock, costos)
  invertGoal?: boolean
  // Set true when no comparison data exists (shows "Sin datos comparativos")
  noComparison?: boolean
}

function fmtGoalRef(val: number, fmt: 'currency' | 'percent' | 'number'): string {
  if (fmt === 'currency') {
    return new Intl.NumberFormat('es-PA', {
      style: 'currency', currency: 'USD',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(val)
  }
  if (fmt === 'percent') return `${val.toFixed(1)}%`
  return new Intl.NumberFormat('es-PA').format(Math.round(val))
}

function fmtCompact(abs: number, fmt: 'currency' | 'percent' | 'number'): string {
  if (fmt === 'currency') {
    if (abs >= 1_000_000) return `$${(abs / 1_000_000).toFixed(1)}M`
    if (abs >= 10_000)    return `$${Math.round(abs / 1_000)}K`
    return new Intl.NumberFormat('es-PA', {
      style: 'currency', currency: 'USD',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(abs)
  }
  if (fmt === 'percent') return `${abs.toFixed(1)}pp`
  if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 10_000)    return `${Math.round(abs / 1_000)}K`
  return new Intl.NumberFormat('es-PA').format(Math.round(abs))
}

export function KPICard({
  label, value, delta, deltaLabel, progress, variant = 'default', periodLabel,
  deltaByPeriod, showPeriodToggle = false,
  goalValue, currentValue, goalFormat = 'number', invertGoal = false,
  noComparison = false,
}: KPICardProps) {
  const [activePeriod, setActivePeriod] = useState<CardPeriod>('month')

  const activeDelta = showPeriodToggle && deltaByPeriod
    ? deltaByPeriod[activePeriod]
    : delta
  const isPositive = activeDelta >= 0

  const goalDiff = goalValue !== undefined && currentValue !== undefined
    ? invertGoal
      ? goalValue - currentValue   // lower-is-better: positive when we're under the threshold
      : currentValue - goalValue
    : null
  // When goalValue=0 (e.g. bajo-stock target=0), use currentValue as denominator for %
  const goalPct = goalDiff !== null
    ? goalValue !== undefined && goalValue > 0
      ? (Math.abs(goalDiff) / goalValue) * 100
      : currentValue !== undefined && Math.abs(currentValue) > 0
        ? (Math.abs(goalDiff) / Math.abs(currentValue)) * 100
        : 0
    : null
  const hasGoal = goalDiff !== null && goalPct !== null

  // Teal = at or above goal, red = below goal
  const goalColor = goalDiff !== null && goalDiff >= 0 ? '#0ABFBC' : '#E05C5C'

  return (
    <div className={`kpi-card ${variant !== 'default' ? variant : ''}`}>
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{value}</span>

      {/* Period toggle slot — fixed height so all cards align regardless of toggle presence */}
      {showPeriodToggle && (
        <div style={{ height: 26, display: 'flex', alignItems: 'center' }}>
          {deltaByPeriod && (
            <div className="flex gap-1">
              {(['week', 'month', 'year'] as CardPeriod[]).map(p => (
                <button
                  key={p}
                  onClick={() => setActivePeriod(p)}
                  style={activePeriod === p
                    ? { background: '#1A6FC4', color: '#fff' }
                    : { background: '#F0F4FA', color: '#4A6580', border: '1px solid #D6E4F0' }
                  }
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors cursor-pointer"
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delta + goal indicator — fixed height */}
      <div className="flex items-center justify-between gap-2" style={{ height: 20 }}>
        {noComparison ? (
          <span style={{ color: '#B0C4D8', fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap', lineHeight: 1 }}>
            Sin datos comparativos
          </span>
        ) : (
          <span
            className={`kpi-delta ${isPositive ? 'up' : 'down'}`}
            style={{ flex: '0 1 auto', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {isPositive ? '↑' : '↓'} {isPositive ? '+' : ''}{activeDelta.toFixed(1)}%
            <span className="ml-1 text-slate text-[11px]">
              {showPeriodToggle && deltaByPeriod
                ? `vs ${PERIOD_VS[activePeriod]}`
                : deltaLabel}
            </span>
          </span>
        )}

        {hasGoal ? (
          <span className="flex items-center gap-1.5 flex-shrink-0">
            <span style={{ display: 'inline-block', width: 1, height: 14, background: '#D6E4F0', opacity: 0.8, flexShrink: 0 }} />
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0 }}>
              <span style={{ color: '#B0C4D8', fontSize: 9, fontWeight: 500, lineHeight: 1, marginBottom: 1 }}>vs objetivo</span>
              <span style={{ color: goalColor, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', lineHeight: 1 }}>
                {goalDiff === 0
                  ? '✓'
                  : goalDiff! > 0
                    ? `+${fmtCompact(goalDiff!, goalFormat)} · +${goalPct!.toFixed(1)}%`
                    : `−${fmtCompact(Math.abs(goalDiff!), goalFormat)} · −${goalPct!.toFixed(1)}%`
                }
              </span>
            </span>
          </span>
        ) : null}
      </div>

      {/* Goal reference line — fixed height slot, always present when toggle is shown */}
      {showPeriodToggle && (
        <div style={{ height: 15, display: 'flex', alignItems: 'center' }}>
          {goalValue !== undefined && (
            <span className="text-[10px] text-slate">
              {fmtGoalRef(goalValue, goalFormat)} objetivo
            </span>
          )}
        </div>
      )}

      {(!showPeriodToggle || !deltaByPeriod) && periodLabel && (
        <span className="text-[10px] text-slate block">{periodLabel}</span>
      )}

      {progress !== undefined && (
        <div className="kpi-bar">
          <div className="kpi-bar-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
      )}
    </div>
  )
}
