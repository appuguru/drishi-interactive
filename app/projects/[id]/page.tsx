import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { ProjectDashboardClient } from '@/components/projects/project-dashboard-client'
import type { Project, Topic } from '@/types'

async function getProject(id: string, userId: string) {
  const supabase = createServiceRoleClient()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (!project) return null

  const { data: topics } = await supabase
    .from('topics')
    .select(`*, scenes(*, tasks(*), scene_assignments(*))`)
    .eq('project_id', id)
    .eq('is_archived', false)
    .order('sort_order', { ascending: true })

  const { data: members } = await supabase
    .from('project_members')
    .select('*')
    .eq('project_id', id)

  const { data: activity } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false })
    .limit(50)

  return { project, topics: topics || [], members: members || [], activity: activity || [] }
}

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const data = await getProject(params.id, userId)
  if (!data) notFound()

  const { project, topics, members, activity } = data

  if (!project.is_published) {
    redirect(`/projects/${params.id}/review`)
  }

  return (
    <ProjectDashboardClient
      project={project as Project}
      initialTopics={topics as Topic[]}
      initialMembers={members}
      initialActivity={activity}
      currentUserId={userId}
    />
  )
}
