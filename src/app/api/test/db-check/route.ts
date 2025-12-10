import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Check if required tables exist by trying to query them
    const tableChecks = []
    
    try {
      const { count: searchCount } = await supabase
        .from('searches')
        .select('*', { count: 'exact', head: true })
      tableChecks.push({ table: 'searches', exists: true, count: searchCount })
    } catch (error) {
      tableChecks.push({ table: 'searches', exists: false, error: (error as Error).message })
    }

    try {
      const { count: queueCount } = await supabase
        .from('queue_jobs')
        .select('*', { count: 'exact', head: true })
      tableChecks.push({ table: 'queue_jobs', exists: true, count: queueCount })
    } catch (error) {
      tableChecks.push({ table: 'queue_jobs', exists: false, error: (error as Error).message })
    }

    try {
      const { count: callsCount } = await supabase
        .from('calls')
        .select('*', { count: 'exact', head: true })
      tableChecks.push({ table: 'calls', exists: true, count: callsCount })
    } catch (error) {
      tableChecks.push({ table: 'calls', exists: false, error: (error as Error).message })
    }

    try {
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
      tableChecks.push({ table: 'users', exists: true, count: usersCount })
    } catch (error) {
      tableChecks.push({ table: 'users', exists: false, error: (error as Error).message })
    }

    const allTablesExist = tableChecks.every(check => check.exists)
    const queueTablesExist = tableChecks.filter(check => 
      ['queue_jobs', 'calls'].includes(check.table)
    ).every(check => check.exists)

    return NextResponse.json({
      success: true,
      database_status: allTablesExist ? 'ready' : 'needs_setup',
      queue_system_ready: queueTablesExist,
      table_status: tableChecks,
      next_steps: allTablesExist 
        ? ['Database is ready!', 'Try running the queue tests']
        : ['Run database schema from /src/lib/database/schema.sql', 'Add test data from /scripts/setup-test-data.sql']
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      next_steps: ['Check your Supabase configuration', 'Verify SUPABASE_URL and SUPABASE_ANON_KEY in .env']
    }, { status: 500 })
  }
}