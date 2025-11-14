import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchId = params.id
    const body = await request.json()
    const { results } = body

    // Verify the search belongs to the user
    const { data: search, error: searchError } = await supabase
      .from('searches')
      .select('id')
      .eq('id', searchId)
      .eq('user_id', user.id)
      .single()

    if (searchError) {
      return NextResponse.json(
        { error: 'Search not found' },
        { status: 404 }
      )
    }

    // Validate results data
    if (!Array.isArray(results)) {
      return NextResponse.json(
        { error: 'Results must be an array' },
        { status: 400 }
      )
    }

    // Insert results
    const formattedResults = results.map(result => ({
      search_id: searchId,
      pharmacy_id: result.pharmacy_id,
      pharmacy_name: result.pharmacy_name,
      address: result.address,
      phone: result.phone,
      latitude: result.latitude,
      longitude: result.longitude,
      price: result.price,
      availability: result.availability,
      confidence_score: result.confidence_score,
      last_called: result.last_called,
      notes: result.notes
    }))

    const { error: insertError } = await supabase
      .from('search_results')
      .insert(formattedResults)

    if (insertError) {
      console.error('Error inserting results:', insertError)
      return NextResponse.json(
        { error: 'Failed to save results' },
        { status: 500 }
      )
    }

    // Update search status to completed
    await supabase
      .from('searches')
      .update({ status: 'completed' })
      .eq('id', searchId)

    return NextResponse.json({
      success: true,
      message: 'Results saved successfully'
    })

  } catch (error) {
    console.error('Results API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}