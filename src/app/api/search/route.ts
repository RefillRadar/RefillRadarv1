import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json()
    const { medication_name, dosage, zipcode, radius } = body

    // Validate required fields
    if (!medication_name || !zipcode || !radius) {
      return NextResponse.json(
        { error: 'Missing required fields: medication_name, zipcode, radius' },
        { status: 400 }
      )
    }

    // Validate radius
    if (radius < 1 || radius > 50) {
      return NextResponse.json(
        { error: 'Radius must be between 1 and 50 miles' },
        { status: 400 }
      )
    }

    // Create new search record
    const { data: search, error: searchError } = await supabase
      .from('searches')
      .insert({
        user_id: user.id,
        medication_name: medication_name.trim(),
        dosage: dosage?.trim(),
        zipcode: zipcode.trim(),
        radius: parseInt(radius),
        status: 'pending'
      })
      .select()
      .single()

    if (searchError) {
      console.error('Error creating search:', searchError)
      return NextResponse.json(
        { error: 'Failed to create search' },
        { status: 500 }
      )
    }

    // TODO: Trigger pharmacy search process here
    // For now, we'll return the search ID and let the frontend handle the next steps
    
    return NextResponse.json({
      success: true,
      search_id: search.id,
      message: 'Search created successfully'
    })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Fetch user's searches (removed search_results join for now since table may not exist)
    const { data: searches, error: searchesError } = await supabase
      .from('searches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (searchesError) {
      console.error('Error fetching searches:', searchesError)
      return NextResponse.json(
        { error: 'Failed to fetch searches' },
        { status: 500 }
      )
    }

    // Transform the data to include results count from metadata
    const transformedSearches = searches.map(search => ({
      ...search,
      results_count: search.metadata?.selected_pharmacies?.length || 0
    }))

    return NextResponse.json({
      success: true,
      searches: transformedSearches
    })

  } catch (error) {
    console.error('Search GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}