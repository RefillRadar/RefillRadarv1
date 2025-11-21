import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getServerStripe, getWebhookSecret } from '@/lib/server-stripe'

export async function POST(request: NextRequest) {
  console.log('🎣 Webhook received!')
  try {
    // Validate Stripe configuration
    const { stripe, isConfigured, error: stripeError } = getServerStripe()
    if (!isConfigured) {
      console.error('Stripe not configured:', stripeError)
      return NextResponse.json({ error: 'Stripe configuration error' }, { status: 500 })
    }

    const { secret: webhookSecret, error: webhookError } = getWebhookSecret()
    if (!webhookSecret) {
      console.error('Webhook secret not configured:', webhookError)
      return NextResponse.json({ error: 'Webhook configuration error' }, { status: 500 })
    }

    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!
    console.log('📝 Webhook signature present:', !!signature)

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('📩 Event type:', event.type)

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      console.log('✅ Processing checkout.session.completed:', session.id)

      // Check if we have the required metadata
      if (!session.metadata?.searchData || !session.metadata?.userId) {
        console.log('⚠️ Missing metadata in session:', session.id, 'Metadata:', session.metadata)
        return NextResponse.json({ received: true, message: 'No metadata - test event' })
      }

      const searchData = JSON.parse(session.metadata.searchData)
      const userId = session.metadata.userId
      const selectedPharmacies = session.metadata.selectedPharmacies ? JSON.parse(session.metadata.selectedPharmacies) : []

      // Use service role client to bypass RLS policies for webhooks
      const supabase = createServiceClient()

      // Check if we already created a search record for this session using stripe_session_id
      const { data: existingSearch } = await supabase
        .from('searches')
        .select('id')
        .eq('stripe_session_id', session.id)
        .single()

      if (existingSearch) {
        console.log('🔄 Search already exists for session:', session.id)
        return NextResponse.json({ received: true })
      }

      // Create search record with payment metadata
      const { data: search, error: searchError } = await supabase
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
            payment_amount: session.amount_total ? session.amount_total / 100 : 0, // Convert from cents
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
        console.error('❌ Error creating search record:', searchError)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }

      console.log('🎉 Search record created successfully:', search.id)
    } else {
      console.log('🔕 Ignoring event type:', event.type)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}