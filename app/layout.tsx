import type { Metadata } from 'next'
import { Sora, DM_Sans } from 'next/font/google'
import './globals.css'
import { AIFloatingButton } from '@/components/AIFloatingButton'
import { ChartHoverTooltip } from '@/components/ChartHoverTooltip'
import { HoverProvider } from '@/lib/hover-context'

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Synkrise — Business Intelligence para PYMEs',
  description: 'Visualiza tus KPIs, dashboards operacionales e indicadores de negocio sin necesidad de conocimiento técnico.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${sora.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface">
        <HoverProvider>
          {children}
          <AIFloatingButton />
          <ChartHoverTooltip />
        </HoverProvider>
      </body>
    </html>
  )
}
