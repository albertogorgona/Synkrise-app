'use client'

import { useState } from 'react'
import Link from 'next/link'
import { register } from '@/app/auth/actions'
import { translateAuthError } from '@/lib/auth-errors'

const SynkriseLogoSVG = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-label="Synkrise">
    <rect width="48" height="48" rx="12" fill="#1A6FC4" />
    <path
      d="M13 30 L21 18 L27 24 L33 15"
      stroke="white"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="35" cy="15" r="3" fill="#0ABFBC" />
    <path
      d="M13 35 H35"
      stroke="rgba(255,255,255,0.25)"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: { preventDefault(): void; currentTarget: HTMLFormElement }) {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)
    try {
      const result = await register(formData)
      if (result?.error) {
        setError(translateAuthError(result.error))
        setLoading(false)
      }
    } catch (err) {
      if (err && typeof err === 'object' && 'digest' in err) throw err
      setError('Error de conexión. Verifica tu internet e intenta de nuevo.')
      setLoading(false)
    }
  }

  const inputStyle = {
    border: '1px solid #D6E4F0',
    fontFamily: 'DM Sans, sans-serif',
    color: '#0A1628',
  }

  const handleFocus = (e: { target: HTMLInputElement }) => {
    e.target.style.border = '1px solid #1A6FC4'
    e.target.style.boxShadow = '0 0 0 3px rgba(26,111,196,0.15)'
  }

  const handleBlur = (e: { target: HTMLInputElement }) => {
    e.target.style.border = '1px solid #D6E4F0'
    e.target.style.boxShadow = 'none'
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — hidden on mobile */}
      <div
        className="hidden md:flex md:w-[40%] flex-col items-center justify-center px-12 gap-6"
        style={{ background: '#0F2D52' }}
      >
        <SynkriseLogoSVG />
        <div className="text-center">
          <p className="font-sora text-2xl font-bold text-white tracking-tight">SYNKRISE</p>
          <p className="mt-2 text-sm" style={{ color: '#8BAFD4', fontFamily: 'DM Sans, sans-serif' }}>
            Visibilidad total de tu operación
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="flex justify-center mb-6 md:hidden">
            <SynkriseLogoSVG />
          </div>

          <h1 className="font-sora text-2xl font-bold text-center mb-1" style={{ color: '#0A1628' }}>
            Crear cuenta
          </h1>
          <p className="text-sm text-center mb-8" style={{ color: '#4A6580', fontFamily: 'DM Sans, sans-serif' }}>
            Empieza gratis hoy
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="fullName"
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: '#4A6580', fontFamily: 'DM Sans, sans-serif' }}
              >
                Nombre completo
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                placeholder="Juan Rodríguez"
                className="w-full px-3 py-3 rounded-lg text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: '#4A6580', fontFamily: 'DM Sans, sans-serif' }}
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="tu@empresa.com"
                className="w-full px-3 py-3 rounded-lg text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: '#4A6580', fontFamily: 'DM Sans, sans-serif' }}
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3 py-3 rounded-lg text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: '#4A6580', fontFamily: 'DM Sans, sans-serif' }}
              >
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                placeholder="Repite tu contraseña"
                className="w-full px-3 py-3 rounded-lg text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            {error && (
              <p
                className="text-sm text-center px-3 py-2 rounded-lg"
                style={{ color: '#E05C5C', background: '#FEF2F2', fontFamily: 'DM Sans, sans-serif' }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-colors mt-1 disabled:opacity-60"
              style={{
                background: loading ? '#4A8FD4' : '#1A6FC4',
                fontFamily: 'Sora, sans-serif',
              }}
              onMouseEnter={(e) => {
                if (!loading) (e.target as HTMLButtonElement).style.background = '#0F5AA8'
              }}
              onMouseLeave={(e) => {
                if (!loading) (e.target as HTMLButtonElement).style.background = '#1A6FC4'
              }}
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p
            className="text-center text-sm mt-6"
            style={{ color: '#4A6580', fontFamily: 'DM Sans, sans-serif' }}
          >
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: '#1A6FC4' }}>
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
