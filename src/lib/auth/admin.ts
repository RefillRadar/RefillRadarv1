import { createClient } from '@/lib/supabase/server'

// Structured error types for admin authentication
export interface AdminAuthError {
  code: 'UNAUTHORIZED' | 'FORBIDDEN'
  message: string
}

export interface AdminAuthSuccess {
  isAdmin: true
  user: any
  error: null
}

export interface AdminAuthFailure {
  isAdmin: false
  user: any | null
  error: AdminAuthError
}

export type AdminAuthResult = AdminAuthSuccess | AdminAuthFailure

// Helper function to create structured errors
function createAuthError(code: AdminAuthError['code'], message: string): AdminAuthError {
  return { code, message }
}

// Helper function for backward compatibility with legacy string errors
export function mapLegacyErrorToCode(legacyError: string): AdminAuthError['code'] {
  if (legacyError === 'Unauthorized' || legacyError.toLowerCase().includes('unauthorized')) {
    return 'UNAUTHORIZED'
  }
  return 'FORBIDDEN'
}

// Helper function to create standardized error responses for admin endpoints
export function createAdminErrorResponse(authError: AdminAuthError | string) {
  const error = typeof authError === 'string' ? 
    { code: mapLegacyErrorToCode(authError), message: authError } : 
    authError
    
  const statusCode = error.code === 'UNAUTHORIZED' ? 401 : 403
  
  return {
    body: { error },
    status: statusCode
  }
}

export async function checkAdminAuth(): Promise<AdminAuthResult> {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { 
      isAdmin: false, 
      user: null, 
      error: createAuthError('UNAUTHORIZED', 'Authentication required')
    }
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
    return { 
      isAdmin: false, 
      user, 
      error: createAuthError('FORBIDDEN', 'Admin access required')
    }
  }
  
  return { isAdmin: true, user, error: null }
}