'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { KPICard } from '@/components/dashboard/KPICard'
import { TrackableElement } from '@/components/TrackableElement'
import { useSortableTable } from '@/hooks/useSortableTable'
import { SortIcon } from '@/components/SortIcon'
import { CHART_PALETTE, SEMANTIC } from '@/lib/chart-colors'
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
  Legend,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface InventarioRow {
  producto: string
  categoria: string
  stock_actual: number | null
  stock_minimo: number | null
  rotacion: number | null
  costo_unitario: number | null
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtNum(v: number): string {
  return new Intl.NumberFormat('es-PA').format(Math.round(v))
}

function fmtCur(v: number): string {
  return new Intl.NumberFormat('es-PA', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v)
}

function GlobalBadge() {
  return (
    <span
      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
      style={{ background: '#F0F4FA', color: '#4A6580', border: '1px solid #D6E4F0' }}
    >
      Vista global · No afectada por filtros
    </span>
  )
}

// ─── Custom tooltip for Stock chart ──────────────────────────────────────────

function StockTooltip({ active, payload }: {
  active?: boolean
  payload?: Array<{ dataKey: string; value: number; payload: { producto: string; stock_actual: number; stock_minimo: number; alerta: boolean } }>
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{ borderRadius: 8, border: '1px solid #D6E4F0', fontSize: 12, background: '#fff', padding: '8px 12px', minWidth: 170 }}>
      <p style={{ fontWeight: 600, color: '#1E2A3B', marginBottom: 6 }}>{d.producto}</p>
      <p style={{ color: '#4A6580', marginBottom: 2 }}>
        Stock Actual: <strong style={{ color: d.alerta ? '#E05C5C' : '#1A6FC4' }}>{fmtNum(d.stock_actual)}</strong>
      </p>
      <p style={{ color: '#4A6580', marginBottom: 2 }}>
        Umbral mínimo: <strong style={{ color: '#F59E0B' }}>{fmtNum(d.stock_minimo)}</strong>
      </p>
      {d.alerta && <p style={{ color: '#E05C5C', marginTop: 6, fontSize: 11 }}>⚠ Bajo mínimo</p>}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InventarioPage() {
  const [items, setItems] = useState<InventarioRow[]>([])
  const [loading, setLoading] = useState(true)
  const [kpiGoals, setKpiGoals] = useState<Record<string, number>>({})

  useEffect(() => { setKpiGoals(readKpiGoals()) }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      supabase
        .from('inventario')
        .select('producto, categoria, stock_actual, stock_minimo, rotacion, costo_unitario')
        .eq('user_id', user.id)
        .then(({ data: rows }) => {
          setItems(rows ?? [])
          setLoading(false)
        })
    })
  }, [])

  // Bug fix: categories always derived from real data, never hardcoded
  const rotacionData = useMemo(() => {
    const catRotMap = new Map<string, { sum: number; count: number }>()
    for (const item of items) {
      const cat = item.categoria || 'Otro'
      const prev = catRotMap.get(cat) ?? { sum: 0, count: 0 }
      catRotMap.set(cat, { sum: prev.sum + (item.rotacion ?? 0), count: prev.count + 1 })
    }
    return Array.from(catRotMap.entries())
      .map(([categoria, { sum, count }]) => ({
        categoria,
        rotacion: Math.round((sum / count) * 10) / 10,
      }))
      .sort((a, b) => b.rotacion - a.rotacion)
  }, [items])

  // Aggregate rows by product name — one entry per unique product
  const groupedItems = useMemo(() => {
    const map = new Map<string, {
      producto: string; categoria: string
      stock_actual: number; stock_minimo: number
      rotacion_sum: number; rotacion_count: number
      costo_unitario_sum: number; costo_unitario_count: number
    }>()
    for (const item of items) {
      const key = item.producto
      const prev = map.get(key)
      if (prev) {
        prev.stock_actual     += item.stock_actual  ?? 0
        prev.stock_minimo     += item.stock_minimo  ?? 0
        prev.rotacion_sum     += item.rotacion      ?? 0
        prev.rotacion_count   += 1
        prev.costo_unitario_sum   += item.costo_unitario ?? 0
        prev.costo_unitario_count += 1
      } else {
        map.set(key, {
          producto: item.producto,
          categoria: item.categoria || '',
          stock_actual:         item.stock_actual  ?? 0,
          stock_minimo:         item.stock_minimo  ?? 0,
          rotacion_sum:         item.rotacion      ?? 0,
          rotacion_count:       1,
          costo_unitario_sum:   item.costo_unitario ?? 0,
          costo_unitario_count: 1,
        })
      }
    }
    return Array.from(map.values()).map((g): InventarioRow => ({
      producto:       g.producto,
      categoria:      g.categoria,
      stock_actual:   g.stock_actual,
      stock_minimo:   g.stock_minimo,
      rotacion:       g.rotacion_count > 0 ? g.rotacion_sum / g.rotacion_count : null,
      costo_unitario: g.costo_unitario_count > 0 ? g.costo_unitario_sum / g.costo_unitario_count : null,
    }))
  }, [items])

  // Sorted table data for useSortableTable (hook must be unconditional)
  const tableRows = useMemo(() => {
    return [...groupedItems]
      .sort((a, b) => {
        const aAlert = (a.stock_actual ?? 0) < (a.stock_minimo ?? 0) ? 0 : 1
        const bAlert = (b.stock_actual ?? 0) < (b.stock_minimo ?? 0) ? 0 : 1
        return aAlert - bAlert
      })
      .map((item) => ({
        ...item,
        // numeric field: 0 = alert (bajo mínimo), 1 = ok — enables useSortableTable to sort estado
        estado_ord: (item.stock_actual ?? 0) < (item.stock_minimo ?? 0) ? 0 : 1,
      }))
  }, [groupedItems])

  const { sortedData: sortedItems, sortConfig, requestSort } = useSortableTable(
    tableRows as unknown as Record<string, unknown>[]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate text-sm">Cargando datos...</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="font-sora text-[22px] font-bold text-ink tracking-tight">Inventario</h1>
            <p className="text-slate text-sm mt-0.5">Control de stock y rotación</p>
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
          <p className="text-slate text-sm">Importa tu archivo de inventario para comenzar.</p>
          <a href="/dashboard/datos" className="mt-5 px-5 py-2 rounded-[9px] text-sm font-medium text-white" style={{ background: '#1A6FC4' }}>
            Ir a Datos
          </a>
        </div>
      </div>
    )
  }

  // ─── Compute KPIs ─────────────────────────────────────────────────────────

  const totalProductos = groupedItems.length
  const bajoMinimo = groupedItems.filter((i) => (i.stock_actual ?? 0) < (i.stock_minimo ?? 0)).length
  const rotacionProm = groupedItems.reduce((s, i) => s + (i.rotacion ?? 0), 0) / (totalProductos || 1)
  const valorInventario = groupedItems.reduce((s, i) => s + (i.stock_actual ?? 0) * (i.costo_unitario ?? 0), 0)

  // Stock vs Mínimo chart (top 8 por stock)
  const stockData = [...groupedItems]
    .sort((a, b) => (b.stock_actual ?? 0) - (a.stock_actual ?? 0))
    .slice(0, 8)
    .map((i) => ({
      producto: i.producto,
      stock_actual: i.stock_actual ?? 0,
      stock_minimo: i.stock_minimo ?? 0,
      alerta: (i.stock_actual ?? 0) < (i.stock_minimo ?? 0),
    }))

  const INVENTARIO_KPI_LABELS: Record<string, string> = {
    'Total Productos':   'KPI de Total de Productos en inventario',
    'Bajo Stock Mínimo': 'KPI de Productos bajo stock mínimo (alertas)',
    'Rotación Promedio': 'KPI de Rotación Promedio del inventario',
    'Valor Inventario':  'KPI de Valor total del inventario a costo',
  }

  const ZERO_PERIOD = { week: 0, month: 0, year: 0 }
  const kpis = [
    {
      label: 'Total Productos', value: fmtNum(totalProductos), delta: 0, deltaLabel: 'en inventario',
      progress: 100, variant: 'default' as const,
      showPeriodToggle: true, deltaByPeriod: ZERO_PERIOD, noComparison: true,
      goalValue: kpiGoals['total-productos'], currentValue: totalProductos, goalFormat: 'number' as const,
    },
    {
      label: 'Bajo Stock Mínimo', value: String(bajoMinimo),
      delta: totalProductos > 0 ? -(bajoMinimo / totalProductos) * 100 : 0, deltaLabel: `de ${totalProductos} productos`,
      progress: totalProductos > 0 ? Math.round((bajoMinimo / totalProductos) * 100) : 0,
      variant: bajoMinimo > 0 ? 'red' as const : 'teal' as const,
      showPeriodToggle: true, deltaByPeriod: ZERO_PERIOD, noComparison: true,
      goalValue: kpiGoals['bajo-stock'], currentValue: bajoMinimo, goalFormat: 'number' as const, invertGoal: true,
    },
    {
      label: 'Rotación Promedio', value: `${rotacionProm.toFixed(1)}x`, delta: 0, deltaLabel: 'veces por período',
      progress: Math.min(Math.round(rotacionProm * 10), 100), variant: 'teal' as const,
      showPeriodToggle: true, deltaByPeriod: ZERO_PERIOD, noComparison: true,
      goalValue: kpiGoals['rotacion-promedio'], currentValue: rotacionProm, goalFormat: 'number' as const,
    },
    {
      label: 'Valor Inventario', value: fmtCur(valorInventario), delta: 0, deltaLabel: 'stock × costo unit.',
      progress: 72, variant: 'amber' as const,
      showPeriodToggle: true, deltaByPeriod: ZERO_PERIOD, noComparison: true,
      goalValue: kpiGoals['valor-inventario'], currentValue: valorInventario, goalFormat: 'currency' as const,
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
          <h1 className="font-sora text-[22px] font-bold text-ink tracking-tight">Inventario</h1>
          <p className="text-slate text-sm mt-0.5">Control de stock y rotación — {totalProductos} productos</p>
        </div>
        <span className="text-xs font-medium px-3 py-1.5 rounded-[8px] self-start sm:self-auto" style={{ background: '#E0F8F8', color: '#0ABFBC' }}>
          Datos actualizados
        </span>
      </div>

      {/* KPIs — react al estado actual del inventario */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi) => (
          <TrackableElement key={kpi.label} id={`inv-kpi-${kpi.label}`} label={INVENTARIO_KPI_LABELS[kpi.label] ?? kpi.label}>
            <KPICard {...kpi} />
          </TrackableElement>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Stock actual vs mínimo — ESTÁTICO (es estado actual, no histórico) */}
        <TrackableElement id="inv-chart-stock" label="Gráfica de Stock Actual vs Mínimo por producto" className="chart-card lg:col-span-2">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Stock Actual vs Mínimo</h3>
              <p className="chart-subtitle">Top 8 productos por volumen</p>
            </div>
            <div className="flex items-center gap-2">
              {bajoMinimo > 0 && (
                <span className="chart-badge neg">⚠ {bajoMinimo} alerta{bajoMinimo > 1 ? 's' : ''}</span>
              )}
              <GlobalBadge />
            </div>
          </div>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D6E4F0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#4A6580' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="producto" tick={{ fontSize: 10, fill: '#4A6580' }} axisLine={false} tickLine={false} width={130} />
                <Tooltip content={<StockTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
                <Bar dataKey="stock_actual" name="Stock Actual" radius={[0, 3, 3, 0]}>
                  {stockData.map((entry, i) => <Cell key={i} fill={entry.alerta ? SEMANTIC.red : SEMANTIC.blue} />)}
                </Bar>
                <Bar
                  dataKey="stock_minimo"
                  name={`Umbral mínimo${bajoMinimo > 0 ? ` (${bajoMinimo} alerta${bajoMinimo !== 1 ? 's' : ''})` : ''}`}
                  fill={CHART_PALETTE[6]}
                  fillOpacity={0.85}
                  radius={[0, 3, 3, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TrackableElement>

        {/* Rotación por categoría — ESTÁTICO (promedio global) */}
        <TrackableElement id="inv-chart-rotacion" label="Gráfica de Rotación por Categoría" className="chart-card flex flex-col">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Rotación por Categoría</h3>
              <p className="chart-subtitle">Promedio de veces por período</p>
            </div>
          </div>
          <div className="flex justify-end mb-2">
            <GlobalBadge />
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rotacionData} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: '#4A6580' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}x`} />
                <YAxis type="category" dataKey="categoria" tick={{ fontSize: 11, fill: '#4A6580' }} axisLine={false} tickLine={false} width={110} />
                <Tooltip formatter={(v) => [`${v}x`, 'Rotación']} contentStyle={{ borderRadius: 8, border: '1px solid #D6E4F0', fontSize: 12 }} />
                <Bar dataKey="rotacion" radius={[0, 4, 4, 0]}>
                  {rotacionData.map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TrackableElement>
      </div>

      {/* Products table — sortable */}
      <TrackableElement id="inv-table-detalle" label="Tabla de Detalle de Inventario por producto" className="chart-card">
        <div className="chart-header">
          <div>
            <h3 className="chart-title">Detalle de Inventario</h3>
            <p className="chart-subtitle">Estado actual por producto</p>
          </div>
        </div>
        {/* Mobile: card stacking */}
        <div className="md:hidden space-y-3 pt-1">
          {(sortedItems as unknown as InventarioRow[]).map((item, i) => {
            const alerta = (item.stock_actual ?? 0) < (item.stock_minimo ?? 0)
            return (
              <div key={`m-${item.producto}-${i}`} className="rounded-[10px] border p-4" style={{ borderColor: '#D6E4F0' }}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 pr-2">
                    <p className="text-sm font-medium text-ink leading-snug">{item.producto}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#4A6580' }}>{item.categoria}</p>
                  </div>
                  <span className={`pill shrink-0 ${alerta ? 'low' : 'high'}`}>
                    {alerta ? '↓ Bajo mínimo' : '✓ OK'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide" style={{ color: '#4A6580' }}>Stock Actual</p>
                    <p className="text-sm font-medium mt-0.5" style={{ color: alerta ? '#E05C5C' : '#0A1628' }}>{fmtNum(item.stock_actual ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide" style={{ color: '#4A6580' }}>Mínimo</p>
                    <p className="text-sm font-medium mt-0.5" style={{ color: '#4A6580' }}>{fmtNum(item.stock_minimo ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide" style={{ color: '#4A6580' }}>Rotación</p>
                    <p className="text-sm font-medium mt-0.5" style={{ color: '#0A1628' }}>{(item.rotacion ?? 0).toFixed(1)}x</p>
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
                <th {...thProps('producto', 'left')}>Producto <SortIcon column="producto" config={sortConfig} /></th>
                <th {...thProps('categoria', 'left')}>Categoría <SortIcon column="categoria" config={sortConfig} /></th>
                <th {...thProps('stock_actual')}>Stock Actual <SortIcon column="stock_actual" config={sortConfig} /></th>
                <th {...thProps('stock_minimo')}>Stock Mínimo <SortIcon column="stock_minimo" config={sortConfig} /></th>
                <th {...thProps('rotacion')}>Rotación <SortIcon column="rotacion" config={sortConfig} /></th>
                <th {...thProps('estado_ord')}>Estado <SortIcon column="estado_ord" config={sortConfig} /></th>
              </tr>
            </thead>
            <tbody>
              {(sortedItems as unknown as InventarioRow[]).map((item, i) => {
                const alerta = (item.stock_actual ?? 0) < (item.stock_minimo ?? 0)
                return (
                  <tr key={`${item.producto}-${i}`} className={i < sortedItems.length - 1 ? 'border-b border-synk-border/50' : ''}>
                    <td className="py-3 text-sm text-ink font-medium">{item.producto}</td>
                    <td className="py-3 text-sm text-slate">{item.categoria}</td>
                    <td className="py-3 text-sm text-right text-ink">{fmtNum(item.stock_actual ?? 0)}</td>
                    <td className="py-3 text-sm text-right text-slate">{fmtNum(item.stock_minimo ?? 0)}</td>
                    <td className="py-3 text-sm text-right text-ink">{(item.rotacion ?? 0).toFixed(1)}x</td>
                    <td className="py-3 text-right">
                      <span className={`pill ${alerta ? 'low' : 'high'}`}>
                        {alerta ? '↓ Bajo mínimo' : '✓ OK'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </TrackableElement>
    </div>
  )
}
