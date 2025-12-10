import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth, createAdminErrorResponse } from '@/lib/auth/admin'
import { qstash, PharmacyCallJob, getBusinessHoursDelay, isBusinessHours } from '@/lib/qstash'

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await checkAdminAuth()
    
    if (!authResult.isAdmin) {
      const errorResponse = createAdminErrorResponse(authResult.error)
      return NextResponse.json(errorResponse.body, { status: errorResponse.status })
    }
    
    const supabase = createClient()
    const { ticketId } = await request.json()
    
    if (!ticketId) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
        { status: 400 }
      )
    }

    // Get search details with selected pharmacies - simplified query
    const { data: search, error: searchError } = await supabase
      .from('searches')
      .select('*')
      .eq('id', ticketId)
      .single()

    if (searchError || !search) {
      console.error('Error fetching search:', searchError)
      return NextResponse.json(
        { error: 'Search not found' },
        { status: 404 }
      )
    }

    // Check if search has selected pharmacies in metadata
    const selectedPharmacies = search.metadata?.selected_pharmacies
    if (!selectedPharmacies || selectedPharmacies.length === 0) {
      return NextResponse.json(
        { error: 'No pharmacies selected for this search' },
        { status: 400 }
      )
    }

    console.log(`Starting calling process for search ${ticketId} with ${selectedPharmacies.length} pharmacies`)

    // Update search status to calling_in_progress
    const { error: updateError } = await supabase
      .from('searches')
      .update({ 
        status: 'calling_in_progress',
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId)

    if (updateError) {
      console.error('Error updating search status:', updateError)
      return NextResponse.json(
        { error: 'Failed to start calling process' },
        { status: 500 }
      )
    }

    // Create queue jobs for each pharmacy
    const jobsToCreate = []
    const qstashJobs = []

    for (const pharmacy of selectedPharmacies) {
      // Create database job record - handle null user_id
      const jobRecord = {
        search_id: ticketId,
        pharmacy_id: pharmacy.id,
        pharmacy_name: pharmacy.name,
        pharmacy_phone: pharmacy.phone,
        pharmacy_address: pharmacy.address,
        medication_name: search.medication_name,
        dosage: search.dosage || '',
        user_id: search.user_id || '00000000-0000-0000-0000-000000000000', // Default UUID for test data
        status: 'pending',
        attempt: 1,
        max_attempts: 3
      }

      jobsToCreate.push(jobRecord)

      // Prepare QStash job - handle null user_id
      const qstashJob: PharmacyCallJob = {
        searchId: ticketId,
        pharmacyId: pharmacy.id,
        pharmacyName: pharmacy.name,
        pharmacyPhone: pharmacy.phone,
        pharmacyAddress: pharmacy.address,
        medicationName: search.medication_name,
        dosage: search.dosage || '',
        userId: search.user_id || '00000000-0000-0000-0000-000000000000', // Default UUID for test data
        attempt: 1
      }

      qstashJobs.push(qstashJob)
    }

    // Insert all job records into database (handle duplicates)
    const { data: createdJobs, error: jobsError } = await supabase
      .from('queue_jobs')
      .upsert(jobsToCreate, { 
        onConflict: 'search_id,pharmacy_id',
        ignoreDuplicates: false 
      })
      .select()

    if (jobsError) {
      console.error('Error creating queue jobs:', jobsError)
      return NextResponse.json(
        { error: 'Failed to create queue jobs' },
        { status: 500 }
      )
    }

    // Calculate delay for business hours if needed
    const delay = isBusinessHours() ? 0 : getBusinessHoursDelay()
    const scheduledFor = new Date(Date.now() + delay * 1000)

    // Enqueue jobs with QStash (handle localhost for testing)
    const qstashPromises = qstashJobs.map(async (job, index) => {
      let result
      
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        
        // For localhost, use the test endpoint instead of QStash
        if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
          console.log(`🧪 Local development: calling test endpoint directly for ${job.pharmacyName}`)
          
          // Call the test endpoint directly for local development
          const response = await fetch(`${baseUrl}/api/process-pharmacy-call/test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(job)
          })
          
          const testResult = await response.json()
          
          if (response.ok) {
            result = { success: true, messageId: 'local-test', pharmacy: job.pharmacyName }
          } else {
            throw new Error(`Local test failed: ${testResult.error}`)
          }
        } else {
          // Use QStash for production with proper webhook URL
          const webhookUrl = `${baseUrl}/api/process-pharmacy-call`
          console.log(`🚀 Scheduling QStash job for ${job.pharmacyName} -> ${webhookUrl}`)
          
          const qstashResult = await qstash.publishJSON({
            url: webhookUrl,
            delay: delay, // Delay in seconds
            body: job,
          })
          
          result = { success: true, messageId: qstashResult.messageId, pharmacy: job.pharmacyName }
        }

        // Update job record with message ID (after successful enqueue/test)
        await supabase
          .from('queue_jobs')
          .update({ 
            qstash_message_id: result.messageId,
            scheduled_for: scheduledFor.toISOString(),
            status: delay > 0 ? 'retry_scheduled' : 'pending'
          })
          .eq('id', createdJobs[index].id)

        return result

      } catch (error) {
        console.error(`Failed to enqueue job for ${job.pharmacyName}:`, error)
        
        // Mark job as failed in database
        await supabase
          .from('queue_jobs')
          .update({ 
            status: 'failed',
            error_message: 'Failed to enqueue job',
            completed_at: new Date().toISOString()
          })
          .eq('id', createdJobs[index].id)

        return { success: false, error: (error as Error).message || 'Unknown error', pharmacy: job.pharmacyName }
      }
    })

    const qstashResults = await Promise.all(qstashPromises)
    
    const successfulJobs = qstashResults.filter(result => result.success)
    const failedJobs = qstashResults.filter(result => !result.success)

    console.log(`Enqueued ${successfulJobs.length}/${qstashJobs.length} jobs successfully`)
    if (failedJobs.length > 0) {
      console.error('Failed to enqueue jobs:', failedJobs)
    }

    // Return status
    const response = {
      success: true,
      message: delay > 0 
        ? `Calling process scheduled for business hours (${scheduledFor.toLocaleString()})`
        : 'Calling process started',
      search_id: ticketId,
      status: 'calling_in_progress',
      jobs_created: qstashJobs.length,
      jobs_enqueued: successfulJobs.length,
      jobs_failed: failedJobs.length,
      scheduled_for: delay > 0 ? scheduledFor.toISOString() : null,
      estimated_completion: new Date(Date.now() + (delay + qstashJobs.length * 30) * 1000).toISOString() // Rough estimate: 30s per call
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Admin start calling API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}