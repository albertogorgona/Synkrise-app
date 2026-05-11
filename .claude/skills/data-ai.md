# Skill: Excel Import + IA Insights — Synkrise

## Cuándo aplicar este skill
Siempre que implementes: importación de archivos Excel/CSV, procesamiento de datos del usuario, o el panel de Insights con IA.

---

## MÓDULO 1 — Importación de Excel / CSV

### Dependencias
```bash
npm install xlsx    # SheetJS — procesa .xlsx y .csv en el browser
```

### Columnas esperadas del archivo del usuario
```
Fecha        → string o Date  (ej: "2025-05-01" o "01/05/2025")
Producto     → string         (nombre del producto)
Categoría    → string         (ej: "Alimentos", "Bebidas")
Unidades     → number         (cantidad vendida)
Ventas       → number         (monto en $)
Costo        → number         (costo de la venta)
```

### Función de importación — patrón estándar
```tsx
// lib/importExcel.ts
import * as XLSX from 'xlsx'

export interface SalesRow {
  fecha: string
  producto: string
  categoria: string
  unidades: number
  ventas: number
  costo: number
}

export interface ImportResult {
  data: SalesRow[]
  errors: string[]
  rowCount: number
}

const COLUMN_ALIASES: Record<string, keyof SalesRow> = {
  // Español
  'fecha': 'fecha', 'date': 'fecha',
  'producto': 'producto', 'product': 'producto', 'item': 'producto',
  'categoria': 'categoria', 'categoría': 'categoria', 'category': 'categoria',
  'unidades': 'unidades', 'units': 'unidades', 'qty': 'unidades', 'cantidad': 'unidades',
  'ventas': 'ventas', 'sales': 'ventas', 'revenue': 'ventas', 'monto': 'ventas',
  'costo': 'costo', 'cost': 'costo', 'costs': 'costo',
}

export function parseExcelFile(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array', cellDates: true })
        
        // Tomar la primera hoja
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][]
        
        if (rawRows.length < 2) {
          resolve({ data: [], errors: ['El archivo está vacío o no tiene datos.'], rowCount: 0 })
          return
        }
        
        // Mapear headers
        const headers = (rawRows[0] as string[]).map(h =>
          String(h).toLowerCase().trim().replace(/[^a-záéíóú\w]/g, '')
        )
        
        const columnMap: Partial<Record<keyof SalesRow, number>> = {}
        headers.forEach((h, i) => {
          const mapped = COLUMN_ALIASES[h]
          if (mapped) columnMap[mapped] = i
        })
        
        // Validar columnas requeridas
        const required: (keyof SalesRow)[] = ['fecha', 'producto', 'ventas']
        const missing = required.filter(col => columnMap[col] === undefined)
        
        if (missing.length > 0) {
          resolve({
            data: [],
            errors: [`Columnas no encontradas: ${missing.join(', ')}. Verifica que tu archivo tenga estas columnas.`],
            rowCount: 0
          })
          return
        }
        
        // Procesar filas
        const parsedData: SalesRow[] = []
        const errors: string[] = []
        
        rawRows.slice(1).forEach((row: unknown[], idx) => {
          const ventas = Number(row[columnMap.ventas!])
          if (isNaN(ventas) || ventas <= 0) {
            errors.push(`Fila ${idx + 2}: valor de ventas inválido`)
            return
          }
          
          parsedData.push({
            fecha: String(row[columnMap.fecha!] ?? ''),
            producto: String(row[columnMap.producto!] ?? 'Sin nombre'),
            categoria: String(row[columnMap.categoria!] ?? 'Otros'),
            unidades: Number(row[columnMap.unidades!] ?? 0),
            ventas,
            costo: Number(row[columnMap.costo!] ?? 0),
          })
        })
        
        resolve({ data: parsedData, errors, rowCount: parsedData.length })
        
      } catch {
        resolve({ data: [], errors: ['No se pudo leer el archivo. Verifica que sea .xlsx o .csv válido.'], rowCount: 0 })
      }
    }
    
    reader.readAsArrayBuffer(file)
  })
}
```

