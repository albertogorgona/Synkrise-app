import { FadeIn } from './FadeIn'

const cards = [
  {
    icon: '🇵🇦',
    title: 'Hecho en Panamá',
    desc: 'Diseñado para la realidad operacional de las PYMEs locales.',
  },
  {
    icon: '🔒',
    title: 'Tus datos, seguros',
    desc: 'Encriptación en tránsito y en reposo. Tus datos nunca se comparten ni se venden.',
  },
  {
    icon: '🤝',
    title: 'Soporte real',
    desc: 'Hablamos tu idioma. Soporte en español por personas, no bots.',
  },
]

export function Nosotros() {
  return (
    <section id="nosotros" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn className="text-center mb-14">
          <span className="text-xs font-semibold uppercase tracking-widest text-synk-accent">
            Nosotros
          </span>
          <h2
            className="text-[32px] md:text-[40px] font-bold text-ink tracking-[-0.03em] mt-3 mb-5"
            style={{ fontFamily: 'var(--font-sora), Sora, sans-serif' }}
          >
            Quiénes somos
          </h2>
          <p className="text-slate text-[16px] max-w-2xl mx-auto leading-relaxed">
            Synkrise nació en Panamá con una misión clara: darle a las PYMEs panameñas las mismas
            herramientas de inteligencia de negocio que usan las grandes empresas, sin la
            complejidad ni el costo. Somos un equipo de profesionales en operaciones, datos y
            tecnología que entiende los retos reales del mercado local.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <FadeIn key={card.title} delay={i * 0.08}>
              <div className="rounded-[14px] border border-synk-border bg-surface p-8 flex flex-col gap-4 hover:shadow-md transition-shadow duration-150 h-full">
                <span className="text-4xl leading-none">{card.icon}</span>
                <div>
                  <h3
                    className="text-[17px] font-bold text-ink mb-2"
                    style={{ fontFamily: 'var(--font-sora), Sora, sans-serif' }}
                  >
                    {card.title}
                  </h3>
                  <p className="text-slate text-[14px] leading-relaxed">{card.desc}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
