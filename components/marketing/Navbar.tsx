'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

function SynkriseLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
        <rect width="36" height="36" rx="9" fill="#1A6FC4" />
        <path
          d="M10 22 L16 14 L20 18 L24 12"
          stroke="white" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
        />
        <circle cx="26" cy="12" r="2.5" fill="#0ABFBC" />
        <path
          d="M10 26 H26"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1.5" strokeLinecap="round"
        />
      </svg>
      <span
        className="font-bold text-[20px] text-ink tracking-tight"
        style={{ fontFamily: 'var(--font-sora), Sora, sans-serif' }}
      >
        Synkrise
      </span>
    </div>
  )
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-200 ${
        scrolled ? 'shadow-sm border-b border-synk-border' : ''
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" aria-label="Synkrise inicio">
          <SynkriseLogo />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#funciones"
            className="text-sm text-slate hover:text-ink transition-colors duration-100"
          >
            Funciones
          </a>
          <a
            href="#precios"
            className="text-sm text-slate hover:text-ink transition-colors duration-100"
          >
            Precios
          </a>
          <a
            href="#nosotros"
            className="text-sm text-slate hover:text-ink transition-colors duration-100"
          >
            Nosotros
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-flex text-sm font-medium text-ink border
                       border-synk-border px-4 py-2 rounded-lg hover:bg-surface
                       transition-colors duration-100"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium text-white bg-synk-accent px-4 py-2
                       rounded-lg hover:bg-blue-700 transition-colors duration-100"
          >
            Prueba gratis
          </Link>
        </div>
      </div>
    </header>
  )
}
