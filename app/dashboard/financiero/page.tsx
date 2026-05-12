'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { KPICard } from '@/components/dashboard/KPICard'
import { TrackableElement } from '@/components/TrackableElement'
import { DateFilterBar } from '@/components/DateFilterBar'
import { useDateFilters } from '@/hooks/useDateFilters'
import { useSortableTable } from '@/hooks/useSortableTable'
import { SortIcon } from '@/components/SortIcon'
import { SEMANTIC } from '@/lib/chart-colors'
import { computeAllPeriodDeltas, readKpiGoals } from '@/lib/kpiHelpers'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts'

interface VentaRow {
  fecha: string
  unidades: number | null
  precio_unitario: number | null
  costo_unitario: number | null
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

const WATERFALL_COLORS: Record<string, string> = {
  total: SEMANTIC.blue,
  subtotal: SEMANTIC.green,
  costo: SEMANTIC.red,
}

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

interface MonthRow {
  mes: string
  ingresos: number
  costos: number
  ebitda: number
}

export default function FinancieroPage() {
  const [ventas, setVentas] = useState<VentaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useDateFilters()
  const [kpiGoals, setKpiGoals] = useState<Record<string, number>>({})
  const autoSelectedRef = useRef(false)

  useEffect(() => { setKpiGoals(readKpiGoals()) }, [])

  useEffect(() => {
    if (autoSelectedRef.current || filters.year !== null || ventas.length === 0) return
    const years = [...new Set(ventas.map(r => parseInt(r.fecha.substring(0, 4))))].filter(y => !isNaN(y)).sort((a, b) => b - a)
    if (years.length > 0) {
      autoSelectedRef.current = true
      setFilters({ year: years[0], month: null, day: null })
    }
  }, [ventas, filters.year, setFilters])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      supabase
        .from('ventas')
        .select('fecha, unidades, precio_unitario, costo_unitario')
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

  // Compute derived data
  const derived = useMemo(() => {
    const monthlyMap = new Map<string, { ingresos: number; costos: number }>()
    for (const row of filtered) {
      const month = row.fecha.substring(0, 7)
      const ingreso = (row.unidades ?? 0) * (row.precio_unitario ?? 0)
      const costo = (row.unidades ?? 0) * (row.costo_unitario ?? 0)
      const prev = monthlyMap.get(month) ?? { ingresos: 0, costos: 0 }
      monthlyMap.set(month, { ingresos: prev.ingresos + ingreso, costos: prev.costos + costo })
    }
    const sortedMonths = Array.from(monthlyMap.keys()).sort()
    const financialMonthly: MonthRow[] = sortedMonths.slice(-6).map((key) => {
      const d = monthlyMap.get(key)!
      return {
        mes: MONTH_LABELS[key.substring(5)] ?? key.substring(5),
        ingresos: Math.round(d.ingresos),
        costos: Math.round(d.costos),
        ebitda: Math.round(d.ingresos - d.costos),
      }
    })
    const current = financialMonthly.at(-1) ?? { mes: '', ingresos: 0, costos: 0, ebitda: 0 }
    const margenBruto = current.ingresos > 0 ? (current.ebitda / current.ingresos) * 100 : 0
    const latestPeriodLabel = sortedMonths.at(-1)
      ? (() => {
          const [year, month] = sortedMonths.at(-1)!.split('-')
          return `${MONTH_NAMES[parseInt(month, 10)]} ${year}`
        })()
      : 'Período actual'
    const waterfallData = [
      { nombre: 'Ingresos', base: 0, valor: current.ingresos, tipo: 'total' },
      { nombre: 'Costo merc.', base: current.ebitda, valor: current.costos, tipo: 'costo' },
      { nombre: 'Margen bruto', base: 0, valor: current.ebitda > 0 ? current.ebitda : 0, tipo: 'subtotal' },
    ]

    // ── Smart delta ──────────────────────────────────────────────────────────
    let curIngresos = 0, prevIngresos = 0, curCostos = 0, prevCostos = 0
    let deltaLabel = 'vs período anterior'

    if (filters.month !== null) {
      const activeMonth = filters.month
      const activeYear = filters.year ?? parseInt(sortedMonths.at(-1)?.substring(0, 4) ?? '0')
      const prevMonthNum = activeMonth === 1 ? 12 : activeMonth - 1
      const prevMonthYear = activeMonth === 1 ? activeYear - 1 : activeYear
      const activeKey = `${activeYear}-${String(activeMonth).padStart(2, '0')}`
      const prevKey = `${prevMonthYear}-${String(prevMonthNum).padStart(2, '0')}`
      for (const row of ventas) {
        const key = row.fecha.substring(0, 7)
        const ing = (row.unidades ?? 0) * (row.precio_unitario ?? 0)
        const cos = (row.unidades ?? 0) * (row.costo_unitario ?? 0)
        if (key === activeKey) { curIngresos += ing; curCostos += cos }
        else if (key === prevKey) { prevIngresos += ing; prevCostos += cos }
      }
      deltaLabel = 'vs mes anterior'
    } else if (filters.year !== null) {
      for (const row of filtered) {
        const m = parseInt(row.fecha.substring(5, 7))
        const ing = (row.unidades ?? 0) * (row.precio_unitario ?? 0)
        const cos = (row.unidades ?? 0) * (row.costo_unitario ?? 0)
        if (m <= 6) { prevIngresos += ing; prevCostos += cos }
        else        { curIngresos += ing; curCostos += cos }
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
          if      (y === latestYear) { curIngresos += ing; curCostos += cos }
          else if (y === prevYear)   { prevIngresos += ing; prevCostos += cos }
        }
        deltaLabel = 'vs año anterior'
      } else {
        for (const row of ventas) {
          const m = parseInt(row.fecha.substring(5, 7))
          const ing = (row.unidades ?? 0) * (row.precio_unitario ?? 0)
          const cos = (row.unidades ?? 0) * (row.costo_unitario ?? 0)
          if (m <= 6) { prevIngresos += ing; prevCostos += cos }
          else        { curIngresos += ing; curCostos += cos }
        }
        deltaLabel = 'H2 vs H1'
      }
    }

    const curEbitda = curIngresos - curCostos
    const prevEbitda = prevIngresos - prevCostos
    const curMargenPct  = curIngresos  > 0 ? (curEbitda  / curIngresos)  * 100 : 0
    const prevMargenPct = prevIngresos > 0 ? (prevEbitda / prevIngresos) * 100 : 0

    return {
      financialMonthly, current, margenBruto, latestPeriodLabel, waterfallData,
      curIngresos, prevIngresos, curCostos, prevCostos,
      curEbitda, prevEbitda, curMargenPct, prevMargenPct, deltaLabel,
      hasCompData: prevIngresos > 0,
    }
  }, [filtered, ventas, filters.year, filters.month])

