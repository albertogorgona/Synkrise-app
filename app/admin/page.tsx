'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

interface Profile {
  id: string
  email: string | null
  full_name: string | null
  role: string
  last_seen: string | null
  created_at: string
}

interface PageViewRank {
  page: string
  total: number
}

interface DemoRequest {
  id: string
  email: string
  fecha: string
  estado: string
}

interface AdminData {
  profiles: Profile[]
  pageViews: PageViewRank[]
  demoRequests: DemoRequest[]
  pageViewsToday: number
}

type SortField = 'created_at' | 'email' | 'full_name'

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Nunca'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora mismo'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  return `hace ${Math.floor(hours / 24)}d`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-PA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const PAGE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/ventas': 'Ventas',
  '/dashboard/inventario': 'Inventario',
  '/dashboard/clientes': 'Clientes',
  '/dashboard/financiero': 'Financiero',
  '/dashboard/kpis': 'KPIs',
  '/dashboard/datos': 'Datos',
  '/dashboard/importar': 'Importar',
  '/dashboard/configuracion': 'Configuración',
  '/admin': 'Panel Admin',
}

function pageName(path: string): string {
  return PAGE_LABELS[path] ?? path
}

const CARD_STYLE: React.CSSProperties = {
  background: 'white',
  borderRadius: 14,
  border: '1px solid #D6E4F0',
  boxShadow: '0 1px 4px rgba(10,22,40,0.06)',
  overflow: 'hidden',
}

const SECTION_TITLE: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#0A1628',
}

const SECTION_SUB: React.CSSProperties = {
  fontSize: 12,
  color: '#4A6580',
  marginTop: 2,
}

