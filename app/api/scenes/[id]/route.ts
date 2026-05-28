import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/utils/activity'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const supabase = createServiceRoleClient()

    // Get old scene for activity log
    const { data: oldScene } = await supabase.from('scenes').select('*').eq('id', params.id).single()

    const { data, error } = await supabase
      .from('scenes')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Log specific actions
    if (body.status && oldScene?.status !== body.status) {
      await logActivity({
        projectId: data.project_id,
        clerkId: userId,
        action: body.status === 'completed' ? 'scene_completed' : 'scene_status_changed',
        entityType: 'scene',
        entityId: data.id,
        entityTitle: data.title,
        metadata: { old_status: oldScene?.status, new_status: body.status },
      })
    }
    if (body.progress !== undefined && oldScene?.progress !== body.progress) {
      await logActivity({
        projectId: data.project_id,
        clerkId: userId,
        action: 'scene_progress_changed',
        entityType: 'scene',
        entityId: data.id,
        entityTitle: data.title,
        metadata: { old_progress: oldScene?.progress, new_progress: body.progress },
      })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createServiceRoleClient()
    const { data: scene } = await supabase.from('scenes').select('*').eq('id', params.id).single()

    await supabase.from('scenes').delete().eq('id', params.id)

    if (scene) {
      await logActivity({
        projectId: scene.project_id,
        clerkId: userId,
        action: 'scene_deleted',
        entityType: 'scene',
        entityTitle: scene.title,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
