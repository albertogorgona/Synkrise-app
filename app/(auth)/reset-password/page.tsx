'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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

type Status = 'verifying' | 'form' | 'invalid'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<Status>('verifying')
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Error enviado por /auth/callback cuando el código era inválido
    const callbackError = searchParams.get('error')
    if (callbackError) {
      setVerifyError('El enlace de recuperación no es válido o ya expiró.')
      setStatus('invalid')
      return
    }

    // Caso normal: /auth/callback ya intercambió el código y hay sesión activa
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStatus('form')
        return
      }

      // Fallback: token_hash directo (emails legacy sin callback)
      const tokenHash = searchParams.get('token_hash')
      const type = searchParams.get('type')
      if (tokenHash && type === 'recovery') {
        supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' }).then(({ error }) => {
          if (error) {
            setVerifyError(translateAuthError(error.message))
            setStatus('invalid')
          } else {
            setStatus('form')
          }
        })
        return
      }

      // Fallback: flujo implícito (hash fragment) — espera evento PASSWORD_RECOVERY
      const { data } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') setStatus('form')
      })

      // Timeout generoso: 8 segundos para el flujo implícito
      const timer = setTimeout(() => {
        data.subscription.unsubscribe()
        setStatus('invalid')
      }, 8000)

      return () => {
        data.subscription.unsubscribe()
        clearTimeout(timer)
      }
    })
  }, [searchParams])

  async function handleSubmit(e: { preventDefault(): void; currentTarget: HTMLFormElement }) {
    e.preventDefault()
    setFormError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    const confirm = formData.get('confirm') as string

    if (password !== confirm) {
      setFormError('Las contraseñas no coinciden')
      setLoading(false)
      return
    }
    if (password.length < 6) {
      setFormError('La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setFormError(translateAuthError(error.message))
      setLoading(false)
    } else {
      await supabase.auth.signOut()
      router.push('/login?reset=success')
    }
  }

  const inputStyle = {
    border: '1px solid #D6E4F0',
    fontFamily: 'DM Sans, sans-serif',
    color: '#0A1628',
  }

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
      <div className="w-full max-w-[400px]">
        {/* Mobile logo */}
        <div className="flex justify-center mb-6 md:hidden">
          <SynkriseLogoSVG />
        </div>

        {status === 'verifying' && (
          <div className="flex flex-col items-center gap-4 py-12">
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#1A6FC4', borderTopColor: 'transparent' }}
            />
            <p className="text-sm" style={{ color: '#4A6580', fontFamily: 'DM Sans, sans-serif' }}>
              Verificando enlace...
            </p>
          </div>
        )}

        {status === 'invalid' && (
          <div
            className="text-center px-6 py-8 rounded-xl"
            style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
          >
            <div className="text-4xl mb-3">🔗</div>
            <p className="font-sora font-semibold text-lg mb-2" style={{ color: '#0A1628' }}>
              Enlace inválido o expirado
            </p>
            <p className="text-sm mb-6" style={{ color: '#4A6580', fontFamily: 'DM Sans, sans-serif' }}>
              {verifyError || 'El enlace de recuperación no es válido o ya expiró.'}
              {' '}Solicita uno nuevo.
            </p>
            <Link
              href="/forgot-password"
              className="text-sm font-semibold hover:underline"
              style={{ color: '#1A6FC4', fontFamily: 'DM Sans, sans-serif' }}
            >
              Solicitar nuevo enlace →
            </Link>
          </div>
        )}

        {status === 'form' && (
          <>
            <h1
              className="font-sora text-2xl font-bold text-center mb-1"
              style={{ color: '#0A1628' }}
            >
              Nueva contraseña
            </h1>
            <p
              className="text-sm text-center mb-8"
              style={{ color: '#4A6580', fontFamily: 'DM Sans, sans-serif' }}
            >
              Elige una contraseña segura para tu cuenta
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: '#4A6580', fontFamily: 'DM Sans, sans-serif' }}
                >
                  Nueva contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full px-3 py-3 rounded-lg text-sm outline-none transition-all"
                  style={inputStyle}
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
                  htmlFor="confirm"
                  className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: '#4A6580', fontFamily: 'DM Sans, sans-serif' }}
                >
                  Confirmar contraseña
                </label>
                <input
                  id="confirm"
                  name="confirm"
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full px-3 py-3 rounded-lg text-sm outline-none transition-all"
                  style={inputStyle}
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

              {formError && (
                <p
                  className="text-sm text-center px-3 py-2 rounded-lg"
                  style={{
                    color: '#E05C5C',
                    background: '#FEF2F2',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  {formError}
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
                {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
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

      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center bg-white">
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#1A6FC4', borderTopColor: 'transparent' }}
            />
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
