'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TrackableElement } from '@/components/TrackableElement'
import { useSortableTable } from '@/hooks/useSortableTable'
import { SortIcon } from '@/components/SortIcon'
import { SEMANTIC, cumplimientoColor } from '@/lib/chart-colors'
import { useKpiGoals } from '@/hooks/useKpiGoals'
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, Legend, Tooltip,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface VentaRow {
  fecha: string
  unidades: number | null
  precio_unitario: number | null
  costo_unitario: number | null
}

interface InventarioRow {
  producto: string
  stock_actual: number | null
  stock_minimo: number | null
  rotacion: number | null
  costo_unitario: number | null
}

interface ClienteRow {
  compras: number | null
  facturacion: number | null
}

type KpiSeccion = 'Ventas' | 'Financiero' | 'Inventario' | 'Clientes'
type KpiEstado = 'En meta' | 'Cerca' | 'Crítico'
type KpiPeriodo = 'Semana actual' | 'Mes actual' | 'Mes anterior' | 'Trimestre' | 'Año'

interface KPIFullRow {
  key: string
  indicador: string
  seccion: KpiSeccion
  valorActual: number
  valorFmt: string
  objetivo: number
  objetivoFmt: string
  cumplimiento: number
  estado: KpiEstado
  format: 'currency' | 'percent' | 'number'
}

const KPI_PERIODOS: KpiPeriodo[] = ['Semana actual', 'Mes actual', 'Mes anterior', 'Trimestre', 'Año']
const KPI_SECCIONES: Array<'Todas' | KpiSeccion> = ['Todas', 'Ventas', 'Financiero', 'Inventario', 'Clientes']
const KPI_ESTADOS: Array<'Todos' | KpiEstado> = ['Todos', 'En meta', 'Cerca', 'Crítico']

