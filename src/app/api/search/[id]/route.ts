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

    const searchId = params.id

    // Fetch search with results
    const { data: search, error: searchError } = await supabase
      .from('searches')
      .select(`
        *,
        search_results(*)
      `)
      .eq('id', searchId)
      .eq('user_id', user.id)
      .single()

    if (searchError) {
      if (searchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Search not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching search:', searchError)
      return NextResponse.json(
        { error: 'Failed to fetch search' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      search,
      results: search.search_results || []
    })

  } catch (error) {
    console.error('Search detail API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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
    const { status } = body

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'completed', 'failed']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Update search status
    const { data: search, error: updateError } = await supabase
      .from('searches')
      .update({ status })
      .eq('id', searchId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Search not found' },
          { status: 404 }
        )
      }
      console.error('Error updating search:', updateError)
      return NextResponse.json(
        { error: 'Failed to update search' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      search
    })

  } catch (error) {
    console.error('Search update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}