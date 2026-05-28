import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/utils/activity'
import type { AIGeneratedStructure } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { projectId, structure }: { projectId: string; structure: AIGeneratedStructure } = body

    if (!projectId || !structure) {
      return NextResponse.json({ error: 'Missing projectId or structure' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // Update project with final structure and mark as published
    await supabase
      .from('projects')
      .update({
        title: structure.project_title,
        description: structure.description,
        ai_generated_structure: structure,
        is_published: true,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .eq('created_by', userId)

    // Create topics and scenes from approved structure
    for (let ti = 0; ti < structure.topics.length; ti++) {
      const topicData = structure.topics[ti]

      const { data: topic } = await supabase
        .from('topics')
        .insert({
          project_id: projectId,
          title: topicData.title,
          description: topicData.description,
          sort_order: ti,
          color: ['#6366f1','#8b5cf6','#ec4899','#f43f5e','#f97316','#22c55e','#14b8a6','#0ea5e9'][ti % 8],
        })
        .select()
        .single()

      if (!topic) continue

      for (let si = 0; si < topicData.scenes.length; si++) {
        const sceneData = topicData.scenes[si]

        const { data: scene } = await supabase
          .from('scenes')
          .insert({
            topic_id: topic.id,
            project_id: projectId,
            title: sceneData.title,
            description: sceneData.description,
            script_text: sceneData.script_text,
            sort_order: si,
            status: 'not_started',
            progress: 0,
          })
          .select()
          .single()

        if (!scene) continue

        // Create suggested tasks
        for (let ki = 0; ki < (sceneData.suggested_tasks || []).length; ki++) {
          await supabase.from('tasks').insert({
            scene_id: scene.id,
            project_id: projectId,
            title: sceneData.suggested_tasks[ki],
            status: 'todo',
            sort_order: ki,
          })
        }
      }
    }

    // Add creator as admin member
    await supabase.from('project_members').upsert({
      project_id: projectId,
      clerk_id: userId,
      role: 'admin',
    })

    await logActivity({
      projectId,
      clerkId: userId,
      action: 'project_published',
      entityType: 'project',
      entityId: projectId,
      entityTitle: structure.project_title,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Publish error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
