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
    const { 
      amount, 
      pharmacyCount, 
      paymentType, 
      searchData,
      userId 
    } = await request.json()

    // Validate required fields
    if (!amount || !pharmacyCount || !paymentType) {
      return NextResponse.json(
        { error: 'Missing required payment data' },
        { status: 400 }
      )
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: paymentType === 'per-call' 
                ? `Pharmacy Calls - ${pharmacyCount} pharmacies`
                : 'Bulk Pharmacy Calls - Flat Rate',
              description: searchData 
                ? `Search for ${searchData.medication} ${searchData.dosage} in ${searchData.zipcode}` 
                : 'Pharmacy availability search',
              images: ['https://your-domain.com/pharmacy-icon.png'], // Optional: add your logo
            },
            unit_amount: amount * 100, // Stripe expects amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard?payment=cancelled`,
      metadata: {
        paymentType,
        pharmacyCount: pharmacyCount.toString(),
        searchData: searchData ? JSON.stringify(searchData) : '',
        userId: userId || '',
      },
    })

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}