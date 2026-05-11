import { Navbar } from '@/components/marketing/Navbar'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      <div className="flex flex-col min-h-screen">{children}</div>
    </>
  )
}
