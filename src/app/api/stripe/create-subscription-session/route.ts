import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
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

    const { productId, planType, userId } = await request.json()

    // Validate required fields
    if (!productId || !planType) {
      return NextResponse.json(
        { error: 'Missing required subscription data' },
        { status: 400 }
      )
    }

    // Get the product to find the default price
    const product = await stripe.products.retrieve(productId)
    
    if (!product.default_price) {
      return NextResponse.json(
        { error: 'Product does not have a default price configured' },
        { status: 400 }
      )
    }

    // Create Stripe Checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: typeof product.default_price === 'string' 
            ? product.default_price 
            : product.default_price.id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXTAUTH_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=subscription`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard?payment=cancelled&page=pricing`,
      metadata: {
        planType,
        userId: userId || '',
        productId,
      },
      // Optional: prefill customer email if available
      ...(userId && { customer_email: undefined }), // You can add customer email logic here
    })

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    })
  } catch (error) {
    console.error('Stripe subscription checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription checkout session' },
      { status: 500 }
    )
  }
}