  const periodDeltas = useMemo(() => computeAllPeriodDeltas(ventas), [ventas])

  // Sortable table — hook called unconditionally
  const tableData = useMemo(
    () => [...derived.financialMonthly].reverse(),
    [derived.financialMonthly]
  )
  const { sortedData: sortedMonths, sortConfig, requestSort } = useSortableTable(
    tableData as unknown as Record<string, unknown>[]
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
            <h1 className="font-sora text-[22px] font-bold text-ink tracking-tight">Financiero</h1>
            <p className="text-slate text-sm mt-0.5">Estado financiero de tu negocio</p>
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
    financialMonthly, current, margenBruto, latestPeriodLabel, waterfallData,
    curIngresos, prevIngresos, curCostos, prevCostos,
    curEbitda, prevEbitda, curMargenPct, prevMargenPct, deltaLabel, hasCompData,
  } = derived
  const periodLabel = buildPeriodLabel(filters.year, filters.month, filters.day)
  const displayPeriod = filters.month && filters.year
    ? `${MONTH_NAMES[filters.month]} ${filters.year}`
    : filters.year ? String(filters.year) : latestPeriodLabel

  const FINANCIERO_KPI_LABELS: Record<string, string> = {
    'Ingresos Totales': 'KPI de Ingresos Totales del último mes',
    'Costos Totales':   'KPI de Costos Totales del último mes',
    'Margen Bruto':     'KPI de Margen Bruto en valor monetario',
    'Margen %':         'KPI de Porcentaje de Margen Bruto',
  }

