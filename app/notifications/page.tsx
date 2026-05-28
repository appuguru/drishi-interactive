import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { Bell, CheckCircle } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

export default async function NotificationsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = createServiceRoleClient()
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('clerk_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Bell className="w-6 h-6 text-brand-500" />Notifications
        </h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {notifications?.filter(n => !n.is_read).length || 0} unread
        </span>
      </div>

      {(!notifications || notifications.length === 0) ? (
        <div className="card p-12 text-center">
          <Bell className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div key={n.id} className={`card p-4 flex gap-4 ${!n.is_read ? 'border-brand-200 dark:border-brand-800/50 bg-brand-50/30 dark:bg-brand-900/10' : ''}`}>
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!n.is_read ? 'bg-brand-500' : 'bg-transparent'}`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</p>
                {n.message && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</p>}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatRelativeTime(n.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
