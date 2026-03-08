import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'

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
    const { data: admin } = await service
      .from('admins')
      .select('id, email')
      .eq('id', user.id)
      .single()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { booking_status, notes, booking_date, deposit_amount, total_amount, tattoo_description } = body

    const { data: oldBooking } = await service.from('bookings').select('*').eq('id', id).single()
    if (!oldBooking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    const updates: Record<string, unknown> = {}
    if (booking_status) updates.booking_status = booking_status
    if (notes !== undefined) updates.notes = notes
    if (booking_date !== undefined) updates.booking_date = booking_date
    if (deposit_amount !== undefined) updates.deposit_amount = deposit_amount
    if (total_amount !== undefined) updates.total_amount = total_amount
    if (tattoo_description !== undefined) updates.tattoo_description = tattoo_description

    const { data: booking, error } = await service
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    await service.from('audit_logs').insert({
      admin_id: admin.id,
      admin_email: admin.email,
      action: 'UPDATE_BOOKING_STATUS',
      table_name: 'bookings',
      record_id: id,
      old_data: { booking_status: oldBooking.booking_status },
      new_data: updates,
    })

    return NextResponse.json({ booking })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
