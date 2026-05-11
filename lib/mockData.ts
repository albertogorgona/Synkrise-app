export interface SalesRow {
  fecha: string
  producto: string
  categoria: string
  unidades: number
  ventas: number
  costo: number
}

export const mockSalesData: SalesRow[] = [
  { fecha: '2024-01-05', producto: 'Arroz Corona 5lb', categoria: 'Granos', unidades: 120, ventas: 480, costo: 360 },
  { fecha: '2024-01-05', producto: 'Aceite Mazola 1L', categoria: 'Aceites', unidades: 85, ventas: 425, costo: 297 },
  { fecha: '2024-01-06', producto: 'Leche Dos Pinos 1L', categoria: 'Lácteos', unidades: 200, ventas: 500, costo: 340 },
  { fecha: '2024-01-06', producto: 'Arroz Corona 5lb', categoria: 'Granos', unidades: 95, ventas: 380, costo: 285 },
  { fecha: '2024-01-07', producto: 'Jabón Dial', categoria: 'Limpieza', unidades: 60, ventas: 180, costo: 108 },
  { fecha: '2024-01-07', producto: 'Aceite Mazola 1L', categoria: 'Aceites', unidades: 70, ventas: 350, costo: 245 },
  { fecha: '2024-01-08', producto: 'Leche Dos Pinos 1L', categoria: 'Lácteos', unidades: 180, ventas: 450, costo: 306 },
  { fecha: '2024-01-08', producto: 'Azúcar Diana 2lb', categoria: 'Granos', unidades: 110, ventas: 330, costo: 220 },
  { fecha: '2024-01-09', producto: 'Arroz Corona 5lb', categoria: 'Granos', unidades: 130, ventas: 520, costo: 390 },
  { fecha: '2024-01-10', producto: 'Jabón Dial', categoria: 'Limpieza', unidades: 75, ventas: 225, costo: 135 },
  { fecha: '2024-01-10', producto: 'Aceite Mazola 1L', categoria: 'Aceites', unidades: 90, ventas: 450, costo: 315 },
  { fecha: '2024-01-11', producto: 'Leche Dos Pinos 1L', categoria: 'Lácteos', unidades: 210, ventas: 525, costo: 357 },
  { fecha: '2024-01-12', producto: 'Azúcar Diana 2lb', categoria: 'Granos', unidades: 100, ventas: 300, costo: 200 },
  { fecha: '2024-01-13', producto: 'Arroz Corona 5lb', categoria: 'Granos', unidades: 145, ventas: 580, costo: 435 },
  { fecha: '2024-01-14', producto: 'Jabón Dial', categoria: 'Limpieza', unidades: 55, ventas: 165, costo: 99 },
  { fecha: '2024-02-01', producto: 'Arroz Corona 5lb', categoria: 'Granos', unidades: 160, ventas: 640, costo: 480 },
  { fecha: '2024-02-01', producto: 'Aceite Mazola 1L', categoria: 'Aceites', unidades: 100, ventas: 500, costo: 350 },
  { fecha: '2024-02-05', producto: 'Leche Dos Pinos 1L', categoria: 'Lácteos', unidades: 220, ventas: 550, costo: 374 },
  { fecha: '2024-02-08', producto: 'Azúcar Diana 2lb', categoria: 'Granos', unidades: 115, ventas: 345, costo: 230 },
  { fecha: '2024-02-12', producto: 'Arroz Corona 5lb', categoria: 'Granos', unidades: 175, ventas: 700, costo: 525 },
  { fecha: '2024-02-15', producto: 'Jabón Dial', categoria: 'Limpieza', unidades: 80, ventas: 240, costo: 144 },
  { fecha: '2024-02-20', producto: 'Aceite Mazola 1L', categoria: 'Aceites', unidades: 110, ventas: 550, costo: 385 },
  { fecha: '2024-02-25', producto: 'Leche Dos Pinos 1L', categoria: 'Lácteos', unidades: 230, ventas: 575, costo: 391 },
  { fecha: '2024-03-01', producto: 'Arroz Corona 5lb', categoria: 'Granos', unidades: 190, ventas: 760, costo: 570 },
  { fecha: '2024-03-05', producto: 'Aceite Mazola 1L', categoria: 'Aceites', unidades: 120, ventas: 600, costo: 420 },
  { fecha: '2024-03-10', producto: 'Leche Dos Pinos 1L', categoria: 'Lácteos', unidades: 250, ventas: 625, costo: 425 },
  { fecha: '2024-03-15', producto: 'Azúcar Diana 2lb', categoria: 'Granos', unidades: 130, ventas: 390, costo: 260 },
  { fecha: '2024-03-20', producto: 'Jabón Dial', categoria: 'Limpieza', unidades: 90, ventas: 270, costo: 162 },
  { fecha: '2024-03-25', producto: 'Arroz Corona 5lb', categoria: 'Granos', unidades: 210, ventas: 840, costo: 630 },
  { fecha: '2024-03-28', producto: 'Aceite Mazola 1L', categoria: 'Aceites', unidades: 130, ventas: 650, costo: 455 },
]

