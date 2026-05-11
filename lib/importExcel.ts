import * as XLSX from 'xlsx'

export interface SalesRow {
  fecha: string
  producto: string
  categoria: string
  unidades: number
  precio_unitario: number
  costo_unitario: number
}

type RawValue = string | number | boolean | Date | null | undefined

const COLUMN_ALIASES: Record<string, keyof SalesRow> = {
  fecha: 'fecha', date: 'fecha',
  producto: 'producto', product: 'producto', item: 'producto',
  categoria: 'categoria', categoría: 'categoria', category: 'categoria',
  unidades: 'unidades', units: 'unidades', qty: 'unidades', cantidad: 'unidades',
  precio_unitario: 'precio_unitario', price: 'precio_unitario', precio: 'precio_unitario',
  costo_unitario: 'costo_unitario', cost: 'costo_unitario', costo: 'costo_unitario',
}

const REQUIRED: (keyof SalesRow)[] = ['fecha', 'producto', 'unidades', 'precio_unitario', 'costo_unitario']

function excelSerialToDate(serial: number): string {
  const utcDays = serial - 25569
  const date = new Date(utcDays * 86400 * 1000)
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function toDateString(val: RawValue): string {
  if (val instanceof Date) {
    const y = val.getFullYear()
    const m = String(val.getMonth() + 1).padStart(2, '0')
    const d = String(val.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  if (typeof val === 'number') return excelSerialToDate(val)
  const s = String(val ?? '').trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  const match = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (match) return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`
  return s
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_')
}

export function parseExcelFile(file: File): Promise<SalesRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer
        const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
        const sheet = wb.Sheets[wb.SheetNames[0]]
        const raw = XLSX.utils.sheet_to_json<Record<string, RawValue>>(sheet, { raw: true, defval: null })

        if (raw.length === 0) {
          reject(new Error('El archivo no contiene datos.'))
          return
        }

        const colMap: Partial<Record<keyof SalesRow, string>> = {}
        for (const key of Object.keys(raw[0])) {
          const normalized = normalizeHeader(key)
          const mapped = COLUMN_ALIASES[normalized]
          if (mapped && !colMap[mapped]) colMap[mapped] = key
        }

        const missing = REQUIRED.filter((col) => !colMap[col])
        if (missing.length > 0) {
          const label = missing.join(', ')
          reject(new Error(`Columna${missing.length > 1 ? 's' : ''} faltante${missing.length > 1 ? 's' : ''}: ${label}`))
          return
        }

        const rows: SalesRow[] = raw
          .filter((row) => Object.values(row).some((v) => v !== null && v !== undefined && v !== ''))
          .map((row) => ({
            fecha: toDateString(row[colMap.fecha!]),
            producto: String(row[colMap.producto!] ?? '').trim(),
            categoria: colMap.categoria ? String(row[colMap.categoria] ?? '').trim() : '',
            unidades: Number(row[colMap.unidades!] ?? 0),
            precio_unitario: Number(row[colMap.precio_unitario!] ?? 0),
            costo_unitario: Number(row[colMap.costo_unitario!] ?? 0),
          }))

        resolve(rows)
      } catch {
        reject(new Error('No se pudo leer el archivo. Asegúrate de que sea un .xlsx válido.'))
      }
    }

    reader.onerror = () => reject(new Error('Error al leer el archivo.'))
    reader.readAsArrayBuffer(file)
  })
}
