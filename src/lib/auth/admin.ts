import { createClient } from '@/lib/supabase/server'

export async function checkAdminAuth() {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { isAdmin: false, user: null, error: 'Unauthorized' }
  }

  // TODO: Add proper admin role checking
  // For now, allowing all authenticated users to access admin
  // In production, you should check user.user_metadata.role === 'admin'
  // or query a separate roles table
  
  const isAdmin = user.email?.endsWith('@refillradar.com') || 
                  user.user_metadata?.role === 'admin' ||
                  process.env.NODE_ENV !== 'production'
  
  if (!isAdmin) {
    return { isAdmin: false, user, error: 'Forbidden - Admin access required' }
  }
  
  return { isAdmin: true, user, error: null }
}