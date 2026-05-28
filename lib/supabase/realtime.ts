import { getSupabaseClient } from './client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function subscribeToProject(
  projectId: string,
  onEvent: (event: string, payload: Record<string, unknown>) => void
): RealtimeChannel {
  const supabase = getSupabaseClient()

  const channel = supabase
    .channel(`project:${projectId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'scenes', filter: `project_id=eq.${projectId}` },
      (payload) => onEvent('scene_change', payload as Record<string, unknown>))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'topics', filter: `project_id=eq.${projectId}` },
      (payload) => onEvent('topic_change', payload as Record<string, unknown>))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${projectId}` },
      (payload) => onEvent('task_change', payload as Record<string, unknown>))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs', filter: `project_id=eq.${projectId}` },
      (payload) => onEvent('activity', payload as Record<string, unknown>))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `project_id=eq.${projectId}` },
      (payload) => onEvent('comment', payload as Record<string, unknown>))
    .subscribe()

  return channel
}

export function subscribeToPresence(
  projectId: string,
  userId: string,
  userInfo: { full_name: string; avatar_url?: string },
  onSync: (users: Record<string, unknown>[]) => void
): RealtimeChannel {
  const supabase = getSupabaseClient()

  const channel = supabase.channel(`presence:${projectId}`, {
    config: { presence: { key: userId } },
  })

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      const users = Object.values(state).flat() as Record<string, unknown>[]
      onSync(users)
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          clerk_id: userId,
          full_name: userInfo.full_name,
          avatar_url: userInfo.avatar_url,
          online_at: new Date().toISOString(),
        })
      }
    })

  return channel
}

export async function unsubscribe(channel: RealtimeChannel) {
  const supabase = getSupabaseClient()
  await supabase.removeChannel(channel)
}
