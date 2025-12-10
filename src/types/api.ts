// API response types for consistent error handling

export interface ApiErrorResponse {
  error: {
    code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'BAD_REQUEST' | 'NOT_FOUND' | 'INTERNAL_ERROR'
    message: string
  }
}

export interface ApiSuccessResponse<T = any> {
  data?: T
  message?: string
  [key: string]: any
}

// Admin-specific error response
export interface AdminErrorResponse {
  error: {
    code: 'UNAUTHORIZED' | 'FORBIDDEN'
    message: string
  }
}

// Type guard for API error responses
export function isApiErrorResponse(response: any): response is ApiErrorResponse {
  return response && response.error && typeof response.error.code === 'string'
}

// Type guard for admin error responses  
export function isAdminErrorResponse(response: any): response is AdminErrorResponse {
  return response && response.error && 
    (response.error.code === 'UNAUTHORIZED' || response.error.code === 'FORBIDDEN')
}