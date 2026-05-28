import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase =
      createServiceRoleClient()

    const { data, error } =
      await supabase
        .from('projects')
        .select(`
          *,
          topics (
            *,
            scenes (
              *
            )
          )
        `)
        .eq('id', params.id)
        .single()

    if (error || !data) {
      return NextResponse.json(
        {
          error:
            'Project not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error(
      'GET PROJECT ERROR:',
      error
    )

    return NextResponse.json(
      {
        error:
          error.message ||
          'Server error',
      },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()

    const supabase =
      createServiceRoleClient()

    const { data, error } =
      await supabase
        .from('projects')
        .update({
          ...body,
          updated_at:
            new Date().toISOString(),
        })
        .eq('id', params.id)
        .eq('created_by', userId)
        .select()
        .single()

    if (error || !data) {
      return NextResponse.json(
        {
          error:
            error?.message ||
            'Failed to update project',
        },
        { status: 400 }
      )
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error(
      'PATCH PROJECT ERROR:',
      error
    )

    return NextResponse.json(
      {
        error:
          error.message ||
          'Server error',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase =
      createServiceRoleClient()

    // DELETE TASKS
    await supabase
      .from('tasks')
      .delete()
      .eq('project_id', params.id)

    // DELETE SCENES
    await supabase
      .from('scenes')
      .delete()
      .eq('project_id', params.id)

    // DELETE TOPICS
    await supabase
      .from('topics')
      .delete()
      .eq('project_id', params.id)

    // DELETE MEMBERS
    await supabase
      .from('project_members')
      .delete()
      .eq('project_id', params.id)

    // DELETE ACTIVITY LOGS
    await supabase
      .from('activity_logs')
      .delete()
      .eq('project_id', params.id)

    // DELETE PROJECT
    const { error } =
      await supabase
        .from('projects')
        .delete()
        .eq('id', params.id)
        .eq('created_by', userId)

    if (error) {
      return NextResponse.json(
        {
          error:
            error.message ||
            'Failed to delete project',
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error(
      'DELETE PROJECT ERROR:',
      error
    )

    return NextResponse.json(
      {
        error:
          error.message ||
          'Server error',
      },
      { status: 500 }
    )
  }
}