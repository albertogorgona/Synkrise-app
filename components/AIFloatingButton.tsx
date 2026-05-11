'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useHoverContext } from '@/lib/hover-context'

interface Message {
  role: 'user' | 'ai'
  content: string
}

interface BusinessContext {
  periodo?: string
  ventas_totales?: number
  transacciones?: number
  producto_mas_vendido?: string
  top_3_productos?: string
  top_categorias?: string
  margen_promedio_pct?: number
  vista_actual?: string
  elemento_activo?: string
}

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard':            'Dashboard principal',
  '/dashboard/ventas':     'Módulo de Ventas',
  '/dashboard/inventario': 'Módulo de Inventario',
  '/dashboard/clientes':   'Módulo de Clientes',
  '/dashboard/financiero': 'Módulo Financiero',
  '/dashboard/kpis':       'Panel de KPIs',
}

const QUICK_QUESTIONS = [
  '¿Cuál fue mi producto más vendido?',
  '¿Cómo está mi margen este mes?',
  '¿Qué categoría debo revisar?',
]

export function AIFloatingButton() {
  const pathname = usePathname()
  const vistaActual = ROUTE_LABELS[pathname] ?? null
  const { elementLabel } = useHoverContext()

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [cleared, setCleared] = useState(false)
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const buttonRef = useRef<HTMLButtonElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function fetchContext(): Promise<BusinessContext> {
    try {
      const supabase = createClient()

      // Fetch most recent 500 rows ordered by date desc — no month filter
      // so we always use the most recent period available in the data
      const { data } = await supabase
        .from('ventas')
        .select('fecha, producto, categoria, unidades, precio_unitario, costo_unitario')
        .order('fecha', { ascending: false })
        .limit(500)

      if (!data || data.length === 0) return {}

      // Detect the most recent month present in the data
      const recentMonth = data[0].fecha.substring(0, 7) // "YYYY-MM"
      const monthData = data.filter((r) => r.fecha.startsWith(recentMonth))

      const totalesPorProducto: Record<string, number> = {}
      const totalesPorCategoria: Record<string, number> = {}
      let totalVentas = 0
      let sumMargen = 0
      let countMargen = 0

      for (const row of monthData) {
        const u = Number(row.unidades) || 1
        const p = Number(row.precio_unitario) || 0
        const c = Number(row.costo_unitario) || 0
        const venta = u * p
        totalVentas += venta
        totalesPorProducto[row.producto] = (totalesPorProducto[row.producto] ?? 0) + venta
        const cat = (row.categoria as string) || 'Otro'
        totalesPorCategoria[cat] = (totalesPorCategoria[cat] ?? 0) + venta
        if (p > 0) {
          sumMargen += (p - c) / p
          countMargen++
        }
      }

      const productosSorted = Object.entries(totalesPorProducto).sort((a, b) => b[1] - a[1])
      const top3 = productosSorted
        .slice(0, 3)
        .map(([name, val]) => `${name} ($${Math.round(val).toLocaleString('es-PA')})`)
        .join(', ')

      const topCats = Object.entries(totalesPorCategoria)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, val]) => `${name} ($${Math.round(val).toLocaleString('es-PA')})`)
        .join(', ')

      const MONTH_NAMES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
      const [year, month] = recentMonth.split('-')
      const periodoLabel = `${MONTH_NAMES[parseInt(month, 10)]} ${year}`

      return {
        periodo: periodoLabel,
        ventas_totales: Math.round(totalVentas),
        transacciones: monthData.length,
        producto_mas_vendido: productosSorted[0]?.[0] ?? '',
        top_3_productos: top3,
        top_categorias: topCats,
        margen_promedio_pct:
          countMargen > 0 ? Math.round((sumMargen / countMargen) * 100) : undefined,
      }
    } catch {
      return {}
    }
  }

  async function sendMessage(question: string, extraCtx?: Partial<BusinessContext>) {
    if (!question.trim() || loading) return

    setMessages((prev) => [...prev, { role: 'user', content: question }])
    setInput('')
    setLoading(true)

    try {
      const context = { ...await fetchContext(), ...extraCtx }
      const res = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, context }),
      })
      const json = (await res.json()) as { answer?: string; error?: string }
      const answer = json.answer ?? 'No pude obtener una respuesta. Intenta de nuevo.'
      setMessages((prev) => [...prev, { role: 'ai', content: answer }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: 'Hubo un error de conexión. Intenta de nuevo.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  function clearChat() {
    setMessages([])
    setInput('')
    setCleared(true)
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
    clearTimerRef.current = setTimeout(() => setCleared(false), 2000)
  }

  function handleSummaryClick() {
    sendMessage(
      'Dame un resumen de lo que estoy viendo ahora',
      vistaActual ? { vista_actual: vistaActual } : undefined,
    )
  }

  function handleElementClick() {
    sendMessage(
      'Explícame este indicador y qué debo hacer con lo que muestra',
      {
        ...(vistaActual ? { vista_actual: vistaActual } : {}),
        elemento_activo: elementLabel ?? '',
      },
    )
  }

  function handleClick() {
    setOpen(true)
  }

  return (
    <>
      <style>{`
        @keyframes ai-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>

      {/* Botón flotante */}
      <button
        ref={buttonRef}
        onClick={handleClick}
        aria-label="Abrir asistente IA Synkrise"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: '#1A6FC4',
          color: '#ffffff',
          border: 'none',
          cursor: 'pointer',
          boxShadow:
            '0 4px 20px rgba(26,111,196,0.45), 0 2px 8px rgba(0,0,0,0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          userSelect: 'none',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)'
          e.currentTarget.style.boxShadow =
            '0 6px 28px rgba(26,111,196,0.55), 0 3px 12px rgba(0,0,0,0.22)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow =
            '0 4px 20px rgba(26,111,196,0.45), 0 2px 8px rgba(0,0,0,0.18)'
        }}
      >
        ✦
      </button>

      {/* Drawer lateral */}
      {open && (
        <div
          style={{
            position: 'fixed',
            right: 0,
            top: 0,
            height: '100dvh',
            width: 'min(380px, 100vw)',
            background: '#FFFFFF',
            boxShadow: '-4px 0 32px rgba(10,22,40,0.14)',
            zIndex: 9998,
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #D6E4F0',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#EDF4FC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1A6FC4',
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                ✦
              </div>
              <div>
                <h2
                  style={{
                    fontFamily: 'var(--font-sora), Sora, sans-serif',
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#0A1628',
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  Synkrise IA
                </h2>
                <p style={{ fontSize: 12, color: '#4A6580', margin: 0 }}>
                  Pregúntame sobre tu negocio
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {messages.length > 0 && !loading && (
                <button
                  onClick={clearChat}
                  aria-label="Limpiar conversación"
                  title="Limpiar conversación"
                  style={{
                    background: 'none',
                    border: '1px solid #D6E4F0',
                    cursor: 'pointer',
                    color: '#4A6580',
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontFamily: 'inherit',
                    transition: 'background 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#F0F4FA' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
                >
                  Nueva sesión
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar panel"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#4A6580',
                  fontSize: 18,
                  lineHeight: 1,
                  padding: '6px',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Área de mensajes */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {cleared && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 8,
                  background: '#E6FAF9',
                  border: '1px solid #99F6E4',
                  alignSelf: 'center',
                  fontSize: 12,
                  color: '#0ABFBC',
                  fontWeight: 500,
                }}
              >
                ✓ Conversación reiniciada
              </div>
            )}

            {messages.length === 0 && !loading && (
              <p
                style={{
                  color: '#4A6580',
                  fontSize: 13,
                  textAlign: 'center',
                  marginTop: 32,
                  lineHeight: 1.6,
                }}
              >
                Haz una pregunta o usa una sugerencia de abajo.
              </p>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius:
                      msg.role === 'user'
                        ? '16px 16px 4px 16px'
                        : '16px 16px 16px 4px',
                    background: msg.role === 'user' ? '#1A6FC4' : '#F0F4FA',
                    color: msg.role === 'user' ? '#ffffff' : '#0A1628',
                    fontSize: 13,
                    lineHeight: 1.55,
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Puntos de carga */}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    background: '#F0F4FA',
                    borderRadius: '16px 16px 16px 4px',
                    padding: '12px 16px',
                    display: 'flex',
                    gap: 5,
                    alignItems: 'center',
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: '#1A6FC4',
                        display: 'inline-block',
                        animation: `ai-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chips */}
          {(vistaActual || messages.length === 0) && (
            <div
              style={{
                padding: '0 20px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                flexShrink: 0,
              }}
            >
              {/* Chip contextual — cambia según hover sobre elemento */}
              {vistaActual && !loading && (
                <button
                  onClick={elementLabel ? handleElementClick : handleSummaryClick}
                  style={{
                    background: '#0ABFBC',
                    border: 'none',
                    borderRadius: 20,
                    padding: '7px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    alignSelf: 'flex-start',
                    transition: 'opacity 0.15s',
                    opacity: 1,
                  }}
                >
                  {elementLabel ? '✦ ¿Qué es este indicador?' : '✦ Resumir lo que estoy viendo'}
                </button>
              )}

              {/* Preguntas rápidas — solo al inicio de la conversación */}
              {messages.length === 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      disabled={loading}
                      style={{
                        background: '#EDF4FC',
                        border: '1px solid #BFDBFE',
                        borderRadius: 20,
                        padding: '6px 12px',
                        fontSize: 12,
                        color: '#1A6FC4',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'background 0.15s',
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Input */}
          <div
            style={{
              padding: '12px 20px 20px',
              borderTop: '1px solid #D6E4F0',
              flexShrink: 0,
              display: 'flex',
              gap: 8,
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage(input)
                }
              }}
              placeholder="Escribe tu pregunta..."
              disabled={loading}
              style={{
                flex: 1,
                border: '1px solid #D6E4F0',
                borderRadius: 10,
                padding: '9px 14px',
                fontSize: 13,
                color: '#0A1628',
                fontFamily: 'inherit',
                outline: 'none',
                background: '#FAFCFF',
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              style={{
                background: '#1A6FC4',
                color: '#ffffff',
                border: 'none',
                borderRadius: 10,
                padding: '9px 16px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                opacity: !input.trim() || loading ? 0.45 : 1,
                fontFamily: 'inherit',
                transition: 'opacity 0.15s',
                flexShrink: 0,
              }}
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