### Componente de importación (botón + drag & drop)
```tsx
// components/dashboard/ImportButton.tsx
'use client'
import { useRef } from 'react'
import { parseExcelFile } from '@/lib/importExcel'
import { useDashboardStore } from '@/lib/store'
import { toast } from 'sonner'

export function ImportButton() {
  const inputRef = useRef<HTMLInputElement>(null)
  const setData = useDashboardStore(s => s.setData)
  
  async function handleFile(file: File) {
    toast.loading('Procesando archivo...')
    const result = await parseExcelFile(file)
    
    if (result.errors.length > 0 && result.data.length === 0) {
      toast.error('Error al importar', { description: result.errors[0] })
      return
    }
    
    setData(result.data)
    toast.success(`${result.rowCount} filas importadas`, {
      description: result.errors.length > 0
        ? `${result.errors.length} filas con errores fueron ignoradas`
        : 'Dashboard actualizado correctamente'
    })
  }
  
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <button
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg
                   text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        ↑ Importar Excel
      </button>
    </>
  )
}
```

### Zustand store — estructura de datos
```tsx
// lib/store.ts
import { create } from 'zustand'
import { SalesRow } from './importExcel'

interface DashboardStore {
  data: SalesRow[]
  isImported: boolean
  setData: (data: SalesRow[]) => void
  clearData: () => void
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  data: [],
  isImported: false,
  setData: (data) => set({ data, isImported: true }),
  clearData: () => set({ data: [], isImported: false }),
}))
```

---

## MÓDULO 2 — IA Insights con Anthropic API

### Regla de seguridad — SIEMPRE server-side
La API key de Anthropic **nunca** llega al browser. Todo pasa por `/api/insights/route.ts`.

### API Route — servidor
```tsx
// app/api/insights/route.ts
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic() // usa ANTHROPIC_API_KEY automáticamente

export async function POST(req: NextRequest) {
  const { summary } = await req.json()
  
  if (!summary) {
    return NextResponse.json({ error: 'No se recibieron datos.' }, { status: 400 })
  }

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    system: `Eres un analista de negocios especialista en PYMEs panameñas.
Recibes un resumen de datos operacionales de un dashboard de negocio.
Responde SIEMPRE en español, en lenguaje simple y directo.
Sin tecnicismos. Sin jerga financiera compleja.
El usuario es un dueño de negocio, no un analista.

Formato de respuesta — EXACTAMENTE este JSON:
{
  "insights": [
    {
      "tipo": "positivo" | "alerta" | "oportunidad",
      "titulo": "Título corto (máx 6 palabras)",
      "que_pasa": "Una oración simple explicando qué está ocurriendo.",
      "por_que_importa": "Una oración explicando el impacto en el negocio.",
      "que_hacer": "Una acción concreta y específica que el dueño puede tomar hoy."
    }
  ]
}
Responde SOLO con el JSON. Sin texto adicional, sin markdown, sin explicaciones.`,
    messages: [{ role: 'user', content: summary }]
  })
  
  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  
  try {
    const parsed = JSON.parse(text)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'Error al procesar respuesta de IA.' }, { status: 500 })
  }
}
```

### Función para preparar el resumen (client-side)
```tsx
// lib/buildInsightsSummary.ts
import { SalesRow } from './importExcel'

export function buildSummary(data: SalesRow[]): string {
  const totalVentas = data.reduce((s, r) => s + r.ventas, 0)
  const totalCosto = data.reduce((s, r) => s + r.costo, 0)
  const margen = totalVentas > 0 ? ((totalVentas - totalCosto) / totalVentas * 100).toFixed(1) : '0'
  
  // Top productos
  const byProduct: Record<string, number> = {}
  data.forEach(r => { byProduct[r.producto] = (byProduct[r.producto] || 0) + r.ventas })
  const topProductos = Object.entries(byProduct)
    .sort(([,a],[,b]) => b - a).slice(0, 3)
    .map(([nombre, ventas]) => `${nombre}: $${ventas.toFixed(0)}`).join(', ')

  // Por categoría
  const byCat: Record<string, number> = {}
  data.forEach(r => { byCat[r.categoria] = (byCat[r.categoria] || 0) + r.ventas })
  const topCategorias = Object.entries(byCat)
    .sort(([,a],[,b]) => b - a).slice(0, 3)
    .map(([cat, v]) => `${cat}: $${v.toFixed(0)}`).join(', ')
  
  return `
