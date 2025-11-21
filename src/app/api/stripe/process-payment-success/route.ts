import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
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

    // FALLBACK: Create search record if webhook hasn't processed yet
    // This is a temporary workaround until webhooks are properly configured
    
    if (!session.metadata?.searchData || !session.metadata?.userId) {
      console.log('⚠️ Missing metadata in session:', session.id)
      return NextResponse.json({
        success: false,
        message: 'Invalid session metadata'
      }, { status: 400 })
    }

    const searchData = JSON.parse(session.metadata.searchData)
    const userId = session.metadata.userId
    const selectedPharmacies = session.metadata.selectedPharmacies ? JSON.parse(session.metadata.selectedPharmacies) : []

    // Use service role client to create the search record
    const supabaseService = createServiceClient()
    
    console.log('Creating fallback search record for session:', session.id)
    
    const { data: search, error: searchError } = await supabaseService
      .from('searches')
      .insert({
        user_id: userId,
        medication_name: searchData.medication,
        dosage: searchData.dosage,
        zipcode: searchData.zipcode,
        radius: parseInt(searchData.radius),
        status: 'payment_completed',
        stripe_session_id: session.id,
        metadata: {
          payment_amount: session.amount_total ? session.amount_total / 100 : 0,
          pharmacy_count: session.metadata?.pharmacyCount || 0,
          payment_type: session.metadata?.paymentType || 'unknown',
          stripe_session_id: session.id,
          customer_email: session.customer_details?.email,
          selected_pharmacies: selectedPharmacies
        }
      })
      .select()
      .single()

    if (searchError) {
      console.error('❌ Error creating fallback search record:', searchError)
      return NextResponse.json({
        success: false,
        message: 'Failed to create search record',
        error: searchError.message
      }, { status: 500 })
    }

    console.log('✅ Fallback search record created:', search.id)
    return NextResponse.json({
      success: true,
      search_id: search.id,
      message: 'Search record created successfully (fallback method)'
    })

  } catch (error) {
    console.error('Error processing payment success:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}