import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Vapi.ai Webhook Handler
 * Receives events from Vapi.ai calls and updates our database
 */

interface VapiWebhookEvent {
  type: 'function-call' | 'call-start' | 'call-end' | 'speech-start' | 'speech-end' | 'transcript'
  call: {
    id: string
    status: string
    phoneNumber: string
    cost?: number
    endedReason?: string
    createdAt: string
    updatedAt: string
    duration?: number
  }
  message?: any
  transcript?: {
    role: 'user' | 'assistant'
    message: string
    time: number
    endTime: number
  }
  functionCall?: {
    name: string
    parameters: any
  }
}

export async function POST(request: NextRequest) {
  try {
    const event: VapiWebhookEvent = await request.json()
    console.log(`📞 Vapi webhook event: ${event.type} for call ${event.call.id}`)

    const supabase = createClient()

    // Find the call record by provider_call_id
    const { data: callRecord, error: findError } = await supabase
      .from('calls')
      .select('*')
      .eq('provider_call_id', event.call.id)
      .single()

    if (findError || !callRecord) {
      console.error('Call record not found for Vapi call ID:', event.call.id)
      return NextResponse.json({ success: true }) // Return success to avoid webhook retries
    }

    switch (event.type) {
      case 'call-start':
        console.log(`📞 Call started: ${event.call.id}`)
        await supabase
          .from('calls')
          .update({
            status: 'answered',
            answered_at: new Date().toISOString()
          })
          .eq('id', callRecord.id)
        break

      case 'call-end':
        console.log(`📞 Call ended: ${event.call.id} - ${event.call.endedReason}`)
        
        // Get final transcript and extracted data
        const transcript = await getCallTranscript(event.call.id)
        const extractedData = await extractDataFromTranscript(transcript, event.call.id)
        
        await supabase
          .from('calls')
          .update({
            status: 'completed',
            ended_at: new Date().toISOString(),
            duration_seconds: event.call.duration || 0,
            transcript: transcript,
            extracted_data: extractedData,
            confidence_score: calculateConfidenceFromCall(event.call, extractedData)
          })
          .eq('id', callRecord.id)

        // Update the corresponding queue job
        await updateQueueJobFromCall(supabase, callRecord, extractedData)
        break

      case 'function-call':
        console.log(`🔧 Function called: ${event.functionCall?.name}`)
        
        if (event.functionCall?.name === 'recordMedicationAvailability') {
          const { availability, price, notes } = event.functionCall.parameters
          
          // Update call record with extracted data
          await supabase
            .from('calls')
            .update({
              extracted_data: {
                availability: availability,
                price: price || null,
                notes: notes || 'Information obtained via function call',
                call_date: new Date().toISOString()
              }
            })
            .eq('id', callRecord.id)
        }
        break

      case 'transcript':
        console.log(`💬 Transcript: ${event.transcript?.role}: ${event.transcript?.message}`)
        // Could store individual transcript segments if needed
        break

      default:
        console.log(`📞 Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Vapi webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

/**
 * Get full transcript from Vapi call (this would use Vapi API)
 */
async function getCallTranscript(callId: string): Promise<string> {
  try {
    // In production, you'd fetch the full transcript from Vapi API
    // For now, return a placeholder
    return `Full transcript for call ${callId} would be fetched from Vapi API`
  } catch (error) {
    console.error('Error fetching transcript:', error)
    return ''
  }
}

/**
 * Extract structured data from transcript
 */
async function extractDataFromTranscript(transcript: string, callId: string) {
  // This could use OpenAI or other NLP to extract structured data
  // For now, use simple keyword detection
  
  const lowerTranscript = transcript.toLowerCase()
  
  const inStockKeywords = ['in stock', 'available', 'have it', 'yes we have', 'we do have']
  const outOfStockKeywords = ['out of stock', 'not available', 'don\'t have', 'no we don\'t', 'sold out']
  
  const hasInStock = inStockKeywords.some(keyword => lowerTranscript.includes(keyword))
  const hasOutOfStock = outOfStockKeywords.some(keyword => lowerTranscript.includes(keyword))
  
  // Extract price
  const priceMatch = transcript.match(/\$(\d+(?:\.\d{2})?)/g)
  const price = priceMatch ? parseFloat(priceMatch[0].replace('$', '')) : null
  
  return {
    availability: hasInStock ? true : hasOutOfStock ? false : null,
    price: price,
    notes: transcript.length > 0 ? 'Information extracted from call transcript' : 'No transcript available',
    call_date: new Date().toISOString(),
    vapi_call_id: callId
  }
}

/**
 * Calculate confidence score from call data
 */
function calculateConfidenceFromCall(call: any, extractedData: any): number {
  let confidence = 0.5

  // Higher confidence for longer calls
  if (call.duration > 30) confidence += 0.2
  if (call.duration > 60) confidence += 0.1

  // Higher confidence if call completed normally
  if (call.endedReason === 'assistant-end-call-function' || call.endedReason === 'customer-hangup') {
    confidence += 0.2
  }

  // Higher confidence if we extracted clear availability info
  if (extractedData.availability !== null) confidence += 0.1

  return Math.min(1.0, confidence)
}

/**
 * Update queue job status based on call results
 */
async function updateQueueJobFromCall(supabase: any, callRecord: any, extractedData: any) {
  try {
    const { data: queueJob } = await supabase
      .from('queue_jobs')
      .select('*')
      .eq('id', callRecord.job_id)
      .single()

    if (queueJob) {
      await supabase
        .from('queue_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          result_data: extractedData
        })
        .eq('id', queueJob.id)

      console.log(`✅ Updated queue job ${queueJob.id} with call results`)
    }
  } catch (error) {
    console.error('Error updating queue job:', error)
  }
}