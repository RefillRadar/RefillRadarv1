import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: { searchId: string } }
) {
  try {
    // Check admin authentication - BYPASSED FOR TESTING
    // const { isAdmin, error: authError } = await checkAdminAuth()
    // 
    // if (!isAdmin) {
    //   return NextResponse.json(
    //     { error: authError || 'Admin access required' },
    //     { status: authError === 'Unauthorized' ? 401 : 403 }
    //   )
    // }
    
    const supabase = createClient()
    const { searchId } = params
    
    // Get all jobs for this search - simplified without relationship
    const { data: jobs, error: jobsError } = await supabase
      .from('queue_jobs')
      .select('*')
      .eq('search_id', searchId)
      .order('created_at', { ascending: true })

    if (jobsError) {
      console.error('Error fetching queue jobs:', jobsError)
      return NextResponse.json(
        { error: 'Failed to fetch queue jobs' },
        { status: 500 }
      )
    }

    // Calculate progress metrics
    const totalJobs = jobs.length
    const completedJobs = jobs.filter(job => job.status === 'completed').length
    const failedJobs = jobs.filter(job => job.status === 'failed').length
    const pendingJobs = jobs.filter(job => ['pending', 'retry_scheduled'].includes(job.status)).length
    const processingJobs = jobs.filter(job => job.status === 'processing').length

    const progress = totalJobs > 0 ? ((completedJobs + failedJobs) / totalJobs) * 100 : 0

    // Get search details
    const { data: search, error: searchError } = await supabase
      .from('searches')
      .select('*')
      .eq('id', searchId)
      .single()

    if (searchError) {
      console.error('Error fetching search details:', searchError)
    }

    return NextResponse.json({
      search_id: searchId,
      search_details: search,
      jobs: jobs || [],
      metrics: {
        total_jobs: totalJobs,
        completed_jobs: completedJobs,
        failed_jobs: failedJobs,
        pending_jobs: pendingJobs,
        processing_jobs: processingJobs,
        progress_percentage: Math.round(progress * 100) / 100,
        success_rate: totalJobs > 0 ? Math.round((completedJobs / (completedJobs + failedJobs)) * 10000) / 100 : 0
      }
    })

  } catch (error) {
    console.error('Queue jobs API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}