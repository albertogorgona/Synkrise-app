'use client'

import { useState, useEffect, useRef } from 'react'
import { useHoverContext } from '@/lib/hover-context'
import { createClient } from '@/lib/supabase/client'

// ─── Section detection ────────────────────────────────────────────────────────

function detectSection(label: string): 'inventario' | 'clientes' | 'ventas' {
  const l = label.toLowerCase()
  if (/stock|rotaci[oó]n|inventario|m[ií]nimo/.test(l)) return 'inventario'
  if (/client[ae]|segmento/.test(l)) return 'clientes'
  return 'ventas'
}

// ─── Context builders per section ────────────────────────────────────────────

async function buildVentasContext(supabase: ReturnType<typeof createClient>): Promise<string> {
  const { data } = await supabase
    .from('ventas')
    .select('fecha, unidades, precio_unitario, costo_unitario')
    .order('fecha', { ascending: false })
    .limit(500)

  if (!data || data.length === 0) return ''

  const monthlyMap = new Map<string, { v: number; c: number; tx: number }>()
  for (const row of data) {
    const m = row.fecha.substring(0, 7)
    const prev = monthlyMap.get(m) ?? { v: 0, c: 0, tx: 0 }
    const v = (row.unidades ?? 0) * (row.precio_unitario ?? 0)
    const c = (row.unidades ?? 0) * (row.costo_unitario ?? 0)
    monthlyMap.set(m, { v: prev.v + v, c: prev.c + c, tx: prev.tx + 1 })
  }

  const sorted = [...monthlyMap.entries()].sort(([a], [b]) => a.localeCompare(b))
  const last6 = sorted.slice(-6)

  const lines = last6.map(([m, d]) => {
    const margen = d.v > 0 ? ((d.v - d.c) / d.v * 100).toFixed(1) : '0.0'
    const ticket = d.tx > 0 ? Math.round(d.v / d.tx) : 0
    return `${m}: Ventas=$${Math.round(d.v).toLocaleString('es-PA')}, Margen=${margen}%, Transacciones=${d.tx}, Ticket=$${ticket.toLocaleString('es-PA')}`
  })

  return 'Datos mensuales exactos (últimos 6 meses):\n' + lines.join('\n')
}

async function buildInventarioContext(supabase: ReturnType<typeof createClient>): Promise<string> {
  const { data } = await supabase
    .from('inventario')
    .select('producto, categoria, stock_actual, stock_minimo, rotacion, costo_unitario')

  if (!data || data.length === 0) return ''

  const totalProductos = data.length
  const bajoMinimo = data.filter(i => (i.stock_actual ?? 0) < (i.stock_minimo ?? 0)).length
  const rotacionProm = data.reduce((s, i) => s + (i.rotacion ?? 0), 0) / (totalProductos || 1)
  const valorTotal = data.reduce((s, i) => s + (i.stock_actual ?? 0) * (i.costo_unitario ?? 0), 0)

  const catMap = new Map<string, { sum: number; count: number }>()
  for (const i of data) {
    const cat = i.categoria || 'Otro'
    const prev = catMap.get(cat) ?? { sum: 0, count: 0 }
    catMap.set(cat, { sum: prev.sum + (i.rotacion ?? 0), count: prev.count + 1 })
  }
  const catLines = [...catMap.entries()]
    .map(([cat, { sum, count }]) => `${cat}: Rotación promedio=${Math.round(sum / count * 10) / 10}x`)
    .join(', ')

  return [
    `Total productos: ${totalProductos}`,
    `Bajo stock mínimo: ${bajoMinimo} productos (${totalProductos > 0 ? Math.round(bajoMinimo / totalProductos * 100) : 0}%)`,
    `Rotación promedio global: ${rotacionProm.toFixed(1)}x`,
    `Valor total inventario: $${Math.round(valorTotal).toLocaleString('es-PA')}`,
    `Rotación por categoría: ${catLines}`,
  ].join('\n')
}

