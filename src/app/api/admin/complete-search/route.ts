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

    // Update search status to completed
    const { data: updatedSearch, error: updateError } = await supabase
      .from('searches')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId)
      .select()
      .single()

    if (updateError) {
      console.error('Error completing search:', updateError)
      return NextResponse.json(
        { error: 'Failed to complete search' },
        { status: 500 }
      )
    }

    // TODO: In production, you would:
    // 1. Send completion notification email to user
    // 2. Generate final search results report
    // 3. Update analytics/metrics
    // 4. Clean up any temporary data
    
    console.log(`Completed search ${ticketId}`)
    
    return NextResponse.json({
      success: true,
      message: 'Search marked as completed',
      search_id: ticketId,
      status: 'completed'
    })

  } catch (error) {
    console.error('Admin complete search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}