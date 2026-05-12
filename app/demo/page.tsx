'use client'

import Link from 'next/link'
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
import { CHART_PALETTE, SEMANTIC } from '@/lib/chart-colors'

// ─── Static demo data ─────────────────────────────────────────────────────────

const MONTHLY_VENTAS = [
  { mes: 'Nov', ventas: 31200 },
  { mes: 'Dic', ventas: 38500 },
  { mes: 'Ene', ventas: 29800 },
  { mes: 'Feb', ventas: 34100 },
  { mes: 'Mar', ventas: 41300 },
  { mes: 'Abr', ventas: 44800 },
  { mes: 'May', ventas: 48320 },
]

const CATEGORY_DATA = [
  { categoria: 'Alimentos', porcentaje: 38 },
  { categoria: 'Bebidas', porcentaje: 25 },
  { categoria: 'Limpieza', porcentaje: 20 },
  { categoria: 'Personal', porcentaje: 12 },
  { categoria: 'Otros', porcentaje: 5 },
]

const TOP_PRODUCTS = [
  { producto: 'Arroz Seco 25lb', ventas: 12400, unidades: 248, tendencia: 'up' },
  { producto: 'Aceite Corona 1L', ventas: 9870, unidades: 329, tendencia: 'up' },
  { producto: 'Leche Estrella 1L', ventas: 7650, unidades: 510, tendencia: 'stable' },
  { producto: 'Azúcar Blanca 5lb', ventas: 6300, unidades: 420, tendencia: 'down' },
  { producto: 'Jabón Ivory x3', ventas: 5100, unidades: 300, tendencia: 'stable' },
]

const KPIS = [
  { label: 'VENTAS TOTALES', value: '$48,320', delta: '+12.4%', note: 'vs mes ant.', color: '#1A6FC4', positive: true },
  { label: 'MARGEN BRUTO', value: '41.2%', delta: '+1.8pp', note: 'vs mes ant.', color: '#0ABFBC', positive: true },
  { label: 'COSTO OPERATIVO', value: '$11,280', delta: '+3.2%', note: 'vs mes ant.', color: '#F59E0B', positive: false },
  { label: 'TICKET PROMEDIO', value: '$22.50', delta: '+4.1%', note: 'vs mes ant.', color: '#1A6FC4', positive: true },
]

function fmt(v: number) {
  return new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)
}

// ─── Demo Sidebar ──────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: 'Dashboard', icon: '⊞', active: true },
  { label: 'Ventas', icon: '↑', active: false },
  { label: 'Inventario', icon: '◫', active: false },
  { label: 'Clientes', icon: '◎', active: false },
]
const NAV_REPORTES = [
  { label: 'Financiero', icon: '$', active: false },
  { label: 'KPIs', icon: '◈', active: false },
]

