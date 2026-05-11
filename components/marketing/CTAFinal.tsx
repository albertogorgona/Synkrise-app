import Link from 'next/link'

export function CTAFinal() {
  return (
    <section
      className="py-28 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0A1628 0%, #0F2D52 100%)' }}
    >
      {/* Subtle decorative circles */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none opacity-10"
        style={{ background: 'radial-gradient(circle, #1A6FC4 0%, transparent 65%)' }}
      />
      <div
        className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none opacity-5"
        style={{ background: '#0ABFBC' }}
      />

      <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-synk-accent/20 border border-synk-accent/40 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
              <path d="M10 22 L16 14 L20 18 L24 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="26" cy="12" r="2.5" fill="#0ABFBC" />
              <path d="M10 26 H26" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <h2
          className="text-[36px] md:text-[48px] font-bold text-white tracking-[-0.04em] leading-[1.1] mb-5"
          style={{ fontFamily: 'var(--font-sora), Sora, sans-serif' }}
        >
          ¿Listo para ver tu negocio<br className="hidden sm:block" /> con claridad?
        </h2>

        <p className="text-white/60 text-[17px] leading-relaxed mb-10">
          Empieza gratis. Sin tarjeta de crédito. Sin contratos.
        </p>

        <Link
          href="/register"
          className="inline-flex items-center gap-2.5 px-8 py-4 text-white font-semibold text-[15px]
                     rounded-xl transition-all duration-150 shadow-lg"
          style={{ background: '#0ABFBC' }}
        >
          Crear mi cuenta gratis
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8h10M9 4l4 4-4 4" />
          </svg>
        </Link>

        <p className="text-white/30 text-xs mt-6">
          14 días gratis en todos los planes · Cancela cuando quieras
        </p>
      </div>
    </section>
  )
}
