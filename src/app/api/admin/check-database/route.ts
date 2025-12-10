import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Check if required tables exist
    const requiredTables = ['queue_jobs', 'calls', 'searches']
    const results: Record<string, boolean> = {}
    
    for (const tableName of requiredTables) {
      try {
        // Simple query to test if table exists and is accessible
        const { error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        results[tableName] = !error || error.code !== 'PGRST116' // PGRST116 is "table not found"
        
        if (error && error.code !== 'PGRST116' && error.code !== 'PGRST103') {
          console.log(`Table ${tableName} check warning:`, error.message)
        }
      } catch (tableError) {
        console.log(`Table ${tableName} check error:`, tableError)
        results[tableName] = false
      }
    }
    
    // Count existing records
    const counts: Record<string, number> = {}
    for (const tableName of requiredTables) {
      if (results[tableName]) {
        try {
          const { count, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true })
          
          counts[tableName] = count || 0
        } catch (countError) {
          counts[tableName] = -1
        }
      } else {
        counts[tableName] = -1
      }
    }
    
    const allTablesExist = Object.values(results).every(exists => exists)
    
    return NextResponse.json({
      success: true,
      tablesExist: allTablesExist,
      tables: results,
      counts,
      message: allTablesExist 
        ? 'All required tables exist and are accessible' 
        : 'Some required tables are missing or inaccessible'
    })
    
  } catch (error) {
    console.error('Database check error:', error)
    return NextResponse.json({
      success: false,
      tablesExist: false,
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}