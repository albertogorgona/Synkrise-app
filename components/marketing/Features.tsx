import { FadeIn } from './FadeIn'

interface Feature {
  icon: React.ReactNode
  title: string
  description: string
}

function IconWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-11 h-11 rounded-xl bg-accent-light flex items-center justify-center mb-4 text-synk-accent">
      {children}
    </div>
  )
}

const features: Feature[] = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M9 17V11M12 17V9M15 17v-4" />
      </svg>
    ),
    title: 'Dashboard en tiempo real',
    description: 'Visualiza tus métricas clave actualizadas al instante. Sin exportar Excel, sin esperar reportes.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20V10M6 20v-4M18 20v-7" />
        <circle cx="12" cy="7" r="2" />
        <circle cx="6" cy="13" r="2" />
        <circle cx="18" cy="10" r="2" />
      </svg>
    ),
    title: 'KPIs personalizables',
    description: 'Define los indicadores que importan en tu negocio. Ventas, margen, inventario, o lo que necesites.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    title: 'Alertas inteligentes',
    description: 'Recibe notificaciones cuando un KPI sale de rango. Actúa antes de que el problema crezca.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    title: 'Reportes automáticos',
    description: 'Genera reportes PDF o CSV con un clic. Compártelos con tu equipo o contador al instante.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M8 13h8M8 17h5" />
      </svg>
    ),
    title: 'Integración Excel / CSV',
    description: 'Sube tus archivos existentes y Synkrise los convierte en dashboards automáticamente, sin soporte técnico.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Multi-usuario con roles',
    description: 'Invita a tu equipo y asigna permisos por área. El gerente ve todo; cada área solo lo suyo.',
  },
]

export function Features() {
  return (
    <section id="funciones" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn className="text-center mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-synk-accent">
            Funciones
          </span>
          <h2
            className="text-[32px] md:text-[40px] font-bold text-ink tracking-[-0.03em] mt-3 mb-4"
            style={{ fontFamily: 'var(--font-sora), Sora, sans-serif' }}
          >
            Todo lo que tu negocio<br className="hidden sm:block" /> necesita para crecer
          </h2>
          <p className="text-slate text-[16px] max-w-xl mx-auto leading-relaxed">
            Diseñado para dueños de negocio, no para analistas. Simple de usar, poderoso en resultados.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <FadeIn key={f.title} delay={i * 0.06}>
              <div className="bg-surface border border-synk-border rounded-[14px] p-6 hover:shadow-md
                              hover:border-synk-accent/30 transition-all duration-150 h-full">
                <IconWrapper>{f.icon}</IconWrapper>
                <h3
                  className="text-[15px] font-semibold text-ink mb-2 tracking-tight"
                  style={{ fontFamily: 'var(--font-sora), Sora, sans-serif' }}
                >
                  {f.title}
                </h3>
                <p className="text-slate text-sm leading-relaxed">{f.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
