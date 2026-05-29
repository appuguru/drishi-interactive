import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { token: string; id: string } }
) {
  try {
    const supabase = createServiceRoleClient()

    const { data: project } = await supabase
      .from('projects')
      .select('id, share_mode')
      .eq('share_token', params.token)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Invalid share link' }, { status: 403 })
    }

    if (!['edit', 'admin'].includes(project.share_mode)) {
      return NextResponse.json({ error: 'This link is view-only' }, { status: 403 })
    }

    const body = await req.json()

    const { data, error } = await supabase
      .from('scenes')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('project_id', project.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await supabase.from('activity_logs').insert({
      project_id: project.id,
      user_name: 'Collaborator',
      action: body.status ? 'scene_status_changed' : 'scene_progress_changed',
      entity_type: 'scene',
      entity_id: data.id,
      entity_title: data.title,
      metadata: body,
    })

    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}