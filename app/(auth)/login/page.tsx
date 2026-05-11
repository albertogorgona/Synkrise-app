'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { login } from '@/app/auth/actions'
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

function ResetSuccessBanner() {
  const searchParams = useSearchParams()
  if (searchParams.get('reset') !== 'success') return null
  return (
    <div
      className="mb-6 px-4 py-3 rounded-lg text-sm text-center"
      style={{
        background: '#F0FDF4',
        border: '1px solid #BBF7D0',
        color: '#16A34A',
        fontFamily: 'DM Sans, sans-serif',
      }}
    >
      Contraseña actualizada. Inicia sesión con tu nueva contraseña.
    </div>
  )
}

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: { preventDefault(): void; currentTarget: HTMLFormElement }) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      const result = await login(formData)
      if (result?.error) {
        setError(translateAuthError(result.error) || result.error)
        setLoading(false)
      }
    } catch (err) {
      // Re-throw Next.js redirect errors — they have a 'digest' property and must propagate
      if (err && typeof err === 'object' && 'digest' in err) throw err
      setError('Error de conexión. Verifica tu internet e intenta de nuevo.')
      setLoading(false)
    }
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
            Iniciar sesión
          </h1>
          <p className="text-sm text-center mb-8" style={{ color: '#4A6580', fontFamily: 'DM Sans, sans-serif' }}>
            Bienvenido de vuelta
          </p>

          <Suspense fallback={null}>
            <ResetSuccessBanner />
          </Suspense>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                style={{
                  border: '1px solid #D6E4F0',
                  fontFamily: 'DM Sans, sans-serif',
                  color: '#0A1628',
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid #1A6FC4'
                  e.target.style.boxShadow = '0 0 0 3px rgba(26,111,196,0.15)'
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid #D6E4F0'
                  e.target.style.boxShadow = 'none'
                }}
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
                placeholder="••••••••"
                className="w-full px-3 py-3 rounded-lg text-sm outline-none transition-all"
                style={{
                  border: '1px solid #D6E4F0',
                  fontFamily: 'DM Sans, sans-serif',
                  color: '#0A1628',
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid #1A6FC4'
                  e.target.style.boxShadow = '0 0 0 3px rgba(26,111,196,0.15)'
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid #D6E4F0'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            <div className="text-right -mt-2">
              <Link
                href="/forgot-password"
                className="text-xs hover:underline"
                style={{ color: '#1A6FC4', fontFamily: 'DM Sans, sans-serif' }}
              >
                ¿Olvidaste tu contraseña?
              </Link>
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
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>

          <p
            className="text-center text-sm mt-6"
            style={{ color: '#4A6580', fontFamily: 'DM Sans, sans-serif' }}
          >
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="font-semibold hover:underline" style={{ color: '#1A6FC4' }}>
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
