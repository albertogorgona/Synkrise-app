'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { parseExcelFile, type SalesRow } from '@/lib/importExcel'
import { useDashboardStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'

type Step = 'upload' | 'preview' | 'importing' | 'success'

const BATCH_SIZE = 50

const COLUMN_LABELS: Record<keyof SalesRow, string> = {
  fecha: 'Fecha',
  producto: 'Producto',
  categoria: 'Categoría',
  unidades: 'Unidades',
  precio_unitario: 'Precio Unit.',
  costo_unitario: 'Costo Unit.',
}

const COLS: (keyof SalesRow)[] = [
  'fecha', 'producto', 'categoria', 'unidades', 'precio_unitario', 'costo_unitario',
]

function IconUpload() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="14" fill="#E8F0FA" />
      <path d="M24 30V18M24 18L19 23M24 18L29 23" stroke="#1A6FC4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 34H32" stroke="#1A6FC4" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <rect width="56" height="56" rx="16" fill="#E6FAF9" />
      <path d="M18 28L24 34L38 20" stroke="#0ABFBC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconAlert() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="10" cy="10" r="9" stroke="#E05C5C" strokeWidth="1.5" />
      <path d="M10 6V11" stroke="#E05C5C" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="14" r="1" fill="#E05C5C" />
    </svg>
  )
}

