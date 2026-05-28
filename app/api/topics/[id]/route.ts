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

    const { data, error } = await supabase
      .from('topics')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    if (body.title) {
      await logActivity({
        projectId: data.project_id,
        clerkId: userId,
        action: 'topic_renamed',
        entityType: 'topic',
        entityId: data.id,
        entityTitle: data.title,
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
    const { data: topic } = await supabase.from('topics').select('*').eq('id', params.id).single()
    await supabase.from('topics').delete().eq('id', params.id)

    if (topic) {
      await logActivity({
        projectId: topic.project_id,
        clerkId: userId,
        action: 'topic_deleted',
        entityType: 'topic',
        entityTitle: topic.title,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
