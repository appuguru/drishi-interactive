import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import type { Project } from '@/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = createServiceRoleClient()
  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, status, slug')
    .eq('created_by', userId)
    .order('updated_at', { ascending: false })
    .limit(20)

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar projects={(projects as Project[]) || []} />
      <main className="flex-1 ml-64 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
