import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/utils/activity'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServiceRoleClient()
    const { data } = await supabase
      .from('scenes')
      .select('*, tasks(*), scene_assignments(*)')
      .eq('topic_id', params.id)
      .eq('is_archived', false)
      .order('sort_order', { ascending: true })
    return NextResponse.json(data || [])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const supabase = createServiceRoleClient()

    // Get topic to find project_id
    const { data: topic } = await supabase.from('topics').select('project_id').eq('id', params.id).single()
    if (!topic) return NextResponse.json({ error: 'Topic not found' }, { status: 404 })

    const { data: lastScene } = await supabase
      .from('scenes')
      .select('sort_order')
      .eq('topic_id', params.id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const { data, error } = await supabase
      .from('scenes')
      .insert({
        topic_id: params.id,
        project_id: topic.project_id,
        title: body.title || 'New Scene',
        description: body.description || '',
        status: 'not_started',
        progress: 0,
        sort_order: (lastScene?.sort_order ?? -1) + 1,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await logActivity({
      projectId: topic.project_id,
      clerkId: userId,
      action: 'scene_created',
      entityType: 'scene',
      entityId: data.id,
      entityTitle: data.title,
    })

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
