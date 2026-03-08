import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'

async function getAuthenticatedAdmin(service: ReturnType<typeof createServiceClient>, userId: string) {
  const { data } = await service.from('admins').select('id, email, role').eq('id', userId).single()
  return data
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()
    const admin = await getAuthenticatedAdmin(service, user.id)
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { status, notes } = body

    // Fetch old data for audit
    const { data: oldInquiry } = await service.from('inquiries').select('*').eq('id', id).single()
    if (!oldInquiry) return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })

    const updates: Record<string, unknown> = {}
    if (status) updates.status = status
    if (notes !== undefined) updates.notes = notes

    const { data: inquiry, error } = await service
      .from('inquiries')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    await service.from('audit_logs').insert({
      admin_id: admin.id,
      admin_email: admin.email,
      action: 'UPDATE_INQUIRY_STATUS',
      table_name: 'inquiries',
      record_id: id,
      old_data: { status: oldInquiry.status, notes: oldInquiry.notes },
      new_data: updates,
    })

    return NextResponse.json({ inquiry })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
