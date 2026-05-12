'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'select' | 'upload' | 'preview' | 'importing' | 'success'
type ModuleId = 'ventas' | 'inventario' | 'clientes'
type RawRow = Record<string, string | number | boolean | Date | null | undefined>
type GenericRow = Record<string, string | number>
type RowError = { row: number; motivo: string }

interface FileRecord {
  id: string
  filename: string
  filesize: number
  filetype: string
  module: ModuleId
  records: number
  uploadedAt: string
  status: 'importado' | 'pendiente'
}

const LS_KEY = 'synkrise_file_library'

function loadLibrary(): FileRecord[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as FileRecord[]
  } catch {
    return []
  }
}

function saveLibrary(records: FileRecord[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(records))
}

interface ModuleConfig {
  id: ModuleId
  title: string
  cardDescription: string
  required: string[]
  optional: string[]
  labels: Record<string, string>
  table: string
  previewCols: string[]
  replaceOnImport: boolean
  normalizeRow: (raw: RawRow) => GenericRow
  validateRow: (n: RawRow) => string[]
  formatCell: (col: string, val: string | number) => string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BATCH_SIZE = 100

function excelSerialToDate(serial: number): string {
  const utcDays = serial - 25569
  const date = new Date(utcDays * 86400 * 1000)
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function toDateString(val: string | number | boolean | Date | null | undefined): string {
  if (val instanceof Date) {
    const y = val.getUTCFullYear()
    const m = String(val.getUTCMonth() + 1).padStart(2, '0')
    const d = String(val.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  if (typeof val === 'number') return excelSerialToDate(val)
  const s = String(val ?? '').trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  const match = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (match) return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`
  return s
}

function normalizeKey(key: string): string {
  return key
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_')
}

function normalizeRawKeys(raw: RawRow): RawRow {
  const n: RawRow = {}
  for (const [k, v] of Object.entries(raw)) n[normalizeKey(k)] = v
  return n
}

// ─── Module Definitions ───────────────────────────────────────────────────────

const MODULES: Record<ModuleId, ModuleConfig> = {
  ventas: {
    id: 'ventas',
    title: 'Importar Ventas',
    cardDescription: 'Historial de ventas con precios y costos por producto.',
    required: ['fecha', 'producto', 'unidades', 'precio_unitario', 'costo_unitario'],
    optional: ['categoria'],
    replaceOnImport: false,
    labels: {
      fecha: 'Fecha', producto: 'Producto', categoria: 'Categoría',
      unidades: 'Unidades', precio_unitario: 'Precio Unit.', costo_unitario: 'Costo Unit.',
    },
    table: 'ventas',
    previewCols: ['fecha', 'producto', 'categoria', 'unidades', 'precio_unitario', 'costo_unitario'],
    normalizeRow: (raw) => {
      const n = normalizeRawKeys(raw)
      return {
        fecha: toDateString(n.fecha),
        producto: String(n.producto ?? '').trim(),
        categoria: String(n.categoria ?? '').trim(),
        unidades: Number(n.unidades ?? 0),
        precio_unitario: Number(n.precio_unitario ?? 0),
        costo_unitario: Number(n.costo_unitario ?? 0),
      }
    },
    validateRow: (n) => {
      const m: string[] = []
      if (!n.producto || String(n.producto).trim() === '') m.push('Producto vacío')
      if (n.precio_unitario === null || n.precio_unitario === undefined || String(n.precio_unitario).trim() === '') m.push('Precio unitario vacío')
      if (Number(n.unidades ?? 0) < 0) m.push(`Unidades negativas (${Number(n.unidades ?? 0)})`)
      return m
    },
    formatCell: (col, val) => {
      if (col === 'precio_unitario' || col === 'costo_unitario') return `$${Number(val).toFixed(2)}`
      if (col === 'unidades') return Number(val).toLocaleString('es-PA')
      return String(val)
    },
  },

  inventario: {
    id: 'inventario',
    title: 'Importar Inventario',
    cardDescription: 'Stock actual, mínimos y rotación por producto.',
    required: ['producto', 'categoria', 'stock_actual', 'stock_minimo', 'rotacion', 'costo_unitario'],
    optional: [],
    replaceOnImport: true,
    labels: {
      producto: 'Producto', categoria: 'Categoría',
      stock_actual: 'Stock Actual', stock_minimo: 'Stock Mínimo',
      rotacion: 'Rotación', costo_unitario: 'Costo Unit.',
    },
    table: 'inventario',
    previewCols: ['producto', 'categoria', 'stock_actual', 'stock_minimo', 'rotacion', 'costo_unitario'],
    normalizeRow: (raw) => {
      const n = normalizeRawKeys(raw)
      return {
        producto: String(n.producto ?? '').trim(),
        categoria: String(n.categoria ?? '').trim(),
        stock_actual: Number(n.stock_actual ?? 0),
        stock_minimo: Number(n.stock_minimo ?? 0),
        rotacion: Number(n.rotacion ?? 0),
        costo_unitario: Number(n.costo_unitario ?? 0),
      }
    },
    validateRow: (n) => {
      const m: string[] = []
      if (!n.producto || String(n.producto).trim() === '') m.push('Producto vacío')
      if (Number(n.stock_actual ?? 0) < 0) m.push('Stock actual negativo')
      if (Number(n.stock_minimo ?? 0) < 0) m.push('Stock mínimo negativo')
      return m
    },
    formatCell: (col, val) => {
      if (col === 'costo_unitario') return `$${Number(val).toFixed(2)}`
      if (col === 'stock_actual' || col === 'stock_minimo') return Number(val).toLocaleString('es-PA')
      if (col === 'rotacion') return `${Number(val).toFixed(1)}x`
      return String(val)
    },
  },

  clientes: {
    id: 'clientes',
    title: 'Importar Clientes',
    cardDescription: 'Cartera de clientes con facturación y segmentos.',
    required: ['cliente_id', 'cliente', 'segmento', 'compras', 'facturacion', 'ultima_compra'],
    optional: [],
    replaceOnImport: true,
    labels: {
      cliente_id: 'ID Cliente', cliente: 'Cliente', segmento: 'Segmento',
      compras: 'Compras', facturacion: 'Facturación', ultima_compra: 'Última Compra',
    },
    table: 'clientes',
    previewCols: ['cliente_id', 'cliente', 'segmento', 'compras', 'facturacion', 'ultima_compra'],
    normalizeRow: (raw) => {
      const n = normalizeRawKeys(raw)
      return {
        cliente_id: String(n.cliente_id ?? '').trim(),
        cliente: String(n.cliente ?? '').trim(),
        segmento: String(n.segmento ?? '').trim(),
        compras: Number(n.compras ?? 0),
        facturacion: Number(n.facturacion ?? 0),
        ultima_compra: toDateString(n.ultima_compra),
      }
    },
    validateRow: (n) => {
      const m: string[] = []
      if (!n.cliente || String(n.cliente).trim() === '') m.push('Nombre de cliente vacío')
      if (!n.cliente_id || String(n.cliente_id).trim() === '') m.push('ID de cliente vacío')
      if (Number(n.facturacion ?? 0) < 0) m.push('Facturación negativa')
      return m
    },
    formatCell: (col, val) => {
      if (col === 'facturacion') return `$${Number(val).toFixed(2)}`
      if (col === 'compras') return Number(val).toLocaleString('es-PA')
      return String(val)
    },
  },
}

// ─── Excel Parser ──────────────────────────────────────────────────────────────

function parseExcel(
  buffer: ArrayBuffer,
  config: ModuleConfig,
): { rows: GenericRow[]; rowErrors: RowError[]; error: string | null } {
  try {
    const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const raw = XLSX.utils.sheet_to_json<RawRow>(sheet, { raw: true, defval: null })

    if (raw.length === 0) return { rows: [], rowErrors: [], error: 'El archivo no contiene datos.' }

    const keys = Object.keys(raw[0]).map(normalizeKey)
    const missing = config.required.filter((col) => !keys.includes(col))

    if (missing.length > 0) {
      const labels = missing.map((c) => config.labels[c] ?? c).join(', ')
      return {
        rows: [],
        rowErrors: [],
        error: `Columna${missing.length > 1 ? 's' : ''} faltante${missing.length > 1 ? 's' : ''}: ${labels}`,
      }
    }

    const rows: GenericRow[] = []
    const rowErrors: RowError[] = []

    raw.forEach((rawRow, idx) => {
      if (Object.values(rawRow).every((v) => v === null || v === undefined || v === '')) return
      const n = normalizeRawKeys(rawRow)
      const motivos = config.validateRow(n)
      if (motivos.length > 0) {
        rowErrors.push({ row: idx + 2, motivo: motivos.join('; ') })
      } else {
        rows.push(config.normalizeRow(rawRow))
      }
    })

    return { rows, rowErrors, error: null }
  } catch {
    return { rows: [], rowErrors: [], error: 'No se pudo leer el archivo. Asegúrate de que sea un .xlsx válido.' }
  }
}

// ─── File Library Component ───────────────────────────────────────────────────

function IconExcel() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="6" fill="#E6FAF9" />
      <path d="M7 8h9l5 5v7a1 1 0 01-1 1H7a1 1 0 01-1-1V9a1 1 0 011-1z" stroke="#0ABFBC" strokeWidth="1.3" fill="none" />
      <path d="M16 8v5h5" stroke="#0ABFBC" strokeWidth="1.3" />
      <path d="M9 16l2.5-4L14 15l2.5-3.5L19 16" stroke="#0ABFBC" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconCSV() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="6" fill="#EDF4FC" />
      <path d="M7 8h9l5 5v7a1 1 0 01-1 1H7a1 1 0 01-1-1V9a1 1 0 011-1z" stroke="#1A6FC4" strokeWidth="1.3" fill="none" />
      <path d="M16 8v5h5" stroke="#1A6FC4" strokeWidth="1.3" />
      <text x="9" y="20" fontSize="6" fontWeight="700" fill="#1A6FC4" fontFamily="monospace">CSV</text>
    </svg>
  )
}

function IconFileGeneric() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="6" fill="#F0F4FA" />
      <path d="M7 8h9l5 5v7a1 1 0 01-1 1H7a1 1 0 01-1-1V9a1 1 0 011-1z" stroke="#4A6580" strokeWidth="1.3" fill="none" />
      <path d="M16 8v5h5" stroke="#4A6580" strokeWidth="1.3" />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M2 4h11M6 4V3a1 1 0 012 0v1M5 4v7a1 1 0 001 1h3a1 1 0 001-1V4" stroke="#E05C5C" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function fileIcon(type: string) {
  if (type === 'xlsx' || type === 'xls') return <IconExcel />
  if (type === 'csv') return <IconCSV />
  return <IconFileGeneric />
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

const MODULE_LABELS: Record<ModuleId, string> = {
  ventas: 'Ventas',
  inventario: 'Inventario',
  clientes: 'Clientes',
}

interface FileLibraryProps {
  library: FileRecord[]
  onDelete: (id: string) => void
}

function FileLibrary({ library, onDelete }: FileLibraryProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null)

  if (library.length === 0) return null

  return (
    <div
      className="mb-8 rounded-2xl overflow-hidden"
      style={{ border: '1px solid #D6E4F0' }}
    >
      {/* Header */}
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ background: '#F0F4FA', borderBottom: '1px solid #D6E4F0' }}
      >
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="3" width="12" height="10" rx="2" stroke="#1A6FC4" strokeWidth="1.3" />
            <path d="M5 7h6M5 10h4" stroke="#1A6FC4" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span
            className="text-sm font-semibold"
            style={{ fontFamily: 'var(--font-sora), Sora, sans-serif', color: '#0A1628' }}
          >
            Archivos importados
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: '#E6F0FB', color: '#1A6FC4' }}
          >
            {library.length}
          </span>
        </div>
      </div>

      {/* File rows */}
      <div>
        {library.map((file, i) => (
          <div
            key={file.id}
            className="flex items-center gap-4 px-5 py-3"
            style={{
              background: i % 2 === 0 ? '#FFFFFF' : '#F7FAFD',
              borderBottom: i < library.length - 1 ? '1px solid #EEF3FA' : 'none',
            }}
          >
            {/* Icon */}
            <div className="flex-shrink-0">{fileIcon(file.filetype)}</div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium truncate"
                style={{ color: '#0A1628' }}
              >
                {file.filename}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#4A6580' }}>
                {formatDate(file.uploadedAt)} · {formatBytes(file.filesize)} · {MODULE_LABELS[file.module]} · {file.records.toLocaleString('es-PA')} registros
              </p>
            </div>

            {/* Status badge */}
            <span
              className="flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={
                file.status === 'importado'
                  ? { background: '#EDFBF5', color: '#2ECC9A' }
                  : { background: '#FBF5E6', color: '#D4A017' }
              }
            >
              {file.status === 'importado' ? '✓ Importado' : '⏳ Pendiente'}
            </span>

            {/* Delete button */}
            {confirmId === file.id ? (
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs" style={{ color: '#4A6580' }}>¿Eliminar?</span>
                <button
                  onClick={() => { onDelete(file.id); setConfirmId(null) }}
                  className="text-xs px-2 py-1 rounded font-semibold"
                  style={{ background: '#FBF0F1', color: '#C0444F' }}
                >
                  Sí
                </button>
                <button
                  onClick={() => setConfirmId(null)}
                  className="text-xs px-2 py-1 rounded font-semibold"
                  style={{ background: '#F0F4FA', color: '#4A6580' }}
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmId(file.id)}
                aria-label="Eliminar archivo"
                className="flex-shrink-0 p-1.5 rounded-lg transition-colors"
                style={{ color: '#E05C5C' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#FBF0F1' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <IconTrash />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

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

function IconInfo() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx="10" cy="10" r="9" stroke="#1A6FC4" strokeWidth="1.5" />
      <path d="M10 9V14" stroke="#1A6FC4" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="6.5" r="1" fill="#1A6FC4" />
    </svg>
  )
}

function IconVentas() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M4 22L10 14L15 18L20 10L24 13" stroke="#1A6FC4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 22H24" stroke="#1A6FC4" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconInventario() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="5" y="12" width="18" height="11" rx="2" stroke="#0ABFBC" strokeWidth="1.8" />
      <path d="M5 15H23" stroke="#0ABFBC" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 12V9C9 7.34315 10.3431 6 12 6H16C17.6569 6 19 7.34315 19 9V12" stroke="#0ABFBC" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M11 18.5H17" stroke="#0ABFBC" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconClientes() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="10" r="4" stroke="#F59E0B" strokeWidth="1.8" />
      <path d="M6 22C6 18.134 9.13401 15 13 15H15C18.866 15 22 18.134 22 22" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconBack() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 3L5 8L10 13" stroke="#4A6580" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Module Card ──────────────────────────────────────────────────────────────

const MODULE_ACCENT: Record<ModuleId, string> = {
  ventas: '#1A6FC4',
  inventario: '#0ABFBC',
  clientes: '#F59E0B',
}

const MODULE_BG: Record<ModuleId, string> = {
  ventas: '#EDF4FC',
  inventario: '#E6FAF9',
  clientes: '#FEF9EC',
}

const MODULE_BORDER: Record<ModuleId, string> = {
  ventas: '#BFDBFE',
  inventario: '#99F6E4',
  clientes: '#FDE68A',
}

function ModuleIcon({ id }: { id: ModuleId }) {
  if (id === 'ventas') return <IconVentas />
  if (id === 'inventario') return <IconInventario />
  return <IconClientes />
}

interface ModuleCardProps {
  config: ModuleConfig
  onSelect: () => void
}

function ModuleCard({ config, onSelect }: ModuleCardProps) {
  const accent = MODULE_ACCENT[config.id]
  const bg = MODULE_BG[config.id]
  const border = MODULE_BORDER[config.id]

  return (
    <div
      className="flex flex-col rounded-2xl p-6 gap-5"
      style={{ border: '1px solid #D6E4F0', background: '#FFFFFF' }}
    >
      <div className="flex flex-col gap-3">
        <div
          className="w-12 h-12 rounded-[12px] flex items-center justify-center"
          style={{ background: bg, border: `1px solid ${border}` }}
        >
          <ModuleIcon id={config.id} />
        </div>
        <div>
          <p className="font-semibold text-base mb-1" style={{ fontFamily: 'var(--font-sora), Sora, sans-serif', color: '#0A1628' }}>
            {config.title}
          </p>
          <p className="text-sm" style={{ color: '#4A6580' }}>
            {config.cardDescription}
          </p>
        </div>
      </div>

      <div
        className="flex flex-col gap-2 px-3 py-3 rounded-[10px] text-xs flex-1"
        style={{ background: '#F7FAFD', border: '1px solid #EEF3FA' }}
      >
        <p className="font-semibold uppercase tracking-wide" style={{ color: '#4A6580', fontSize: '10px' }}>
          Columnas requeridas
        </p>
        <p style={{ color: '#0A1628', lineHeight: 1.6 }}>
          {config.required.join(', ')}
        </p>
        {config.optional.length > 0 && (
          <p style={{ color: '#4A6580' }}>
            + {config.optional.join(', ')}{' '}
            <span style={{ color: '#9FB3C8' }}>(opcional)</span>
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onSelect}
        className="w-full py-2.5 rounded-[9px] text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: accent }}
      >
        Importar →
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DatosPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('select')
  const [activeModuleId, setActiveModuleId] = useState<ModuleId | null>(null)
  const [rows, setRows] = useState<GenericRow[]>([])
  const [rowErrors, setRowErrors] = useState<RowError[]>([])
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [importedCount, setImportedCount] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [fileLibrary, setFileLibrary] = useState<FileRecord[]>([])
  const [replaceVentas, setReplaceVentas] = useState(false)
  const pendingFileRef = useRef<Omit<FileRecord, 'status'> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setFileLibrary(loadLibrary())
  }, [])

  function deleteFileRecord(id: string) {
    const updated = fileLibrary.filter((f) => f.id !== id)
    setFileLibrary(updated)
    saveLibrary(updated)
  }

  const config = activeModuleId ? MODULES[activeModuleId] : null

  function selectModule(id: ModuleId) {
    setActiveModuleId(id)
    setRows([])
    setRowErrors([])
    setError(null)
    setProgress(0)
    setReplaceVentas(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setStep('upload')
  }

  function handleReset() {
    setStep('select')
    setActiveModuleId(null)
    setRows([])
    setRowErrors([])
    setError(null)
    setProgress(0)
    setReplaceVentas(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const processFile = useCallback(
    (file: File) => {
      if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
        setError('Solo se aceptan archivos .xlsx, .xls o .csv')
        return
      }
      if (!activeModuleId) return
      setError(null)

      const ext = (file.name.split('.').pop() ?? 'xlsx').toLowerCase()
      pendingFileRef.current = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        filename: file.name,
        filesize: file.size,
        filetype: ext,
        module: activeModuleId,
        records: 0,
        uploadedAt: new Date().toISOString(),
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer
        const { rows: parsed, rowErrors: errors, error: parseError } = parseExcel(buffer, MODULES[activeModuleId])
        if (parseError) {
          setError(parseError)
          return
        }
        setRows(parsed)
        setRowErrors(errors)
        setStep('preview')
      }
      reader.readAsArrayBuffer(file)
    },
    [activeModuleId],
  )

  async function handleImport() {
    if (!config) return
    setStep('importing')
    setProgress(0)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('No hay sesión activa. Por favor inicia sesión nuevamente.')
      setStep('preview')
      return
    }

    const shouldReplace = config.replaceOnImport || (activeModuleId === 'ventas' && replaceVentas)
    if (shouldReplace) {
      const { error: deleteError } = await supabase
        .from(config.table)
        .delete()
        .eq('user_id', user.id)
      if (deleteError) {
        setError(`Error al limpiar datos anteriores: ${deleteError.message}`)
        setStep('preview')
        return
      }
    }

    const records = rows.map((row) => ({ ...row, user_id: user.id }))
    const total = records.length
    let inserted = 0

    for (let i = 0; i < total; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE)
      const { error: insertError } = await supabase.from(config.table).insert(batch)
      if (insertError) {
        setError(`Error al importar: ${insertError.message}`)
        setStep('preview')
        return
      }
      inserted += batch.length
      setProgress(Math.round((inserted / total) * 100))
    }

    setImportedCount(total)

    // Guardar registro en biblioteca
    if (pendingFileRef.current) {
      const newRecord: FileRecord = {
        ...pendingFileRef.current,
        records: total,
        status: 'importado',
      }
      const updated = [newRecord, ...loadLibrary()]
      saveLibrary(updated)
      setFileLibrary(updated)
      pendingFileRef.current = null
    }

    setStep('success')
    setTimeout(() => router.push('/dashboard/datos'), 2000)
  }

  // ── Render: Select ───────────────────────────────────────────────────────────

  if (step === 'select') {
    return (
      <div style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
        <div className="mb-8">
          <h1
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: 'var(--font-sora), Sora, sans-serif', color: '#0A1628' }}
          >
            Datos
          </h1>
          <p style={{ color: '#4A6580' }}>
            Importa datos o revisa los archivos ya cargados al sistema.
          </p>
        </div>

        <FileLibrary library={fileLibrary} onDelete={deleteFileRecord} />

        <div className="mb-6">
          <p
            className="text-sm font-semibold mb-1"
            style={{ fontFamily: 'var(--font-sora), Sora, sans-serif', color: '#0A1628' }}
          >
            Importar nuevo archivo
          </p>
          <p className="text-sm" style={{ color: '#4A6580' }}>
            Selecciona el tipo de datos que deseas importar al sistema.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(Object.values(MODULES) as ModuleConfig[]).map((mod) => (
            <ModuleCard key={mod.id} config={mod} onSelect={() => selectModule(mod.id)} />
          ))}
        </div>
      </div>
    )
  }

  if (!config) return null

  // ── Render: Upload ───────────────────────────────────────────────────────────

  if (step === 'upload') {
    return (
      <div style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
        <div className="mb-8">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-sm mb-4 transition-opacity hover:opacity-70"
            style={{ color: '#4A6580' }}
          >
            <IconBack />
            Volver a opciones de importación
          </button>
          <h1
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: 'var(--font-sora), Sora, sans-serif', color: '#0A1628' }}
          >
            {config.title}
          </h1>
          <p style={{ color: '#4A6580' }}>{config.cardDescription}</p>
        </div>

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
              border: `2px dashed ${isDragging ? MODULE_ACCENT[config.id] : '#D6E4F0'}`,
              background: isDragging ? MODULE_BG[config.id] : '#F7FAFD',
              padding: 'clamp(2.5rem, 6vw, 5rem) clamp(1.5rem, 4vw, 4rem)',
              minHeight: 'clamp(280px, 40vh, 420px)',
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <IconUpload />
            <div className="text-center">
              <p className="text-lg font-semibold mb-1" style={{ color: '#0A1628' }}>
                Arrastra tu archivo aquí
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
              style={{ background: MODULE_ACCENT[config.id] }}
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
            >
              Seleccionar archivo
            </button>

            <p className="text-xs" style={{ color: '#4A6580' }}>
              Formatos aceptados: .xlsx, .xls, .csv
            </p>
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

          {activeModuleId === 'ventas' && (
            <div
              className="mt-4 flex items-start gap-3 px-4 py-3 rounded-[9px] cursor-pointer"
              style={{ background: replaceVentas ? '#FEF3E2' : '#F0F4FA', border: `1px solid ${replaceVentas ? '#FDE68A' : '#D6E4F0'}` }}
              onClick={() => setReplaceVentas(!replaceVentas)}
            >
              <div
                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
                style={{ background: replaceVentas ? '#F59E0B' : '#FFFFFF', border: `2px solid ${replaceVentas ? '#F59E0B' : '#D6E4F0'}` }}
              >
                {replaceVentas && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: replaceVentas ? '#92400E' : '#0A1628' }}>
                  Reemplazar datos existentes de ventas
                </p>
                <p className="text-xs mt-0.5" style={{ color: replaceVentas ? '#78350F' : '#4A6580' }}>
                  {replaceVentas
                    ? '⚠ Se eliminarán todos los registros anteriores antes de importar'
                    : 'Por defecto, los nuevos registros se agregan al historial existente'}
                </p>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-col md:flex-row gap-3">
            {error && (
              <div
                className="flex items-start gap-3 px-4 py-3 rounded-[9px] flex-1"
                style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
              >
                <IconAlert />
                <p className="text-sm font-medium" style={{ color: '#E05C5C' }}>{error}</p>
              </div>
            )}

            <div
              className={`flex items-start gap-3 px-4 py-3 rounded-[9px]`}
              style={{
                background: '#EDF4FC',
                border: '1px solid #BFDBFE',
                flex: 1,
              }}
            >
              <IconInfo />
              <p className="text-sm" style={{ color: '#1A6FC4' }}>
                El archivo debe incluir las columnas:{' '}
                <strong>{config.required.join(', ')}</strong>
                {config.optional.length > 0 && (
                  <>. La columna <strong>{config.optional.join(', ')}</strong> es opcional.</>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Render: Preview ──────────────────────────────────────────────────────────

  if (step === 'preview') {
    const totalRead = rows.length + rowErrors.length
    const preview = rows.slice(0, 5)

    const validationBadge =
      rowErrors.length === 0 ? (
        <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: '#E6FAF9', color: '#0ABFBC' }}>
          Validación correcta
        </span>
      ) : (
        <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: '#FEF9EC', color: '#F59E0B' }}>
          {rowErrors.length} fila{rowErrors.length > 1 ? 's' : ''} con errores detectados
        </span>
      )

    return (
      <div style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
        <div className="mb-8">
          <button
            type="button"
            onClick={() => setStep('upload')}
            className="inline-flex items-center gap-1.5 text-sm mb-4 transition-opacity hover:opacity-70"
            style={{ color: '#4A6580' }}
          >
            <IconBack />
            Volver a carga de archivo
          </button>
          <h1
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: 'var(--font-sora), Sora, sans-serif', color: '#0A1628' }}
          >
            Vista previa — {config.title.replace('Importar ', '')}
          </h1>
          <p style={{ color: '#4A6580' }}>
            {totalRead} registros leídos —{' '}
            <strong style={{ color: '#0A1628' }}>{rows.length} válidos</strong>
            {rowErrors.length > 0 && (
              <>, <strong style={{ color: '#F59E0B' }}>{rowErrors.length} con errores</strong></>
            )}
            . Revisa antes de confirmar.
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

        <div className="rounded-2xl overflow-hidden mb-4" style={{ border: '1px solid #D6E4F0' }}>
          <div
            className="px-5 py-3 flex items-center justify-between"
            style={{ background: '#F0F4FA', borderBottom: '1px solid #D6E4F0' }}
          >
            <span className="text-sm font-semibold" style={{ color: '#0A1628' }}>
              Primeras {preview.length} filas válidas de {rows.length}
            </span>
            {validationBadge}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#0F2D52' }}>
                  {config.previewCols.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'rgba(255,255,255,0.7)' }}
                    >
                      {config.labels[col] ?? col}
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
                    {config.previewCols.map((col) => {
                      const val = row[col] ?? ''
                      const formatted = config.formatCell(col, val)
                      return (
                        <td key={col} className="px-4 py-3" style={{ color: formatted === '' ? '#D6E4F0' : '#0A1628' }}>
                          {formatted === '' ? '—' : formatted}
                        </td>
                      )
                    })}
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
              +{rows.length - 5} filas válidas adicionales no mostradas
            </div>
          )}
        </div>

        {rowErrors.length > 0 && (
          <div
            className="mb-6 px-4 py-3 rounded-[9px]"
            style={{ background: '#FEF9EC', border: '1px solid #FDE68A' }}
          >
            <p className="text-sm font-semibold mb-2" style={{ color: '#92400E' }}>
              {rowErrors.length} fila{rowErrors.length > 1 ? 's' : ''} descartada{rowErrors.length > 1 ? 's' : ''} por errores:
            </p>
            <ul className="space-y-0.5">
              {rowErrors.map((e) => (
                <li key={e.row} className="text-xs" style={{ color: '#78350F' }}>
                  Fila {e.row}: {e.motivo}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={() => setStep('upload')}
            className="px-5 py-2.5 rounded-[9px] text-sm font-semibold transition-colors"
            style={{ background: '#F0F4FA', color: '#4A6580', border: '1px solid #D6E4F0' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#E5EDF8' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#F0F4FA' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleImport}
            disabled={rows.length === 0}
            className="flex-1 sm:flex-none px-6 py-2.5 rounded-[9px] text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: MODULE_ACCENT[config.id] }}
          >
            Confirmar e importar ({rows.length} registros)
          </button>
        </div>
      </div>
    )
  }

  // ── Render: Importing ────────────────────────────────────────────────────────

  if (step === 'importing') {
    return (
      <div
        className="flex flex-col items-center justify-center text-center"
        style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif', minHeight: '50vh' }}
      >
        <div className="max-w-sm w-full">
          <p
            className="text-lg font-semibold mb-2"
            style={{ fontFamily: 'var(--font-sora), Sora, sans-serif', color: '#0A1628' }}
          >
            Importando datos...
          </p>
          <p className="text-sm mb-8" style={{ color: '#4A6580' }}>
            {progress < 100 ? `Procesando registros (${progress}%)` : 'Finalizando importación...'}
          </p>

          <div className="w-full rounded-full overflow-hidden mb-3" style={{ height: '10px', background: '#E5EDF8' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${MODULE_ACCENT[config.id]}, #0ABFBC)`,
              }}
            />
          </div>

          <p className="text-sm font-semibold" style={{ color: MODULE_ACCENT[config.id] }}>
            {progress}%
          </p>
        </div>
      </div>
    )
  }

  // ── Render: Success ──────────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col items-center justify-center text-center"
      style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif', minHeight: '50vh' }}
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
            <strong style={{ color: '#0ABFBC' }}>{importedCount} registros</strong> de{' '}
            <strong style={{ color: '#0A1628' }}>{config.title.replace('Importar ', '')}</strong> correctamente.
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
