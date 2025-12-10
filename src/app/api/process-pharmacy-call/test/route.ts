import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { qstash, PharmacyCallJob, getRetryDelay, isBusinessHours } from '@/lib/qstash'

// Test endpoint that bypasses auth and signature verification for local development
// This is a simplified version of the main endpoint for testing purposes
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 TEST ENDPOINT: Processing pharmacy call job...')
    
    const body = await request.json()
    const job: PharmacyCallJob = body

    console.log(`Processing pharmacy call job for search ${job.searchId}, pharmacy ${job.pharmacyName}`)

    const supabase = createClient()
    
    // Create a test job record if it doesn't exist
    const { data: existingJob } = await supabase
      .from('queue_jobs')
      .select('*')
      .eq('search_id', job.searchId)
      .eq('pharmacy_id', job.pharmacyId)
      .single()

    let jobRecord
    
    if (!existingJob) {
      console.log('📋 Creating test job record...')
      const { data: newJob, error: createError } = await supabase
        .from('queue_jobs')
        .insert({
          search_id: job.searchId,
          pharmacy_id: job.pharmacyId,
          pharmacy_name: job.pharmacyName,
          pharmacy_phone: job.pharmacyPhone,
          pharmacy_address: job.pharmacyAddress,
          medication_name: job.medicationName,
          dosage: job.dosage,
          user_id: job.userId,
          status: 'pending',
          attempt: 1,
          max_attempts: 3
        })
        .select()
        .single()

      if (createError) {
        console.error('Failed to create test job:', createError)
        return NextResponse.json({ 
          error: 'Failed to create test job',
          details: createError.message,
          code: createError.code,
          fullError: createError
        }, { status: 500 })
      }
      jobRecord = newJob
    } else {
      jobRecord = existingJob
    }

    // Update job status to processing
    await supabase
      .from('queue_jobs')
      .update({ 
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('id', jobRecord.id)

    // Create call record
    const { data: callRecord, error: callError } = await supabase
      .from('calls')
      .insert({
        search_id: job.searchId,
        job_id: jobRecord.id,
        pharmacy_id: job.pharmacyId,
        pharmacy_phone: job.pharmacyPhone,
        call_provider: 'mock',
        status: 'initiated'
      })
      .select()
      .single()

    if (callError) {
      console.error('Failed to create call record:', callError)
      return NextResponse.json({ error: 'Failed to create call record' }, { status: 500 })
    }

    // Simulate a call with mock data
    const mockResult = await simulatePharmacyCall(job)
    
    // Update call record with results
    await supabase
      .from('calls')
      .update({
        status: mockResult.success ? 'completed' : 'failed',
        answered_at: mockResult.success ? new Date().toISOString() : null,
        ended_at: new Date().toISOString(),
        duration_seconds: mockResult.duration_seconds,
        transcript: mockResult.transcript,
        extracted_data: mockResult.extracted_data,
        confidence_score: mockResult.confidence_score
      })
      .eq('id', callRecord.id)

    if (mockResult.success) {
      // Mark job as completed
      await supabase
        .from('queue_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          result_data: mockResult.extracted_data
        })
        .eq('id', jobRecord.id)

      console.log(`✅ Successfully processed call for ${job.pharmacyName}`)
      return NextResponse.json({ 
        success: true, 
        status: 'completed',
        result: mockResult.extracted_data,
        message: 'Test call completed successfully'
      })
    } else {
      // Mark as failed for simplicity in testing
      await supabase
        .from('queue_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: mockResult.error || 'Mock call failed'
        })
        .eq('id', jobRecord.id)

      console.log(`❌ Call failed for ${job.pharmacyName}: ${mockResult.error}`)
      return NextResponse.json({ 
        success: false, 
        status: 'failed',
        error: mockResult.error,
        message: 'Test call failed'
      })
    }

  } catch (error) {
    console.error('Test pharmacy call error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Mock pharmacy call simulation (same as main endpoint)
async function simulatePharmacyCall(job: PharmacyCallJob) {
  console.log(`📞 Simulating call to ${job.pharmacyName} for ${job.medicationName}...`)
  
  // Simulate call duration
  const duration = Math.floor(Math.random() * 120) + 30 // 30-150 seconds
  
  // Simulate success/failure (85% success rate for testing)
  const success = Math.random() > 0.15
  
  if (!success) {
    const errors = ['no_answer', 'busy', 'invalid_number', 'call_failed']
    const error = errors[Math.floor(Math.random() * errors.length)]
    console.log(`❌ Mock call failed: ${error}`)
    return {
      success: false,
      error: error,
      duration_seconds: Math.floor(duration / 2) // Shorter for failed calls
    }
  }

  // Mock successful call results
  const hasStock = Math.random() > 0.3 // 70% chance of having stock
  const price = hasStock ? Math.floor(Math.random() * 200) + 20 : null // $20-$220
  
  console.log(`✅ Mock call successful: ${hasStock ? `In stock for $${price}` : 'Out of stock'}`)
  
  return {
    success: true,
    duration_seconds: duration,
    transcript: `Called ${job.pharmacyName} asking about ${job.medicationName} ${job.dosage}. ${hasStock ? `In stock for $${price}` : 'Out of stock'}.`,
    extracted_data: {
      availability: hasStock,
      price: price,
      notes: hasStock ? 'In stock, ready for pickup' : 'Currently out of stock',
      call_date: new Date().toISOString()
    },
    confidence_score: Math.random() * 0.3 + 0.7 // 0.7-1.0 for mock data
  }
}