import Stripe from 'stripe'

interface StripeConfig {
  stripe: Stripe
  isConfigured: boolean
  error?: string
}

let cachedStripeConfig: StripeConfig | null = null

export function getServerStripe(): StripeConfig {
  // Return cached config if available
  if (cachedStripeConfig) {
    return cachedStripeConfig
  }

  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    const error = 'STRIPE_SECRET_KEY environment variable is not set'
    console.error('Stripe configuration error:', error)
    
    cachedStripeConfig = {
      stripe: null as any,
      isConfigured: false,
      error
    }
    return cachedStripeConfig
  }

  if (!secretKey.startsWith('sk_')) {
    const error = 'STRIPE_SECRET_KEY must start with sk_ (invalid format)'
    console.error('Stripe configuration error:', error)
    
    cachedStripeConfig = {
      stripe: null as any,
      isConfigured: false,
      error
    }
    return cachedStripeConfig
  }

  try {
    const stripe = new Stripe(secretKey, {
      apiVersion: '2024-06-20',
    })

    cachedStripeConfig = {
      stripe,
      isConfigured: true
    }
    
    return cachedStripeConfig
  } catch (error) {
    const errorMessage = `Failed to initialize Stripe: ${error}`
    console.error('Stripe initialization error:', errorMessage)
    
    cachedStripeConfig = {
      stripe: null as any,
      isConfigured: false,
      error: errorMessage
    }
    return cachedStripeConfig
  }
}

export function getWebhookSecret(): { secret: string | null, error?: string } {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    const error = 'STRIPE_WEBHOOK_SECRET environment variable is not set'
    console.error('Webhook configuration error:', error)
    return { secret: null, error }
  }

  if (!webhookSecret.startsWith('whsec_')) {
    const error = 'STRIPE_WEBHOOK_SECRET must start with whsec_ (invalid format)'
    console.error('Webhook configuration error:', error)
    return { secret: null, error }
  }

  return { secret: webhookSecret }
}