export interface KPIData {
  ventasTotales: number
  ventasAnterior: number
  margenBruto: number
  margenAnterior: number
  unidadesVendidas: number
  unidadesAnterior: number
  clientesActivos: number
  clientesAnterior: number
}

export const mockKPIs: KPIData = {
  ventasTotales: 48320,
  ventasAnterior: 43150,
  margenBruto: 32.4,
  margenAnterior: 29.8,
  unidadesVendidas: 3842,
  unidadesAnterior: 3619,
  clientesActivos: 284,
  clientesAnterior: 261,
}

export interface MonthlyData {
  mes: string
  ventas: number
  costos: number
  margen: number
}

export const mockMonthlyData: MonthlyData[] = [
  { mes: 'Oct', ventas: 38200, costos: 26740, margen: 30.1 },
  { mes: 'Nov', ventas: 41500, costos: 28640, margen: 31.0 },
  { mes: 'Dic', ventas: 52100, costos: 35430, margen: 32.0 },
  { mes: 'Ene', ventas: 39800, costos: 27080, margen: 31.9 },
  { mes: 'Feb', ventas: 43150, costos: 30340, margen: 29.8 },
  { mes: 'Mar', ventas: 48320, costos: 32640, margen: 32.4 },
]

export interface CategoryData {
  categoria: string
  ventas: number
  porcentaje: number
}

export const mockCategoryData: CategoryData[] = [
  { categoria: 'Granos', ventas: 18500, porcentaje: 38.3 },
  { categoria: 'Lácteos', ventas: 14200, porcentaje: 29.4 },
  { categoria: 'Aceites', ventas: 9800, porcentaje: 20.3 },
  { categoria: 'Limpieza', ventas: 5820, porcentaje: 12.0 },
]

export interface TopProduct {
  producto: string
  ventas: number
  unidades: number
  margen: number
  tendencia: 'up' | 'down' | 'stable'
}

export const mockTopProducts: TopProduct[] = [
  { producto: 'Arroz Corona 5lb', ventas: 15420, unidades: 1285, margen: 25.0, tendencia: 'up' },
  { producto: 'Leche Dos Pinos 1L', ventas: 12800, unidades: 1024, margen: 32.0, tendencia: 'up' },
  { producto: 'Aceite Mazola 1L', ventas: 9800, unidades: 784, margen: 30.0, tendencia: 'stable' },
  { producto: 'Azúcar Diana 2lb', ventas: 6240, unidades: 832, margen: 33.3, tendencia: 'down' },
  { producto: 'Jabón Dial', ventas: 4060, unidades: 812, margen: 40.0, tendencia: 'stable' },
]

// ─── INVENTARIO ───────────────────────────────────────────────────────────────

export interface InventoryProduct {
  producto: string
  categoria: string
  stockActual: number
  stockMinimo: number
  estado: 'OK' | 'Critico' | 'Agotado'
  rotacion: number
  valorUnitario: number
}

