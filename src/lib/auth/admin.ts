import { createClient } from '@/lib/supabase/server'

export async function checkAdminAuth() {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { isAdmin: false, user: null, error: 'Unauthorized' }
  }

  // Admin email whitelist for production
  const adminEmails = [
    'nhr245@nyu.edu',
    // Add more admin emails as needed
  ]
  
  const isAdmin = user.email?.endsWith('@refillradar.com') || 
                  adminEmails.includes(user.email || '') ||
                  user.user_metadata?.role === 'admin' ||
                  process.env.NODE_ENV !== 'production'
  
  if (!isAdmin) {
    return { isAdmin: false, user, error: 'Forbidden - Admin access required' }
  }
  
  return { isAdmin: true, user, error: null }
}