function DemoSidebar() {
  return (
    <aside
      className="hidden md:flex flex-col flex-shrink-0 w-[220px] min-h-screen"
      style={{ background: 'linear-gradient(180deg, #0A2040 0%, #0F2D52 100%)' }}
    >
      <div className="px-5 py-6 flex items-center gap-3">
        <svg width="30" height="30" viewBox="0 0 36 36" fill="none">
          <rect width="36" height="36" rx="9" fill="#1A6FC4" />
          <path d="M10 22 L16 14 L20 18 L24 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="26" cy="12" r="2.5" fill="#0ABFBC" />
          <path d="M10 26 H26" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="text-white font-bold text-lg tracking-tight" style={{ fontFamily: 'var(--font-sora), Sora, sans-serif' }}>
          Synkrise
        </span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <div
            key={item.label}
            className="relative flex items-center gap-3 px-3 py-2.5 rounded-[9px]"
            style={{
              color: item.active ? 'white' : 'rgba(255,255,255,0.6)',
              background: item.active ? 'rgba(26,111,196,0.35)' : undefined,
              borderLeft: item.active ? '2px solid #1A6FC4' : undefined,
            }}
          >
            <span className="text-base w-5 text-center flex-shrink-0">{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </div>
        ))}

        <div className="pt-4 pb-1 px-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Reportes
          </span>
        </div>
        {NAV_REPORTES.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 px-3 py-2.5 rounded-[9px]"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            <span className="text-base w-5 text-center flex-shrink-0">{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </div>
        ))}
      </nav>

      <div className="px-4 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#1A6FC4' }}>
            DM
          </div>
          <div>
            <p className="text-white text-xs font-medium">Demo · Retail Panamá</p>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>demo@synkrise.com</p>
          </div>
        </div>
        <Link
          href="/register"
          className="w-full flex items-center justify-center py-2 rounded-[9px] text-xs font-semibold transition-colors"
          style={{ background: '#1A6FC4', color: 'white' }}
        >
          Crear cuenta gratis
        </Link>
      </div>
    </aside>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DemoPage() {
  return (
    <div className="flex min-h-screen bg-surface">
      <DemoSidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Demo banner */}
        <div className="flex items-center justify-between gap-4 px-6 py-3" style={{ background: '#1A6FC4' }}>
          <p className="text-white text-sm font-medium leading-snug">
            Esta es una demo con datos de ejemplo. Crea tu cuenta gratis para conectar tus propios datos.
          </p>
          <Link
            href="/register"
            className="flex-shrink-0 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: 'white', color: '#1A6FC4' }}
          >
            Crear cuenta
          </Link>
        </div>

        <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="font-sora text-[22px] font-bold text-ink tracking-tight">Dashboard</h1>
              <p className="text-slate text-sm mt-0.5">Resumen de tu operación — Mayo 2025</p>
            </div>
            <span className="text-xs font-medium px-3 py-1.5 rounded-[8px]" style={{ background: '#E0F8F8', color: '#0ABFBC' }}>
              ↑ Datos de ejemplo
            </span>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {KPIS.map((kpi) => (
              <div key={kpi.label} className="kpi-card">
                <span className="kpi-label">{kpi.label}</span>
                <span className="kpi-value">{kpi.value}</span>
                <div style={{ height: 26 }} />
                <div className="flex items-center gap-2" style={{ height: 20 }}>
                  <span className={`kpi-delta ${kpi.positive ? 'up' : 'down'}`}>
                    {kpi.positive ? '↑' : '↓'} {kpi.delta}
                    <span className="ml-1 text-slate text-[11px]">{kpi.note}</span>
                  </span>
                </div>
                <div style={{ height: 15 }} />
                <div className="kpi-bar">
                  <div className="kpi-bar-fill" style={{ width: '74%' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* Evolución mensual */}
            <div className="chart-card lg:col-span-2">
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">Evolución de Ventas</h3>
                  <p className="chart-subtitle">Últimos 7 meses</p>
                </div>
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={MONTHLY_VENTAS} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D6E4F0" vertical={false} />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#4A6580' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#4A6580' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => [fmt(v as number), 'Ventas']} contentStyle={{ borderRadius: 8, border: '1px solid #D6E4F0', fontSize: 12 }} />
                    <Line type="monotone" dataKey="ventas" stroke={SEMANTIC.blue} strokeWidth={2.5} dot={{ fill: SEMANTIC.blue, r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Categorías */}
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">Por Categoría</h3>
                  <p className="chart-subtitle">Distribución de ventas</p>
                </div>
              </div>
              <div className="space-y-3">
                {CATEGORY_DATA.map((cat, i) => (
                  <div key={cat.categoria}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-ink font-medium">{cat.categoria}</span>
                      <span className="text-xs text-slate">{cat.porcentaje}%</span>
                    </div>
                    <div className="kpi-bar">
                      <div className="kpi-bar-fill" style={{ width: `${cat.porcentaje}%`, background: CHART_PALETTE[Math.min(i, CHART_PALETTE.length - 1)] }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top productos */}
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Top Productos</h3>
                <p className="chart-subtitle">Por volumen de ventas</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr className="border-b border-synk-border">
                    <th className="text-left kpi-label pb-2">Producto</th>
                    <th className="text-right kpi-label pb-2">Ventas</th>
                    <th className="text-right kpi-label pb-2">Unidades</th>
                    <th className="text-right kpi-label pb-2">Tendencia</th>
                  </tr>
                </thead>
                <tbody>
                  {TOP_PRODUCTS.map((p, i) => (
                    <tr key={p.producto} className={i < TOP_PRODUCTS.length - 1 ? 'border-b border-synk-border/50' : ''}>
                      <td className="py-3 text-sm text-ink font-medium">{p.producto}</td>
                      <td className="py-3 text-sm text-right text-ink">{fmt(p.ventas)}</td>
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
          </div>

          {/* Bottom CTA */}
          <div className="mt-8 rounded-[14px] border border-synk-border bg-white p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-sora text-[16px] font-bold text-ink">¿Listo para ver tus propios datos?</p>
              <p className="text-slate text-sm mt-1">Crea tu cuenta gratis — sin tarjeta de crédito, 14 días de prueba.</p>
            </div>
            <Link
              href="/register"
              className="flex-shrink-0 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-colors"
              style={{ background: '#1A6FC4' }}
            >
              Empieza gratis →
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
