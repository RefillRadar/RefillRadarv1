import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Test basic connection
    const { data: searches, error, count } = await supabase
      .from('searches')
      .select('*', { count: 'exact' })
      .limit(5)
    
    console.log('Debug API - Supabase response:', {
      error: error,
      count: count,
      resultsLength: searches?.length || 0,
      sampleResult: searches?.[0] || null
    })
    
    return NextResponse.json({
      success: !error,
      error: error?.message || null,
      count: count,
      resultsLength: searches?.length || 0,
      sampleResults: searches || [],
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'not set',
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    })
    
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}