export default function AdminPage() {
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const fetchData = useCallback(async () => {
    const supabase = createClient()

    const [
      { data: profiles },
      { data: pageViews },
      { data: demoRequests },
      { count: pageViewsToday },
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, email, full_name, role, last_seen, created_at')
        .order('created_at', { ascending: false }),
      supabase.rpc('get_page_views_ranking'),
      supabase
        .from('demo_requests')
        .select('id, email, fecha, estado')
        .order('fecha', { ascending: false }),
      supabase
        .from('page_views')
        .select('id', { count: 'exact', head: true })
        .gte(
          'visited_at',
          new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
        ),
    ])

    setData({
      profiles: (profiles as Profile[]) ?? [],
      pageViews: (pageViews as PageViewRank[]) ?? [],
      demoRequests: (demoRequests as DemoRequest[]) ?? [],
      pageViewsToday: pageViewsToday ?? 0,
    })
    setLastRefresh(new Date())
    setLoading(false)
  }, [])

  useEffect(() => {
    void fetchData()
    const interval = setInterval(() => void fetchData(), 30_000)
    return () => clearInterval(interval)
  }, [fetchData])

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#F0F4FA' }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: '#1A6FC4', borderTopColor: 'transparent' }}
          />
          <p style={{ fontSize: 13, color: '#4A6580' }}>
            Cargando datos de administrador...
          </p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const now = new Date()
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  const activeUsers = data.profiles.filter(
    (p) => p.last_seen && new Date(p.last_seen) > fiveMinAgo
  )
  const signupsLast7 = data.profiles.filter(
    (p) => new Date(p.created_at) > sevenDaysAgo
  ).length
  const signupsPrev7 = data.profiles.filter((p) => {
    const d = new Date(p.created_at)
    return d > fourteenDaysAgo && d <= sevenDaysAgo
  }).length
  const signupsDelta =
    signupsPrev7 === 0
      ? signupsLast7 > 0
        ? 100
        : 0
      : Math.round(((signupsLast7 - signupsPrev7) / signupsPrev7) * 100)

  const sortedProfiles = [...data.profiles].sort((a, b) => {
    let aVal: string
    let bVal: string
    if (sortField === 'created_at') {
      aVal = a.created_at
      bVal = b.created_at
    } else if (sortField === 'email') {
      aVal = a.email ?? ''
      bVal = b.email ?? ''
    } else {
      aVal = a.full_name ?? ''
      bVal = b.full_name ?? ''
    }
    return sortDir === 'asc'
      ? aVal.localeCompare(bVal)
      : bVal.localeCompare(aVal)
  })

  const maxViews = Number(data.pageViews[0]?.total ?? 1)

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const statCards = [
    {
      label: 'Usuarios Registrados',
      value: data.profiles.length,
      icon: '◎',
      color: '#1A6FC4',
      sub: null as string | null,
    },
    {
      label: 'Activos Ahora',
      value: activeUsers.length,
      icon: '●',
      color: '#0ABFBC',
      sub: 'últimos 5 min',
    },
    {
      label: 'Páginas Vistas Hoy',
      value: data.pageViewsToday,
      icon: '⊞',
      color: '#1A6FC4',
      sub: null,
    },
    {
      label: 'Signups (7 días)',
      value: signupsLast7,
      icon: '↑',
      color: signupsDelta >= 0 ? '#0ABFBC' : '#E05C5C',
      sub: `${signupsDelta >= 0 ? '+' : ''}${signupsDelta}% vs semana anterior`,
    },
  ]

  const thStyle: React.CSSProperties = {
    padding: '10px 16px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 600,
    color: '#4A6580',
    borderBottom: '1px solid #D6E4F0',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  }

  const tdStyle: React.CSSProperties = {
    padding: '12px 16px',
    fontSize: 12,
    color: '#4A6580',
    borderBottom: '1px solid #F0F4FA',
  }

  const columns: { field: SortField; label: string }[] = [
    { field: 'full_name', label: 'Nombre' },
    { field: 'email', label: 'Email' },
    { field: 'created_at', label: 'Registro' },
  ]

  return (
    <div
      className="min-h-screen"
      style={{
        background: '#F0F4FA',
        fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)',
      }}
    >
      {/* ── HEADER ── */}
      <header style={{ background: 'white', borderBottom: '1px solid #D6E4F0' }}>
        <div className="px-6 md:px-8 py-4 flex items-center justify-between max-w-[1400px] mx-auto">
          <div className="flex items-center gap-3 flex-wrap">
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="9" fill="#1A6FC4" />
              <path
                d="M10 22 L16 14 L20 18 L24 12"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="26" cy="12" r="2.5" fill="#0ABFBC" />
              <path
                d="M10 26 H26"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: '#0A1628',
                fontFamily: 'var(--font-sora, Sora, sans-serif)',
              }}
            >
              Synkrise
            </span>
            <span style={{ color: '#D6E4F0' }}>|</span>
            <h1 style={{ fontSize: 15, fontWeight: 600, color: '#0A1628', margin: 0 }}>
              Panel de Administrador
            </h1>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 6,
                background: 'rgba(245,158,11,0.12)',
                color: '#D97706',
                border: '1px solid rgba(245,158,11,0.3)',
                letterSpacing: '0.05em',
              }}
            >
              ADMIN
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span style={{ fontSize: 11, color: '#4A6580' }}>
              {lastRefresh.toLocaleTimeString('es-PA', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <button
              onClick={() => void fetchData()}
              style={{
                fontSize: 12,
                padding: '6px 14px',
                borderRadius: 8,
                background: 'rgba(26,111,196,0.08)',
                color: '#1A6FC4',
                border: '1px solid rgba(26,111,196,0.2)',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Actualizar
            </button>
            <Link
              href="/dashboard"
              style={{
                fontSize: 12,
                padding: '6px 14px',
                borderRadius: 8,
                background: '#1A6FC4',
                color: 'white',
                fontWeight: 500,
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="px-6 md:px-8 py-6 max-w-[1400px] mx-auto space-y-6">
        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div key={card.label} style={CARD_STYLE}>
              <div style={{ padding: '20px 22px' }}>
                <div
                  className="flex items-center gap-2"
                  style={{ marginBottom: 8 }}
                >
                  <span style={{ fontSize: 18, color: card.color }}>
                    {card.icon}
                  </span>
                  <span style={{ fontSize: 11, color: '#4A6580', fontWeight: 500 }}>
                    {card.label}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: '#0A1628',
                    fontFamily: 'var(--font-sora, Sora, sans-serif)',
                  }}
                >
                  {card.value.toLocaleString()}
                </div>
                {card.sub && (
                  <div
                    style={{ fontSize: 11, color: card.color, marginTop: 4, fontWeight: 500 }}
                  >
                    {card.sub}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* LEFT — Usuarios Registrados */}
          <div style={CARD_STYLE}>
            <div
              className="px-6 py-4"
              style={{ borderBottom: '1px solid #D6E4F0' }}
            >
              <p style={SECTION_TITLE}>Usuarios Registrados</p>
              <p style={SECTION_SUB}>
                {data.profiles.length} usuario
                {data.profiles.length !== 1 ? 's' : ''} en total
              </p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFD' }}>
                    {columns.map((col) => (
                      <th
                        key={col.field}
                        onClick={() => handleSort(col.field)}
                        style={{ ...thStyle, cursor: 'pointer' }}
                      >
                        {col.label}{' '}
                        {sortField === col.field
                          ? sortDir === 'asc'
                            ? '↑'
                            : '↓'
                          : ''}
                      </th>
                    ))}
                    <th style={thStyle}>Último acceso</th>
                    <th style={thStyle}>Rol</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProfiles.map((p, i) => (
                    <tr
                      key={p.id}
                      style={{ background: i % 2 === 0 ? 'white' : '#FAFBFD' }}
                    >
                      <td
                        style={{
                          ...tdStyle,
                          fontSize: 13,
                          color: '#0A1628',
                          fontWeight: 500,
                        }}
                      >
                        {p.full_name ?? '—'}
                      </td>
                      <td style={tdStyle}>{p.email ?? '—'}</td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                        {formatDate(p.created_at)}
                      </td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                        {timeAgo(p.last_seen)}
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #F0F4FA' }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 6,
                            background:
                              p.role === 'admin'
                                ? 'rgba(245,158,11,0.12)'
                                : 'rgba(26,111,196,0.08)',
                            color:
                              p.role === 'admin' ? '#D97706' : '#1A6FC4',
                            border: `1px solid ${
                              p.role === 'admin'
                                ? 'rgba(245,158,11,0.3)'
                                : 'rgba(26,111,196,0.2)'
                            }`,
                          }}
                        >
                          {p.role === 'admin' ? 'Admin' : 'Usuario'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {data.profiles.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          padding: '32px 16px',
                          textAlign: 'center',
                          fontSize: 13,
                          color: '#4A6580',
                        }}
                      >
                        No hay usuarios registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT — Actividad + Conversiones */}
          <div className="space-y-4">
            {/* Actividad en Tiempo Real */}
            <div style={CARD_STYLE}>
              <div
                className="px-5 py-4"
                style={{ borderBottom: '1px solid #D6E4F0' }}
              >
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: activeUsers.length > 0 ? '#0ABFBC' : '#D6E4F0',
                      display: 'inline-block',
                      boxShadow:
                        activeUsers.length > 0
                          ? '0 0 0 3px rgba(10,191,188,0.2)'
                          : 'none',
                    }}
                  />
                  <p style={SECTION_TITLE}>Actividad en Tiempo Real</p>
                </div>
                <p style={SECTION_SUB}>
                  {activeUsers.length} activo
                  {activeUsers.length !== 1 ? 's' : ''} · auto-refresh 30s
                </p>
              </div>
              <div
                style={{
                  padding: '8px 20px 12px',
                  maxHeight: 220,
                  overflowY: 'auto',
                }}
              >
                {activeUsers.length === 0 ? (
                  <p
                    style={{
                      fontSize: 12,
                      color: '#4A6580',
                      textAlign: 'center',
                      padding: '20px 0',
                    }}
                  >
                    Sin usuarios activos ahora mismo
                  </p>
                ) : (
                  activeUsers.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between py-2"
                      style={{ borderBottom: '1px solid #F0F4FA' }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: '#1A6FC4',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: 'white',
                            }}
                          >
                            {(u.full_name ?? u.email ?? '?')[0].toUpperCase()}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: '#0A1628',
                          }}
                        >
                          {u.email ?? '—'}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          color: '#0ABFBC',
                          fontWeight: 500,
                          flexShrink: 0,
                        }}
                      >
                        {timeAgo(u.last_seen)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Conversiones */}
            <div style={CARD_STYLE}>
              <div
                className="px-5 py-4"
                style={{ borderBottom: '1px solid #D6E4F0' }}
              >
                <p style={SECTION_TITLE}>Conversiones</p>
              </div>
              <div style={{ padding: '16px 20px' }}>
                {/* Signups */}
                <div style={{ marginBottom: 16 }}>
                  <div
                    className="flex items-center justify-between"
                    style={{ marginBottom: 4 }}
                  >
                    <span style={{ fontSize: 12, color: '#4A6580' }}>
                      Nuevos registros (7 días)
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        style={{
                          fontSize: 22,
                          fontWeight: 700,
                          color: '#0A1628',
                          fontFamily: 'var(--font-sora, Sora, sans-serif)',
                        }}
                      >
                        {signupsLast7}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: signupsDelta >= 0 ? '#0ABFBC' : '#E05C5C',
                        }}
                      >
                        {signupsDelta >= 0 ? '+' : ''}
                        {signupsDelta}%
                      </span>
                    </div>
                  </div>
                  <p style={{ fontSize: 11, color: '#4A6580' }}>
                    vs {signupsPrev7} la semana anterior
                  </p>
                </div>

                {/* Demos */}
                <div style={{ borderTop: '1px solid #F0F4FA', paddingTop: 14 }}>
                  <div
                    className="flex items-center justify-between"
                    style={{ marginBottom: 10 }}
                  >
                    <span style={{ fontSize: 12, color: '#4A6580' }}>
                      Demos solicitadas
                    </span>
                    <span
                      style={{
                        fontSize: 22,
                        fontWeight: 700,
                        color: '#0A1628',
                        fontFamily: 'var(--font-sora, Sora, sans-serif)',
                      }}
                    >
                      {data.demoRequests.length}
                    </span>
                  </div>
                  <div style={{ maxHeight: 130, overflowY: 'auto' }}>
                    {data.demoRequests.length === 0 ? (
                      <p style={{ fontSize: 11, color: '#4A6580' }}>
                        Sin demos solicitadas aún
                      </p>
                    ) : (
                      data.demoRequests.slice(0, 6).map((dr) => (
                        <div
                          key={dr.id}
                          className="flex items-center justify-between py-1"
                        >
                          <span
                            style={{
                              fontSize: 11,
                              color: '#0A1628',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: 180,
                            }}
                          >
                            {dr.email}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              padding: '2px 7px',
                              borderRadius: 5,
                              fontWeight: 600,
                              flexShrink: 0,
                              background:
                                dr.estado === 'convertido'
                                  ? 'rgba(10,191,188,0.1)'
                                  : dr.estado === 'contactado'
                                  ? 'rgba(26,111,196,0.1)'
                                  : 'rgba(245,158,11,0.1)',
                              color:
                                dr.estado === 'convertido'
                                  ? '#0ABFBC'
                                  : dr.estado === 'contactado'
                                  ? '#1A6FC4'
                                  : '#D97706',
                            }}
                          >
                            {dr.estado}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── PÁGINAS MÁS VISITADAS ── */}
        <div style={CARD_STYLE}>
          <div
            className="px-6 py-4"
            style={{ borderBottom: '1px solid #D6E4F0' }}
          >
            <p style={SECTION_TITLE}>Páginas Más Visitadas</p>
            <p style={SECTION_SUB}>Ranking histórico acumulado</p>
          </div>
          <div style={{ padding: '20px 24px' }}>
            {data.pageViews.length === 0 ? (
              <p
                style={{
                  fontSize: 13,
                  color: '#4A6580',
                  textAlign: 'center',
                  padding: '16px 0',
                }}
              >
                Sin datos de visitas aún — se registrarán automáticamente al navegar.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {data.pageViews.map((pv, i) => {
                  const pct = (Number(pv.total) / maxViews) * 100
                  return (
                    <div key={pv.page} className="flex items-center gap-3">
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#4A6580',
                          width: 20,
                          textAlign: 'right',
                          flexShrink: 0,
                        }}
                      >
                        {i + 1}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: '#0A1628',
                          width: 170,
                          flexShrink: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {pageName(pv.page)}
                      </span>
                      <div
                        style={{
                          flex: 1,
                          background: '#F0F4FA',
                          borderRadius: 6,
                          height: 8,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            borderRadius: 6,
                            width: `${pct}%`,
                            background: 'linear-gradient(90deg, #1A6FC4, #0ABFBC)',
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#0A1628',
                          width: 52,
                          textAlign: 'right',
                          flexShrink: 0,
                        }}
                      >
                        {Number(pv.total).toLocaleString()}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
