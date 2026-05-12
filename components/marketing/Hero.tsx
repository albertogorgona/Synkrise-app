import Link from 'next/link'

const kpiCards = [
  { label: 'VENTAS TOTALES', value: '$48,320', delta: '+12.4%', note: 'vs mes anterior', borderColor: '#1A6FC4', deltaColor: '#0ABFBC', positive: true },
  { label: 'MARGEN BRUTO',   value: '41.2%',   delta: '+1.8pp',  note: 'vs mes anterior', borderColor: '#0ABFBC', deltaColor: '#0ABFBC', positive: true },
  { label: 'COSTO OPERATIVO',value: '$11,280',  delta: '+3.2% (alerta)', note: 'vs mes anterior', borderColor: '#E05C5C', deltaColor: '#E05C5C', positive: false },
  { label: 'TICKET PROMEDIO',value: '$22.50',   delta: '+4.1%',  note: '', borderColor: '#F59E0B', deltaColor: '#0ABFBC', positive: true },
]

const donutSegments = [
  { color: '#1A6FC4', label: 'Alimentos', pct: '38%' },
  { color: '#3A8FD8', label: 'Bebidas',   pct: '25%' },
  { color: '#0ABFBC', label: 'Limpieza',  pct: '20%' },
  { color: '#A8CCE8', label: 'Personal',  pct: '12%' },
  { color: '#D6E4F0', label: 'Otros',     pct: '5%'  },
]

