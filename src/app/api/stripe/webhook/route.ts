import { NextRequest, NextResponse } from 'next/server'

// DEPRECATED: This legacy webhook endpoint has been replaced by /api/webhooks/stripe
// which is the canonical source of truth for Stripe payment processing.
// This endpoint returns a 410 Gone status to indicate it should no longer be used.

export async function POST(request: NextRequest) {
  console.log('⚠️ Legacy webhook called - redirecting to canonical endpoint')
  
  return NextResponse.json(
    { 
      error: 'This webhook endpoint has been deprecated',
      message: 'Please use /api/webhooks/stripe as the canonical webhook endpoint',
      status: 'deprecated'
    },
    { status: 410 } // 410 Gone - resource no longer available
  )
}