import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad — Synkrise',
  description: 'Política de privacidad de Synkrise, la plataforma de Business Intelligence para PYMEs panameñas.',
}

export default function PrivacidadPage() {
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
          Política de Privacidad
        </h1>
        <p className="text-sm text-slate mb-10">Última actualización: Mayo 2026</p>

        <div className="space-y-8 text-[15px] leading-relaxed text-ink/80">
          <section>
            <h2 className="text-lg font-semibold text-ink mb-3">1. Responsable del tratamiento</h2>
            <p>
              El responsable del tratamiento de los datos personales es <strong>Synkrise</strong>, empresa
              constituida bajo las leyes de la República de Panamá. Para cualquier consulta relacionada con
              el tratamiento de tus datos, puedes escribirnos a{' '}
              <a href="mailto:hola@synkrise.com" className="text-synk-accent hover:underline">
                hola@synkrise.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink mb-3">2. Datos que recolectamos</h2>
            <p className="mb-3">Al usar Synkrise, podemos recolectar los siguientes datos:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-1">
              <li><strong>Información de cuenta:</strong> nombre completo y correo electrónico.</li>
              <li><strong>Datos de negocio:</strong> archivos e información que el usuario carga a la plataforma (ventas, inventario, clientes).</li>
              <li><strong>Datos de uso:</strong> páginas visitadas, funciones utilizadas, frecuencia de acceso y eventos de interacción dentro de la plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink mb-3">3. Cómo usamos tus datos</h2>
            <p className="mb-3">Utilizamos tus datos exclusivamente para:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-1">
              <li>Operar y mantener el servicio Synkrise.</li>
              <li>Personalizar y mejorar tu experiencia dentro de la plataforma.</li>
              <li>Enviarte comunicaciones relacionadas con el servicio (actualizaciones, alertas de cuenta).</li>
              <li>Analizar el uso agregado de la plataforma para mejorar las funcionalidades.</li>
            </ul>
            <p className="mt-3">
              <strong>No vendemos, alquilamos ni compartimos tus datos personales con terceros</strong> con fines
              comerciales o publicitarios.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink mb-3">4. Cookies</h2>
            <p>
              Synkrise utiliza <strong>cookies de sesión</strong> necesarias para mantener tu autenticación
              mientras navegas la plataforma. Estas cookies no se utilizan para rastrear tu actividad fuera
              de Synkrise y se eliminan al cerrar sesión o cuando expiran automáticamente.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink mb-3">5. Almacenamiento y seguridad</h2>
            <p>
              Tus datos se almacenan en servidores seguros a través de Supabase. Aplicamos medidas técnicas
              razonables para proteger tu información contra accesos no autorizados, pérdida o alteración.
              Sin embargo, ningún sistema de transmisión por internet es 100% seguro.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink mb-3">6. Tus derechos</h2>
            <p className="mb-3">Como usuario de Synkrise tienes derecho a:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-1">
              <li>Acceder a los datos que tenemos sobre ti.</li>
              <li>Solicitar la corrección de datos inexactos.</li>
              <li>Solicitar la <strong>eliminación de tu cuenta y tus datos</strong>.</li>
              <li>Oponerte al tratamiento de tus datos en determinadas circunstancias.</li>
            </ul>
            <p className="mt-3">
              Para ejercer cualquiera de estos derechos, escríbenos a{' '}
              <a href="mailto:hola@synkrise.com" className="text-synk-accent hover:underline">
                hola@synkrise.com
              </a>{' '}
              con el asunto <em>"Solicitud de datos"</em>. Atenderemos tu solicitud en un plazo máximo de 30 días.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink mb-3">7. Cambios a esta política</h2>
            <p>
              Podemos actualizar esta Política de Privacidad cuando sea necesario. En caso de cambios
              significativos, te notificaremos por correo electrónico o mediante un aviso visible dentro
              de la plataforma antes de que entren en vigencia.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-synk-border py-6">
        <div className="max-w-3xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate">© 2026 Synkrise. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacidad" className="text-xs text-synk-accent font-medium">Privacidad</Link>
            <Link href="/terminos" className="text-xs text-slate hover:text-ink transition-colors">Términos de Uso</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
