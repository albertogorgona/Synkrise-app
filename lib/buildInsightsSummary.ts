import type { SalesRow } from './importExcel'

export function buildInsightsSummary(rows: SalesRow[]): string {
  if (rows.length === 0) return 'No hay datos cargados.'

  const totalVentas = rows.reduce((s, r) => s + r.unidades * r.precio_unitario, 0)

  const byProduct: Record<string, { unidades: number; ventas: number }> = {}
  for (const r of rows) {
    if (!byProduct[r.producto]) byProduct[r.producto] = { unidades: 0, ventas: 0 }
    byProduct[r.producto].unidades += r.unidades
    byProduct[r.producto].ventas += r.unidades * r.precio_unitario
  }

  const top3 = Object.entries(byProduct)
    .sort(([, a], [, b]) => b.unidades - a.unidades)
    .slice(0, 3)
    .map(([nombre, d]) => `${nombre} (${d.unidades.toLocaleString('es-PA')} uds, $${d.ventas.toFixed(0)})`)
    .join('; ')

  const fechas = rows.map((r) => r.fecha).filter(Boolean).sort()
  const desde = fechas[0] ?? 'N/D'
  const hasta = fechas[fechas.length - 1] ?? 'N/D'

  const categorias = [...new Set(rows.map((r) => r.categoria).filter(Boolean))].join(', ')

  return [
    `Resumen operacional:`,
    `- Período analizado: ${desde} → ${hasta}`,
    `- Total de registros: ${rows.length}`,
    `- Ventas brutas totales: $${totalVentas.toFixed(2)}`,
    `- Top 3 productos por volumen: ${top3}`,
    `- Categorías presentes: ${categorias || 'No especificadas'}`,
  ].join('\n')
}
