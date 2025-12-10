import { Client } from '@upstash/qstash'

if (!process.env.QSTASH_URL || !process.env.QSTASH_TOKEN) {
  throw new Error('QSTASH_URL and QSTASH_TOKEN environment variables are required')
}

export const qstash = new Client({
  baseUrl: process.env.QSTASH_URL,
  token: process.env.QSTASH_TOKEN,
})

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
  const pharmacyTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
  const hour = pharmacyTime.getHours()
  const day = pharmacyTime.getDay()
  
  // Monday-Friday, 9AM-7PM
  return day >= 1 && day <= 5 && hour >= 9 && hour < 19
}

// Calculate delay for business hours (next 9AM if outside hours)
export function getBusinessHoursDelay(timezone: string = 'America/New_York'): number {
  if (isBusinessHours(timezone)) return 0
  
  const now = new Date()
  const pharmacyTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
  const nextBusinessDay = new Date(pharmacyTime)
  
  // If it's Friday evening or weekend, move to Monday
  const currentDay = pharmacyTime.getDay()
  if (currentDay === 0) { // Sunday
    nextBusinessDay.setDate(nextBusinessDay.getDate() + 1)
  } else if (currentDay === 6) { // Saturday
    nextBusinessDay.setDate(nextBusinessDay.getDate() + 2)
  } else if (pharmacyTime.getHours() >= 19) { // After hours on weekday
    nextBusinessDay.setDate(nextBusinessDay.getDate() + 1)
  }
  
  // Set to 9AM
  nextBusinessDay.setHours(9, 0, 0, 0)
  
  return Math.max(0, nextBusinessDay.getTime() - now.getTime()) / 1000 // Return seconds
}

// Retry delays: 5 min → 30 min → 2 hours
export function getRetryDelay(attempt: number): number {
  const delays = [300, 1800, 7200] // seconds
  return delays[Math.min(attempt - 1, delays.length - 1)]
}