async function buildClientesContext(supabase: ReturnType<typeof createClient>): Promise<string> {
  const { data } = await supabase
    .from('clientes')
    .select('segmento, compras, facturacion')

  if (!data || data.length === 0) return ''

  const totalClientes = data.length
  const totalFacturacion = data.reduce((s, c) => s + (c.facturacion ?? 0), 0)
  const totalCompras = data.reduce((s, c) => s + (c.compras ?? 0), 0)
  const ticketProm = totalCompras > 0 ? totalFacturacion / totalCompras : 0

  const segMap = new Map<string, { count: number; fact: number; compras: number }>()
  for (const c of data) {
    const seg = c.segmento || 'Sin segmento'
    const prev = segMap.get(seg) ?? { count: 0, fact: 0, compras: 0 }
    segMap.set(seg, { count: prev.count + 1, fact: prev.fact + (c.facturacion ?? 0), compras: prev.compras + (c.compras ?? 0) })
  }
  const segLines = [...segMap.entries()]
    .sort(([, a], [, b]) => b.fact - a.fact)
    .map(([seg, { count, fact }]) => `${seg}: ${count} clientes, $${Math.round(fact).toLocaleString('es-PA')}`)
    .join(' | ')

  return [
    `Total clientes: ${totalClientes}`,
    `Facturación total: $${Math.round(totalFacturacion).toLocaleString('es-PA')}`,
    `Ticket promedio: $${Math.round(ticketProm).toLocaleString('es-PA')}`,
    `Por segmento: ${segLines}`,
  ].join('\n')
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ChartHoverTooltip() {
  const { elementLabel } = useHoverContext()
  const [insight, setInsight] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)
  const cacheRef = useRef<Record<string, string>>({})
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeRef = useRef<string | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!elementLabel) {
      setVisible(false)
      setInsight(null)
      setLoading(false)
      activeRef.current = null
      return
    }

    setVisible(true)
    activeRef.current = elementLabel

    if (cacheRef.current[elementLabel]) {
      setInsight(cacheRef.current[elementLabel])
      setLoading(false)
      return
    }

    setInsight(null)
    setLoading(true)

    debounceRef.current = setTimeout(async () => {
      if (activeRef.current !== elementLabel) return

      try {
        const supabase = createClient()
        const section = detectSection(elementLabel)

        let contextData = ''
        if (section === 'inventario') {
          contextData = await buildInventarioContext(supabase)
        } else if (section === 'clientes') {
          contextData = await buildClientesContext(supabase)
        } else {
          contextData = await buildVentasContext(supabase)
        }

        if (activeRef.current !== elementLabel) return

        const res = await fetch('/api/ai-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: `Analiza EXCLUSIVAMENTE con los datos exactos proporcionados: "${elementLabel}". No uses conocimiento externo ni supongas cifras que no estén en el contexto. Solo menciona números que aparezcan textualmente en los datos. Máximo 3 oraciones, texto plano, sin markdown.`,
            context: {
              elemento_activo: elementLabel,
              ...(contextData ? { datos_exactos: contextData } : {}),
            },
            strictMode: true,
          }),
        })

        if (activeRef.current !== elementLabel) return

        const json = (await res.json()) as { answer?: string }
        const answer = json.answer?.trim() ?? ''

        if (answer) {
          cacheRef.current[elementLabel] = answer
          setInsight(answer)
        }
      } catch {
        // fail silently — tooltip simplemente no muestra insight
      } finally {
        if (activeRef.current === elementLabel) setLoading(false)
      }
    }, 700)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [elementLabel])

  if (!visible) return null
  if (!loading && !insight) return null

  return (
    <>
      <style>{`
        @keyframes tooltip-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dot-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          bottom: 90,
          left: 24,
          zIndex: 9990,
          maxWidth: 320,
          background: '#0F2D52',
          color: '#E0ECF8',
          borderRadius: 12,
          padding: '12px 16px',
          boxShadow: '0 8px 32px rgba(10,22,40,0.28)',
          fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
          fontSize: 13,
          lineHeight: 1.6,
          pointerEvents: 'none',
          animation: 'tooltip-in 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ color: '#0ABFBC', fontSize: 11 }}>✦</span>
          <span
            style={{
              fontFamily: 'var(--font-sora), Sora, sans-serif',
              fontSize: 10,
              fontWeight: 700,
              color: '#8BAFD4',
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
            }}
          >
            {elementLabel}
          </span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: '#0ABFBC',
                    display: 'inline-block',
                    animation: `dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
            <span style={{ color: '#8BAFD4', fontSize: 12 }}>Analizando...</span>
          </div>
        ) : (
          <p style={{ margin: 0 }}>{insight}</p>
        )}
      </div>
    </>
  )
}