Resumen del período analizado:
- Total de ventas: $${totalVentas.toFixed(2)}
- Margen bruto estimado: ${margen}%
- Total registros analizados: ${data.length}
- Productos con más ventas: ${topProductos}
- Categorías con más ventas: ${topCategorias}
- Costo total del período: $${totalCosto.toFixed(2)}
  `.trim()
}
```

### Componente del Panel de Insights
```tsx
// components/insights/InsightsPanel.tsx
'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDashboardStore } from '@/lib/store'
import { buildSummary } from '@/lib/buildInsightsSummary'

type Insight = {
  tipo: 'positivo' | 'alerta' | 'oportunidad'
  titulo: string
  que_pasa: string
  por_que_importa: string
  que_hacer: string
}

const TIPO_CONFIG = {
  positivo:    { bg: 'bg-teal-50', border: 'border-teal-200', icon: '↑', color: 'text-teal-700' },
  alerta:      { bg: 'bg-red-50',  border: 'border-red-200',  icon: '⚠', color: 'text-red-700' },
  oportunidad: { bg: 'bg-blue-50', border: 'border-blue-200', icon: '✦', color: 'text-blue-700' },
}

export function InsightsPanel() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [insights, setInsights] = useState<Insight[]>([])
  const data = useDashboardStore(s => s.data)

  async function fetchInsights() {
    setLoading(true)
    setOpen(true)
    try {
      const summary = buildSummary(data.length > 0 ? data : []) 
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary }),
      })
      const json = await res.json()
      setInsights(json.insights ?? [])
    } catch {
      setInsights([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={fetchInsights}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2
                   px-5 py-3 bg-[#0A1628] text-white rounded-full shadow-xl
                   font-medium text-sm hover:bg-[#1A5A9E] transition-colors"
      >
        ✦ Analizar con IA
      </button>

      {/* Panel lateral */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/20 z-40"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed right-0 top-0 h-full w-96 bg-white z-50 shadow-2xl
                         flex flex-col overflow-hidden"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="p-5 border-b border-[#D6E4F0] flex justify-between items-center">
                <div>
                  <h2 className="font-sora font-semibold text-[#0A1628]">Insights IA</h2>
                  <p className="text-xs text-[#4A6580] mt-0.5">Análisis de tu operación</p>
                </div>
                <button onClick={() => setOpen(false)} className="text-[#4A6580] hover:text-[#0A1628]">✕</button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {loading && (
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse"/>
                    ))}
                  </div>
                )}
                {!loading && insights.map((ins, i) => {
                  const cfg = TIPO_CONFIG[ins.tipo]
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07, duration: 0.2 }}
                      className={`p-4 rounded-xl border ${cfg.bg} ${cfg.border}`}
                    >
                      <div className={`flex items-center gap-2 font-semibold text-sm mb-2 ${cfg.color}`}>
                        <span>{cfg.icon}</span> {ins.titulo}
                      </div>
                      <p className="text-xs text-gray-700 mb-1">{ins.que_pasa}</p>
                      <p className="text-xs text-gray-500 mb-2">{ins.por_que_importa}</p>
                      <div className="text-xs font-medium text-[#1A6FC4] bg-white/70 rounded-lg p-2">
                        → {ins.que_hacer}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
```

---

## Instalación de dependencias para este módulo
```bash
npm install xlsx @anthropic-ai/sdk zustand sonner framer-motion
```
