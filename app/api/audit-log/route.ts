import { NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()
    const { data: admin } = await service.from('admins').select('id, role').eq('id', user.id).single()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (admin.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: logs, error } = await service
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) throw error
    return NextResponse.json({ logs })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
