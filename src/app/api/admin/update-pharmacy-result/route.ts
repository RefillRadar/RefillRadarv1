import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
    
    const body = await request.json()
    const { searchId, pharmacyId, availability, price, notes } = body
    
    if (!searchId || !pharmacyId) {
      return NextResponse.json(
        { error: 'Search ID and Pharmacy ID are required' },
        { status: 400 }
      )
    }
    
    // Use service role client for admin operations
    const supabase = createServiceClient()
    
    // Get the current search to update its metadata
    const { data: search, error: searchError } = await supabase
      .from('searches')
      .select('metadata')
      .eq('id', searchId)
      .single()
    
    if (searchError || !search) {
      return NextResponse.json(
        { error: 'Search not found' },
        { status: 404 }
      )
    }
    
    // Update the metadata with pharmacy results
    const currentMetadata = search.metadata || {}
    const pharmacyResults = currentMetadata.pharmacy_results || {}
    
    pharmacyResults[pharmacyId] = {
      availability: availability === 'true' || availability === true,
      price: price ? parseFloat(price) : null,
      notes: notes || '',
      updated_at: new Date().toISOString(),
      updated_by: 'admin'
    }
    
    const updatedMetadata = {
      ...currentMetadata,
      pharmacy_results: pharmacyResults,
      last_updated: new Date().toISOString()
    }
    
    // Update the search with new results
    const { data: updatedSearch, error: updateError } = await supabase
      .from('searches')
      .update({ 
        metadata: updatedMetadata,
        status: 'completed', // Mark as completed when we have results
        completed_at: new Date().toISOString()
      })
      .eq('id', searchId)
      .select()
      .single()
    
    if (updateError) {
      console.error('Error updating search:', updateError)
      return NextResponse.json(
        { error: 'Failed to update search results' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Pharmacy result updated successfully',
      search: updatedSearch
    })
    
  } catch (error) {
    console.error('Admin update pharmacy result API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}