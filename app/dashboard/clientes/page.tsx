'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { KPICard } from '@/components/dashboard/KPICard'
import { TrackableElement } from '@/components/TrackableElement'
import { DateFilterBar } from '@/components/DateFilterBar'
import { useDateFilters } from '@/hooks/useDateFilters'
import { useSortableTable } from '@/hooks/useSortableTable'
import { SortIcon } from '@/components/SortIcon'
import { CHART_PALETTE } from '@/lib/chart-colors'
import { readKpiGoals } from '@/lib/kpiHelpers'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClienteRow {
  cliente_id: string
  cliente: string
  segmento: string | null
  compras: number | null
  facturacion: number | null
  ultima_compra: string | null
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtCur(v: number): string {
  return new Intl.NumberFormat('es-PA', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v)
}

function fmtNum(v: number): string {
  return new Intl.NumberFormat('es-PA').format(Math.round(v))
}

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

// Segment colors derived dynamically from data — no hardcoded segment names
function getSegmentStyle(segmento: string, allSegments: string[]): { bg: string; color: string } {
  const idx = allSegments.indexOf(segmento)
  const palette = [
    { bg: '#E0F8F8', color: '#0ABFBC' },
    { bg: '#EBF4FF', color: '#1A6FC4' },
    { bg: '#FEF3E2', color: '#F59E0B' },
    { bg: '#FFE9E9', color: '#E05C5C' },
    { bg: '#E8FFF3', color: '#10B981' },
    { bg: '#F0F4FA', color: '#4A6580' },
  ]
  return palette[Math.max(0, idx) % palette.length]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useDateFilters()
  const [kpiGoals, setKpiGoals] = useState<Record<string, number>>({})

  useEffect(() => { setKpiGoals(readKpiGoals()) }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      supabase
        .from('clientes')
        .select('cliente_id, cliente, segmento, compras, facturacion, ultima_compra')
        .eq('user_id', user.id)
        .then(({ data: rows }) => {
          setClientes(rows ?? [])
          setLoading(false)
        })
    })
  }, [])

  // Get all unique segments from real data (no hardcoding)
  const allSegments = useMemo(
    () => [...new Set(clientes.map((c) => c.segmento).filter(Boolean))] as string[],
    [clientes]
  )

  // Apply date filter on ultima_compra
  const filtered = useMemo(() => {
    if (!filters.year) return clientes
    return clientes.filter((c) => {
      const uc = c.ultima_compra
      if (!uc) return false
      const y = parseInt(uc.substring(0, 4))
      const m = parseInt(uc.substring(5, 7))
      const d = parseInt(uc.substring(8, 10))
      if (filters.year && y !== filters.year) return false
      if (filters.month && m !== filters.month) return false
      if (filters.day && d !== filters.day) return false
      return true
    })
  }, [clientes, filters])

  // Derive KPI and chart data from filtered set
  const derived = useMemo(() => {
    const totalClientes = filtered.length
    const facturacionTotal = filtered.reduce((s, c) => s + (c.facturacion ?? 0), 0)
    const totalCompras = filtered.reduce((s, c) => s + (c.compras ?? 0), 0)
    const promedioCompras = totalClientes > 0 ? totalCompras / totalClientes : 0
    const ticketPromedio = totalCompras > 0 ? facturacionTotal / totalCompras : 0

    const topClientes = [...filtered]
      .sort((a, b) => (b.facturacion ?? 0) - (a.facturacion ?? 0))
      .slice(0, 8)
      .map((c) => ({
        cliente: c.cliente.length > 18 ? c.cliente.slice(0, 16) + '…' : c.cliente,
        facturacion: c.facturacion ?? 0,
      }))

    const segMap = new Map<string, { count: number; facturacion: number }>()
    for (const c of filtered) {
      const seg = c.segmento || 'Sin segmento'
      const prev = segMap.get(seg) ?? { count: 0, facturacion: 0 }
      segMap.set(seg, { count: prev.count + 1, facturacion: prev.facturacion + (c.facturacion ?? 0) })
    }
    const segmentoData = Array.from(segMap.entries())
      .map(([segmento, { count, facturacion }]) => ({ segmento, clientes: count, facturacion }))
      .sort((a, b) => b.clientes - a.clientes)

    const sortedClientes: ClienteRow[] = [...filtered].sort((a, b) => (b.facturacion ?? 0) - (a.facturacion ?? 0))

    return { totalClientes, facturacionTotal, promedioCompras, ticketPromedio, topClientes, segmentoData, sortedClientes }
  }, [filtered])

  // Sortable table hook — called unconditionally
  const { sortedData: sortedClientes, sortConfig, requestSort } = useSortableTable(
    derived.sortedClientes as unknown as Record<string, unknown>[]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate text-sm">Cargando datos...</p>
      </div>
    )
  }

  if (clientes.length === 0) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="font-sora text-[22px] font-bold text-ink tracking-tight">Clientes</h1>
            <p className="text-slate text-sm mt-0.5">Análisis de tu base de clientes</p>
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
          <p className="text-slate text-sm">Importa tu archivo de clientes para comenzar.</p>
          <a href="/dashboard/datos" className="mt-5 px-5 py-2 rounded-[9px] text-sm font-medium text-white" style={{ background: '#1A6FC4' }}>
            Ir a Datos
          </a>
        </div>
      </div>
    )
  }

  const { totalClientes, facturacionTotal, promedioCompras, ticketPromedio, topClientes, segmentoData } = derived
  const periodLabel = buildPeriodLabel(filters.year, filters.month, filters.day)

  // Dates for filter bar (from ultima_compra)
  const allDates = clientes.map((c) => c.ultima_compra ?? '').filter(Boolean)

  const CLIENTES_KPI_LABELS: Record<string, string> = {
    'Total Clientes':    'KPI de Total de Clientes registrados',
    'Facturación Total': 'KPI de Facturación Total acumulada por todos los clientes',
    'Promedio Compras':  'KPI de Promedio de Compras por cliente',
    'Ticket Promedio':   'KPI de Ticket Promedio por compra de clientes',
  }

  const ZERO_PERIOD = { week: 0, month: 0, year: 0 }
  const kpis = [
    {
      label: 'Total Clientes', value: fmtNum(totalClientes), delta: 0, deltaLabel: 'registrados',
      progress: 100, variant: 'default' as const, periodLabel,
      showPeriodToggle: true, deltaByPeriod: ZERO_PERIOD,
      goalValue: kpiGoals['total-clientes'], currentValue: totalClientes, goalFormat: 'number' as const,
    },
    {
      label: 'Facturación Total', value: fmtCur(facturacionTotal), delta: 0, deltaLabel: 'acumulada',
      progress: 78, variant: 'teal' as const, periodLabel,
      showPeriodToggle: true, deltaByPeriod: ZERO_PERIOD,
      goalValue: kpiGoals['facturacion-clientes'], currentValue: facturacionTotal, goalFormat: 'currency' as const,
    },
    {
      label: 'Promedio Compras', value: promedioCompras.toFixed(1), delta: 0, deltaLabel: 'compras por cliente',
      progress: Math.min(Math.round(promedioCompras * 5), 100), variant: 'amber' as const, periodLabel,
      showPeriodToggle: true, deltaByPeriod: ZERO_PERIOD,
      goalValue: kpiGoals['promedio-compras'], currentValue: promedioCompras, goalFormat: 'number' as const,
    },
    {
      label: 'Ticket Promedio', value: fmtCur(ticketPromedio), delta: 0, deltaLabel: 'facturación / compras',
      progress: 65, variant: 'default' as const, periodLabel,
      showPeriodToggle: true, deltaByPeriod: ZERO_PERIOD,
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
          <h1 className="font-sora text-[22px] font-bold text-ink tracking-tight">Clientes</h1>
          <p className="text-slate text-sm mt-0.5">
            Análisis de tu base de clientes — {clientes.length} registros
          </p>
        </div>
        <span className="text-xs font-medium px-3 py-1.5 rounded-[8px] self-start sm:self-auto" style={{ background: '#E0F8F8', color: '#0ABFBC' }}>
          Datos actualizados
        </span>
      </div>

      <DateFilterBar
        dates={allDates}
        totalCount={clientes.length}
        filteredCount={filtered.length}
        filters={filters}
        onFilterChange={setFilters}
      />

      {filtered.length === 0 ? (
        <EmptyFiltered />
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {kpis.map((kpi) => (
              <TrackableElement key={kpi.label} id={`cli-kpi-${kpi.label}`} label={CLIENTES_KPI_LABELS[kpi.label] ?? kpi.label}>
                <KPICard {...kpi} />
              </TrackableElement>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <TrackableElement id="cli-chart-top" label="Gráfica de Top Clientes por facturación" className="chart-card lg:col-span-2">
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">Top Clientes</h3>
                  <p className="chart-subtitle">Por facturación total</p>
                </div>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topClientes} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D6E4F0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#4A6580' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="cliente" tick={{ fontSize: 11, fill: '#4A6580' }} axisLine={false} tickLine={false} width={110} />
                    <Tooltip formatter={(v) => [fmtCur(v as number), 'Facturación']} contentStyle={{ borderRadius: 8, border: '1px solid #D6E4F0', fontSize: 12 }} />
                    <Bar dataKey="facturacion" radius={[0, 4, 4, 0]}>
                      {topClientes.map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TrackableElement>

            <TrackableElement id="cli-chart-segmento" label="Gráfica de Clientes por Segmento" className="chart-card">
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">Por Segmento</h3>
                  <p className="chart-subtitle">Clientes por tipo</p>
                </div>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={segmentoData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D6E4F0" vertical={false} />
                    <XAxis dataKey="segmento" tick={{ fontSize: 11, fill: '#4A6580' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#4A6580' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      formatter={(v, name) => [
                        name === 'clientes' ? `${v} clientes` : fmtCur(v as number),
                        name === 'clientes' ? 'Clientes' : 'Facturación',
                      ]}
                      contentStyle={{ borderRadius: 8, border: '1px solid #D6E4F0', fontSize: 12 }}
                    />
                    <Bar dataKey="clientes" radius={[4, 4, 0, 0]}>
                      {segmentoData.map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TrackableElement>
          </div>

          {/* Clients table */}
          <TrackableElement id="cli-table-detalle" label="Tabla de Detalle de Clientes" className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Detalle de Clientes</h3>
                <p className="chart-subtitle">Por facturación total</p>
              </div>
            </div>
            {/* Mobile: card stacking */}
            <div className="md:hidden space-y-3 pt-1">
              {(sortedClientes as unknown as ClienteRow[]).map((c, i) => {
                const style = c.segmento ? getSegmentStyle(c.segmento, allSegments) : { bg: '#F0F4FA', color: '#4A6580' }
                return (
                  <div key={`m-${c.cliente_id}-${i}`} className="rounded-[10px] border p-4" style={{ borderColor: '#D6E4F0' }}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 pr-2">
                        <p className="text-sm font-medium text-ink">{c.cliente}</p>
                        <p className="text-[10px] font-mono mt-0.5" style={{ color: '#4A6580' }}>{c.cliente_id}</p>
                      </div>
                      {c.segmento ? (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0" style={{ background: style.bg, color: style.color }}>
                          {c.segmento}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: '#4A6580' }}>—</span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide" style={{ color: '#4A6580' }}>Compras</p>
                        <p className="text-sm font-medium mt-0.5" style={{ color: '#4A6580' }}>{fmtNum(c.compras ?? 0)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide" style={{ color: '#4A6580' }}>Facturación</p>
                        <p className="text-sm font-medium mt-0.5" style={{ color: '#0A1628' }}>{fmtCur(c.facturacion ?? 0)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide" style={{ color: '#4A6580' }}>Última Compra</p>
                        <p className="text-sm font-medium mt-0.5" style={{ color: '#4A6580' }}>{c.ultima_compra ?? '—'}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Desktop: full table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[580px]">
                <thead>
                  <tr className="border-b border-synk-border">
                    <th {...thProps('cliente_id', 'left')}>ID <SortIcon column="cliente_id" config={sortConfig} /></th>
                    <th {...thProps('cliente', 'left')}>Cliente <SortIcon column="cliente" config={sortConfig} /></th>
                    <th {...thProps('segmento', 'left')}>Segmento <SortIcon column="segmento" config={sortConfig} /></th>
                    <th {...thProps('compras')}>Compras <SortIcon column="compras" config={sortConfig} /></th>
                    <th {...thProps('facturacion')}>Facturación <SortIcon column="facturacion" config={sortConfig} /></th>
                    <th {...thProps('ultima_compra')}>Última Compra <SortIcon column="ultima_compra" config={sortConfig} /></th>
                  </tr>
                </thead>
                <tbody>
                  {(sortedClientes as unknown as ClienteRow[]).map((c, i) => {
                    const style = c.segmento ? getSegmentStyle(c.segmento, allSegments) : { bg: '#F0F4FA', color: '#4A6580' }
                    return (
                      <tr key={`${c.cliente_id}-${i}`} className={i < sortedClientes.length - 1 ? 'border-b border-synk-border/50' : ''}>
                        <td className="py-3 text-xs text-slate font-mono">{c.cliente_id}</td>
                        <td className="py-3 text-sm text-ink font-medium">{c.cliente}</td>
                        <td className="py-3 text-sm">
                          {c.segmento ? (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: style.bg, color: style.color }}>
                              {c.segmento}
                            </span>
                          ) : (
                            <span className="text-slate text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3 text-sm text-right text-slate">{fmtNum(c.compras ?? 0)}</td>
                        <td className="py-3 text-sm text-right text-ink font-medium">{fmtCur(c.facturacion ?? 0)}</td>
                        <td className="py-3 text-sm text-right text-slate">{c.ultima_compra ?? '—'}</td>
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
