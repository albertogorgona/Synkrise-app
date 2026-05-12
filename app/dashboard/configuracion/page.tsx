'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Preferences storage ──────────────────────────────────────────────────────

const PREFS_KEY = 'synkrise_dashboard_prefs'

interface DashboardPrefs {
  defaultPeriod: 'week' | 'month' | 'year'
  showGoals: boolean
  emailAlerts: boolean
}

function readPrefs(): DashboardPrefs {
  if (typeof window === 'undefined') return { defaultPeriod: 'month', showGoals: true, emailAlerts: true }
  try {
    return { defaultPeriod: 'month', showGoals: true, emailAlerts: true, ...JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') }
  } catch { return { defaultPeriod: 'month', showGoals: true, emailAlerts: true } }
}

function savePrefs(prefs: DashboardPrefs) {
  if (typeof window === 'undefined') return
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[14px] border border-synk-border p-6 mb-6">
      <h2
        className="text-[17px] font-bold text-ink mb-6"
        style={{ fontFamily: 'var(--font-sora), Sora, sans-serif' }}
      >
        {title}
      </h2>
      {children}
    </div>
  )
}

function Field({ label, children, note }: { label: string; children: React.ReactNode; note?: string }) {
  return (
    <div className="mb-5">
      <label className="block text-sm font-medium text-ink mb-1.5">{label}</label>
      {children}
      {note && <p className="text-xs text-slate mt-1">{note}</p>}
    </div>
  )
}

const inputClass = 'w-full px-3 py-2 rounded-[9px] border border-synk-border text-sm text-ink outline-none focus:border-synk-accent transition-colors bg-white disabled:bg-surface disabled:text-slate'
const selectClass = 'w-full px-3 py-2 rounded-[9px] border border-synk-border text-sm text-ink outline-none focus:border-synk-accent transition-colors bg-white cursor-pointer'

function SaveButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="px-5 py-2 rounded-[9px] text-sm font-semibold text-white transition-colors disabled:opacity-60"
      style={{ background: '#1A6FC4' }}
    >
      {loading ? 'Guardando…' : 'Guardar cambios'}
    </button>
  )
}

