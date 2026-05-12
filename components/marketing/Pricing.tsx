import Link from 'next/link'
import { FadeIn } from './FadeIn'

interface Plan {
  name: string
  price: string
  period: string
  description: string
  aiBlock?: string
  features: string[]
  cta: string
  ctaHref: string
  popular?: boolean
  apex?: boolean
}

const plans: Plan[] = [
  {
    name: 'Starter',
    price: '$19.99',
    period: '/mes',
    description: 'Para empezar a tomar decisiones con datos.',
    features: [
      'Hasta 3 usuarios',
      '2 Dashboards',
      'KPIs seleccionables por el usuario',
      'Import Excel / CSV',
      'Soporte por email',
      '2 GB de almacenamiento',
    ],
    cta: 'Empezar',
    ctaHref: '/register',
  },
  {
    name: 'Business',
    price: '$99.99',
    period: '/mes',
    description: 'Inteligencia artificial aplicada a tu operación.',
    aiBlock:
      'Insights con IA — análisis automático de KPIs, detección de anomalías y recomendaciones en lenguaje natural, en español.',
    features: [
      'Hasta 10 usuarios',
      'Dashboards ilimitados',
      'KPIs seleccionables y personalizables',
      'Alertas inteligentes por umbral',
      'Reportes automáticos en PDF',
      'Import Excel / CSV / Google Sheets',
      'Soporte prioritario',
      '20 GB de almacenamiento',
    ],
    cta: 'Empezar',
    ctaHref: '/register',
    popular: true,
  },
  {
    name: 'Apex',
    price: '$249.99',
    period: '/mes',
    description: 'Tu socio operacional. Sin límites, con respaldo.',
    features: [
      'Usuarios ilimitados',
      'Dashboards ilimitados',
      'KPIs seleccionables y personalizables',
      'IA avanzada con reportes ejecutivos automáticos',
      'Onboarding dedicado',
      'Integraciones personalizadas (ERP, POS, APIs)',
      'Gerente de cuenta asignado',
      'SLA garantizado',
      'Almacenamiento ilimitado',
    ],
    cta: 'Hablar con ventas',
    ctaHref: 'mailto:ventas@synkrise.com',
    apex: true,
  },
]

function CheckIcon({ teal }: { teal?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <circle cx="8" cy="8" r="8" fill="currentColor" fillOpacity={teal ? 0.18 : 0.12} />
      <path
        d="M5 8.5l2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <path
        d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5L8 1z"
        fill="#0ABFBC"
        fillOpacity="0.9"
      />
    </svg>
  )
}

export function Pricing() {
  return (
    <section id="precios" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn className="text-center mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-synk-accent">
            Precios
          </span>
          <h2
            className="text-[32px] md:text-[40px] font-bold text-ink tracking-[-0.03em] mt-3 mb-4"
            style={{ fontFamily: 'var(--font-sora), Sora, sans-serif' }}
          >
            Planes simples,
            <br className="hidden sm:block" /> sin sorpresas
          </h2>
          <p className="text-slate text-[16px] max-w-lg mx-auto leading-relaxed">
            14 días gratis en todos los planes. Sin tarjeta de crédito. Cancela cuando quieras.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {plans.map((plan, i) => (
            <FadeIn key={plan.name} delay={i * 0.08}>
              <div
                className={`relative rounded-[14px] border p-8 flex flex-col h-full transition-shadow duration-150 ${
                  plan.popular
                    ? 'border-synk-accent shadow-2xl bg-white lg:scale-[1.03] z-10'
                    : plan.apex
                    ? 'border-[#1E3A5F] bg-ink text-white'
                    : 'border-synk-border bg-white hover:shadow-md'
                }`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-teal text-white text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-sm">
                      Más popular
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-6">
                  <p
                    className={`text-[13px] font-semibold uppercase tracking-widest mb-3 ${
                      plan.apex ? 'text-white/50' : 'text-slate'
                    }`}
                  >
                    {plan.name}
                  </p>
                  <div className="flex items-end gap-1 mb-2">
                    <span
                      className={`font-bold tracking-tight leading-none text-[40px] ${
                        plan.apex ? 'text-white' : 'text-ink'
                      }`}
                      style={{ fontFamily: 'var(--font-sora), Sora, sans-serif' }}
                    >
                      {plan.price}
                    </span>
                    <span
                      className={`text-sm mb-1.5 ${
                        plan.apex ? 'text-white/50' : 'text-slate'
                      }`}
                    >
                      {plan.period}
                    </span>
                  </div>
                  <p
                    className={`text-sm leading-relaxed ${
                      plan.apex ? 'text-white/60' : 'text-slate'
                    }`}
                  >
                    {plan.description}
                  </p>
                </div>

                {/* AI block — Business only */}
                {plan.aiBlock && (
                  <div className="mb-5 rounded-[10px] bg-[#EBF9F9] border border-teal/25 px-4 py-3 flex gap-2.5 items-start">
                    <SparkleIcon />
                    <p className="text-[13px] text-[#0A7A78] leading-snug font-medium">
                      {plan.aiBlock}
                    </p>
                  </div>
                )}

                {/* Features list */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <span
                        className={
                          plan.popular
                            ? 'text-teal mt-[1px]'
                            : plan.apex
                            ? 'text-teal mt-[1px]'
                            : 'text-synk-accent mt-[1px]'
                        }
                      >
                        <CheckIcon teal={plan.apex} />
                      </span>
                      <span
                        className={`text-sm leading-snug ${
                          plan.apex ? 'text-white/80' : 'text-ink'
                        }`}
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href={plan.ctaHref}
                  className={`w-full flex items-center justify-center py-3 rounded-xl text-sm font-semibold transition-colors duration-100 ${
                    plan.popular
                      ? 'bg-synk-accent text-white hover:bg-blue-700'
                      : plan.apex
                      ? 'border border-teal text-teal hover:bg-teal/10'
                      : 'border border-synk-border text-ink hover:bg-surface'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Transversal note */}
        <FadeIn delay={0.3}>
          <p className="text-center text-[13px] text-slate mt-8">
            Todos los planes incluyen selección libre de KPIs por el usuario.
          </p>
        </FadeIn>
      </div>
    </section>
  )
}
