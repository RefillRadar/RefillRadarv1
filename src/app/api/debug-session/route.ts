import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getServerStripe } from '@/lib/server-stripe'
import { checkAdminAuth } from '@/lib/auth/admin'

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
    const { stripe, isConfigured, error: stripeError } = getServerStripe()
    if (!isConfigured) {
      return NextResponse.json(
        { error: 'Stripe configuration error' },
        { status: 500 }
      )
    }
    const { sessionId } = await request.json()
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    return NextResponse.json({
      session: {
        id: session.id,
        payment_status: session.payment_status,
        metadata: session.metadata,
        customer_details: session.customer_details,
        amount_total: session.amount_total
      }
    })
    
  } catch (error) {
    console.error('Debug session error:', error)
    return NextResponse.json({ error: 'Failed to retrieve session' }, { status: 500 })
  }
}