function StatusMsg({ type, msg }: { type: 'success' | 'error'; msg: string }) {
  return (
    <p className="text-sm font-medium mt-3" style={{ color: type === 'success' ? '#0ABFBC' : '#E05C5C' }}>
      {msg}
    </p>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0"
        style={{ background: checked ? '#0ABFBC' : '#D6E4F0' }}
      >
        <div
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? 'translateX(22px)' : 'translateX(2px)' }}
        />
      </div>
      <span className="text-sm text-ink">{label}</span>
    </label>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConfiguracionPage() {
  // ── Profile state ──────────────────────────────────────────────────────────
  const [fullName, setFullName] = useState('Alberto Enrique Gorona')
  const [email] = useState('synkrise.business@gmail.com')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileStatus, setProfileStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // ── Password state ─────────────────────────────────────────────────────────
  const [showPwdForm, setShowPwdForm] = useState(false)
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdStatus, setPwdStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // ── Company state ──────────────────────────────────────────────────────────
  const [company, setCompany] = useState('Synkrise')
  const [industry, setIndustry] = useState('Retail · Comercio')
  const [currency, setCurrency] = useState('USD')
  const [companyLoading, setCompanyLoading] = useState(false)
  const [companyStatus, setCompanyStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // ── Preferences state ──────────────────────────────────────────────────────
  const [prefs, setPrefs] = useState<DashboardPrefs>({ defaultPeriod: 'month', showGoals: true, emailAlerts: true })
  const [prefsLoading, setPrefsLoading] = useState(false)
  const [prefsStatus, setPrefsStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // ── Load user data ─────────────────────────────────────────────────────────
  useEffect(() => {
    setPrefs(readPrefs())
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      const meta = user.user_metadata as Record<string, string> | undefined
      if (meta?.full_name) setFullName(meta.full_name)
      if (meta?.company) setCompany(meta.company)
      if (meta?.industry) setIndustry(meta.industry)
      if (meta?.currency) setCurrency(meta.currency)
    })
  }, [])

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleSaveProfile() {
    setProfileLoading(true)
    setProfileStatus(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } })
    setProfileLoading(false)
    setProfileStatus(error ? { type: 'error', msg: 'Error al guardar. Intenta de nuevo.' } : { type: 'success', msg: 'Perfil actualizado correctamente.' })
  }

  async function handleChangePassword() {
    if (newPwd !== confirmPwd) { setPwdStatus({ type: 'error', msg: 'Las contraseñas no coinciden.' }); return }
    if (newPwd.length < 8) { setPwdStatus({ type: 'error', msg: 'La contraseña debe tener al menos 8 caracteres.' }); return }
    setPwdLoading(true)
    setPwdStatus(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPwd })
    setPwdLoading(false)
    if (error) {
      setPwdStatus({ type: 'error', msg: 'Error al cambiar la contraseña. Verifica la contraseña actual.' })
    } else {
      setPwdStatus({ type: 'success', msg: 'Contraseña actualizada correctamente.' })
      setShowPwdForm(false)
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
    }
  }

  async function handleSaveCompany() {
    setCompanyLoading(true)
    setCompanyStatus(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ data: { company, industry, currency } })
    setCompanyLoading(false)
    setCompanyStatus(error ? { type: 'error', msg: 'Error al guardar. Intenta de nuevo.' } : { type: 'success', msg: 'Datos de empresa actualizados.' })
  }

  function handleSavePrefs() {
    setPrefsLoading(true)
    setPrefsStatus(null)
    savePrefs(prefs)
    setTimeout(() => {
      setPrefsLoading(false)
      setPrefsStatus({ type: 'success', msg: 'Preferencias guardadas.' })
    }, 400)
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-sora text-[22px] font-bold text-ink tracking-tight">Configuración</h1>
        <p className="text-slate text-sm mt-0.5">Administra tu perfil, empresa y preferencias del dashboard.</p>
      </div>

      {/* ── SECCIÓN A: Perfil ───────────────────────────────────────────────── */}
      <SectionCard title="Perfil de usuario">
        <Field label="Nombre completo">
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputClass}
            placeholder="Tu nombre completo"
          />
        </Field>
        <Field label="Correo electrónico" note="Para cambiar tu correo, contacta soporte.">
          <input type="email" value={email} disabled className={inputClass} />
        </Field>

        <div className="mb-5">
          <p className="text-sm font-medium text-ink mb-2">Contraseña</p>
          {!showPwdForm ? (
            <button
              onClick={() => setShowPwdForm(true)}
              className="px-4 py-2 rounded-[9px] text-sm font-medium border border-synk-border text-ink hover:bg-surface transition-colors"
            >
              Cambiar contraseña
            </button>
          ) : (
            <div className="space-y-3 p-4 rounded-[10px] bg-surface border border-synk-border">
              <input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} placeholder="Contraseña actual" className={inputClass} />
              <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="Nueva contraseña" className={inputClass} />
              <input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} placeholder="Confirmar nueva contraseña" className={inputClass} />
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleChangePassword}
                  disabled={pwdLoading}
                  className="px-4 py-2 rounded-[9px] text-sm font-semibold text-white disabled:opacity-60 transition-colors"
                  style={{ background: '#1A6FC4' }}
                >
                  {pwdLoading ? 'Guardando…' : 'Actualizar contraseña'}
                </button>
                <button
                  onClick={() => { setShowPwdForm(false); setPwdStatus(null) }}
                  className="text-sm text-slate hover:text-ink transition-colors"
                >
                  Cancelar
                </button>
              </div>
              {pwdStatus && <StatusMsg {...pwdStatus} />}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <SaveButton loading={profileLoading} onClick={handleSaveProfile} />
          {profileStatus && <StatusMsg {...profileStatus} />}
        </div>
      </SectionCard>

      {/* ── SECCIÓN B: Empresa ──────────────────────────────────────────────── */}
      <SectionCard title="Datos de la empresa">
        <Field label="Nombre de la empresa">
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className={inputClass}
            placeholder="Nombre de tu empresa"
          />
        </Field>
        <Field label="Industria">
          <select value={industry} onChange={(e) => setIndustry(e.target.value)} className={selectClass}>
            <option>Retail · Comercio</option>
            <option>Restaurantes</option>
            <option>Logística</option>
            <option>Salud</option>
            <option>Servicios</option>
            <option>Otro</option>
          </select>
        </Field>
        <Field label="Moneda principal">
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={selectClass}>
            <option value="USD">USD — Dólar estadounidense</option>
            <option value="PAB">PAB — Balboa panameño</option>
          </select>
        </Field>
        <Field label="País" note="El país no es editable por ahora.">
          <input type="text" value="Panamá" disabled className={inputClass} />
        </Field>

        <div className="flex items-center gap-4">
          <SaveButton loading={companyLoading} onClick={handleSaveCompany} />
          {companyStatus && <StatusMsg {...companyStatus} />}
        </div>
      </SectionCard>

      {/* ── SECCIÓN C: Preferencias ─────────────────────────────────────────── */}
      <SectionCard title="Preferencias del Dashboard">
        <Field label="Período por defecto al entrar">
          <select
            value={prefs.defaultPeriod}
            onChange={(e) => setPrefs({ ...prefs, defaultPeriod: e.target.value as DashboardPrefs['defaultPeriod'] })}
            className={selectClass}
          >
            <option value="week">Semana</option>
            <option value="month">Mes</option>
            <option value="year">Año</option>
          </select>
        </Field>

        <div className="space-y-4 mb-6">
          <Toggle
            checked={prefs.showGoals}
            onChange={(v) => setPrefs({ ...prefs, showGoals: v })}
            label="Mostrar objetivos en KPI cards"
          />
          <Toggle
            checked={prefs.emailAlerts}
            onChange={(v) => setPrefs({ ...prefs, emailAlerts: v })}
            label="Recibir alertas por email cuando un KPI esté en estado Crítico"
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSavePrefs}
            disabled={prefsLoading}
            className="px-5 py-2 rounded-[9px] text-sm font-semibold text-white transition-colors disabled:opacity-60"
            style={{ background: '#1A6FC4' }}
          >
            {prefsLoading ? 'Guardando…' : 'Guardar preferencias'}
          </button>
          {prefsStatus && <StatusMsg {...prefsStatus} />}
        </div>
      </SectionCard>
    </div>
  )
}
