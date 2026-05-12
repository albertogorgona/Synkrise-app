const KPI_GOALS_KEY = 'synkrise_kpi_goals'

export type KpiGoals = Record<string, number>

export function readKpiGoals(): KpiGoals {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(KPI_GOALS_KEY) ?? '{}') as KpiGoals
  } catch {
    return {}
  }
}

export function writeKpiGoals(goals: KpiGoals): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(KPI_GOALS_KEY, JSON.stringify(goals))
  } catch {}
}

interface VentaForDelta {
  fecha: string
  unidades: number | null
  precio_unitario: number | null
  costo_unitario: number | null
}

interface PeriodAgg {
  v: number
  c: number
  u: number
  tx: number
}

function aggRows(rows: VentaForDelta[]): PeriodAgg {
  let v = 0, c = 0, u = 0, tx = 0
  for (const r of rows) {
    v += (r.unidades ?? 0) * (r.precio_unitario ?? 0)
    c += (r.unidades ?? 0) * (r.costo_unitario ?? 0)
    u += r.unidades ?? 0
    tx++
  }
  return { v, c, u, tx }
}

export interface PeriodDeltas {
  ventasDelta: number
  margenDelta: number
  ticketDelta: number
  unidadesDelta: number
  ingresosDelta: number
  costosDelta: number
}

function calcDeltas(cur: PeriodAgg, prev: PeriodAgg): PeriodDeltas {
  const ventasDelta = prev.v > 0 ? ((cur.v - prev.v) / prev.v) * 100 : 0
  const curM = cur.v > 0 ? ((cur.v - cur.c) / cur.v) * 100 : 0
  const prevM = prev.v > 0 ? ((prev.v - prev.c) / prev.v) * 100 : 0
  const margenDelta = curM - prevM
  const curT = cur.tx > 0 ? cur.v / cur.tx : 0
  const prevT = prev.tx > 0 ? prev.v / prev.tx : 0
  const ticketDelta = prevT > 0 ? ((curT - prevT) / prevT) * 100 : 0
  const unidadesDelta = prev.u > 0 ? ((cur.u - prev.u) / prev.u) * 100 : 0
  const ingresosDelta = ventasDelta
  const costosDelta = prev.c > 0 ? ((cur.c - prev.c) / prev.c) * 100 : 0
  return { ventasDelta, margenDelta, ticketDelta, unidadesDelta, ingresosDelta, costosDelta }
}

export interface AllPeriodDeltas {
  week: PeriodDeltas
  month: PeriodDeltas
  year: PeriodDeltas
}

const ZERO_DELTAS: PeriodDeltas = {
  ventasDelta: 0, margenDelta: 0, ticketDelta: 0,
  unidadesDelta: 0, ingresosDelta: 0, costosDelta: 0,
}

export function computeAllPeriodDeltas(ventas: VentaForDelta[]): AllPeriodDeltas {
  if (ventas.length === 0) return { week: ZERO_DELTAS, month: ZERO_DELTAS, year: ZERO_DELTAS }

  const sortedDates = [...new Set(ventas.map(r => r.fecha))].sort()
  const sortedMonths = [...new Set(ventas.map(r => r.fecha.substring(0, 7)))].sort()
  const sortedYears = [...new Set(ventas.map(r => r.fecha.substring(0, 4)))].sort()

  const curWeekSet = new Set(sortedDates.slice(-7))
  const prevWeekSet = new Set(sortedDates.slice(-14, -7))
  const weekDeltas = calcDeltas(
    aggRows(ventas.filter(r => curWeekSet.has(r.fecha))),
    aggRows(ventas.filter(r => prevWeekSet.has(r.fecha))),
  )

  const curMonth = sortedMonths.at(-1) ?? ''
  const prevMonth = sortedMonths.at(-2) ?? ''
  const monthDeltas = calcDeltas(
    aggRows(ventas.filter(r => r.fecha.startsWith(curMonth))),
    aggRows(ventas.filter(r => r.fecha.startsWith(prevMonth))),
  )

  const curYear = sortedYears.at(-1) ?? ''
  const prevYear = sortedYears.at(-2) ?? ''
  const yearDeltas = calcDeltas(
    aggRows(ventas.filter(r => r.fecha.startsWith(curYear))),
    aggRows(ventas.filter(r => r.fecha.startsWith(prevYear))),
  )

  return { week: weekDeltas, month: monthDeltas, year: yearDeltas }
}

// ─── Period totals (absolute values per period) ───────────────────────────────

export interface PeriodTotals {
  ventas: number
  costos: number
  unidades: number
  txCount: number
  margenPct: number
  ticket: number
}

export interface AllPeriodTotals {
  week: PeriodTotals
  month: PeriodTotals
  year: PeriodTotals
}

function aggToTotals(agg: PeriodAgg): PeriodTotals {
  return {
    ventas:    agg.v,
    costos:    agg.c,
    unidades:  agg.u,
    txCount:   agg.tx,
    margenPct: agg.v > 0 ? ((agg.v - agg.c) / agg.v) * 100 : 0,
    ticket:    agg.tx > 0 ? agg.v / agg.tx : 0,
  }
}

const ZERO_TOTALS: PeriodTotals = { ventas: 0, costos: 0, unidades: 0, txCount: 0, margenPct: 0, ticket: 0 }

export function computeAllPeriodTotals(ventas: VentaForDelta[]): AllPeriodTotals {
  if (ventas.length === 0) return { week: ZERO_TOTALS, month: ZERO_TOTALS, year: ZERO_TOTALS }

  const sortedDates = [...new Set(ventas.map(r => r.fecha))].sort()
  const sortedMonths = [...new Set(ventas.map(r => r.fecha.substring(0, 7)))].sort()
  const sortedYears  = [...new Set(ventas.map(r => r.fecha.substring(0, 4)))].sort()

  const curWeekSet = new Set(sortedDates.slice(-7))
  const curMonth   = sortedMonths.at(-1) ?? ''
  const curYear    = sortedYears.at(-1)  ?? ''

  return {
    week:  aggToTotals(aggRows(ventas.filter(r => curWeekSet.has(r.fecha)))),
    month: aggToTotals(aggRows(ventas.filter(r => r.fecha.startsWith(curMonth)))),
    year:  aggToTotals(aggRows(ventas.filter(r => r.fecha.startsWith(curYear)))),
  }
}
