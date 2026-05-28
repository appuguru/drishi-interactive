import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/utils/activity'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServiceRoleClient()
    const { data } = await supabase
      .from('topics')
      .select(`*, scenes(*, tasks(*), scene_assignments(*))`)
      .eq('project_id', params.id)
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

    const { data: lastTopic } = await supabase
      .from('topics')
      .select('sort_order')
      .eq('project_id', params.id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const { data, error } = await supabase
      .from('topics')
      .insert({
        project_id: params.id,
        title: body.title || 'New Topic',
        description: body.description || '',
        color: body.color || '#6366f1',
        sort_order: (lastTopic?.sort_order ?? -1) + 1,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await logActivity({
      projectId: params.id,
      clerkId: userId,
      action: 'topic_created',
      entityType: 'topic',
      entityId: data.id,
      entityTitle: data.title,
    })

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
