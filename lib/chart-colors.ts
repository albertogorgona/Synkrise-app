/**
 * Paleta unificada para todas las gráficas y visualizaciones de Synkrise.
 * Combina los azules/teales de marca con los tres semánticos (verde, amarillo, rojo).
 * Usar CHART_PALETTE para series múltiples/categóricas.
 * Usar SEMANTIC para estados, tendencias y semáforos.
 */

export const CHART_PALETTE = [
  '#1A6FC4', // 0 — azul principal
  '#0ABFBC', // 1 — teal vibrante
  '#2B9ED6', // 2 — azul cielo
  '#4BAEC0', // 3 — teal medio
  '#7ACEE0', // 4 — teal claro
  '#3A8FD8', // 5 — azul secundario
  '#A8CCE8', // 6 — azul pálido
] as const

export const SEMANTIC = {
  green:  '#28A87A',
  yellow: '#C97830',
  red:    '#A83E48',
  blue:   '#1A6FC4',
  teal:   '#0ABFBC',
} as const

export const SEMANTIC_BG = {
  green:  '#E8F7F1',
  yellow: '#F5E8D8',
  red:    '#F2E8EA',
  blue:   '#EDF4FC',
  teal:   '#E0F8F8',
} as const

/** Devuelve el color semántico según % de cumplimiento */
export function cumplimientoColor(pct: number): string {
  if (pct >= 80) return SEMANTIC.green
  if (pct >= 65) return SEMANTIC.yellow
  return SEMANTIC.red
}