function DashboardMockup() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-synk-border shadow-2xl w-full max-w-[640px]">
      {/* Top bar */}
      <div className="px-5 py-3.5 border-b border-synk-border flex items-center justify-between bg-white">
        <div>
          <p className="text-[11px] font-bold text-ink" style={{ fontFamily: 'var(--font-sora), Sora, sans-serif' }}>
            Dashboard Operacional
          </p>
          <p className="text-[9px] text-slate mt-0.5">Resumen del período · Mayo 2025</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] bg-surface text-slate px-2 py-1 rounded-md border border-synk-border">
            May 1 — May 31, 2025
          </span>
          <span className="text-[9px] bg-accent-light text-synk-accent font-semibold px-2 py-1 rounded-md">
            Retail · Comercio
          </span>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 divide-x divide-synk-border border-b border-synk-border">
        {kpiCards.map((k) => (
          <div key={k.label} className="px-4 py-3" style={{ borderTop: `2.5px solid ${k.borderColor}` }}>
            <p className="text-[7.5px] font-semibold uppercase tracking-wider text-slate mb-1">{k.label}</p>
            <p className="text-[13px] font-bold text-ink mb-0.5" style={{ fontFamily: 'var(--font-sora), Sora, sans-serif', letterSpacing: '-0.03em' }}>
              {k.value}
            </p>
            <p className="text-[7.5px] font-medium" style={{ color: k.deltaColor }}>
              {k.positive ? '↑' : '↑'} {k.delta}
              {k.note && <span className="text-slate ml-1">{k.note}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-5 divide-x divide-synk-border">
        {/* Line chart */}
        <div className="col-span-3 px-4 py-3">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-[10px] font-semibold text-ink" style={{ fontFamily: 'var(--font-sora), Sora, sans-serif' }}>
                Evolución de Ventas
              </p>
              <p className="text-[8px] text-slate">Últimos 6 meses · Comparado con período anterior</p>
            </div>
            <span className="text-[8px] bg-teal-light text-teal font-semibold px-1.5 py-0.5 rounded-md whitespace-nowrap">
              ↑ +12.4% MoM
            </span>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 mb-2">
            <span className="flex items-center gap-1 text-[8px] text-slate">
              <span className="w-4 h-0.5 bg-synk-accent inline-block rounded" />
              Este año
            </span>
            <span className="flex items-center gap-1 text-[8px] text-slate">
              <span className="w-4 inline-block" style={{ borderTop: '1.5px dashed #D6E4F0' }} />
              Año anterior
            </span>
          </div>

          {/* SVG Chart */}
          <svg viewBox="0 0 400 115" className="w-full" style={{ height: '100px' }}>
            <defs>
              <linearGradient id="heroAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1A6FC4" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#1A6FC4" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[20, 45, 70, 95].map((y) => (
              <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#D6E4F0" strokeWidth="0.5" />
            ))}

            {/* Area fill */}
            <path
              d="M 0,96 C 40,94 56,86 80,80 C 104,74 136,61 160,54 C 184,47 216,43 240,38 C 264,33 296,22 320,18 C 344,14 376,5 400,3 L 400,105 L 0,105 Z"
              fill="url(#heroAreaGrad)"
            />

            {/* Previous year dashed */}
            <path
              d="M 0,106 C 40,105 56,102 80,100 C 104,98 136,93 160,90 C 184,87 216,83 240,80 C 264,77 296,71 320,68 C 344,65 376,58 400,54"
              fill="none" stroke="#D6E4F0" strokeWidth="1.5" strokeDasharray="4,3"
            />

            {/* Current year line */}
            <path
              d="M 0,96 C 40,94 56,86 80,80 C 104,74 136,61 160,54 C 184,47 216,43 240,38 C 264,33 296,22 320,18 C 344,14 376,5 400,3"
              fill="none" stroke="#1A6FC4" strokeWidth="2"
            />

            {/* Dots */}
            {([0, 80, 160, 240, 320, 400] as const).map((x, i) => {
              const ys = [96, 80, 54, 38, 18, 3]
              return (
                <circle key={x} cx={x} cy={ys[i]} r="2.5" fill="white" stroke="#1A6FC4" strokeWidth="1.5" />
              )
            })}

            {/* X labels */}
            {(['Dic', 'Ene', 'Feb', 'Mar', 'Abr', 'May'] as const).map((l, i) => (
              <text key={l} x={i * 80} y="113" textAnchor="middle" fontSize="7" fill="#4A6580">{l}</text>
            ))}
          </svg>
        </div>

        {/* Donut chart */}
        <div className="col-span-2 px-4 py-3">
          <p className="text-[10px] font-semibold text-ink mb-0.5" style={{ fontFamily: 'var(--font-sora), Sora, sans-serif' }}>
            Ventas por Categoría
          </p>
          <p className="text-[8px] text-slate mb-3">% del total del período</p>

          <div className="flex items-center gap-3">
            {/* Donut */}
            <div className="relative flex-shrink-0" style={{ width: 72, height: 72 }}>
              <div
                className="w-full h-full rounded-full"
                style={{
                  background: 'conic-gradient(#1A6FC4 0% 38%, #3A8FD8 38% 63%, #0ABFBC 63% 83%, #A8CCE8 83% 95%, #D6E4F0 95% 100%)',
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full bg-white" style={{ width: 40, height: 40 }} />
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-1 flex-1 min-w-0">
              {donutSegments.map((seg) => (
                <div key={seg.label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: seg.color }} />
                  <span className="text-[7.5px] text-slate truncate">{seg.label}</span>
                  <span className="text-[7.5px] font-semibold text-ink ml-auto">{seg.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-16 pb-8 md:pt-20 md:pb-12"
      style={{ background: 'linear-gradient(160deg, #FFFFFF 0%, #F0F4FA 60%, #E6F0FB 100%)' }}>

      {/* Background decoration */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 80% 20%, #E6F0FB 0%, transparent 60%)',
        }}
      />

      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-10">

          {/* Left: copy */}
          <div className="flex-1 max-w-xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-accent-light border border-synk-border
                            text-synk-accent text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-teal inline-block" />
              Nuevo: Insights con IA en español
            </div>

            <h1
              className="text-[40px] md:text-[52px] font-bold text-ink leading-[1.1] tracking-[-0.04em] mb-5"
              style={{ fontFamily: 'var(--font-sora), Sora, sans-serif' }}
            >
              Toma decisiones<br />
              <span className="text-synk-accent">con datos.</span><br />
              Sin complicaciones.
            </h1>

            <p className="text-slate text-[17px] leading-relaxed mb-8 max-w-md mx-auto lg:mx-0">
              Synkrise conecta los números de tu negocio en un Dashboard operacional claro,
              en minutos. Hecho para PYMEs panameñas.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-10">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-synk-accent
                           text-white font-semibold text-sm rounded-xl hover:bg-blue-700
                           transition-colors duration-100 shadow-md"
              >
                Empieza gratis — 14 días sin costo
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border
                           border-synk-border text-ink font-medium text-sm rounded-xl
                           hover:bg-synk-border/40 transition-colors duration-100"
              >
                Ver demo →
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-4 justify-center lg:justify-start">
              {['Sin tarjeta de crédito', 'Setup en 5 minutos', 'Soporte en español'].map((b) => (
                <span key={b} className="flex items-center gap-1.5 text-[12px] text-slate">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="8" fill="#E0F8F8" />
                    <path d="M5 8.5l2 2 4-4" stroke="#0ABFBC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Right: dashboard mockup */}
          <div className="flex-1 w-full flex justify-center lg:justify-end">
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  )
}
