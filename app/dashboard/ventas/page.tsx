'use client'

import { useEffect, useState, useMemo } from 'react'
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
  BarChart,
  Bar,
  Cell,
} from 'recharts'

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
  margen: number
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

function fmt(value: number): string {
  return new Intl.NumberFormat('es-PA', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

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

export default function VentasPage() {
  const [ventas, setVentas] = useState<VentaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useDateFilters()
  const [kpiGoals, setKpiGoals] = useState<Record<string, number>>({})

  useEffect(() => { setKpiGoals(readKpiGoals()) }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      supabase
        .from('ventas')
        .select('fecha, producto, categoria, unidades, precio_unitario, costo_unitario')
        .eq('user_id', user.id)
        .order('fecha', { ascending: true })
        .then(({ data }) => {
          setVentas(data ?? [])
          setLoading(false)
        })
    })
  }, [])

  // Apply date filter
  const filtered = useMemo(() => {
    if (!filters.year) return ventas
    return ventas.filter((r) => {
      const y = parseInt(r.fecha.substring(0, 4))
      const m = parseInt(r.fecha.substring(5, 7))
      const d = parseInt(r.fecha.substring(8, 10))
      if (filters.year && y !== filters.year) return false
      if (filters.month && m !== filters.month) return false
      if (filters.day && d !== filters.day) return false
      return true
    })
  }, [ventas, filters])

  // Compute all derived data (runs even when empty, returns safe defaults)
  const derived = useMemo(() => {
    const monthlyVentasMap = new Map<string, number>()
    const monthlyUnidadesMap = new Map<string, number>()
    const monthlyTxMap = new Map<string, number>()
    const monthlyCostoMap = new Map<string, number>()

    for (const row of filtered) {
      const month = row.fecha.substring(0, 7)
      const ingreso = (row.unidades ?? 0) * (row.precio_unitario ?? 0)
      const costo = (row.unidades ?? 0) * (row.costo_unitario ?? 0)
      monthlyVentasMap.set(month, (monthlyVentasMap.get(month) ?? 0) + ingreso)
      monthlyUnidadesMap.set(month, (monthlyUnidadesMap.get(month) ?? 0) + (row.unidades ?? 0))
      monthlyTxMap.set(month, (monthlyTxMap.get(month) ?? 0) + 1)
      monthlyCostoMap.set(month, (monthlyCostoMap.get(month) ?? 0) + costo)
    }

    const sortedMonths = Array.from(monthlyVentasMap.keys()).sort()
    const lastMonth = sortedMonths.at(-1) ?? ''
    const prevMonth = sortedMonths.at(-2) ?? ''

    // Smart delta — avoids extreme swings from partial-month data
    let lastVentas = 0, prevVentas = 0
    let lastUnidades = 0, prevUnidades = 0
    let lastTx = 0, prevTx = 0
    let lastCosto = 0, prevCosto = 0
    let smallSample = false
    let deltaLabel = 'vs período anterior'

    if (filters.month !== null) {
      // Month selected: compare that month vs its immediate predecessor
      const activeMonth = filters.month
      const activeYear = filters.year ?? parseInt(lastMonth.substring(0, 4) || '0')
      const prevMonthNum = activeMonth === 1 ? 12 : activeMonth - 1
      const prevMonthYear = activeMonth === 1 ? activeYear - 1 : activeYear
      const activeKey = `${activeYear}-${String(activeMonth).padStart(2, '0')}`
      const prevKey = `${prevMonthYear}-${String(prevMonthNum).padStart(2, '0')}`
      for (const row of ventas) {
        const key = row.fecha.substring(0, 7)
        const ing = (row.unidades ?? 0) * (row.precio_unitario ?? 0)
        const cos = (row.unidades ?? 0) * (row.costo_unitario ?? 0)
        const uni = row.unidades ?? 0
        if (key === activeKey) { lastVentas += ing; lastCosto += cos; lastUnidades += uni; lastTx++ }
        else if (key === prevKey) { prevVentas += ing; prevCosto += cos; prevUnidades += uni; prevTx++ }
      }
      smallSample = lastTx < 30
      deltaLabel = 'vs mes anterior'
    } else if (filters.year !== null) {
      // Year only: split into H1 (Jan–Jun) vs H2 (Jul–Dec)
      for (const row of filtered) {
        const m = parseInt(row.fecha.substring(5, 7))
        const ing = (row.unidades ?? 0) * (row.precio_unitario ?? 0)
        const cos = (row.unidades ?? 0) * (row.costo_unitario ?? 0)
        const uni = row.unidades ?? 0
        if (m <= 6) { prevVentas += ing; prevCosto += cos; prevUnidades += uni; prevTx++ }
        else        { lastVentas += ing; lastCosto += cos; lastUnidades += uni; lastTx++ }
      }
      deltaLabel = 'H2 vs H1'
    } else {
      const allYears = [...new Set(ventas.map(r => parseInt(r.fecha.substring(0, 4))))].sort()
      if (allYears.length >= 2) {
        const latestYear = allYears.at(-1) ?? 0
        const prevYear   = allYears.at(-2) ?? 0
        for (const row of ventas) {
          const y = parseInt(row.fecha.substring(0, 4))
          const ing = (row.unidades ?? 0) * (row.precio_unitario ?? 0)
          const cos = (row.unidades ?? 0) * (row.costo_unitario ?? 0)
          const uni = row.unidades ?? 0
          if      (y === latestYear) { lastVentas += ing; lastCosto += cos; lastUnidades += uni; lastTx++ }
          else if (y === prevYear)   { prevVentas += ing; prevCosto += cos; prevUnidades += uni; prevTx++ }
        }
        deltaLabel = 'vs año anterior'
      } else {
        // Single year: H2 (Jul–Dec) vs H1 (Jan–Jun)
        for (const row of ventas) {
          const m = parseInt(row.fecha.substring(5, 7))
          const ing = (row.unidades ?? 0) * (row.precio_unitario ?? 0)
          const cos = (row.unidades ?? 0) * (row.costo_unitario ?? 0)
          const uni = row.unidades ?? 0
          if (m <= 6) { prevVentas += ing; prevCosto += cos; prevUnidades += uni; prevTx++ }
          else        { lastVentas += ing; lastCosto += cos; lastUnidades += uni; lastTx++ }
        }
        deltaLabel = 'H2 vs H1'
      }
    }

    const ticketLast = lastTx > 0 ? lastVentas / lastTx : 0
    const ticketPrev = prevTx > 0 ? prevVentas / prevTx : 0
    const margenLast = lastVentas > 0 ? ((lastVentas - lastCosto) / lastVentas) * 100 : 0
    const margenPrev = prevVentas > 0 ? ((prevVentas - prevCosto) / prevVentas) * 100 : 0
    const ventasMoM = prevVentas > 0 ? ((lastVentas - prevVentas) / prevVentas) * 100 : 0

    const catMap = new Map<string, number>()
    for (const row of filtered) {
      const cat = row.categoria || 'Otro'
      catMap.set(cat, (catMap.get(cat) ?? 0) + (row.unidades ?? 0) * (row.precio_unitario ?? 0))
    }
    const totalCat = Array.from(catMap.values()).reduce((a, b) => a + b, 0)
    const categoryData = Array.from(catMap.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([categoria, v]) => ({
        categoria,
        porcentaje: totalCat > 0 ? Math.round((v / totalCat) * 1000) / 10 : 0,
      }))

    const productMap = new Map<string, { ventas: number; unidades: number; costos: number }>()
    const prodLastMap = new Map<string, number>()
    const prodPrevMap = new Map<string, number>()
    for (const row of filtered) {
      const total = (row.unidades ?? 0) * (row.precio_unitario ?? 0)
      const costo = (row.unidades ?? 0) * (row.costo_unitario ?? 0)
      const month = row.fecha.substring(0, 7)
      const prev = productMap.get(row.producto) ?? { ventas: 0, unidades: 0, costos: 0 }
      productMap.set(row.producto, { ventas: prev.ventas + total, unidades: prev.unidades + (row.unidades ?? 0), costos: prev.costos + costo })
      if (month === lastMonth) prodLastMap.set(row.producto, (prodLastMap.get(row.producto) ?? 0) + total)
      else if (month === prevMonth) prodPrevMap.set(row.producto, (prodPrevMap.get(row.producto) ?? 0) + total)
    }

    const topProducts: ProductRow[] = Array.from(productMap.entries())
      .sort(([, a], [, b]) => b.ventas - a.ventas)
      .slice(0, 5)
      .map(([producto, data]) => {
        const cur = prodLastMap.get(producto) ?? 0
        const prv = prodPrevMap.get(producto) ?? 0
        const pct = prv > 0 ? (cur - prv) / prv : 0
        const tendencia = pct > 0.05 ? 'up' : pct < -0.05 ? 'down' : 'stable'
        const margen = data.ventas > 0 ? ((data.ventas - data.costos) / data.ventas) * 100 : 0
        return { producto, ventas: Math.round(data.ventas), unidades: data.unidades, tendencia, margen }
      })

    const latestPeriodLabel = lastMonth
      ? (() => {
          const [year, month] = lastMonth.split('-')
          return `${MONTH_NAMES[parseInt(month, 10)]} ${year}`
        })()
      : 'Período actual'

    return {
      lastVentas, prevVentas, lastUnidades, prevUnidades,
      ticketLast, ticketPrev, margenLast, margenPrev, ventasMoM,
      categoryData, topProducts, latestPeriodLabel,
      smallSample, deltaLabel,
    }
  }, [filtered, ventas, filters.year, filters.month])

  const periodDeltas = useMemo(() => computeAllPeriodDeltas(ventas), [ventas])

  // Rolling 6-month chart — always from raw ventas, never affected by filters
  const monthlyChartData = useMemo(() => {
    const monthlyMap = new Map<string, number>()
    for (const row of ventas) {
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
  }, [ventas])

  // Hook must be called unconditionally — passes derived data
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

  if (ventas.length === 0) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="font-sora text-[22px] font-bold text-ink tracking-tight">Ventas</h1>
            <p className="text-slate text-sm mt-0.5">Análisis detallado de tus ventas</p>
          </div>
        </div>
        <div className="chart-card flex flex-col items-center justify-center py-24 text-center">
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none" className="mb-4 opacity-25">
            <rect x="4"  y="32" width="9" height="16" rx="2" fill="#1A6FC4" />
            <rect x="17" y="20" width="9" height="28" rx="2" fill="#1A6FC4" />
            <rect x="30" y="24" width="9" height="24" rx="2" fill="#1A6FC4" />
            <rect x="43" y="8"  width="9" height="40" rx="2" fill="#1A6FC4" />
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
    lastVentas, prevVentas, lastUnidades, prevUnidades,
    ticketLast, ticketPrev, margenLast, margenPrev, ventasMoM,
    categoryData, latestPeriodLabel,
    smallSample, deltaLabel,
  } = derived

  const periodLabel = buildPeriodLabel(filters.year, filters.month, filters.day)

  const VENTAS_KPI_LABELS: Record<string, string> = {
    'Ventas Totales':    'KPI de Ventas Totales del último mes',
    'Unidades Vendidas': 'KPI de Unidades Vendidas',
    'Ticket Promedio':   'KPI de Ticket Promedio por transacción',
    'Margen Bruto':      'KPI de Margen Bruto porcentual',
  }

  const kpis = [
    {
      label: 'Ventas Totales', value: fmt(lastVentas),
      delta: prevVentas > 0 ? ((lastVentas - prevVentas) / prevVentas) * 100 : 0, deltaLabel,
      progress: 74, variant: 'default' as const, periodLabel,
      showPeriodToggle: true,
      deltaByPeriod: { week: periodDeltas.week.ventasDelta, month: periodDeltas.month.ventasDelta, year: periodDeltas.year.ventasDelta },
      goalValue: kpiGoals['ventas-totales'], currentValue: lastVentas, goalFormat: 'currency' as const,
    },
    {
      label: 'Unidades Vendidas', value: lastUnidades.toLocaleString('es-PA'),
      delta: prevUnidades > 0 ? ((lastUnidades - prevUnidades) / prevUnidades) * 100 : 0, deltaLabel,
      progress: 62, variant: 'teal' as const, periodLabel,
      showPeriodToggle: true,
      deltaByPeriod: { week: periodDeltas.week.unidadesDelta, month: periodDeltas.month.unidadesDelta, year: periodDeltas.year.unidadesDelta },
      goalValue: kpiGoals['unidades-vendidas'], currentValue: lastUnidades, goalFormat: 'number' as const,
    },
    {
      label: 'Ticket Promedio', value: fmt(ticketLast),
      delta: ticketPrev > 0 ? ((ticketLast - ticketPrev) / ticketPrev) * 100 : 0, deltaLabel,
      progress: 68, variant: 'amber' as const, periodLabel,
      showPeriodToggle: true,
      deltaByPeriod: { week: periodDeltas.week.ticketDelta, month: periodDeltas.month.ticketDelta, year: periodDeltas.year.ticketDelta },
      goalValue: kpiGoals['ticket-promedio'], currentValue: ticketLast, goalFormat: 'currency' as const,
    },
    {
      label: 'Margen Bruto', value: `${margenLast.toFixed(1)}%`,
      delta: margenLast - margenPrev, deltaLabel,
      progress: Math.min(Math.round(margenLast), 100), variant: 'default' as const, periodLabel,
      showPeriodToggle: true,
      deltaByPeriod: { week: periodDeltas.week.margenDelta, month: periodDeltas.month.margenDelta, year: periodDeltas.year.margenDelta },
      goalValue: kpiGoals['margen-bruto-pct'], currentValue: margenLast, goalFormat: 'percent' as const,
    },
  ]

  const thProps = (key: string, align: 'left' | 'right' = 'right') => ({
    className: `text-${align} kpi-label pb-2 cursor-pointer select-none`,
    onClick: () => requestSort(key),
    onMouseEnter: (e: React.MouseEvent<HTMLTableCellElement>) => { e.currentTarget.style.background = '#EBF4FF' },
    onMouseLeave: (e: React.MouseEvent<HTMLTableCellElement>) => { e.currentTarget.style.background = '' },
  })

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-sora text-[22px] font-bold text-ink tracking-tight">Ventas</h1>
          <p className="text-slate text-sm mt-0.5">Análisis detallado de tus ventas — {latestPeriodLabel}</p>
        </div>
        <span className="text-xs font-medium px-3 py-1.5 rounded-[8px] self-start sm:self-auto" style={{ background: '#E0F8F8', color: '#0ABFBC' }}>
          Datos actualizados
        </span>
      </div>

      <DateFilterBar
        dates={ventas.map((v) => v.fecha)}
        totalCount={ventas.length}
        filteredCount={filtered.length}
        filters={filters}
        onFilterChange={setFilters}
      />

      {smallSample && filters.month !== null && filtered.length > 0 && (
        <div className="mb-4">
          <span className="text-xs font-medium px-3 py-1.5 rounded-[8px]" style={{ background: '#FEF3E2', color: '#F59E0B' }}>
            ⚠ Muestra pequeña — mes activo con menos de 30 registros
          </span>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyFiltered />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {kpis.map((kpi) => (
              <TrackableElement key={kpi.label} id={`v-kpi-${kpi.label}`} label={VENTAS_KPI_LABELS[kpi.label] ?? kpi.label}>
                <KPICard {...kpi} />
              </TrackableElement>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <TrackableElement id="v-chart-evolucion" label="Gráfica de Evolución de Ventas mensual" className="chart-card lg:col-span-2">
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">Evolución de Ventas</h3>
                  <p className="chart-subtitle">Últimos 6 meses</p>
                </div>
                <span className="chart-badge">
                  {ventasMoM >= 0 ? '↑' : '↓'} {ventasMoM >= 0 ? '+' : ''}{ventasMoM.toFixed(1)}% MoM
                </span>
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D6E4F0" vertical={false} />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#4A6580' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#4A6580' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => [fmt(v as number), 'Ventas']} contentStyle={{ borderRadius: 8, border: '1px solid #D6E4F0', fontSize: 12 }} />
                    <Line type="monotone" dataKey="ventas" stroke={SEMANTIC.blue} strokeWidth={2.5} dot={{ fill: SEMANTIC.blue, r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TrackableElement>

            <TrackableElement id="v-chart-categorias" label="Gráfica de Ventas por Categoría" className="chart-card">
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">Por Categoría</h3>
                  <p className="chart-subtitle">Ventas por segmento</p>
                </div>
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 10, left: 4, bottom: 0 }}>
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#4A6580' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="categoria" tick={{ fontSize: 11, fill: '#4A6580' }} axisLine={false} tickLine={false} width={90} />
                    <Tooltip formatter={(v) => [`${v}%`, 'Participación']} contentStyle={{ borderRadius: 8, border: '1px solid #D6E4F0', fontSize: 12 }} />
                    <Bar dataKey="porcentaje" radius={[0, 4, 4, 0]}>
                      {categoryData.map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TrackableElement>
          </div>

          <TrackableElement id="v-table-top-productos" label="Tabla de Top Productos por facturación en Ventas" className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Top Productos</h3>
                <p className="chart-subtitle">Por facturación total</p>
              </div>
            </div>
            <div className="overflow-x-auto -mx-[22px] px-[22px] md:mx-0 md:px-0">
              <table className="w-full min-w-[580px]">
                <thead>
                  <tr className="border-b border-synk-border">
                    <th {...thProps('producto', 'left')}>Producto <SortIcon column="producto" config={sortConfig} /></th>
                    <th {...thProps('unidades')}>Unidades <SortIcon column="unidades" config={sortConfig} /></th>
                    <th {...thProps('ventas')}>Ventas <SortIcon column="ventas" config={sortConfig} /></th>
                    <th {...thProps('margen')}>Margen <SortIcon column="margen" config={sortConfig} /></th>
                    <th {...thProps('tendencia')}>Tendencia <SortIcon column="tendencia" config={sortConfig} /></th>
                  </tr>
                </thead>
                <tbody>
                  {(sortedProducts as unknown as ProductRow[]).map((p, i) => (
                    <tr key={p.producto} className={i < sortedProducts.length - 1 ? 'border-b border-synk-border/50' : ''}>
                      <td className="py-3 text-sm text-ink font-medium">{p.producto}</td>
                      <td className="py-3 text-sm text-right text-slate">{p.unidades.toLocaleString('es-PA')}</td>
                      <td className="py-3 text-sm text-right text-ink">{fmt(p.ventas)}</td>
                      <td className="py-3 text-sm text-right text-ink">{p.margen.toFixed(1)}%</td>
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
