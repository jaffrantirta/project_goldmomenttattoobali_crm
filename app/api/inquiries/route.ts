import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { sendWhatsAppNotification, sendWhatsAppGroupNotification, buildInquiryNotification, buildInquiryGroupNotification } from '@/lib/whatsapp'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()
    const { data: admin } = await service
      .from('admins')
      .select('id')
      .eq('id', user.id)
      .single()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: inquiries, error } = await service
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ inquiries })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, whatsapp, referral_source } = body

    if (!name || !whatsapp || !referral_source) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const validSources = ['google', 'instagram', 'friend', 'tour_guide']
    if (!validSources.includes(referral_source)) {
      return NextResponse.json({ error: 'Invalid referral source' }, { status: 400 })
    }

    const service = createServiceClient()

    const { data: inquiry, error } = await service
      .from('inquiries')
      .insert({ name, whatsapp, referral_source })
      .select()
      .single()

    if (error) throw error

    // Log to audit table (system action — no admin_id)
    await service.from('audit_logs').insert({
      admin_id: null,
      admin_email: 'public_form',
      action: 'CREATE_INQUIRY',
      table_name: 'inquiries',
      record_id: inquiry.id,
      new_data: { name, whatsapp, referral_source },
    })

    // Send WhatsApp notifications (non-blocking)
    const message = buildInquiryNotification({ name, whatsapp, referral_source })
    sendWhatsAppNotification(message).catch(console.error)

    const groupMessage = buildInquiryGroupNotification({ name, whatsapp, referral_source })
    sendWhatsAppGroupNotification(groupMessage).catch(console.error)

    return NextResponse.json({ inquiry }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
