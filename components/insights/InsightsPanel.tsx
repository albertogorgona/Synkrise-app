'use client'

import { useState } from 'react'
import { useDashboardStore } from '@/lib/store'
import { buildInsightsSummary } from '@/lib/buildInsightsSummary'

type InsightType = 'positivo' | 'alerta' | 'oportunidad'

interface Insight {
  tipo: InsightType
  titulo: string
  que_pasa: string
  por_que_importa: string
  que_hacer: string
}

interface InsightsResponse {
  insights?: Insight[]
  error?: string
}

const TIPO_CONFIG: Record<InsightType, { bg: string; border: string; icon: string; color: string }> = {
  positivo:    { bg: '#F0FDF9', border: '#99F6E4', icon: '↑', color: '#0ABFBC' },
  alerta:      { bg: '#FEF2F2', border: '#FECACA', icon: '⚠', color: '#E05C5C' },
  oportunidad: { bg: '#EDF4FC', border: '#BFDBFE', icon: '✦', color: '#1A6FC4' },
}

export function InsightsPanel() {
  const data = useDashboardStore((s) => s.data)
  const isImported = useDashboardStore((s) => s.isImported)

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [insights, setInsights] = useState<Insight[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)

  async function handleAnalyze() {
    setOpen(true)
    setLoading(true)
    setFetchError(null)
    setInsights([])

    try {
      const summary = buildInsightsSummary(data)
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary }),
      })
      const json = (await res.json()) as InsightsResponse
      if (json.error || !json.insights) {
        setFetchError('No se pudo generar el análisis. Intenta nuevamente.')
      } else {
        setInsights(json.insights)
      }
    } catch {
      setFetchError('No se pudo generar el análisis. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={handleAnalyze}
        disabled={!isImported && data.length === 0}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full shadow-xl font-medium text-sm text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: '#0A1628', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
        title={data.length === 0 ? 'Importa datos primero para analizar' : 'Analizar con IA'}
      >
        <span>✦</span>
        Analizar con IA
      </button>

      {/* Overlay + panel lateral */}
      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setOpen(false)}
          />
          <div
            className="fixed right-0 top-0 h-full z-50 shadow-2xl flex flex-col overflow-hidden"
            style={{ width: 'min(24rem, 100vw)', background: '#FFFFFF' }}
          >
            {/* Header */}
            <div
              className="px-5 py-4 flex items-center justify-between flex-shrink-0"
              style={{ borderBottom: '1px solid #D6E4F0' }}
            >
              <div>
                <h2
                  className="font-bold text-base"
                  style={{ fontFamily: 'var(--font-sora), Sora, sans-serif', color: '#0A1628' }}
                >
                  Insights IA
                </h2>
                <p className="text-xs mt-0.5" style={{ color: '#4A6580' }}>
                  Análisis de tu operación
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
                style={{ color: '#4A6580' }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {loading && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin flex-shrink-0"
                      style={{ borderColor: '#D6E4F0', borderTopColor: '#1A6FC4' }}
                    />
                    <p className="text-sm" style={{ color: '#4A6580' }}>
                      Analizando tu operación...
                    </p>
                  </div>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: '#F0F4FA' }} />
                  ))}
                </>
              )}

              {!loading && fetchError && (
                <div
                  className="flex items-start gap-3 p-4 rounded-xl"
                  style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                    <circle cx="10" cy="10" r="9" stroke="#E05C5C" strokeWidth="1.5" />
                    <path d="M10 6V11" stroke="#E05C5C" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="10" cy="14" r="1" fill="#E05C5C" />
                  </svg>
                  <p className="text-sm" style={{ color: '#E05C5C' }}>{fetchError}</p>
                </div>
              )}

              {!loading && !fetchError && insights.length === 0 && (
                <p className="text-sm text-center py-8" style={{ color: '#4A6580' }}>
                  No hay insights disponibles.
                </p>
              )}

              {!loading && insights.map((ins, i) => {
                const cfg = TIPO_CONFIG[ins.tipo] ?? TIPO_CONFIG.oportunidad
                return (
                  <div
                    key={i}
                    className="p-4 rounded-xl"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                  >
                    <div className="flex items-center gap-2 font-semibold text-sm mb-2" style={{ color: cfg.color }}>
                      <span>{cfg.icon}</span>
                      <span>{ins.titulo}</span>
                    </div>
                    <p className="text-xs mb-1" style={{ color: '#374151' }}>{ins.que_pasa}</p>
                    <p className="text-xs mb-3" style={{ color: '#6B7280' }}>{ins.por_que_importa}</p>
                    <div
                      className="text-xs font-medium p-2 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.7)', color: '#1A6FC4' }}
                    >
                      → {ins.que_hacer}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer — re-analizar */}
            {!loading && (insights.length > 0 || fetchError) && (
              <div
                className="px-5 py-4 flex-shrink-0"
                style={{ borderTop: '1px solid #D6E4F0' }}
              >
                <button
                  onClick={handleAnalyze}
                  className="w-full py-2.5 rounded-[9px] text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: '#1A6FC4' }}
                >
                  Volver a analizar
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}
