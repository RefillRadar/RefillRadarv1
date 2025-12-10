import { Client } from '@upstash/qstash'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

// Initialize QStash client lazily to avoid build-time errors
let qstashClient: Client | null = null

export function getQStashClient(): Client {
  if (!qstashClient) {
    if (!process.env.QSTASH_URL || !process.env.QSTASH_TOKEN) {
      throw new Error('QSTASH_URL and QSTASH_TOKEN environment variables are required')
    }
    
    qstashClient = new Client({
      baseUrl: process.env.QSTASH_URL,
      token: process.env.QSTASH_TOKEN,
    })
  }
  
  return qstashClient
}

// Export for backward compatibility
export const qstash = {
  get publishJSON() {
    return getQStashClient().publishJSON.bind(getQStashClient())
  }
}

// Job types
export interface PharmacyCallJob {
  searchId: string
  pharmacyId: string
  pharmacyName: string
  pharmacyPhone: string
  pharmacyAddress: string
  medicationName: string
  dosage: string
  userId: string
  attempt: number
}

// Job status types
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'retry_scheduled'

// Business hours helper (9AM-7PM in pharmacy's timezone)
export function isBusinessHours(timezone: string = 'America/New_York'): boolean {
  const now = new Date()
  const pharmacyTime = toZonedTime(now, timezone)
  const hour = pharmacyTime.getHours()
  const day = pharmacyTime.getDay()
  
  // Monday-Friday, 9AM-7PM
  return day >= 1 && day <= 5 && hour >= 9 && hour < 19
}

// Calculate delay for business hours (next 9AM if outside hours)
export function getBusinessHoursDelay(timezone: string = 'America/New_York'): number {
  if (isBusinessHours(timezone)) return 0
  
  const now = new Date()
  const pharmacyTime = toZonedTime(now, timezone)
  
  const currentDay = pharmacyTime.getDay()
  const currentHour = pharmacyTime.getHours()
  
  let daysToAdd = 0
  
  // Calculate days to add for next business day
  if (currentDay === 0) { // Sunday
    daysToAdd = 1 // Monday
  } else if (currentDay === 6) { // Saturday  
    daysToAdd = 2 // Monday
  } else if (currentDay === 5 && currentHour >= 19) { // Friday after hours
    daysToAdd = 3 // Monday (Sat + Sun + Mon)
  } else if (currentDay >= 1 && currentDay <= 4 && currentHour >= 19) { // Mon-Thu after hours
    daysToAdd = 1 // Next day
  }
  
  // Create next business day at 9 AM in pharmacy timezone
  const nextBusinessDay = new Date(pharmacyTime)
  nextBusinessDay.setDate(nextBusinessDay.getDate() + daysToAdd)
  nextBusinessDay.setHours(9, 0, 0, 0)
  
  // Convert back to UTC
  const nextBusinessDayUtc = fromZonedTime(nextBusinessDay, timezone)
  
  return Math.max(0, (nextBusinessDayUtc.getTime() - now.getTime()) / 1000)
}

// Retry delays: 5 min → 30 min → 2 hours
export function getRetryDelay(attempt: number): number {
  const delays = [300, 1800, 7200] // seconds
  return delays[Math.min(attempt - 1, delays.length - 1)]
}