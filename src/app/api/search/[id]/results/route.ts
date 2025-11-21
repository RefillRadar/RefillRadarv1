import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
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

    // Get the search and verify ownership
    const { data: search, error: searchError } = await supabase
      .from('searches')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (searchError || !search) {
      return NextResponse.json(
        { error: 'Search not found' },
        { status: 404 }
      )
    }

    // Extract pharmacy results from metadata
    const pharmacyResults = search.metadata?.pharmacy_results || {}
    const selectedPharmacies = search.metadata?.selected_pharmacies || []
    
    // Combine selected pharmacies with their results
    const results = selectedPharmacies.map((pharmacy: any) => {
      const result = pharmacyResults[pharmacy.id] || {}
      return {
        id: pharmacy.id,
        name: pharmacy.name,
        address: pharmacy.address,
        phone: pharmacy.phone,
        availability: result.availability,
        price: result.price,
        notes: result.notes,
        last_updated: result.updated_at,
        status: result.availability !== undefined ? 'completed' : 'pending'
      }
    })

    return NextResponse.json({
      success: true,
      search: {
        id: search.id,
        medication_name: search.medication_name,
        dosage: search.dosage,
        zipcode: search.zipcode,
        radius: search.radius,
        status: search.status,
        created_at: search.created_at,
        completed_at: search.completed_at
      },
      results,
      summary: {
        total_pharmacies: selectedPharmacies.length,
        completed_calls: results.filter((r: any) => r.status === 'completed').length,
        in_stock: results.filter((r: any) => r.availability === true).length,
        out_of_stock: results.filter((r: any) => r.availability === false).length
      }
    })

  } catch (error) {
    console.error('Search results API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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