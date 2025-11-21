import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  if (token_hash && type) {
    const supabase = createClient()

    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    })

    if (!error) {
      // Redirect to dashboard on successful confirmation
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Redirect to login page with error on failure
  return NextResponse.redirect(new URL('/login?error=confirmation_failed', request.url))
}