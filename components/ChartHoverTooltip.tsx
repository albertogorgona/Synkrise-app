'use client'

import { useState, useEffect, useRef } from 'react'
import { useHoverContext } from '@/lib/hover-context'
import { createClient } from '@/lib/supabase/client'

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
        const { data } = await supabase
          .from('ventas')
          .select('fecha, producto, unidades, precio_unitario, costo_unitario')
          .order('fecha', { ascending: false })
          .limit(100)

        let contextSummary = ''
        if (data && data.length > 0) {
          const recentMonth = data[0].fecha.substring(0, 7)
          const monthRows = data.filter((r) => r.fecha.startsWith(recentMonth))
          const totalVentas = monthRows.reduce(
            (s, r) => s + Number(r.unidades) * Number(r.precio_unitario),
            0,
          )
          contextSummary = `Período: ${recentMonth}. Ventas: $${Math.round(totalVentas).toLocaleString('es-PA')} en ${monthRows.length} transacciones.`
        }

        const res = await fetch('/api/ai-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: `Dame un insight breve (máximo 3 oraciones) sobre ${elementLabel} como business analyst. Sin markdown, texto plano.`,
            context: {
              elemento_activo: elementLabel,
              ...(contextSummary ? { resumen_datos: contextSummary } : {}),
            },
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
        {/* Label del elemento */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 8,
          }}
        >
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
