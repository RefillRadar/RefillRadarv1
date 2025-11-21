import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getServerStripe } from '@/lib/server-stripe'
import { checkAdminAuth } from '@/lib/auth/admin'

// DEVELOPMENT/ADMIN TOOL ONLY
// This endpoint is for fixing up missing search records from Stripe sessions
// It is NOT part of the normal user-facing payment flow
// The canonical webhook at /api/webhooks/stripe handles all production record creation

export async function POST(request: NextRequest) {
  try {
    // Production guard - only allow in development or for admin users
    if (process.env.NODE_ENV === 'production') {
      const { isAdmin, error } = await checkAdminAuth()
      if (!isAdmin) {
        return NextResponse.json(
          { error: error || 'Development tool not available in production' },
          { status: 404 }
        )
      }
    }

    // Validate Stripe configuration
    const { stripe, isConfigured, error } = getServerStripe()
    if (!isConfigured) {
      console.error('Stripe not configured:', error)
      return NextResponse.json(
        { error: 'Payment system not available - configuration error' },
        { status: 500 }
      )
    }
    const { sessionId } = await request.json()
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    if (!session || session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      )
    }

    if (!session.metadata?.searchData || !session.metadata?.userId) {
      return NextResponse.json(
        { error: 'Missing search data in session metadata' },
        { status: 400 }
      )
    }

    const searchData = JSON.parse(session.metadata.searchData)
    const userId = session.metadata.userId
    
    const supabase = createClient()

    // Check if we already created a search record for this session using stripe_session_id
    const { data: existingSearch } = await supabase
      .from('searches')
      .select('id')
      .eq('stripe_session_id', sessionId)
      .single()

    if (existingSearch) {
      return NextResponse.json({
        success: true,
        message: 'Search already exists',
        search_id: existingSearch.id
      })
    }

    // Create search record
    const { data: search, error: searchError } = await supabase
      .from('searches')
      .insert({
        user_id: userId,
        medication_name: searchData.medication,
        dosage: searchData.dosage,
        zipcode: searchData.zipcode,
        radius: parseInt(searchData.radius),
        status: 'payment_completed',
        stripe_session_id: sessionId
      })
      .select()
      .single()

    if (searchError) {
      console.error('Error creating search record:', searchError)
      return NextResponse.json(
        { 
          error: 'Failed to create search record', 
          details: searchError.message,
          code: searchError.code,
          hint: searchError.hint,
          searchData,
          userId
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      search_id: search.id,
      message: 'Search record created successfully from existing session'
    })

  } catch (error) {
    console.error('Error processing existing session:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
}