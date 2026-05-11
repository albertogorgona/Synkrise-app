'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { logout } from '@/app/auth/actions'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/dashboard/ventas', label: 'Ventas', icon: '↑' },
  { href: '/dashboard/inventario', label: 'Inventario', icon: '◫' },
  { href: '/dashboard/clientes', label: 'Clientes', icon: '◎' },
] as const

const NAV_REPORTES = [
  { href: '/dashboard/financiero', label: 'Financiero', icon: '$' },
  { href: '/dashboard/kpis', label: 'KPIs', icon: '◈' },
]

const NAV_DATOS = [
  { href: '/dashboard/datos', label: 'Datos', icon: '⊕' },
]

const NAV_SISTEMA = [
  { href: '/dashboard/configuracion', label: 'Configuración', icon: '⚙' },
]

interface SidebarProps {
  userFullName?: string
  userEmail?: string
}

export function Sidebar({ userFullName = 'Usuario', userEmail = '' }: SidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const labelClass = `relative text-sm font-medium whitespace-nowrap ${!isOpen ? 'hidden md:inline' : ''}`

  const initials = userFullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  async function handleLogout() {
    setLoggingOut(true)
    await logout()
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 md:static md:z-auto md:inset-auto',
          'min-h-screen flex flex-col flex-shrink-0 overflow-hidden',
          'transition-[width] duration-[250ms] ease-[cubic-bezier(0,0,0.2,1)]',
          isOpen ? 'w-[220px]' : 'w-12 md:w-[220px]',
        ].join(' ')}
        style={{ background: 'linear-gradient(180deg, #0A2040 0%, #0F2D52 100%)' }}
      >
        {/* Logo / toggle */}
        <div className="px-[9px] md:px-5 py-6 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex-shrink-0 focus:outline-none md:cursor-default"
            aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            <svg width="30" height="30" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="9" fill="#1A6FC4" />
              <path
                d="M10 22 L16 14 L20 18 L24 12"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="26" cy="12" r="2.5" fill="#0ABFBC" />
              <path
                d="M10 26 H26"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <span
            className={`text-white font-bold text-lg tracking-tight whitespace-nowrap ${!isOpen ? 'hidden md:inline' : ''}`}
            style={{ fontFamily: 'var(--font-sora), Sora, sans-serif' }}
          >
            Synkrise
          </span>
        </div>

        <nav className="flex-1 px-[6px] md:px-3 space-y-1 overflow-hidden">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                <div
                  className="relative flex items-center gap-3 px-2 md:px-3 py-2.5 rounded-[9px] cursor-pointer"
                  style={{ color: isActive ? 'white' : 'rgba(255,255,255,0.6)' }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-[9px]"
                      style={{
                        background: 'rgba(26, 111, 196, 0.35)',
                        borderLeft: '2px solid #1A6FC4',
                      }}
                      transition={{ duration: 0.15, ease: [0.0, 0.0, 0.2, 1] }}
                    />
                  )}
                  <span className="relative text-base w-5 text-center flex-shrink-0">
                    {item.icon}
                  </span>
                  <span className={labelClass}>{item.label}</span>
                </div>
              </Link>
            )
          })}

          <div className={`pt-4 pb-1 px-3 ${!isOpen ? 'hidden md:block' : ''}`}>
            <span
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              Reportes
            </span>
          </div>

          {NAV_REPORTES.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                <div
                  className="relative flex items-center gap-3 px-2 md:px-3 py-2.5 rounded-[9px] cursor-pointer"
                  style={{ color: isActive ? 'white' : 'rgba(255,255,255,0.6)' }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-[9px]"
                      style={{
                        background: 'rgba(26, 111, 196, 0.35)',
                        borderLeft: '2px solid #1A6FC4',
                      }}
                      transition={{ duration: 0.15, ease: [0.0, 0.0, 0.2, 1] }}
                    />
                  )}
                  <span className="relative text-base w-5 text-center flex-shrink-0">
                    {item.icon}
                  </span>
                  <span className={labelClass}>{item.label}</span>
                </div>
              </Link>
            )
          })}

          <div className={`pt-4 pb-1 px-3 ${!isOpen ? 'hidden md:block' : ''}`}>
            <span
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              Datos
            </span>
          </div>

          {NAV_DATOS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                <div
                  className="relative flex items-center gap-3 px-2 md:px-3 py-2.5 rounded-[9px] cursor-pointer"
                  style={{ color: isActive ? 'white' : 'rgba(255,255,255,0.6)' }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-[9px]"
                      style={{
                        background: 'rgba(26, 111, 196, 0.35)',
                        borderLeft: '2px solid #1A6FC4',
                      }}
                      transition={{ duration: 0.15, ease: [0.0, 0.0, 0.2, 1] }}
                    />
                  )}
                  <span className="relative text-base w-5 text-center flex-shrink-0">
                    {item.icon}
                  </span>
                  <span className={labelClass}>{item.label}</span>
                </div>
              </Link>
            )
          })}

          <div className={`pt-4 pb-1 px-3 ${!isOpen ? 'hidden md:block' : ''}`}>
            <span
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              Sistema
            </span>
          </div>

          {NAV_SISTEMA.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                <div
                  className="relative flex items-center gap-3 px-2 md:px-3 py-2.5 rounded-[9px] cursor-pointer"
                  style={{ color: isActive ? 'white' : 'rgba(255,255,255,0.6)' }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-[9px]"
                      style={{
                        background: 'rgba(26, 111, 196, 0.35)',
                        borderLeft: '2px solid #1A6FC4',
                      }}
                      transition={{ duration: 0.15, ease: [0.0, 0.0, 0.2, 1] }}
                    />
                  )}
                  <span className="relative text-base w-5 text-center flex-shrink-0">
                    {item.icon}
                  </span>
                  <span className={labelClass}>{item.label}</span>
                </div>
              </Link>
            )
          })}
        </nav>

        {/* User footer + logout */}
        <div
          className={`px-4 py-4 border-t ${!isOpen ? 'hidden md:block' : ''}`}
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: '#1A6FC4' }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{userFullName}</p>
              <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {userEmail}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-[9px] text-xs font-medium transition-colors disabled:opacity-50"
            style={{ color: 'rgba(255,255,255,0.5)' }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(224,92,92,0.15)'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#E05C5C'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)'
            }}
          >
            <span>⎋</span>
            <span>{loggingOut ? 'Cerrando...' : 'Cerrar sesión'}</span>
          </button>
        </div>
      </aside>
    </>
  )
}
