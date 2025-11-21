import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getServerStripe } from '@/lib/server-stripe'

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
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
    const { sessionId } = params

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Parse the search data from metadata
    const searchData = session.metadata?.searchData 
      ? JSON.parse(session.metadata.searchData)
      : null

    // Return the session details
    return NextResponse.json({
      sessionId: session.id,
      paymentType: session.metadata?.paymentType || 'unknown',
      pharmacyCount: session.metadata?.pharmacyCount || '0',
      searchData,
      amount: session.amount_total ? session.amount_total / 100 : 0, // Convert from cents
      customerEmail: session.customer_details?.email,
      paymentStatus: session.payment_status,
    })

  } catch (error) {
    console.error('Error retrieving session:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve session details' },
      { status: 500 }
    )
  }
}