/**
 * Vapi.ai Integration for Pharmacy Calling
 * Real AI voice calls to pharmacies
 */

interface VapiCall {
  id: string
  status: 'queued' | 'ringing' | 'in-progress' | 'forwarding' | 'ended'
  phoneNumber: string
  assistantId: string
  cost?: number
  endedReason?: string
  transcript?: string
  recordingUrl?: string
  createdAt: string
  updatedAt: string
  duration?: number
}

interface VapiCallRequest {
  phoneNumber: string
  assistantId: string
  variables?: Record<string, any>
  name?: string
  metadata?: Record<string, any>
}

export class VapiClient {
  private apiKey: string
  private baseUrl = 'https://api.vapi.ai'

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.VAPI_API_KEY || ''
    if (!this.apiKey) {
      throw new Error('VAPI_API_KEY environment variable is required')
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Vapi API error: ${response.status} ${error}`)
    }

    return response.json()
  }

  /**
   * Start a phone call with AI assistant
   */
  async createCall(request: VapiCallRequest): Promise<VapiCall> {
    return this.request('/call', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  /**
   * Get call details by ID
   */
  async getCall(callId: string): Promise<VapiCall> {
    return this.request(`/call/${callId}`)
  }

  /**
   * List recent calls with pagination
   */
  async listCalls(limit = 100, offset = 0): Promise<VapiCall[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    })
    
    return this.request(`/call?${params}`)
  }

  /**
   * End an active call
   */
  async endCall(callId: string): Promise<VapiCall> {
    return this.request(`/call/${callId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'ended' }),
    })
  }
}

/**
 * Create pharmacy call using Vapi.ai
 */
export async function createPharmacyCall(
  pharmacyPhone: string,
  medicationName: string,
  dosage: string,
  pharmacyName?: string
) {
  console.log(`📞 Starting Vapi.ai call to ${pharmacyName || pharmacyPhone} for ${medicationName} ${dosage}`)

  const vapi = new VapiClient()
  
  const assistantId = process.env.VAPI_ASSISTANT_ID
  if (!assistantId) {
    throw new Error('VAPI_ASSISTANT_ID environment variable is required')
  }

  try {
    const call = await vapi.createCall({
      phoneNumber: pharmacyPhone,
      assistantId: assistantId,
      name: `Pharmacy Call - ${medicationName}`,
      variables: {
        medicationName,
        dosage,
        pharmacyName: pharmacyName || 'pharmacy',
      },
      metadata: {
        searchType: 'pharmacy',
        medication: medicationName,
        dosage: dosage,
        pharmacyName: pharmacyName,
        timestamp: new Date().toISOString(),
      },
    })

    console.log(`✅ Vapi.ai call created: ${call.id}`)
    return call

  } catch (error) {
    console.error('❌ Vapi.ai call failed:', error)
    throw error
  }
}

/**
 * Monitor call status and get results
 */
export async function monitorPharmacyCall(callId: string) {
  const vapi = new VapiClient()
  
  try {
    const call = await vapi.getCall(callId)
    
    // Parse results from transcript or structured data
    const result = {
      id: call.id,
      status: call.status,
      duration: call.duration,
      transcript: call.transcript,
      recordingUrl: call.recordingUrl,
      cost: call.cost,
      endedReason: call.endedReason,
      // Extract medication availability from transcript/AI response
      extractedData: await extractMedicationInfo(call.transcript || ''),
      confidence: calculateConfidence(call),
    }

    return result

  } catch (error) {
    console.error('❌ Failed to monitor Vapi.ai call:', error)
    throw error
  }
}

/**
 * Extract medication information from call transcript
 */
async function extractMedicationInfo(transcript: string) {
  // This would use AI/NLP to extract structured data from transcript
  // For now, we'll use simple keyword detection
  
  const lowerTranscript = transcript.toLowerCase()
  
  // Look for availability keywords
  const inStockKeywords = ['in stock', 'available', 'have it', 'yes we have']
  const outOfStockKeywords = ['out of stock', 'not available', 'don\'t have', 'no we don\'t']
  
  const hasInStock = inStockKeywords.some(keyword => lowerTranscript.includes(keyword))
  const hasOutOfStock = outOfStockKeywords.some(keyword => lowerTranscript.includes(keyword))
  
  // Extract price if mentioned
  const priceMatch = transcript.match(/\$(\d+(?:\.\d{2})?)/g)
  const price = priceMatch ? parseFloat(priceMatch[0].replace('$', '')) : null
  
  return {
    availability: hasInStock ? true : hasOutOfStock ? false : null,
    price: price,
    notes: transcript.length > 0 ? 'Call completed with transcript' : 'No transcript available',
    call_date: new Date().toISOString(),
    raw_transcript: transcript,
  }
}

/**
 * Calculate confidence score based on call quality
 */
function calculateConfidence(call: VapiCall): number {
  let confidence = 0.5 // Base confidence
  
  // Higher confidence for longer calls (more conversation)
  if (call.duration && call.duration > 30) confidence += 0.2
  if (call.duration && call.duration > 60) confidence += 0.1
  
  // Higher confidence if call completed successfully  
  if (call.status === 'ended' && call.endedReason !== 'error') confidence += 0.2
  
  // Higher confidence if we have a transcript
  if (call.transcript && call.transcript.length > 50) confidence += 0.1
  
  return Math.min(1.0, confidence)
}

// Default export
export default VapiClient