import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth, createAdminErrorResponse } from '@/lib/auth/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    // Check admin authentication
    const authResult = await checkAdminAuth()
    
    if (!authResult.isAdmin) {
      const errorResponse = createAdminErrorResponse(authResult.error)
      return NextResponse.json(errorResponse.body, { status: errorResponse.status })
    }
    
    const supabase = createClient()
    const { ticketId } = params
    
    if (!ticketId) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
        { status: 400 }
      )
    }

    // First, verify the search exists
    const { data: search, error: searchError } = await supabase
      .from('searches')
      .select('zipcode, radius, status')
      .eq('id', ticketId)
      .single()

    if (searchError || !search) {
      return NextResponse.json(
        { error: 'Search not found' },
        { status: 404 }
      )
    }

    // Get real call results from the search_results table
    const { data: searchResults, error: resultsError } = await supabase
      .from('search_results')
      .select('*')
      .eq('search_id', ticketId)
      .order('created_at', { ascending: true })

    if (resultsError) {
      console.error('Error fetching pharmacy results:', resultsError)
      return NextResponse.json(
        { error: 'Failed to fetch pharmacy results' },
        { status: 500 }
      )
    }

    // If no results exist yet, return empty list with status
    if (!searchResults || searchResults.length === 0) {
      return NextResponse.json({
        success: true,
        status: search.status === 'payment_completed' ? 'pending' : search.status,
        results: [],
        message: 'No pharmacy call results available yet. Calls may not have been started or completed.'
      })
    }

    // Transform search_results to match expected format
    const pharmacyResults = searchResults.map(result => ({
      id: result.id,
      pharmacy_id: result.pharmacy_id,
      name: result.pharmacy_name,
      address: result.address,
      phone: result.phone,
      latitude: result.latitude,
      longitude: result.longitude,
      status: result.availability !== null ? 'completed' : 'pending',
      availability: result.availability,
      price: result.price,
      confidence_score: result.confidence_score,
      notes: result.notes,
      last_called: result.last_called,
      created_at: result.created_at
    }))
    
    return NextResponse.json({
      success: true,
      status: search.status,
      results: pharmacyResults,
      total_pharmacies: pharmacyResults.length,
      completed_calls: pharmacyResults.filter(r => r.status === 'completed').length
    })

  } catch (error) {
    console.error('Admin pharmacy results API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}