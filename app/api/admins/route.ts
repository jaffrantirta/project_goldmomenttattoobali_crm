import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()
    const { data: currentAdmin } = await service
      .from('admins')
      .select('id, email, name, role')
      .eq('id', user.id)
      .single()
    if (!currentAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: admins, error } = await service
      .from('admins')
      .select('id, email, name, role, created_at, created_by')
      .order('created_at', { ascending: true })

    if (error) throw error
    return NextResponse.json({ admins, currentUser: currentAdmin })
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
    const { data: currentAdmin } = await service
      .from('admins')
      .select('id, email, role')
      .eq('id', user.id)
      .single()

    if (!currentAdmin || currentAdmin.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admins can create admin users' }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, password, role } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const validRoles = ['admin', 'super_admin']
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Create Supabase Auth user via admin API
    const { data: authData, error: authError } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || 'Failed to create auth user' },
        { status: 400 }
      )
    }

    const { data: admin, error: adminError } = await service
      .from('admins')
      .insert({
        id: authData.user.id,
        email,
        name,
        role: role || 'admin',
        created_by: currentAdmin.id,
      })
      .select()
      .single()

    if (adminError) {
      // Rollback auth user if admin insert fails
      await service.auth.admin.deleteUser(authData.user.id)
      throw adminError
    }

    await service.from('audit_logs').insert({
      admin_id: currentAdmin.id,
      admin_email: currentAdmin.email,
      action: 'CREATE_ADMIN',
      table_name: 'admins',
      record_id: admin.id,
      new_data: { email, name, role: role || 'admin' },
    })

    return NextResponse.json({ admin }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
