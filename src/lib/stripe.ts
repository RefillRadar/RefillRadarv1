import { loadStripe, Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null> | null = null

// Make sure to add your Stripe publishable key to your environment variables
export const getStripe = async (): Promise<Stripe | null> => {
  // Memoize the Stripe promise to avoid loading multiple times
  if (!stripePromise) {
    const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    
    if (!stripePublishableKey) {
      console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
      return null
    }
    
    stripePromise = loadStripe(stripePublishableKey)
  }
  
  return stripePromise
}