export const mockInventory: InventoryProduct[] = [
  { producto: 'Arroz Corona 5lb',    categoria: 'Granos',   stockActual: 450, stockMinimo: 200, estado: 'OK',      rotacion: 8.2, valorUnitario: 3.75 },
  { producto: 'Leche Dos Pinos 1L',  categoria: 'Lácteos',  stockActual: 85,  stockMinimo: 150, estado: 'Critico', rotacion: 12.4, valorUnitario: 2.25 },
  { producto: 'Aceite Mazola 1L',    categoria: 'Aceites',  stockActual: 210, stockMinimo: 100, estado: 'OK',      rotacion: 6.8, valorUnitario: 4.5  },
  { producto: 'Azúcar Diana 2lb',    categoria: 'Granos',   stockActual: 0,   stockMinimo: 100, estado: 'Agotado', rotacion: 5.1, valorUnitario: 1.85 },
  { producto: 'Jabón Dial',          categoria: 'Limpieza', stockActual: 175, stockMinimo: 80,  estado: 'OK',      rotacion: 4.2, valorUnitario: 2.1  },
  { producto: 'Café Durán 250g',     categoria: 'Granos',   stockActual: 60,  stockMinimo: 120, estado: 'Critico', rotacion: 7.5, valorUnitario: 3.2  },
  { producto: 'Mantequilla Bonlac',  categoria: 'Lácteos',  stockActual: 320, stockMinimo: 150, estado: 'OK',      rotacion: 9.1, valorUnitario: 3.5  },
  { producto: 'Detergente Ariel 1kg',categoria: 'Limpieza', stockActual: 140, stockMinimo: 100, estado: 'OK',      rotacion: 3.8, valorUnitario: 5.25 },
]

export interface StockCategory {
  categoria: string
  stockActual: number
  stockMinimo: number
}

export const mockStockByCategory: StockCategory[] = [
  { categoria: 'Granos',   stockActual: 510, stockMinimo: 420 },
  { categoria: 'Lácteos',  stockActual: 405, stockMinimo: 300 },
  { categoria: 'Aceites',  stockActual: 210, stockMinimo: 100 },
  { categoria: 'Limpieza', stockActual: 315, stockMinimo: 180 },
]

// ─── CLIENTES ─────────────────────────────────────────────────────────────────

export interface ClientData {
  cliente: string
  segmento: 'Frecuente' | 'Ocasional' | 'Nuevo'
  compras: number
  facturacion: number
  ultimaCompra: string
}

export const mockTopClients: ClientData[] = [
  { cliente: 'Supermercado El Rey',       segmento: 'Frecuente', compras: 24, facturacion: 12400, ultimaCompra: '2024-03-28' },
  { cliente: 'Tienda Don Mario',           segmento: 'Frecuente', compras: 18, facturacion: 8750,  ultimaCompra: '2024-03-27' },
  { cliente: 'Minisuper La Esperanza',     segmento: 'Frecuente', compras: 15, facturacion: 6200,  ultimaCompra: '2024-03-25' },
  { cliente: 'Bodega Central',             segmento: 'Ocasional', compras: 6,  facturacion: 4100,  ultimaCompra: '2024-03-20' },
  { cliente: 'Almacén Los Andes',          segmento: 'Nuevo',     compras: 3,  facturacion: 1850,  ultimaCompra: '2024-03-15' },
]

export interface MonthlyClients {
  mes: string
  clientes: number
}

export const mockClientsMonthly: MonthlyClients[] = [
  { mes: 'Oct', clientes: 241 },
  { mes: 'Nov', clientes: 258 },
  { mes: 'Dic', clientes: 275 },
  { mes: 'Ene', clientes: 262 },
  { mes: 'Feb', clientes: 271 },
  { mes: 'Mar', clientes: 284 },
]

export interface ClientSegment {
  segmento: string
  cantidad: number
  porcentaje: number
}