export function ImportButton() {
  const router = useRouter()
  const setData = useDashboardStore((s) => s.setData)

  const [step, setStep] = useState<Step>('upload')
  const [rows, setRows] = useState<SalesRow[]>([])
  const [fileName, setFileName] = useState<string>('')
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(0)
  const [importedCount, setImportedCount] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback((file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError('Solo se aceptan archivos .xlsx, .xls o .csv')
      return
    }
    setError(null)
    setFileName(file.name)
    setParsing(true)
    parseExcelFile(file)
      .then((parsed) => {
        setRows(parsed)
        setStep('preview')
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Error desconocido al leer el archivo.'
        setError(msg)
      })
      .finally(() => setParsing(false))
  }, [])

  async function handleImport() {
    setStep('importing')
    setSaved(0)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('No hay sesión activa. Por favor inicia sesión nuevamente.')
      setStep('preview')
      return
    }

    const records = rows.map((row) => ({ ...row, user_id: user.id }))
    const total = records.length
    let inserted = 0

    for (let i = 0; i < total; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE)
      const { error: insertError } = await supabase.from('ventas').insert(batch)
      if (insertError) {
        setError(`Error al guardar: ${insertError.message}`)
        setStep('preview')
        return
      }
      inserted += batch.length
      setSaved(inserted)
    }

    setData(rows)
    setImportedCount(total)
    setStep('success')
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  function handleReset() {
    setStep('upload')
    setRows([])
    setFileName('')
    setError(null)
    setSaved(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Upload ───────────────────────────────────────────────────────────────────

  if (step === 'upload') {
    return (
      <div style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragging(false)
            const file = e.dataTransfer.files[0]
            if (file) processFile(file)
          }}
        >
          <div
            className="w-full rounded-2xl flex flex-col items-center justify-center gap-6 cursor-pointer transition-colors"
            style={{
              border: `2px dashed ${isDragging ? '#1A6FC4' : '#D6E4F0'}`,
              background: isDragging ? '#EDF4FC' : '#F7FAFD',
              padding: 'clamp(2.5rem, 6vw, 5rem) clamp(1.5rem, 4vw, 4rem)',
              minHeight: 'clamp(280px, 40vh, 420px)',
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            {parsing ? (
              <>
                <div
                  className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
                  style={{ borderColor: '#D6E4F0', borderTopColor: '#1A6FC4' }}
                />
                <div className="text-center">
                  <p className="text-base font-semibold" style={{ color: '#0A1628' }}>
                    Procesando {fileName}...
                  </p>
                  <p className="text-sm mt-1" style={{ color: '#4A6580' }}>Un momento</p>
                </div>
              </>
            ) : (
              <>
                <IconUpload />
                <div className="text-center">
                  <p className="text-lg font-semibold mb-1" style={{ color: '#0A1628' }}>
                    Arrastra tu archivo .xlsx aquí
                  </p>
                  <p className="text-sm" style={{ color: '#4A6580' }}>
                    o haz clic para seleccionarlo desde tu dispositivo
                  </p>
                </div>
                <div className="flex items-center gap-3 w-full max-w-sm">
                  <div className="flex-1 h-px" style={{ background: '#D6E4F0' }} />
                  <span className="text-xs font-medium" style={{ color: '#4A6580' }}>o</span>
                  <div className="flex-1 h-px" style={{ background: '#D6E4F0' }} />
                </div>
                <button
                  type="button"
                  className="px-7 py-3 rounded-[9px] text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: '#1A6FC4' }}
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                >
                  Seleccionar archivo
                </button>
                <p className="text-xs" style={{ color: '#4A6580' }}>
                  Formatos aceptados: .xlsx, .xls, .csv
                </p>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) processFile(file)
            }}
          />

          {error && (
            <div
              className="mt-4 flex items-start gap-3 px-4 py-3 rounded-[9px]"
              style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
            >
              <IconAlert />
              <p className="text-sm font-medium" style={{ color: '#E05C5C' }}>{error}</p>
            </div>
          )}

          {!error && (
            <div
              className="mt-4 flex items-start gap-3 px-4 py-3 rounded-[9px]"
              style={{ background: '#EDF4FC', border: '1px solid #BFDBFE' }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="10" cy="10" r="9" stroke="#1A6FC4" strokeWidth="1.5" />
                <path d="M10 9V14" stroke="#1A6FC4" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="10" cy="6.5" r="1" fill="#1A6FC4" />
              </svg>
              <p className="text-sm" style={{ color: '#1A6FC4' }}>
                El archivo debe incluir las columnas:{' '}
                <strong>fecha, producto, unidades, precio_unitario, costo_unitario</strong>.
                La columna <strong>categoria</strong> es opcional.
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Preview ──────────────────────────────────────────────────────────────────

  if (step === 'preview') {
    const preview = rows.slice(0, 5)
    return (
      <div style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
        <div className="mb-6">
          <p className="text-sm" style={{ color: '#4A6580' }}>
            <strong style={{ color: '#0A1628' }}>{rows.length} registros</strong> detectados en{' '}
            <span style={{ color: '#1A6FC4' }}>{fileName}</span>. Revisa las primeras filas.
          </p>
        </div>

        {error && (
          <div
            className="mb-5 flex items-start gap-3 px-4 py-3 rounded-[9px]"
            style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
          >
            <IconAlert />
            <p className="text-sm font-medium" style={{ color: '#E05C5C' }}>{error}</p>
          </div>
        )}

        <div className="rounded-2xl overflow-hidden mb-6" style={{ border: '1px solid #D6E4F0' }}>
          <div
            className="px-5 py-3 flex items-center justify-between"
            style={{ background: '#F0F4FA', borderBottom: '1px solid #D6E4F0' }}
          >
            <span className="text-sm font-semibold" style={{ color: '#0A1628' }}>
              Primeras {preview.length} filas de {rows.length}
            </span>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: '#E6FAF9', color: '#0ABFBC' }}
            >
              Validación correcta
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#0F2D52' }}>
                  {COLS.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'rgba(255,255,255,0.7)' }}
                    >
                      {COLUMN_LABELS[col]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr
                    key={i}
                    style={{
                      background: i % 2 === 0 ? '#FFFFFF' : '#F7FAFD',
                      borderBottom: '1px solid #EEF3FA',
                    }}
                  >
                    <td className="px-4 py-3" style={{ color: '#0A1628' }}>{row.fecha}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: '#0A1628' }}>{row.producto}</td>
                    <td className="px-4 py-3" style={{ color: '#4A6580' }}>
                      {row.categoria || <span style={{ color: '#D6E4F0' }}>—</span>}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#0A1628' }}>
                      {row.unidades.toLocaleString('es-PA')}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#0A1628' }}>
                      ${row.precio_unitario.toFixed(2)}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#0A1628' }}>
                      ${row.costo_unitario.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rows.length > 5 && (
            <div
              className="px-5 py-2.5 text-center text-xs"
              style={{ background: '#F7FAFD', borderTop: '1px solid #EEF3FA', color: '#4A6580' }}
            >
              +{rows.length - 5} filas adicionales no mostradas
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={handleReset}
            className="px-5 py-2.5 rounded-[9px] text-sm font-semibold transition-colors"
            style={{ background: '#F0F4FA', color: '#4A6580', border: '1px solid #D6E4F0' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#E5EDF8' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#F0F4FA' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleImport}
            className="flex-1 sm:flex-none px-6 py-2.5 rounded-[9px] text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: '#1A6FC4' }}
          >
            Confirmar e Importar ({rows.length} registros)
          </button>
        </div>
      </div>
    )
  }

  // ── Importing ────────────────────────────────────────────────────────────────

  if (step === 'importing') {
    const total = rows.length
    const pct = total > 0 ? Math.round((saved / total) * 100) : 0
    return (
      <div
        className="flex flex-col items-center justify-center text-center"
        style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif', minHeight: '40vh' }}
      >
        <div className="max-w-sm w-full">
          <p
            className="text-lg font-semibold mb-2"
            style={{ fontFamily: 'var(--font-sora), Sora, sans-serif', color: '#0A1628' }}
          >
            Guardando datos...
          </p>
          <p className="text-sm mb-8" style={{ color: '#4A6580' }}>
            Guardando {Math.min(saved + BATCH_SIZE, total)} de {total} registros
          </p>
          <div className="w-full rounded-full overflow-hidden mb-3" style={{ height: '10px', background: '#E5EDF8' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #1A6FC4, #0ABFBC)' }}
            />
          </div>
          <p className="text-sm font-semibold" style={{ color: '#1A6FC4' }}>{pct}%</p>
        </div>
      </div>
    )
  }

  // ── Success ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col items-center justify-center text-center"
      style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif', minHeight: '40vh' }}
    >
      <div className="max-w-sm w-full flex flex-col items-center gap-5">
        <IconCheck />
        <div>
          <p
            className="text-xl font-bold mb-1"
            style={{ fontFamily: 'var(--font-sora), Sora, sans-serif', color: '#0A1628' }}
          >
            ¡Importación exitosa!
          </p>
          <p className="text-sm" style={{ color: '#4A6580' }}>
            Se importaron{' '}
            <strong style={{ color: '#0ABFBC' }}>{importedCount} registros</strong> correctamente.
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm"
          style={{ background: '#E6FAF9', color: '#0ABFBC' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="#0ABFBC" strokeWidth="1.2" />
            <path d="M5 8L7 10L11 6" stroke="#0ABFBC" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Redirigiendo al dashboard...
        </div>
      </div>
    </div>
  )
}
