import { FadeIn } from './FadeIn'

const steps = [
  {
    number: '01',
    title: 'Conecta tu data',
    description: 'Sube tu archivo Excel o CSV. Synkrise lo lee, lo interpreta y lo transforma en segundos.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Configura tus KPIs',
    description: 'Selecciona las métricas que importan en tu industria. Ventas, costos, margen, rotación de inventario.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Toma decisiones',
    description: 'Tu dashboard listo. Compártelo con tu equipo y actúa sobre datos reales, no suposiciones.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
  },
]

export function HowItWorks() {
  return (
    <section className="py-24 bg-surface">
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn className="text-center mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-synk-accent">
            Cómo funciona
          </span>
          <h2
            className="text-[32px] md:text-[40px] font-bold text-ink tracking-[-0.03em] mt-3 mb-4"
            style={{ fontFamily: 'var(--font-sora), Sora, sans-serif' }}
          >
            De cero a tu dashboard<br className="hidden sm:block" /> en 3 pasos
          </h2>
          <p className="text-slate text-[16px] max-w-lg mx-auto leading-relaxed">
            Sin conocimiento técnico. Sin ayuda de IT. Solo sube tus datos y empieza.
          </p>
        </FadeIn>

        <div className="relative">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-14 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px bg-synk-border z-0" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-8 relative z-10">
            {steps.map((step, i) => (
              <FadeIn key={step.number} delay={i * 0.1}>
                <div className="flex flex-col items-center text-center lg:items-center">
                  {/* Step icon circle */}
                  <div
                    className="w-[56px] h-[56px] rounded-2xl bg-white border-2 border-synk-border
                                flex items-center justify-center text-synk-accent mb-5 shadow-sm relative z-10"
                  >
                    {step.icon}
                  </div>

                  <div
                    className="inline-flex items-center justify-center w-6 h-6 rounded-full
                                bg-synk-accent text-white text-[10px] font-bold mb-3"
                  >
                    {i + 1}
                  </div>

                  <h3
                    className="text-[17px] font-bold text-ink tracking-tight mb-3"
                    style={{ fontFamily: 'var(--font-sora), Sora, sans-serif' }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-slate text-sm leading-relaxed max-w-xs mx-auto">
                    {step.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
