import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth/admin'

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const { isAdmin, error: authError } = await checkAdminAuth()
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: authError || 'Admin access required' },
        { status: authError === 'Unauthorized' ? 401 : 403 }
      )
    }
    
    const supabase = createClient()
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query with user info from auth.users table
    let query = supabase
      .from('searches')
      .select(`
        *,
        users:user_id (
          id,
          email,
          raw_user_meta_data
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: searches, error: searchesError } = await query

    if (searchesError) {
      console.error('Error fetching search tickets:', searchesError)
      return NextResponse.json(
        { error: 'Failed to fetch search tickets' },
        { status: 500 }
      )
    }

    // Transform data to include real user info
    const tickets = searches.map(search => ({
      id: search.id,
      user_id: search.user_id,
      medication_name: search.medication_name,
      dosage: search.dosage,
      zipcode: search.zipcode,
      radius: search.radius,
      status: search.status,
      created_at: search.created_at,
      completed_at: search.completed_at,
      stripe_session_id: search.stripe_session_id,
      user_email: search.users?.email || 'Unknown',
      user_name: search.users?.raw_user_meta_data?.full_name || 
                 search.users?.raw_user_meta_data?.name || 
                 search.users?.email?.split('@')[0] || 
                 'Unknown User',
      // Get payment info from metadata JSON
      payment_amount: search.metadata?.payment_amount || search.metadata?.amount || 0,
      pharmacy_count: search.metadata?.pharmacy_count || search.metadata?.pharmacyCount || 0
    }))

    return NextResponse.json({
      success: true,
      tickets
    })

  } catch (error) {
    console.error('Admin search tickets API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}