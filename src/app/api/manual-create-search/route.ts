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

    const { medication, dosage, zipcode, radius, sessionId } = await request.json()

    // Create search record manually
    const { data: search, error: searchError } = await supabase
      .from('searches')
      .insert({
        user_id: user.id,
        medication_name: medication || 'Test Medication',
        dosage: dosage || '10mg',
        zipcode: zipcode || '10001',
        radius: parseInt(radius || '5'),
        status: 'payment_completed'
      })
      .select()
      .single()

    if (searchError) {
      console.error('Error creating manual search record:', searchError)
      return NextResponse.json(
        { 
          error: 'Failed to create search record', 
          details: searchError.message,
          code: searchError.code,
          hint: searchError.hint 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      search_id: search.id,
      message: 'Manual search record created successfully'
    })

  } catch (error) {
    console.error('Manual create search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}