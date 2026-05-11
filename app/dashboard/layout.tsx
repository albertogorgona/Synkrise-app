import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const fullName =
    (user.user_metadata?.full_name as string | undefined) ?? user.email ?? 'Usuario'

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar userFullName={fullName} userEmail={user.email ?? ''} />
      <main className="flex-1 overflow-y-auto pl-12 md:pl-0">
        <div className="p-4 md:p-8 max-w-[1400px] mx-auto">{children}</div>
      </main>
    </div>
  )
}
