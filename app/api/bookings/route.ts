import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'
import { sendWhatsAppNotification, buildBookingNotification } from '@/lib/whatsapp'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()
    const { data: admin } = await service.from('admins').select('id').eq('id', user.id).single()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: bookings, error } = await service
      .from('bookings')
      .select('*, inquiry:inquiries(id, name, whatsapp, referral_source)')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ bookings })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
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
    const {
      inquiry_id,
      client_name,
      whatsapp,
      source,
      booking_date,
      tattoo_description,
      deposit_amount,
      notes,
    } = body

    if (!client_name || !whatsapp) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: booking, error } = await service
      .from('bookings')
      .insert({
        inquiry_id: inquiry_id || null,
        client_name,
        whatsapp,
        source: source || null,
        booking_date: booking_date || null,
        tattoo_description: tattoo_description || null,
        deposit_amount: deposit_amount || null,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) throw error

    await service.from('audit_logs').insert({
      admin_id: admin.id,
      admin_email: admin.email,
      action: 'CREATE_BOOKING',
      table_name: 'bookings',
      record_id: booking.id,
      new_data: booking,
    })

    // Send WhatsApp notification
    const message = buildBookingNotification({
      client_name,
      whatsapp,
      booking_date,
      tattoo_description,
      deposit_amount,
    })
    sendWhatsAppNotification(message).catch(console.error)

    return NextResponse.json({ booking }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
