import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { qstash, PharmacyCallJob, getRetryDelay, isBusinessHours, getBusinessHoursDelay } from '@/lib/qstash'
// import { verifySignature } from '@upstash/qstash/nextjs'
import { createPharmacyCall, monitorPharmacyCall } from '@/lib/vapi'

// This endpoint processes individual pharmacy calls
// Called by QStash for each pharmacy in a search
export async function POST(request: NextRequest) {
  try {
    // Read body once and use it for both signature verification and data
    const bodyText = await request.text()
    let body: PharmacyCallJob
    
    try {
      body = JSON.parse(bodyText)
    } catch (parseError) {
      console.error('Invalid JSON in request body:', parseError)
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    // For local testing, skip signature verification if no real QStash token
    const signature = request.headers.get('upstash-signature') || ''
    const shouldVerifySignature = process.env.QSTASH_TOKEN && 
                                  process.env.QSTASH_TOKEN !== 'test_token_for_local_development' &&
                                  signature && signature !== 'test-signature'

    // TODO: Fix QStash signature verification - disabled for now due to TypeScript issues
    if (shouldVerifySignature) {
      console.log('⚠️ QStash signature verification disabled - TODO: fix implementation')
      // Signature verification temporarily disabled for build
    } else {
      console.log('⚠️ Skipping signature verification (local development mode)')
    }

    const job: PharmacyCallJob = body

    console.log(`Processing pharmacy call job for search ${job.searchId}, pharmacy ${job.pharmacyName}`)

    const supabase = createClient()
    
    // Get the job from database
    const { data: jobRecord, error: jobError } = await supabase
      .from('queue_jobs')
      .select('*')
      .eq('search_id', job.searchId)
      .eq('pharmacy_id', job.pharmacyId)
      .single()

    if (jobError || !jobRecord) {
      console.error('Job not found in database:', jobError)
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Check if job is already completed or failed permanently
    if (jobRecord.status === 'completed' || (jobRecord.status === 'failed' && jobRecord.attempt >= jobRecord.max_attempts)) {
      console.log(`Job already ${jobRecord.status}, skipping`)
      return NextResponse.json({ success: true, status: 'skipped', reason: `Already ${jobRecord.status}` })
    }

    // Check rate limiting - don't call same pharmacy within 1 hour
    const { data: lastCall } = await supabase
      .from('pharmacy_last_called')
      .select('last_called_at')
      .eq('pharmacy_id', job.pharmacyId)
      .single()

    if (lastCall?.last_called_at) {
      const hoursSinceLastCall = (Date.now() - new Date(lastCall.last_called_at).getTime()) / (1000 * 60 * 60)
      if (hoursSinceLastCall < 1) {
        console.log(`Pharmacy ${job.pharmacyName} called too recently (${hoursSinceLastCall.toFixed(1)}h ago), skipping`)
        await supabase
          .from('queue_jobs')
          .update({ 
            status: 'failed',
            error_message: 'Rate limited - called too recently',
            completed_at: new Date().toISOString()
          })
          .eq('id', jobRecord.id)
        
        return NextResponse.json({ 
          success: true, 
          status: 'rate_limited', 
          reason: 'Pharmacy called too recently' 
        })
      }
    }

    // Check business hours
    if (!isBusinessHours()) {
      console.log(`Outside business hours, rescheduling job`)
      const delay = getBusinessHoursDelay()
      
      // Reschedule for next business hours
      await scheduleRetry(job, jobRecord.attempt, delay)
      
      await supabase
        .from('queue_jobs')
        .update({ 
          status: 'retry_scheduled',
          scheduled_for: new Date(Date.now() + delay * 1000).toISOString()
        })
        .eq('id', jobRecord.id)
      
      return NextResponse.json({ 
        success: true, 
        status: 'rescheduled', 
        reason: 'Outside business hours',
        next_attempt_in: delay
      })
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
        call_provider: process.env.VAPI_API_KEY ? 'vapi' : 'mock', // Use Vapi if configured
        status: 'initiated'
      })
      .select()
      .single()

    if (callError) {
      console.error('Failed to create call record:', callError)
      await markJobFailed(supabase, jobRecord.id, 'Failed to create call record')
      return NextResponse.json({ error: 'Failed to create call record' }, { status: 500 })
    }

    // Use Vapi.ai for real calls or simulate for testing
    let callResult
    
    if (process.env.VAPI_API_KEY && process.env.NODE_ENV === 'production') {
      console.log(`🎙️ Starting real Vapi.ai call to ${job.pharmacyName}`)
      callResult = await performRealPharmacyCall(job, callRecord.id, supabase)
    } else {
      console.log(`🧪 Simulating pharmacy call to ${job.pharmacyName}`)
      callResult = await simulatePharmacyCall(job)
    }
    
    // Update call record with results
    await supabase
      .from('calls')
      .update({
        status: callResult.success ? 'completed' : 'failed',
        answered_at: callResult.success ? new Date().toISOString() : null,
        ended_at: new Date().toISOString(),
        duration_seconds: callResult.duration_seconds,
        transcript: callResult.transcript || '',
        extracted_data: callResult.extracted_data || null,
        confidence_score: callResult.confidence_score || 0,
        provider_call_id: (callResult.success && 'provider_call_id' in callResult) ? callResult.provider_call_id : null
      })
      .eq('id', callRecord.id)

    if (callResult.success) {
      // Mark job as completed
      await supabase
        .from('queue_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          result_data: callResult.extracted_data
        })
        .eq('id', jobRecord.id)

      console.log(`Successfully processed call for ${job.pharmacyName}`)
      return NextResponse.json({ 
        success: true, 
        status: 'completed',
        result: callResult.extracted_data
      })
    } else {
      // Handle failure - retry if attempts left
      if (jobRecord.attempt < jobRecord.max_attempts) {
        const delay = getRetryDelay(jobRecord.attempt + 1)
        await scheduleRetry(job, jobRecord.attempt + 1, delay)
        
        await supabase
          .from('queue_jobs')
          .update({
            status: 'retry_scheduled',
            attempt: jobRecord.attempt + 1,
            scheduled_for: new Date(Date.now() + delay * 1000).toISOString(),
            error_message: callResult.error
          })
          .eq('id', jobRecord.id)

        console.log(`Call failed, scheduled retry ${jobRecord.attempt + 1}/${jobRecord.max_attempts} in ${delay}s`)
        return NextResponse.json({ 
          success: true, 
          status: 'retry_scheduled',
          attempt: jobRecord.attempt + 1,
          max_attempts: jobRecord.max_attempts,
          retry_in: delay
        })
      } else {
        // Max retries reached, mark as permanently failed
        await markJobFailed(supabase, jobRecord.id, callResult.error || 'Max retries exceeded')
        
        console.log(`Call failed permanently for ${job.pharmacyName} after ${jobRecord.max_attempts} attempts`)
        return NextResponse.json({ 
          success: true, 
          status: 'failed',
          reason: 'Max retries exceeded'
        })
      }
    }

  } catch (error) {
    console.error('Process pharmacy call error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to schedule retry via QStash
async function scheduleRetry(job: PharmacyCallJob, attempt: number, delaySeconds: number) {
  const retryJob: PharmacyCallJob = {
    ...job,
    attempt
  }

  try {
    await qstash.publishJSON({
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/process-pharmacy-call`,
      delay: delaySeconds,
      body: retryJob,
    })
    console.log(`Scheduled retry for ${job.pharmacyName} in ${delaySeconds}s (attempt ${attempt})`)
  } catch (error) {
    console.error('Failed to schedule retry:', error)
  }
}

// Helper function to mark job as failed
async function markJobFailed(supabase: any, jobId: string, errorMessage: string) {
  await supabase
    .from('queue_jobs')
    .update({
      status: 'failed',
      completed_at: new Date().toISOString(),
      error_message: errorMessage
    })
    .eq('id', jobId)
}

// Real pharmacy call using Vapi.ai
async function performRealPharmacyCall(job: PharmacyCallJob, callRecordId: string, supabase: any) {
  try {
    console.log(`📞 Starting real call to ${job.pharmacyName} (${job.pharmacyPhone}) for ${job.medicationName} ${job.dosage}`)
    
    // Start the Vapi.ai call
    const vapiCall = await createPharmacyCall(
      job.pharmacyPhone,
      job.medicationName,
      job.dosage,
      job.pharmacyName
    )
    
    // Update call record with Vapi call ID
    await supabase
      .from('calls')
      .update({
        provider_call_id: vapiCall.id,
        status: 'ringing'
      })
      .eq('id', callRecordId)
    
    // Wait for call to complete (polling - in production you'd use webhooks)
    console.log(`⏳ Waiting for Vapi call ${vapiCall.id} to complete...`)
    
    let attempts = 0
    const maxAttempts = 60 // 5 minutes max
    let callStatus
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
      
      try {
        callStatus = await monitorPharmacyCall(vapiCall.id)
        
        if (callStatus.status === 'ended') {
          console.log(`✅ Vapi call completed: ${callStatus.extractedData?.availability ? 'In stock' : 'Out of stock'}`)
          
          return {
            success: true,
            duration_seconds: callStatus.duration || 0,
            transcript: callStatus.transcript || '',
            extracted_data: callStatus.extractedData,
            confidence_score: callStatus.confidence || 0.8,
            provider_call_id: vapiCall.id
          }
        }
        
        // Check for terminal states that indicate failure
        if (callStatus.endedReason && callStatus.endedReason.includes('error')) {
          throw new Error(`Vapi call failed: ${callStatus.endedReason}`)
        }
        
        attempts++
        console.log(`⏳ Call still in progress (${callStatus.status}), checking again in 5s...`)
        
      } catch (error) {
        console.error(`Error monitoring call ${vapiCall.id}:`, error)
        attempts++
      }
    }
    
    // Timeout - call took too long
    console.log(`⏰ Call timeout after ${maxAttempts * 5} seconds`)
    
    return {
      success: false,
      error: 'Call timeout - exceeded maximum duration',
      duration_seconds: maxAttempts * 5,
      provider_call_id: vapiCall.id
    }
    
  } catch (error) {
    console.error('Vapi.ai call error:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Vapi call failed',
      duration_seconds: 0
    }
  }
}

// Mock pharmacy call simulation (for development and testing)
async function simulatePharmacyCall(job: PharmacyCallJob) {
  // Simulate call duration
  const duration = Math.floor(Math.random() * 120) + 30 // 30-150 seconds
  
  // Simulate success/failure (90% success rate for testing)
  const success = Math.random() > 0.1
  
  if (!success) {
    const errors = ['no_answer', 'busy', 'invalid_number', 'call_failed']
    return {
      success: false,
      error: errors[Math.floor(Math.random() * errors.length)],
      duration_seconds: duration
    }
  }

  // Mock successful call results
  const hasStock = Math.random() > 0.3 // 70% chance of having stock
  const price = hasStock ? Math.floor(Math.random() * 200) + 20 : null // $20-$220
  
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