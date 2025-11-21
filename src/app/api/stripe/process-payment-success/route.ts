import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { getServerStripe } from '@/lib/server-stripe'

export async function POST(request: NextRequest) {
  try {
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
    console.log('Processing payment success for session:', sessionId)
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    console.log('Session retrieved:', {
      id: session.id,
      payment_status: session.payment_status,
      metadata: session.metadata
    })

    if (!session || session.payment_status !== 'paid') {
      console.log('Payment not completed:', session.payment_status)
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      )
    }

    // Check if we already created a search record for this session using stripe_session_id
    const supabase = createClient()
    
    const { data: existingSearch } = await supabase
      .from('searches')
      .select('id')
      .eq('stripe_session_id', session.id)
      .single()

    if (existingSearch) {
      console.log('Search record found for session:', session.id)
      return NextResponse.json({
        success: true,
        search_id: existingSearch.id,
        message: 'Search record found (created by webhook)'
      })
    }

    // This endpoint is now read-only - it only verifies and returns existing search records
    // The canonical webhook at /api/webhooks/stripe handles all record creation
    
    // No existing search found - webhook may not have processed yet
    console.log('No search record found for session:', session.id)
    return NextResponse.json(
      { 
        success: false,
        message: 'Search record not found. Please wait for webhook processing or contact support.',
        sessionId: session.id
      },
      { status: 202 } // 202 Accepted - processing may still be in progress
    )

  } catch (error) {
    console.error('Error processing payment success:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}