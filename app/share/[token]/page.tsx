import { notFound } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { PublicProjectView } from '@/components/sharing/public-project-view'
import type { Project, Topic } from '@/types'

export default async function SharePage({ params }: { params: { token: string } }) {
  const supabase = createServiceRoleClient()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('share_token', params.token)
    .neq('share_mode', 'private')
    .single()

  if (!project) notFound()

  const { data: topics } = await supabase
    .from('topics')
    .select('*, scenes(*, tasks(*), scene_assignments(*))')
    .eq('project_id', project.id)
    .eq('is_archived', false)
    .order('sort_order', { ascending: true })

  const { data: activity } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false })
    .limit(30)

  return (
    <PublicProjectView
      project={project as Project}
      topics={(topics || []) as Topic[]}
      activity={activity || []}
      shareMode={project.share_mode}
      shareToken={params.token}  // FIX: pass token so client can make edit API calls
    />
  )
}