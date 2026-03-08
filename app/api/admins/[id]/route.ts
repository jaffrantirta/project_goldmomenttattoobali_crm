import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()
    const { data: currentAdmin } = await service
      .from('admins')
      .select('id, email, role')
      .eq('id', user.id)
      .single()

    if (!currentAdmin || currentAdmin.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admins can remove admins' }, { status: 403 })
    }

    if (id === currentAdmin.id) {
      return NextResponse.json({ error: 'You cannot remove yourself' }, { status: 400 })
    }

    const { data: targetAdmin } = await service
      .from('admins')
      .select('id, email, name')
      .eq('id', id)
      .single()

    if (!targetAdmin) return NextResponse.json({ error: 'Admin not found' }, { status: 404 })

    // Delete from admins table (cascades via auth FK)
    const { error: deleteError } = await service.from('admins').delete().eq('id', id)
    if (deleteError) throw deleteError

    // Also delete from Supabase Auth
    await service.auth.admin.deleteUser(id)

    await service.from('audit_logs').insert({
      admin_id: currentAdmin.id,
      admin_email: currentAdmin.email,
      action: 'DELETE_ADMIN',
      table_name: 'admins',
      record_id: id,
      old_data: { email: targetAdmin.email, name: targetAdmin.name },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
