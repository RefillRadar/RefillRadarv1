import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth/admin'

export async function POST(request: NextRequest) {
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
    const { ticketId } = await request.json()
    
    if (!ticketId) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
        { status: 400 }
      )
    }

    // Update search status to calling_in_progress
    const { data: updatedSearch, error: updateError } = await supabase
      .from('searches')
      .update({ 
        status: 'calling_in_progress',
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating search status:', updateError)
      return NextResponse.json(
        { error: 'Failed to start calling process' },
        { status: 500 }
      )
    }

    // TODO: In production, you would:
    // 1. Queue the pharmacy calls in a job system (Redis, Bull, etc.)
    // 2. Start the AI calling process
    // 3. Create call records in the database
    // 4. Send notifications to the user
    
    console.log(`Started calling process for search ${ticketId}`)
    
    // Simulate starting the calling process
    // In production, this would trigger your AI calling system
    
    return NextResponse.json({
      success: true,
      message: 'Calling process started',
      search_id: ticketId,
      status: 'calling_in_progress'
    })

  } catch (error) {
    console.error('Admin start calling API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}