const SECCION_STYLE: Record<KpiSeccion, { bg: string; color: string }> = {
  Ventas:      { bg: '#EBF4FF', color: '#1A6FC4' },
  Financiero:  { bg: '#E0F8F8', color: '#0ABFBC' },
  Inventario:  { bg: '#FEF3E2', color: '#F59E0B' },
  Clientes:    { bg: '#E8FFF3', color: '#10B981' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtCur = (v: number) =>
  new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)

function estadoFromCumpl(c: number): KpiEstado {
  return c >= 90 ? 'En meta' : c >= 70 ? 'Cerca' : 'Crítico'
}

function cumpl(current: number, goal: number): number {
  if (goal <= 0) return 0
  return Math.min(Math.round((current / goal) * 100), 100)
}

function filterVentasByPeriodo(ventas: VentaRow[], periodo: KpiPeriodo): VentaRow[] {
  if (ventas.length === 0) return ventas
  const sortedDates = [...new Set(ventas.map(r => r.fecha))].sort()
  const sortedMonths = [...new Set(ventas.map(r => r.fecha.substring(0, 7)))].sort()
  const sortedYears = [...new Set(ventas.map(r => r.fecha.substring(0, 4)))].sort()

  if (periodo === 'Semana actual') {
    const cutoff = sortedDates.at(-7) ?? sortedDates[0]
    return ventas.filter(r => r.fecha >= cutoff)
  }
  if (periodo === 'Mes actual') {
    const m = sortedMonths.at(-1) ?? ''
    return ventas.filter(r => r.fecha.startsWith(m))
  }
  if (periodo === 'Mes anterior') {
    const m = sortedMonths.at(-2) ?? sortedMonths.at(-1) ?? ''
    return ventas.filter(r => r.fecha.startsWith(m))
  }
  if (periodo === 'Trimestre') {
    const m = sortedMonths.slice(-3)[0] ?? sortedMonths[0]
    return ventas.filter(r => r.fecha.substring(0, 7) >= m)
  }
  // Año
  const y = sortedYears.at(-1) ?? ''
  return ventas.filter(r => r.fecha.startsWith(y))
}

function computeKpiRows(
  ventasFiltered: VentaRow[],
  ventasFull: VentaRow[],
  inventario: InventarioRow[],
  clientes: ClienteRow[],
  userGoals: Record<string, number>,
): KPIFullRow[] {
  // ── Ventas aggregation ─────────────────────────────────────────────────────
  let totalIngresos = 0, totalCostos = 0, totalUnidades = 0, txCount = 0
  for (const r of ventasFiltered) {
    totalIngresos += (r.unidades ?? 0) * (r.precio_unitario ?? 0)
    totalCostos += (r.unidades ?? 0) * (r.costo_unitario ?? 0)
    totalUnidades += r.unidades ?? 0
    txCount++
  }
  const margenPct = totalIngresos > 0 ? ((totalIngresos - totalCostos) / totalIngresos) * 100 : 0
  const ticket = txCount > 0 ? totalIngresos / txCount : 0
  const margenBruto = totalIngresos - totalCostos

  // Default goals from full data
  const allMonths = [...new Set(ventasFull.map(r => r.fecha.substring(0, 7)))]
  const monthlyVentasMap = new Map<string, number>()
  for (const r of ventasFull) {
    const m = r.fecha.substring(0, 7)
    monthlyVentasMap.set(m, (monthlyVentasMap.get(m) ?? 0) + (r.unidades ?? 0) * (r.precio_unitario ?? 0))
  }
  const avgMonthly = allMonths.length > 0
    ? Array.from(monthlyVentasMap.values()).reduce((a, b) => a + b, 0) / allMonths.length
    : 0

  const g = (key: string, def: number) => userGoals[key] ?? def

  const rows: KPIFullRow[] = []

  // ── Ventas section ─────────────────────────────────────────────────────────
  const vtGoal = g('ventas-totales', avgMonthly > 0 ? avgMonthly * 1.2 : 65300)
  const vtC = cumpl(totalIngresos, vtGoal)
  rows.push({ key: 'ventas-totales', indicador: 'Ventas Totales', seccion: 'Ventas', valorActual: totalIngresos, valorFmt: fmtCur(totalIngresos), objetivo: vtGoal, objetivoFmt: fmtCur(vtGoal), cumplimiento: vtC, estado: estadoFromCumpl(vtC), format: 'currency' })

  const uvGoal = g('unidades-vendidas', totalUnidades > 0 ? Math.round(totalUnidades * 1.2) : 100)
  const uvC = cumpl(totalUnidades, uvGoal)
  rows.push({ key: 'unidades-vendidas', indicador: 'Unidades Vendidas', seccion: 'Ventas', valorActual: totalUnidades, valorFmt: totalUnidades.toLocaleString('es-PA'), objetivo: uvGoal, objetivoFmt: Math.round(uvGoal).toLocaleString('es-PA'), cumplimiento: uvC, estado: estadoFromCumpl(uvC), format: 'number' })

  const tpGoal = g('ticket-promedio', ticket > 0 ? ticket * 1.2 : 100)
  const tpC = cumpl(ticket, tpGoal)
  rows.push({ key: 'ticket-promedio', indicador: 'Ticket Promedio', seccion: 'Ventas', valorActual: ticket, valorFmt: fmtCur(ticket), objetivo: tpGoal, objetivoFmt: fmtCur(tpGoal), cumplimiento: tpC, estado: estadoFromCumpl(tpC), format: 'currency' })

  const mbPctGoal = g('margen-bruto-pct', 35)
  const mbPctC = cumpl(margenPct, mbPctGoal)
  rows.push({ key: 'margen-bruto-pct', indicador: 'Margen Bruto %', seccion: 'Ventas', valorActual: margenPct, valorFmt: `${margenPct.toFixed(1)}%`, objetivo: mbPctGoal, objetivoFmt: `${mbPctGoal.toFixed(1)}%`, cumplimiento: mbPctC, estado: estadoFromCumpl(mbPctC), format: 'percent' })

  // ── Financiero section ─────────────────────────────────────────────────────
  const cosGoal = g('costos-totales', totalIngresos > 0 ? totalIngresos * 0.65 : 1)
  // Lower is better for costos: cumplimiento = goal/actual * 100 (capped at 100)
  const cosC = totalCostos > 0 ? Math.min(Math.round((cosGoal / totalCostos) * 100), 100) : (totalCostos === 0 ? 100 : 0)
  rows.push({ key: 'costos-totales', indicador: 'Costos Totales', seccion: 'Financiero', valorActual: totalCostos, valorFmt: fmtCur(totalCostos), objetivo: cosGoal, objetivoFmt: fmtCur(cosGoal), cumplimiento: cosC, estado: estadoFromCumpl(cosC), format: 'currency' })

  const mbUsdGoal = g('margen-bruto-usd', margenBruto > 0 ? margenBruto * 1.2 : 1000)
  const mbUsdC = cumpl(margenBruto, mbUsdGoal)
  rows.push({ key: 'margen-bruto-usd', indicador: 'Margen Bruto $', seccion: 'Financiero', valorActual: margenBruto, valorFmt: fmtCur(margenBruto), objetivo: mbUsdGoal, objetivoFmt: fmtCur(mbUsdGoal), cumplimiento: mbUsdC, estado: estadoFromCumpl(mbUsdC), format: 'currency' })

  // ── Inventario section ─────────────────────────────────────────────────────
  if (inventario.length > 0) {
    const totalProductos = inventario.length
    const bajoMinimo = inventario.filter(i => (i.stock_actual ?? 0) < (i.stock_minimo ?? 0)).length
    const rotacionProm = inventario.reduce((s, i) => s + (i.rotacion ?? 0), 0) / totalProductos
    const valorInv = inventario.reduce((s, i) => s + (i.stock_actual ?? 0) * (i.costo_unitario ?? 0), 0)

    const tprdGoal = g('total-productos', totalProductos)
    const tprdC = cumpl(totalProductos, tprdGoal)
    rows.push({ key: 'total-productos', indicador: 'Total Productos', seccion: 'Inventario', valorActual: totalProductos, valorFmt: totalProductos.toLocaleString('es-PA'), objetivo: tprdGoal, objetivoFmt: Math.round(tprdGoal).toLocaleString('es-PA'), cumplimiento: tprdC, estado: estadoFromCumpl(tprdC), format: 'number' })

    const bsGoal = g('bajo-stock', 0)
    // Cumplimiento = % of products NOT below minimum (lower bajoMinimo = better)
    const bsC = totalProductos > 0
      ? Math.max(0, Math.round((1 - bajoMinimo / totalProductos) * 100))
      : 100
    rows.push({ key: 'bajo-stock', indicador: 'Bajo Stock Mínimo', seccion: 'Inventario', valorActual: bajoMinimo, valorFmt: String(bajoMinimo), objetivo: bsGoal, objetivoFmt: String(Math.round(bsGoal)), cumplimiento: bsC, estado: estadoFromCumpl(bsC), format: 'number' })

    const rotGoal = g('rotacion-promedio', 5)
    const rotC = cumpl(rotacionProm, rotGoal)
    rows.push({ key: 'rotacion-promedio', indicador: 'Rotación Promedio', seccion: 'Inventario', valorActual: rotacionProm, valorFmt: `${rotacionProm.toFixed(1)}x`, objetivo: rotGoal, objetivoFmt: `${rotGoal.toFixed(1)}x`, cumplimiento: rotC, estado: estadoFromCumpl(rotC), format: 'number' })

    const viGoal = g('valor-inventario', valorInv > 0 ? valorInv * 1.1 : 1000)
    const viC = cumpl(valorInv, viGoal)
    rows.push({ key: 'valor-inventario', indicador: 'Valor Inventario', seccion: 'Inventario', valorActual: valorInv, valorFmt: fmtCur(valorInv), objetivo: viGoal, objetivoFmt: fmtCur(viGoal), cumplimiento: viC, estado: estadoFromCumpl(viC), format: 'currency' })
  }

  // ── Clientes section ───────────────────────────────────────────────────────
  if (clientes.length > 0) {
    const totalClientes = clientes.length
    const facturacionTotal = clientes.reduce((s, c) => s + (c.facturacion ?? 0), 0)
    const totalCompras = clientes.reduce((s, c) => s + (c.compras ?? 0), 0)
    const promedioCompras = totalClientes > 0 ? totalCompras / totalClientes : 0

    const tcGoal = g('total-clientes', Math.ceil(totalClientes * 1.1))
    const tcC = cumpl(totalClientes, tcGoal)
    rows.push({ key: 'total-clientes', indicador: 'Total Clientes', seccion: 'Clientes', valorActual: totalClientes, valorFmt: totalClientes.toLocaleString('es-PA'), objetivo: tcGoal, objetivoFmt: Math.round(tcGoal).toLocaleString('es-PA'), cumplimiento: tcC, estado: estadoFromCumpl(tcC), format: 'number' })

    const ftGoal = g('facturacion-clientes', facturacionTotal > 0 ? facturacionTotal * 1.1 : 1000)
    const ftC = cumpl(facturacionTotal, ftGoal)
    rows.push({ key: 'facturacion-clientes', indicador: 'Facturación Clientes', seccion: 'Clientes', valorActual: facturacionTotal, valorFmt: fmtCur(facturacionTotal), objetivo: ftGoal, objetivoFmt: fmtCur(ftGoal), cumplimiento: ftC, estado: estadoFromCumpl(ftC), format: 'currency' })

    const pcGoal = g('promedio-compras', promedioCompras > 0 ? promedioCompras * 1.1 : 10)
    const pcC = cumpl(promedioCompras, pcGoal)
    rows.push({ key: 'promedio-compras', indicador: 'Promedio Compras', seccion: 'Clientes', valorActual: promedioCompras, valorFmt: promedioCompras.toFixed(1), objetivo: pcGoal, objetivoFmt: pcGoal.toFixed(1), cumplimiento: pcC, estado: estadoFromCumpl(pcC), format: 'number' })
  }

  return rows
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EstadoPill({ estado }: { estado: KpiEstado }) {
  if (estado === 'En meta') return <span className="pill high">✓ En meta</span>
  if (estado === 'Cerca') return <span className="pill warn">⚠ Cerca</span>
  return <span className="pill low">✗ Crítico</span>
}

function SectionTag({ seccion }: { seccion: KpiSeccion }) {
  const s = SECCION_STYLE[seccion]
  return (
    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>
      {seccion}
    </span>
  )
}

function GlobalBadge() {
  return (
    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: '#F0F4FA', color: '#4A6580', border: '1px solid #D6E4F0' }}>
      Vista global · No afectada por filtros
    </span>
  )
}

