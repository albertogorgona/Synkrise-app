import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos de Uso — Synkrise',
  description: 'Términos y condiciones de uso de Synkrise, la plataforma de Business Intelligence para PYMEs panameñas.',
}

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-synk-border bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Synkrise inicio">
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="9" fill="#1A6FC4" />
              <path
                d="M10 22 L16 14 L20 18 L24 12"
                stroke="white" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
              />
              <circle cx="26" cy="12" r="2.5" fill="#0ABFBC" />
              <path d="M10 26 H26" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span
              className="font-bold text-[17px] text-ink tracking-tight"
              style={{ fontFamily: 'var(--font-sora), Sora, sans-serif' }}
            >
              Synkrise
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm text-slate hover:text-ink transition-colors duration-150 flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Volver al inicio
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 pb-20">
        <h1
          className="text-3xl font-bold text-ink mb-2"
          style={{ fontFamily: 'var(--font-sora), Sora, sans-serif' }}
        >
          Términos de Uso
        </h1>
        <p className="text-sm text-slate mb-10">Última actualización: Mayo 2026</p>

        <div className="space-y-8 text-[15px] leading-relaxed text-ink/80">
          <section>
            <h2 className="text-lg font-semibold text-ink mb-3">1. Aceptación de los términos</h2>
            <p>
              Al registrarte en Synkrise o al acceder y usar la plataforma, aceptas quedar vinculado por
              estos Términos de Uso. Si no estás de acuerdo con alguno de los términos, no debes usar el
              servicio.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink mb-3">2. Servicio en fase beta</h2>
            <p>
              Synkrise se encuentra actualmente en <strong>fase beta</strong>. Esto significa que el servicio
              puede presentar interrupciones, errores o cambios inesperados en su funcionalidad. Trabajamos
              continuamente para mejorar la plataforma, pero no garantizamos una disponibilidad ininterrumpida
              durante este período.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink mb-3">3. Responsabilidad sobre los datos</h2>
            <p>
              El usuario es el único responsable de los datos que carga, almacena o procesa dentro de
              Synkrise. Esto incluye, sin limitarse a, datos de ventas, inventario, clientes y cualquier
              otra información de negocio. El usuario garantiza que cuenta con los derechos y autorizaciones
              necesarios para procesar dicha información dentro de la plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink mb-3">4. Limitación de responsabilidad</h2>
            <p className="mb-3">
              Synkrise proporciona herramientas de visualización e inteligencia de negocio con fines
              informativos. <strong>Synkrise no se hace responsable por ninguna decisión de negocio tomada
              con base en los datos, gráficas o análisis mostrados en la plataforma.</strong>
            </p>
            <p>
              En ningún caso Synkrise será responsable por pérdidas de ingresos, pérdida de datos,
              daños indirectos o consecuentes derivados del uso o la imposibilidad de uso del servicio.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink mb-3">5. Uso aceptable</h2>
            <p className="mb-3">Al usar Synkrise, el usuario se compromete a:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-1">
              <li>No utilizar la plataforma para actividades ilegales o fraudulentas.</li>
              <li>No intentar acceder sin autorización a sistemas, cuentas o datos de otros usuarios.</li>
              <li>No cargar contenido que infrinja derechos de propiedad intelectual de terceros.</li>
              <li>No realizar acciones que afecten negativamente la disponibilidad o el rendimiento del servicio.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink mb-3">6. Propiedad intelectual</h2>
            <p>
              Todo el software, diseño, marcas y contenidos de Synkrise son propiedad exclusiva de Synkrise
              o sus licenciantes. El usuario no adquiere ningún derecho de propiedad intelectual sobre el
              servicio más allá del uso permitido por estos términos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink mb-3">7. Modificaciones al servicio y los términos</h2>
            <p>
              Synkrise se reserva el derecho de modificar, suspender o descontinuar el servicio, o de
              actualizar estos Términos de Uso en cualquier momento. En caso de cambios materiales a los
              términos, notificaremos a los usuarios con un mínimo de{' '}
              <strong>15 días de anticipación</strong> mediante correo electrónico o aviso en la plataforma.
              El uso continuado del servicio tras la notificación implica la aceptación de los nuevos términos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink mb-3">8. Jurisdicción y ley aplicable</h2>
            <p>
              Estos Términos de Uso se rigen por las leyes de la <strong>República de Panamá</strong>.
              Cualquier disputa relacionada con el uso del servicio será sometida a la jurisdicción de los
              tribunales competentes de la Ciudad de Panamá.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink mb-3">9. Contacto</h2>
            <p>
              Si tienes preguntas sobre estos términos, escríbenos a{' '}
              <a href="mailto:hola@synkrise.com" className="text-synk-accent hover:underline">
                hola@synkrise.com
              </a>.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-synk-border py-6">
        <div className="max-w-3xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate">© 2026 Synkrise. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacidad" className="text-xs text-slate hover:text-ink transition-colors">Política de Privacidad</Link>
            <Link href="/terminos" className="text-xs text-synk-accent font-medium">Términos</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