export const mockClientSegments: ClientSegment[] = [
  { segmento: 'Frecuente', cantidad: 142, porcentaje: 50 },
  { segmento: 'Ocasional', cantidad: 85,  porcentaje: 30 },
  { segmento: 'Nuevo',     cantidad: 57,  porcentaje: 20 },
]

// ─── FINANCIERO ───────────────────────────────────────────────────────────────

export interface FinancialMonthly {
  mes: string
  ingresos: number
  costos: number
  ebitda: number
}

export const mockFinancialMonthly: FinancialMonthly[] = [
  { mes: 'Oct', ingresos: 38200, costos: 26740, ebitda: 11460 },
  { mes: 'Nov', ingresos: 41500, costos: 28640, ebitda: 12860 },
  { mes: 'Dic', ingresos: 52100, costos: 35430, ebitda: 16670 },
  { mes: 'Ene', ingresos: 39800, costos: 27080, ebitda: 12720 },
  { mes: 'Feb', ingresos: 43150, costos: 30340, ebitda: 12810 },
  { mes: 'Mar', ingresos: 48320, costos: 32640, ebitda: 15680 },
]

export interface WaterfallEntry {
  nombre: string
  base: number
  valor: number
  tipo: 'total' | 'subtotal' | 'costo'
}

export const mockWaterfallData: WaterfallEntry[] = [
  { nombre: 'Ingresos',     base: 0,     valor: 48320, tipo: 'total'    },
  { nombre: 'Costo merc.',  base: 18520, valor: 29800, tipo: 'costo'    },
  { nombre: 'Margen bruto', base: 0,     valor: 18520, tipo: 'subtotal' },
  { nombre: 'Gastos op.',   base: 12280, valor: 6240,  tipo: 'costo'    },
  { nombre: 'EBITDA',       base: 0,     valor: 12280, tipo: 'subtotal' },
  { nombre: 'Deprec.',      base: 11440, valor: 840,   tipo: 'costo'    },
  { nombre: 'Impuestos',    base: 9600,  valor: 1840,  tipo: 'costo'    },
  { nombre: 'Utilidad neta',base: 0,     valor: 9600,  tipo: 'total'    },
]

// ─── KPIs ─────────────────────────────────────────────────────────────────────

export interface RadarEntry {
  indicador: string
  valor: number
  objetivo: number
}

export const mockRadarData: RadarEntry[] = [
  { indicador: 'Ventas',       valor: 74, objetivo: 100 },
  { indicador: 'Margen',       valor: 88, objetivo: 100 },
  { indicador: 'Inventario',   valor: 62, objetivo: 100 },
  { indicador: 'Rotación',     valor: 71, objetivo: 100 },
  { indicador: 'Satisfacción', valor: 85, objetivo: 100 },
  { indicador: 'Cobranza',     valor: 58, objetivo: 100 },
]

export interface KPIIndicator {
  indicador: string
  valorActual: string
  objetivo: string
  cumplimiento: number
  estado: 'En meta' | 'En alerta' | 'Crítico'
}

export const mockKPITable: KPIIndicator[] = [
  { indicador: 'Ventas Totales',           valorActual: 'USD 48,320', objetivo: 'USD 65,000', cumplimiento: 74, estado: 'En alerta' },
  { indicador: 'Margen Bruto',             valorActual: '32.4%',      objetivo: '37%',         cumplimiento: 88, estado: 'En meta'   },
  { indicador: 'Nivel de Inventario',      valorActual: '1,540 SKUs', objetivo: '2,500 SKUs',  cumplimiento: 62, estado: 'En alerta' },
  { indicador: 'Rotación de Inventario',   valorActual: '6.8x',       objetivo: '9.5x',        cumplimiento: 71, estado: 'En alerta' },
  { indicador: 'Satisfacción del Cliente', valorActual: '4.25/5',     objetivo: '5.0/5',       cumplimiento: 85, estado: 'En meta'   },
  { indicador: 'Tasa de Cobranza',         valorActual: '58%',        objetivo: '95%',         cumplimiento: 58, estado: 'Crítico'   },
]