function CumplimientoBar({ value }: { value: number }) {
  const color = value >= 90 ? '#0ABFBC' : value >= 70 ? '#F59E0B' : '#E05C5C'
  return (
    <div className="flex items-center gap-2 justify-end">
      <div style={{ width: 80, height: 6, borderRadius: 3, background: '#EBF4FF', overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
      <span className="text-xs font-semibold w-9 text-right" style={{ color }}>{value}%</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KPIsPage() {
  const [ventas, setVentas] = useState<VentaRow[]>([])
  const [inventario, setInventario] = useState<InventarioRow[]>([])
  const [clientes, setClientes] = useState<ClienteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState<KpiPeriodo>('Mes actual')
  const [seccionFilter, setSeccionFilter] = useState<'Todas' | KpiSeccion>('Todas')
  const [estadoFilter, setEstadoFilter] = useState<'Todos' | KpiEstado>('Todos')
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const [goals, updateGoal] = useKpiGoals()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      Promise.all([
        supabase.from('ventas').select('fecha, unidades, precio_unitario, costo_unitario').eq('user_id', user.id).order('fecha', { ascending: true }),
        supabase.from('inventario').select('producto, stock_actual, stock_minimo, rotacion, costo_unitario').eq('user_id', user.id),
        supabase.from('clientes').select('compras, facturacion').eq('user_id', user.id),
      ]).then(([{ data: v }, { data: inv }, { data: cli }]) => {
        setVentas(v ?? [])
        setInventario(inv ?? [])
        setClientes(cli ?? [])
        setLoading(false)
      })
    })
  }, [])

  // Radar uses the most recent month in data (global, unaffected by filters)
  const radarData = useMemo(() => {
    if (ventas.length === 0) return []
    const sortedMonths = [...new Set(ventas.map(r => r.fecha.substring(0, 7)))].sort()
    const latestMonth = sortedMonths.at(-1) ?? ''
    const latest = ventas.filter(r => r.fecha.startsWith(latestMonth))
    let ing = 0, cos = 0, uni = 0, tx = 0
    for (const r of latest) {
      ing += (r.unidades ?? 0) * (r.precio_unitario ?? 0)
      cos += (r.unidades ?? 0) * (r.costo_unitario ?? 0)
      uni += r.unidades ?? 0
      tx++
    }
    const mPct = ing > 0 ? ((ing - cos) / ing) * 100 : 0
    const tkt = tx > 0 ? ing / tx : 0

    const vtGoal = goals['ventas-totales'] ?? (ing > 0 ? ing * 1.2 : 1)
    const uvGoal = goals['unidades-vendidas'] ?? (uni > 0 ? uni * 1.2 : 1)
    const tpGoal = goals['ticket-promedio'] ?? (tkt > 0 ? tkt * 1.2 : 1)
    const mbGoal = goals['margen-bruto-pct'] ?? 35

    return [
      { indicador: 'Ventas',   valor: Math.min(Math.round((ing / vtGoal) * 100), 100), objetivo: 100 },
      { indicador: 'Margen',   valor: Math.min(Math.round((mPct / mbGoal) * 100), 100), objetivo: 100 },
      { indicador: 'Unidades', valor: Math.min(Math.round((uni / uvGoal) * 100), 100), objetivo: 100 },
      { indicador: 'Ticket',   valor: Math.min(Math.round((tkt / tpGoal) * 100), 100), objetivo: 100 },
    ]
  }, [ventas, goals])

  const ventasFiltered = useMemo(() => filterVentasByPeriodo(ventas, periodo), [ventas, periodo])

  const allKpiRows = useMemo(
    () => computeKpiRows(ventasFiltered, ventas, inventario, clientes, goals),
    [ventasFiltered, ventas, inventario, clientes, goals],
  )

  const filteredKpiRows = useMemo(() => {
    return allKpiRows.filter(row => {
      if (seccionFilter !== 'Todas' && row.seccion !== seccionFilter) return false
      if (estadoFilter !== 'Todos' && row.estado !== estadoFilter) return false
      return true
    })
  }, [allKpiRows, seccionFilter, estadoFilter])

  const { sortedData: sortedKpis, sortConfig, requestSort } = useSortableTable(
    filteredKpiRows as unknown as Record<string, unknown>[],
  )

  function saveGoal(key: string) {
    const val = parseFloat(editValue)
    if (!isNaN(val) && val >= 0) updateGoal(key, val)
  }

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
            <h1 className="font-sora text-[22px] font-bold text-ink tracking-tight">KPIs</h1>
            <p className="text-slate text-sm mt-0.5">Indicadores clave de rendimiento</p>
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

  const thProps = (key: string, align: 'left' | 'right' = 'right') => ({
    className: `text-${align} kpi-label pb-2 cursor-pointer select-none`,
    onClick: () => requestSort(key),
    onMouseEnter: (e: React.MouseEvent<HTMLTableCellElement>) => { e.currentTarget.style.background = '#EBF4FF' },
    onMouseLeave: (e: React.MouseEvent<HTMLTableCellElement>) => { e.currentTarget.style.background = '' },
  })

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="font-sora text-[22px] font-bold text-ink tracking-tight">KPIs</h1>
          <p className="text-slate text-sm mt-0.5">Indicadores clave de rendimiento</p>
        </div>
        <span className="text-xs font-medium px-3 py-1.5 rounded-[8px] self-start sm:self-auto" style={{ background: '#E0F8F8', color: '#0ABFBC' }}>
          Datos actualizados
        </span>
      </div>

      {/* Filter bar */}
      <div className="chart-card mb-4 py-3 px-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Período */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate whitespace-nowrap">Período:</span>
            <select
              value={periodo}
              onChange={e => setPeriodo(e.target.value as KpiPeriodo)}
              className="text-xs font-medium px-2.5 py-1.5 rounded-[8px] border border-synk-border bg-white text-ink outline-none cursor-pointer"
            >
              {KPI_PERIODOS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Sección */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-slate">Sección:</span>
            <div className="flex gap-1 flex-wrap">
              {KPI_SECCIONES.map(s => (
                <button
                  key={s}
                  onClick={() => setSeccionFilter(s)}
                  style={seccionFilter === s
                    ? { background: '#1A6FC4', color: '#fff', border: '1px solid #1A6FC4' }
                    : { background: '#F0F4FA', color: '#4A6580', border: '1px solid #D6E4F0' }
                  }
                  className="text-[11px] px-2.5 py-1 rounded-[8px] font-medium cursor-pointer transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Estado */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-slate">Estado:</span>
            <div className="flex gap-1 flex-wrap">
              {KPI_ESTADOS.map(e => (
                <button
                  key={e}
                  onClick={() => setEstadoFilter(e)}
                  style={estadoFilter === e
                    ? { background: '#1A6FC4', color: '#fff', border: '1px solid #1A6FC4' }
                    : { background: '#F0F4FA', color: '#4A6580', border: '1px solid #D6E4F0' }
                  }
                  className="text-[11px] px-2.5 py-1 rounded-[8px] font-medium cursor-pointer transition-colors"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Radar + Cumplimiento — GLOBAL (no afectado por filtros) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <TrackableElement id="kpi-chart-radar" label="Gráfica Radar de Performance General vs Objetivos" className="chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Performance vs Objetivos</h3>
              <p className="chart-subtitle">Mes más reciente — escala 0–100</p>
            </div>
            <GlobalBadge />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
                <PolarGrid stroke="#D6E4F0" />
                <PolarAngleAxis dataKey="indicador" tick={{ fontSize: 11, fill: '#4A6580' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#4A6580' }} tickCount={4} />
                <Radar name="Objetivo" dataKey="objetivo" stroke="#D6E4F0" fill="#D6E4F0" fillOpacity={0.3} />
                <Radar name="Performance" dataKey="valor" stroke={SEMANTIC.blue} fill={SEMANTIC.blue} fillOpacity={0.25} />
                <Legend formatter={value => <span style={{ fontSize: 11, color: '#4A6580' }}>{value}</span>} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #D6E4F0', fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </TrackableElement>

        <TrackableElement id="kpi-card-cumplimiento" label="Panel de Resumen de Cumplimiento por indicador" className="chart-card flex flex-col justify-center gap-3">
          <div className="chart-header mb-0">
            <div>
              <h3 className="chart-title">Resumen de Cumplimiento</h3>
              <p className="chart-subtitle">Mes más reciente</p>
            </div>
            <GlobalBadge />
          </div>
          <div className="space-y-3">
            {radarData.map(item => (
              <div key={item.indicador}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-ink font-medium">{item.indicador}</span>
                  <span className="text-xs font-semibold" style={{ color: cumplimientoColor(item.valor) }}>
                    {item.valor}%
                  </span>
                </div>
                <div className="kpi-bar">
                  <div className="kpi-bar-fill" style={{ width: `${item.valor}%`, background: cumplimientoColor(item.valor) }} />
                </div>
              </div>
            ))}
          </div>
        </TrackableElement>
      </div>

      {/* KPI Table */}
      <TrackableElement id="kpi-table-kpis" label="Tabla de KPIs comparativa valor vs objetivo" className="chart-card">
        <div className="chart-header">
          <div>
            <h3 className="chart-title">Tabla de KPIs</h3>
            <p className="chart-subtitle">
              {periodo} — {filteredKpiRows.length} indicador{filteredKpiRows.length !== 1 ? 'es' : ''}
              {seccionFilter !== 'Todas' ? ` · ${seccionFilter}` : ''}
              {estadoFilter !== 'Todos' ? ` · ${estadoFilter}` : ''}
            </p>
          </div>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: '#EBF4FF', color: '#1A6FC4', border: '1px solid #D6E4F0' }}>
            Click en objetivo para editar
          </span>
        </div>
        <div className="overflow-x-auto -mx-[22px] px-[22px] md:mx-0 md:px-0">
          <table className="w-full min-w-[680px]">
            <thead>
              <tr className="border-b border-synk-border">
                <th {...thProps('indicador', 'left')}>Indicador <SortIcon column="indicador" config={sortConfig} /></th>
                <th {...thProps('seccion', 'left')}>Sección <SortIcon column="seccion" config={sortConfig} /></th>
                <th {...thProps('valorActual')}>Valor actual <SortIcon column="valorActual" config={sortConfig} /></th>
                <th {...thProps('objetivo')}>Objetivo <SortIcon column="objetivo" config={sortConfig} /></th>
                <th {...thProps('cumplimiento')}>Cumplimiento <SortIcon column="cumplimiento" config={sortConfig} /></th>
                <th {...thProps('estado')}>Estado <SortIcon column="estado" config={sortConfig} /></th>
              </tr>
            </thead>
            <tbody>
              {(sortedKpis as unknown as KPIFullRow[]).map((row, i) => (
                <tr key={row.key} className={i < sortedKpis.length - 1 ? 'border-b border-synk-border/50' : ''}>
                  <td className="py-3 text-sm text-ink font-medium">{row.indicador}</td>
                  <td className="py-3">
                    <SectionTag seccion={row.seccion} />
                  </td>
                  <td className="py-3 text-sm text-right text-ink">{row.valorFmt}</td>
                  <td className="py-3 text-sm text-right" style={{ minWidth: 120 }}>
                    {editingKey === row.key ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={() => { saveGoal(row.key); setEditingKey(null) }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') { saveGoal(row.key); setEditingKey(null) }
                          if (e.key === 'Escape') setEditingKey(null)
                        }}
                        autoFocus
                        className="text-sm text-right w-full rounded-[6px] px-2 py-0.5 outline-none"
                        style={{ border: '1.5px solid #1A6FC4', background: '#EBF4FF' }}
                      />
                    ) : (
                      <span
                        className="cursor-pointer hover:text-accent transition-colors"
                        style={{ color: '#4A6580' }}
                        title="Click para editar objetivo"
                        onClick={() => { setEditingKey(row.key); setEditValue(String(row.objetivo)) }}
                      >
                        {row.objetivoFmt}
                      </span>
                    )}
                  </td>
                  <td className="py-3">
                    <CumplimientoBar value={row.cumplimiento} />
                  </td>
                  <td className="py-3 text-right">
                    <EstadoPill estado={row.estado} />
                  </td>
                </tr>
              ))}
              {sortedKpis.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate text-sm">
                    No hay indicadores que coincidan con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </TrackableElement>
    </div>
  )
}