  const kpis = [
    {
      label: 'Ingresos Totales', value: fmt(current.ingresos),
      delta: prevIngresos > 0 ? ((curIngresos - prevIngresos) / prevIngresos) * 100 : 0, deltaLabel,
      progress: 74, variant: 'default' as const, periodLabel,
      showPeriodToggle: true,
      deltaByPeriod: { week: periodDeltas.week.ingresosDelta, month: periodDeltas.month.ingresosDelta, year: periodDeltas.year.ingresosDelta },
      goalValue: kpiGoals['ventas-totales'], currentValue: current.ingresos, goalFormat: 'currency' as const,
      noComparison: !hasCompData,
    },
    {
      label: 'Costos Totales', value: fmt(current.costos),
      delta: prevCostos > 0 ? ((curCostos - prevCostos) / prevCostos) * 100 : 0, deltaLabel,
      progress: 68, variant: 'red' as const, periodLabel,
      showPeriodToggle: true,
      deltaByPeriod: { week: periodDeltas.week.costosDelta, month: periodDeltas.month.costosDelta, year: periodDeltas.year.costosDelta },
      goalValue: kpiGoals['costos-totales'], currentValue: current.costos, goalFormat: 'currency' as const,
      noComparison: !hasCompData,
    },
    {
      label: 'Margen Bruto', value: fmt(current.ebitda),
      delta: prevEbitda > 0 ? ((curEbitda - prevEbitda) / prevEbitda) * 100 : 0, deltaLabel,
      progress: 82, variant: 'teal' as const, periodLabel,
      showPeriodToggle: true,
      deltaByPeriod: { week: periodDeltas.week.ventasDelta, month: periodDeltas.month.ventasDelta, year: periodDeltas.year.ventasDelta },
      goalValue: kpiGoals['margen-bruto-usd'], currentValue: current.ebitda, goalFormat: 'currency' as const,
      noComparison: !hasCompData,
    },
    {
      label: 'Margen %', value: `${margenBruto.toFixed(1)}%`,
      delta: prevIngresos > 0 ? curMargenPct - prevMargenPct : 0, deltaLabel,
      progress: Math.min(Math.round(margenBruto), 100), variant: 'amber' as const, periodLabel,
      showPeriodToggle: true,
      deltaByPeriod: { week: periodDeltas.week.margenDelta, month: periodDeltas.month.margenDelta, year: periodDeltas.year.margenDelta },
      goalValue: kpiGoals['margen-bruto-pct'], currentValue: margenBruto, goalFormat: 'percent' as const,
      noComparison: !hasCompData,
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
          <h1 className="font-sora text-[22px] font-bold text-ink tracking-tight">Financiero</h1>
          <p className="text-slate text-sm mt-0.5">Estado financiero de tu negocio — {displayPeriod}</p>
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

      {filtered.length === 0 ? (
        <EmptyFiltered />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {kpis.map((kpi) => (
              <TrackableElement key={kpi.label} id={`fin-kpi-${kpi.label}`} label={FINANCIERO_KPI_LABELS[kpi.label] ?? kpi.label}>
                <KPICard {...kpi} />
              </TrackableElement>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <TrackableElement id="fin-chart-ingresos" label="Gráfica de Evolución Financiera mensual" className="chart-card lg:col-span-2">
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">Ingresos vs Costos</h3>
                  <p className="chart-subtitle">Últimos 6 meses</p>
                </div>
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialMonthly} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D6E4F0" vertical={false} />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#4A6580' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#4A6580' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => [fmt(v as number)]} contentStyle={{ borderRadius: 8, border: '1px solid #D6E4F0', fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#4A6580', paddingTop: 8 }} />
                    <Bar dataKey="ingresos" name="Ingresos" fill={SEMANTIC.blue} stackId="a" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="costos" name="Costos" fill={SEMANTIC.red} stackId="b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TrackableElement>

            <TrackableElement id="fin-chart-cascada" label="Gráfica de Cascada de Resultados financieros" className="chart-card">
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">Cascada de Resultados</h3>
                  <p className="chart-subtitle">De ingresos a margen bruto</p>
                </div>
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={waterfallData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D6E4F0" vertical={false} />
                    <XAxis dataKey="nombre" tick={{ fontSize: 10, fill: '#4A6580' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#4A6580' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v, name) => name === 'base' ? null : [fmt(v as number), 'Valor']} contentStyle={{ borderRadius: 8, border: '1px solid #D6E4F0', fontSize: 12 }} />
                    <Bar dataKey="base" stackId="w" fill="transparent" legendType="none" />
                    <Bar dataKey="valor" stackId="w" radius={[4, 4, 0, 0]}>
                      {waterfallData.map((entry, i) => <Cell key={i} fill={WATERFALL_COLORS[entry.tipo]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TrackableElement>
          </div>

          <TrackableElement id="fin-table-resumen" label="Tabla de Resumen Financiero Mensual" className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Resumen Financiero Mensual</h3>
                <p className="chart-subtitle">Últimos 6 meses</p>
              </div>
            </div>
            {/* Mobile: card stacking */}
            <div className="md:hidden space-y-3 pt-1">
              {(sortedMonths as unknown as MonthRow[]).map((row, i) => {
                const margen = row.ingresos > 0 ? ((row.ebitda / row.ingresos) * 100).toFixed(1) : '0.0'
                return (
                  <div key={`m-${row.mes}-${i}`} className="rounded-[10px] border p-4" style={{ borderColor: '#D6E4F0' }}>
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-sm font-medium text-ink">{row.mes}</p>
                      <span className="pill high">{margen}%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide" style={{ color: '#4A6580' }}>Ingresos</p>
                        <p className="text-sm font-medium mt-0.5" style={{ color: '#0A1628' }}>{fmt(row.ingresos)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide" style={{ color: '#4A6580' }}>Costos</p>
                        <p className="text-sm font-medium mt-0.5" style={{ color: '#4A6580' }}>{fmt(row.costos)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide" style={{ color: '#4A6580' }}>Margen bruto</p>
                        <p className="text-sm font-medium mt-0.5" style={{ color: '#0A1628' }}>{fmt(row.ebitda)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Desktop: full table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr className="border-b border-synk-border">
                    <th {...thProps('mes', 'left')}>Mes <SortIcon column="mes" config={sortConfig} /></th>
                    <th {...thProps('ingresos')}>Ingresos <SortIcon column="ingresos" config={sortConfig} /></th>
                    <th {...thProps('costos')}>Costos <SortIcon column="costos" config={sortConfig} /></th>
                    <th {...thProps('ebitda')}>Margen bruto <SortIcon column="ebitda" config={sortConfig} /></th>
                    <th className="text-right kpi-label pb-2">Margen %</th>
                  </tr>
                </thead>
                <tbody>
                  {(sortedMonths as unknown as MonthRow[]).map((row, i) => {
                    const margen = row.ingresos > 0 ? ((row.ebitda / row.ingresos) * 100).toFixed(1) : '0.0'
                    return (
                      <tr key={`${row.mes}-${i}`} className={i < sortedMonths.length - 1 ? 'border-b border-synk-border/50' : ''}>
                        <td className="py-3 text-sm text-ink font-medium">{row.mes}</td>
                        <td className="py-3 text-sm text-right text-ink">{fmt(row.ingresos)}</td>
                        <td className="py-3 text-sm text-right text-slate">{fmt(row.costos)}</td>
                        <td className="py-3 text-sm text-right text-ink">{fmt(row.ebitda)}</td>
                        <td className="py-3 text-sm text-right">
                          <span className="pill high">{margen}%</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </TrackableElement>
        </>
      )}
    </div>
  )
}
