import { createServiceRoleClient } from '@/lib/supabase/server'

interface LogActivityParams {
  projectId: string
  clerkId?: string
  userName?: string
  userAvatar?: string
  action: string
  entityType?: string
  entityId?: string
  entityTitle?: string
  metadata?: Record<string, unknown>
}

export async function logActivity(params: LogActivityParams) {
  try {
    const supabase = createServiceRoleClient()
    await supabase.from('activity_logs').insert({
      project_id: params.projectId,
      clerk_id: params.clerkId,
      user_name: params.userName,
      user_avatar: params.userAvatar,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId,
      entity_title: params.entityTitle,
      metadata: params.metadata || {},
    })
  } catch (error) {
    console.error('Failed to log activity:', error)
  }
}

export function buildActivityMessage(log: {
  user_name: string | null
  action: string
  entity_title: string | null
  entity_type: string | null
}): string {
  const user = log.user_name || 'Someone'
  const entity = log.entity_title ? `"${log.entity_title}"` : 'an item'

  const messages: Record<string, string> = {
    scene_completed: `${user} completed scene ${entity}`,
    scene_approved: `${user} approved scene ${entity}`,
    scene_rejected: `${user} rejected scene ${entity}`,
    scene_revision_requested: `${user} requested revision on ${entity}`,
    scene_created: `${user} created scene ${entity}`,
    scene_deleted: `${user} deleted scene ${entity}`,
    scene_status_changed: `${user} updated status of ${entity}`,
    scene_progress_changed: `${user} updated progress on ${entity}`,
    topic_created: `${user} added topic ${entity}`,
    topic_deleted: `${user} removed topic ${entity}`,
    topic_renamed: `${user} renamed topic to ${entity}`,
    task_completed: `${user} completed task ${entity}`,
    task_created: `${user} added task ${entity}`,
    comment_added: `${user} commented on ${entity}`,
    project_published: `${user} published the project`,
    member_added: `${user} was added to the project`,
  }

  return messages[log.action] || `${user} performed ${log.action}`
}
