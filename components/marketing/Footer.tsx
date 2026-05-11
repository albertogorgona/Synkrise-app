import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-white border-t border-synk-border py-10">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Logo */}
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

        {/* Links */}
        <nav className="flex items-center gap-6 flex-wrap justify-center">
          <a href="/privacidad" className="text-sm text-slate hover:text-ink transition-colors duration-100">
            Privacidad
          </a>
          <a href="/terminos" className="text-sm text-slate hover:text-ink transition-colors duration-100">
            Términos
          </a>
          <a href="mailto:hola@synkrise.com" className="text-sm text-slate hover:text-ink transition-colors duration-100">
            Contacto
          </a>
        </nav>

        {/* Copyright */}
        <div className="text-center md:text-right">
          <p className="text-xs text-slate">
            © 2026 Synkrise. Todos los derechos reservados.
          </p>
          <p className="text-xs text-slate mt-0.5">
            Hecho para PYMEs panameñas 🇵🇦
          </p>
        </div>
      </div>
    </footer>
  )
}
