'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { KPICard } from '@/components/dashboard/KPICard'
import { TrackableElement } from '@/components/TrackableElement'
import { DateFilterBar } from '@/components/DateFilterBar'
import { useDateFilters } from '@/hooks/useDateFilters'
import { useSortableTable } from '@/hooks/useSortableTable'
import { SortIcon } from '@/components/SortIcon'
import { CHART_PALETTE, SEMANTIC } from '@/lib/chart-colors'
import { computeAllPeriodDeltas, readKpiGoals } from '@/lib/kpiHelpers'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface VentaRow {
  fecha: string
  producto: string
  categoria: string | null
  unidades: number | null
  precio_unitario: number | null
  costo_unitario: number | null
}

interface ProductRow {
  producto: string
  ventas: number
  unidades: number
  tendencia: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-PA', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const MONTH_LABELS: Record<string, string> = {
  '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
}

const MONTH_NAMES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const MONTH_SHORT = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function buildPeriodLabel(year: number | null, month: number | null, day: number | null): string | undefined {
  if (!year) return undefined
  let label = `Período: ${year}`
  if (month) {
    label += ` · ${MONTH_SHORT[month]}`
    if (day) label += ` · ${day}`
  }
  return label
}

function EmptyFiltered() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-4xl mb-3" role="img" aria-label="sin datos">📭</span>
      <p className="text-slate text-sm font-medium">Sin datos para este período</p>
      <p className="text-slate text-xs mt-1">Prueba ajustando los filtros de fecha</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [ventasRows, setVentasRows] = useState<VentaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useDateFilters()
  const [kpiGoals, setKpiGoals] = useState<Record<string, number>>({})
  const autoSelectedRef = useRef(false)

  useEffect(() => { setKpiGoals(readKpiGoals()) }, [])

  // Auto-select most recent year on first data load
  useEffect(() => {
    if (autoSelectedRef.current || filters.year !== null || ventasRows.length === 0) return
    const years = [...new Set(ventasRows.map(r => parseInt(r.fecha.substring(0, 4))))].filter(y => !isNaN(y)).sort((a, b) => b - a)
    if (years.length > 0) {
      autoSelectedRef.current = true
      setFilters({ year: years[0], month: null, day: null })
    }
  }, [ventasRows, filters.year, setFilters])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      supabase
          .from('ventas')
          .select('fecha, producto, categoria, unidades, precio_unitario, costo_unitario')
          .eq('user_id', user.id)
          .order('fecha', { ascending: true })
          .then(({ data: ventas }) => {
            setVentasRows(ventas ?? [])
            setLoading(false)
          })
    })
  }, [])

  // Filter ventas by date
  const filteredVentas = useMemo(() => {
    if (!filters.year) return ventasRows
    return ventasRows.filter((r) => {
      const y = parseInt(r.fecha.substring(0, 4))
      const m = parseInt(r.fecha.substring(5, 7))
      const d = parseInt(r.fecha.substring(8, 10))
      if (filters.year && y !== filters.year) return false
      if (filters.month && m !== filters.month) return false
      if (filters.day && d !== filters.day) return false
      return true
    })
  }, [ventasRows, filters])

  // Compute derived data
  const derived = useMemo(() => {
    // ── KPI totals computed from filtered ventas (single source of truth) ──
    let totalIngresos = 0, totalCostos = 0, txCount = 0
    for (const r of filteredVentas) {
      totalIngresos += (r.unidades ?? 0) * (r.precio_unitario ?? 0)
      totalCostos   += (r.unidades ?? 0) * (r.costo_unitario ?? 0)
      txCount++
    }
    const margenPct      = totalIngresos > 0 ? ((totalIngresos - totalCostos) / totalIngresos) * 100 : 0
    const ticketPromedio = txCount > 0 ? totalIngresos / txCount : 0

    const sortedFilteredMonths = [...new Set(filteredVentas.map(r => r.fecha.substring(0, 7)))].sort()
    const latestMonthKey = sortedFilteredMonths.at(-1) ?? ''
    const latestPeriod = latestMonthKey
      ? (() => {
          const [year, month] = latestMonthKey.split('-')
          return `${MONTH_NAMES[parseInt(month, 10)]} ${year}`
        })()
      : 'Período actual'

    // Monthly aggregation from ventas (used for top-product trend only)
    const monthlyMap = new Map<string, number>()
    for (const row of filteredVentas) {
      const month = row.fecha.substring(0, 7)
      const total = (row.unidades ?? 0) * (row.precio_unitario ?? 0)
      monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + total)
    }

    // Top products
    const sortedMonths = Array.from(monthlyMap.keys()).sort()
    const lastMonth = sortedMonths.at(-1) ?? ''
    const prevMonth = sortedMonths.at(-2) ?? ''
    const prodLast = new Map<string, number>()
    const prodPrev = new Map<string, number>()
    const productMap = new Map<string, { ventas: number; unidades: number }>()
    for (const row of filteredVentas) {
      const month = row.fecha.substring(0, 7)
      const total = (row.unidades ?? 0) * (row.precio_unitario ?? 0)
      if (month === lastMonth) prodLast.set(row.producto, (prodLast.get(row.producto) ?? 0) + total)
      if (month === prevMonth) prodPrev.set(row.producto, (prodPrev.get(row.producto) ?? 0) + total)
      const prev = productMap.get(row.producto) ?? { ventas: 0, unidades: 0 }
      productMap.set(row.producto, {
        ventas: prev.ventas + total,
        unidades: prev.unidades + (row.unidades ?? 0),
      })
    }

    const topProducts: ProductRow[] = Array.from(productMap.entries())
      .sort(([, a], [, b]) => b.ventas - a.ventas)
      .slice(0, 5)
      .map(([producto, data]) => {
        const cur = prodLast.get(producto) ?? 0
        const prv = prodPrev.get(producto) ?? 0
        const pct = prv > 0 ? (cur - prv) / prv : 0
        const tendencia = pct > 0.05 ? 'up' : pct < -0.05 ? 'down' : 'stable'
        return { producto, ventas: Math.round(data.ventas), unidades: data.unidades, tendencia }
      })

    // Category distribution
    const catMap = new Map<string, number>()
    for (const row of filteredVentas) {
      const cat = row.categoria ?? 'Otro'
      catMap.set(cat, (catMap.get(cat) ?? 0) + (row.unidades ?? 0) * (row.precio_unitario ?? 0))
    }
    const totalCat = Array.from(catMap.values()).reduce((a, b) => a + b, 0)
    const categoryData = Array.from(catMap.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([categoria, v]) => ({
        categoria,
        porcentaje: totalCat > 0 ? Math.round((v / totalCat) * 1000) / 10 : 0,
      }))

    // ── Smart delta from ventasRows ────────────────────────────────────────
    let dvCurV = 0, dvPrevV = 0, dvCurC = 0, dvPrevC = 0, dvCurTx = 0, dvPrevTx = 0
    let dvDeltaLabel = 'vs período anterior'

    if (filters.month !== null) {
      const activeMonth = filters.month
      const activeYear = filters.year ?? parseInt(lastMonth.substring(0, 4) || '0')
      const prevMN = activeMonth === 1 ? 12 : activeMonth - 1
      const prevMY = activeMonth === 1 ? activeYear - 1 : activeYear
      const activeKey = `${activeYear}-${String(activeMonth).padStart(2, '0')}`
      const prevKey   = `${prevMY}-${String(prevMN).padStart(2, '0')}`
      for (const row of ventasRows) {
        const key = row.fecha.substring(0, 7)
        const ing = (row.unidades ?? 0) * (row.precio_unitario ?? 0)
        const cos = (row.unidades ?? 0) * (row.costo_unitario ?? 0)
        if (key === activeKey) { dvCurV += ing; dvCurC += cos; dvCurTx++ }
        else if (key === prevKey) { dvPrevV += ing; dvPrevC += cos; dvPrevTx++ }
      }
      dvDeltaLabel = 'vs mes anterior'
    } else if (filters.year !== null) {
      for (const row of filteredVentas) {
        const m = parseInt(row.fecha.substring(5, 7))
        const ing = (row.unidades ?? 0) * (row.precio_unitario ?? 0)
        const cos = (row.unidades ?? 0) * (row.costo_unitario ?? 0)
        if (m <= 6) { dvPrevV += ing; dvPrevC += cos; dvPrevTx++ }
        else        { dvCurV  += ing; dvCurC  += cos; dvCurTx++ }
      }
      dvDeltaLabel = 'H2 vs H1'
    } else {
      const allYears = [...new Set(ventasRows.map(r => parseInt(r.fecha.substring(0, 4))))].sort()
      if (allYears.length >= 2) {
        const ly = allYears.at(-1) ?? 0, py = allYears.at(-2) ?? 0
        for (const row of ventasRows) {
          const y = parseInt(row.fecha.substring(0, 4))
          const ing = (row.unidades ?? 0) * (row.precio_unitario ?? 0)
          const cos = (row.unidades ?? 0) * (row.costo_unitario ?? 0)
          if      (y === ly) { dvCurV  += ing; dvCurC  += cos; dvCurTx++ }
          else if (y === py) { dvPrevV += ing; dvPrevC += cos; dvPrevTx++ }
        }
        dvDeltaLabel = 'vs año anterior'
      } else {
        for (const row of ventasRows) {
          const m = parseInt(row.fecha.substring(5, 7))
          const ing = (row.unidades ?? 0) * (row.precio_unitario ?? 0)
          const cos = (row.unidades ?? 0) * (row.costo_unitario ?? 0)
          if (m <= 6) { dvPrevV += ing; dvPrevC += cos; dvPrevTx++ }
          else        { dvCurV  += ing; dvCurC  += cos; dvCurTx++ }
        }
        dvDeltaLabel = 'H2 vs H1'
      }
    }

    const dvCurMargen  = dvCurV  > 0 ? ((dvCurV  - dvCurC)  / dvCurV)  * 100 : 0
    const dvPrevMargen = dvPrevV > 0 ? ((dvPrevV - dvPrevC) / dvPrevV) * 100 : 0
    const dvCurTicket  = dvCurTx  > 0 ? dvCurV  / dvCurTx  : 0
    const dvPrevTicket = dvPrevTx > 0 ? dvPrevV / dvPrevTx : 0

    const dvVentasDelta = dvPrevV      > 0 ? ((dvCurV       - dvPrevV)      / dvPrevV)      * 100 : 0
    const dvMargenDelta = dvPrevV      > 0 ? dvCurMargen  - dvPrevMargen                          : 0
    const dvTicketDelta = dvPrevTicket > 0 ? ((dvCurTicket  - dvPrevTicket) / dvPrevTicket) * 100 : 0
    const dvCostoDelta  = dvPrevC > 0 ? ((dvCurC - dvPrevC) / dvPrevC) * 100 : 0

    return {
      latestPeriod, topProducts, categoryData,
      totalIngresos, totalCostos, margenPct, ticketPromedio,
      dvVentasDelta, dvMargenDelta, dvTicketDelta, dvCostoDelta, dvDeltaLabel,
      dvHasCompData: dvPrevV > 0,
    }
  }, [filteredVentas, ventasRows, filters.year, filters.month])

  const periodDeltas = useMemo(() => computeAllPeriodDeltas(ventasRows), [ventasRows])

  // Rolling 6-month chart — always from raw ventasRows, never affected by filters
  const monthlyChartData = useMemo(() => {
    const monthlyMap = new Map<string, number>()
    for (const row of ventasRows) {
      const month = row.fecha.substring(0, 7)
      const total = (row.unidades ?? 0) * (row.precio_unitario ?? 0)
      monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + total)
    }
    return Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, value]) => ({
        mes: MONTH_LABELS[key.substring(5)] ?? key.substring(5),
        ventas: Math.round(value),
      }))
  }, [ventasRows])

  // Sortable table hook — unconditional
  const { sortedData: sortedProducts, sortConfig, requestSort } = useSortableTable(
    derived.topProducts as unknown as Record<string, unknown>[]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate text-sm">Cargando datos...</p>
      </div>
    )
  }

  const hasData = ventasRows.length > 0

  if (!hasData) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="font-sora text-[22px] font-bold text-ink tracking-tight">Dashboard</h1>
            <p className="text-slate text-sm mt-0.5">Resumen de tu operación</p>
          </div>
        </div>
        <div className="chart-card flex flex-col items-center justify-center py-24 text-center">
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none" className="mb-4 opacity-25">
            <rect x="4"  y="32" width="9"  height="16" rx="2" fill="#1A6FC4" />
            <rect x="17" y="20" width="9"  height="28" rx="2" fill="#1A6FC4" />
            <rect x="30" y="24" width="9"  height="24" rx="2" fill="#1A6FC4" />
            <rect x="43" y="8"  width="9"  height="40" rx="2" fill="#1A6FC4" />
          </svg>
          <h3 className="font-sora text-base font-semibold text-ink mb-1">Aún no tienes datos cargados</h3>
          <p className="text-slate text-sm">Importa tu primer archivo para comenzar.</p>
          <a href="/dashboard/datos" className="mt-5 px-5 py-2 rounded-[9px] text-sm font-medium text-white" style={{ background: '#1A6FC4' }}>
            Ir a Datos
          </a>
        </div>
      </div>
    )
  }

  const {
    latestPeriod, topProducts, categoryData,
    totalIngresos, totalCostos, margenPct, ticketPromedio,
    dvVentasDelta, dvMargenDelta, dvTicketDelta, dvCostoDelta, dvDeltaLabel,
    dvHasCompData,
  } = derived
  const periodLabel = buildPeriodLabel(filters.year, filters.month, filters.day)

  const displayPeriod = filters.month && filters.year
    ? `${MONTH_NAMES[filters.month]} ${filters.year}`
    : filters.year
      ? String(filters.year)
      : latestPeriod

  const kpis = [
    {
      label: 'Ventas Totales',
      value: formatCurrency(totalIngresos),
      delta: dvVentasDelta,
      deltaLabel: dvDeltaLabel,
      progress: kpiGoals['ventas-totales'] > 0 ? Math.min(Math.round((totalIngresos / kpiGoals['ventas-totales']) * 100), 100) : 0,
      variant: 'default' as const,
      periodLabel,
      showPeriodToggle: true,
      deltaByPeriod: { week: periodDeltas.week.ventasDelta, month: periodDeltas.month.ventasDelta, year: periodDeltas.year.ventasDelta },
      goalValue: kpiGoals['ventas-totales'],
      currentValue: totalIngresos,
      goalFormat: 'currency' as const,
      noComparison: !dvHasCompData,
    },
    {
      label: 'Margen Bruto',
      value: `${margenPct.toFixed(1)}%`,
      delta: dvMargenDelta,
      deltaLabel: dvDeltaLabel,
      progress: Math.min(Math.round(margenPct), 100),
      variant: 'teal' as const,
      periodLabel,
      showPeriodToggle: true,
      deltaByPeriod: { week: periodDeltas.week.margenDelta, month: periodDeltas.month.margenDelta, year: periodDeltas.year.margenDelta },
      goalValue: kpiGoals['margen-bruto-pct'],
      currentValue: margenPct,
      goalFormat: 'percent' as const,
      noComparison: !dvHasCompData,
    },
    {
      label: 'Costo Operativo',
      value: formatCurrency(totalCostos),
      delta: dvCostoDelta,
      deltaLabel: dvDeltaLabel,
      progress: totalIngresos > 0 ? Math.round((totalCostos / totalIngresos) * 100) : 0,
      variant: 'amber' as const,
      periodLabel,
      showPeriodToggle: true,
      deltaByPeriod: { week: periodDeltas.week.costosDelta, month: periodDeltas.month.costosDelta, year: periodDeltas.year.costosDelta },
      goalValue: kpiGoals['costos-totales'],
      currentValue: totalCostos,
      goalFormat: 'currency' as const,
      noComparison: !dvHasCompData,
    },
    {
      label: 'Ticket Promedio',
      value: formatCurrency(ticketPromedio),
      delta: dvTicketDelta,
      deltaLabel: dvDeltaLabel,
      progress: kpiGoals['ticket-promedio'] > 0 ? Math.min(Math.round((ticketPromedio / kpiGoals['ticket-promedio']) * 100), 100) : 0,
      variant: 'default' as const,
      periodLabel,
      showPeriodToggle: true,
      deltaByPeriod: { week: periodDeltas.week.ticketDelta, month: periodDeltas.month.ticketDelta, year: periodDeltas.year.ticketDelta },
      goalValue: kpiGoals['ticket-promedio'],
      currentValue: ticketPromedio,
      goalFormat: 'currency' as const,
      noComparison: !dvHasCompData,
    },
  ]

  const DB_KPI_LABELS: Record<string, string> = {
    'Ventas Totales':  'KPI de Ventas Totales del período',
    'Margen Bruto':    'KPI de Margen Bruto',
    'Costo Operativo': 'KPI de Costo Operativo',
    'Ticket Promedio': 'KPI de Ticket Promedio',
  }

  const thProps = (key: string, align: 'left' | 'right' = 'right') => ({
    className: `text-${align} kpi-label pb-2 cursor-pointer select-none`,
    onClick: () => requestSort(key),
    onMouseEnter: (e: React.MouseEvent<HTMLTableCellElement>) => { e.currentTarget.style.background = '#EBF4FF' },
    onMouseLeave: (e: React.MouseEvent<HTMLTableCellElement>) => { e.currentTarget.style.background = '' },
  })

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-sora text-[22px] font-bold text-ink tracking-tight">Dashboard</h1>
          <p className="text-slate text-sm mt-0.5">Resumen de tu operación — {displayPeriod}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium px-3 py-1.5 rounded-[8px]" style={{ background: '#E0F8F8', color: '#0ABFBC' }}>
            ↑ Datos actualizados
          </span>
        </div>
      </div>

      <DateFilterBar
        dates={ventasRows.map((v) => v.fecha)}
        totalCount={ventasRows.length}
        filteredCount={filteredVentas.length}
        filters={filters}
        onFilterChange={setFilters}
      />

      {filteredVentas.length === 0 && filters.year ? (
        <EmptyFiltered />
      ) : (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {kpis.map((kpi) => (
              <TrackableElement key={kpi.label} id={`db-kpi-${kpi.label}`} label={DB_KPI_LABELS[kpi.label] ?? kpi.label}>
                <KPICard {...kpi} />
              </TrackableElement>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* Evolución mensual */}
            <TrackableElement id="db-chart-evolucion" label="Gráfica de Evolución de Ventas — últimos 6 meses" className="chart-card lg:col-span-2">
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">Evolución de Ventas</h3>
                  <p className="chart-subtitle">Últimos 6 meses</p>
                </div>
              </div>
              <div className="h-52">
                {monthlyChartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-slate text-sm">Sin datos suficientes</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#D6E4F0" vertical={false} />
                      <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#4A6580' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#4A6580' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => [formatCurrency(v as number), 'Ventas']} contentStyle={{ borderRadius: 8, border: '1px solid #D6E4F0', fontSize: 12 }} />
                      <Line type="monotone" dataKey="ventas" stroke={SEMANTIC.blue} strokeWidth={2.5} dot={{ fill: SEMANTIC.blue, r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </TrackableElement>

            {/* Categorías */}
            <TrackableElement id="db-chart-categorias" label="Gráfica de Ventas por Categoría" className="chart-card">
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">Por Categoría</h3>
                  <p className="chart-subtitle">Distribución de ventas</p>
                </div>
              </div>
              <div className="space-y-3">
                {categoryData.map((cat, i) => (
                  <div key={cat.categoria}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-ink font-medium">{cat.categoria}</span>
                      <span className="text-xs text-slate">{cat.porcentaje}%</span>
                    </div>
                    <div className="kpi-bar">
                      <div
                        className="kpi-bar-fill"
                        style={{
                          width: `${cat.porcentaje}%`,
                          background: CHART_PALETTE[Math.min(i, CHART_PALETTE.length - 1)],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </TrackableElement>
          </div>

          {/* Top productos */}
          <TrackableElement id="db-table-top-productos" label="Tabla de Productos Top por facturación" className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Top Productos</h3>
                <p className="chart-subtitle">Por volumen de ventas</p>
              </div>
            </div>
            <div className="overflow-x-auto -mx-[22px] px-[22px] md:mx-0 md:px-0">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr className="border-b border-synk-border">
                    <th {...thProps('producto', 'left')}>Producto <SortIcon column="producto" config={sortConfig} /></th>
                    <th {...thProps('ventas')}>Ventas <SortIcon column="ventas" config={sortConfig} /></th>
                    <th {...thProps('unidades')}>Unidades <SortIcon column="unidades" config={sortConfig} /></th>
                    <th className="text-right kpi-label pb-2">Tendencia</th>
                  </tr>
                </thead>
                <tbody>
                  {(sortedProducts as unknown as ProductRow[]).map((p, i) => (
                    <tr key={p.producto} className={i < sortedProducts.length - 1 ? 'border-b border-synk-border/50' : ''}>
                      <td className="py-3 text-sm text-ink font-medium">{p.producto}</td>
                      <td className="py-3 text-sm text-right text-ink">{formatCurrency(p.ventas)}</td>
                      <td className="py-3 text-sm text-right text-slate">{p.unidades.toLocaleString('es-PA')}</td>
                      <td className="py-3 text-right">
                        <span className={`pill ${p.tendencia === 'up' ? 'high' : p.tendencia === 'down' ? 'low' : 'mid'}`}>
                          {p.tendencia === 'up' ? '↑ Alta' : p.tendencia === 'down' ? '↓ Baja' : '→ Estable'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TrackableElement>
        </>
      )}
    </div>
  )
}
