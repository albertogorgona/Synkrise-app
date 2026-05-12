import { FadeIn } from './FadeIn'

interface Testimonial {
  quote: string
  name: string
  role: string
  company: string
  initials: string
}

const testimonials: Testimonial[] = [
  {
    quote: 'Antes usábamos 4 Excel distintos para seguir las ventas de la semana. Ahora todo está en un solo lugar y puedo ver los números desde el celular.',
    name: 'Carlos Méndez',
    role: 'Gerente de Operaciones',
    company: 'Distribuidora Nacional',
    initials: 'CM',
  },
  {
    quote: 'Configuramos los KPIs de nuestra cadena de restaurantes en una tarde. Lo que antes tardaba 3 horas en preparar, ahora está listo en segundos.',
    name: 'Sofía Arias',
    role: 'Dueña',
    company: 'Grupo Gastronómico Arias',
    initials: 'SA',
  },
]

function StarRating() {
  return (
    <div className="flex gap-0.5 mb-4">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width="16" height="16" viewBox="0 0 16 16" fill="#F59E0B">
          <path d="M8 1l1.8 3.6L14 5.3l-3 2.9.7 4.1L8 10.5l-3.7 1.8.7-4.1-3-2.9 4.2-.7z" />
        </svg>
      ))}
    </div>
  )
}

export function Testimonials() {
  return (
    <section id="testimonios" className="py-24 bg-surface">
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn className="text-center mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-synk-accent">
            Testimonios
          </span>
          <h2
            className="text-[32px] md:text-[40px] font-bold text-ink tracking-[-0.03em] mt-3 mb-4"
            style={{ fontFamily: 'var(--font-sora), Sora, sans-serif' }}
          >
            Negocios que ya<br className="hidden sm:block" /> usan Synkrise
          </h2>
          <p className="text-slate text-[16px] max-w-lg mx-auto">
            Más de 150 PYMEs panameñas ya toman mejores decisiones con sus datos.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <FadeIn key={t.name} delay={i * 0.1}>
              <div className="bg-white border border-synk-border rounded-[14px] p-8 h-full flex flex-col hover:shadow-md transition-shadow duration-150">
                <StarRating />

                <blockquote className="text-ink text-[16px] leading-relaxed flex-1 mb-6">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-full bg-accent-light flex items-center justify-center
                                text-synk-accent font-bold text-sm flex-shrink-0"
                    style={{ fontFamily: 'var(--font-sora), Sora, sans-serif' }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{t.name}</p>
                    <p className="text-xs text-slate">
                      {t.role} · {t.company}
                    </p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
