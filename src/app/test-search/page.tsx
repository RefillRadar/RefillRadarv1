"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'

export default function TestSearchPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')
  const [sessionId, setSessionId] = useState('cs_test_example_session_id_placeholder')

  // Production guard - redirect in production unless admin
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      if (!authLoading && !user) {
        router.push('/login')
        return
      }
      
      if (!authLoading && user) {
        const isAdmin = user.email?.endsWith('@refillradar.com') || 
                        user.user_metadata?.role === 'admin'
        
        if (!isAdmin) {
          router.push('/dashboard')
          return
        }
      }
    }
  }, [user, authLoading, router])

  // Don't render in production for non-admin users
  if (process.env.NODE_ENV === 'production' && (!user || (!user.email?.endsWith('@refillradar.com') && user.user_metadata?.role !== 'admin'))) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Page Not Found</h1>
          <p className="text-gray-400">This development tool is not available in production.</p>
        </div>
      </div>
    )
  }

  const createTestSearch = async () => {
    if (!user) {
      setResult('Please login first')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/manual-create-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medication: 'Lisinopril',
          dosage: '10mg',
          zipcode: '10001',
          radius: '5',
          sessionId: 'test_' + Date.now()
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setResult(`✅ Success! Created search with ID: ${data.search_id}`)
      } else {
        setResult(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setResult(`❌ Network error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const debugSession = async () => {
    if (!sessionId.trim()) {
      setResult('❌ Please enter a session ID')
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch('/api/debug-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: sessionId.trim() })
      })

      const data = await response.json()
      
      if (response.ok) {
        setResult(`🔍 Session Debug:\n${JSON.stringify(data.session, null, 2)}`)
      } else {
        setResult(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setResult(`❌ Network error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const processExistingSession = async () => {
    if (!sessionId.trim()) {
      setResult('❌ Please enter a session ID')
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch('/api/process-existing-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: sessionId.trim() })
      })

      const data = await response.json()
      
      if (response.ok) {
        setResult(`✅ Success! ${data.message}\nSearch ID: ${data.search_id}`)
      } else {
        setResult(`❌ Error: ${data.error}\nDetails: ${JSON.stringify(data, null, 2)}`)
      }
    } catch (error) {
      setResult(`❌ Network error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-8">Search Testing Page</h1>
        
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-white mb-4">User Info</h2>
            {user ? (
              <div className="text-gray-300">
                <p>User ID: {user.id}</p>
                <p>Email: {user.email}</p>
              </div>
            ) : (
              <p className="text-red-400">Please login first</p>
            )}
          </div>

          <div className="bg-gray-800 p-6 rounded-lg space-y-4">
            <h2 className="text-lg font-semibold text-white">Actions</h2>
            
            <Button 
              onClick={createTestSearch}
              disabled={loading || !user}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Creating...' : 'Create Test Search Record'}
            </Button>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Session ID for debugging/processing:
              </label>
              <Input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="Enter Stripe session ID (cs_...)"
                className="w-full"
              />
            </div>
            
            <Button 
              onClick={debugSession}
              disabled={loading || !sessionId.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Debugging...' : 'Debug Session'}
            </Button>
            
            <Button 
              onClick={processExistingSession}
              disabled={loading || !sessionId.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {loading ? 'Processing...' : 'Process Existing Session'}
            </Button>
          </div>

          {result && (
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-white mb-4">Result</h2>
              <pre className="text-gray-300 text-sm whitespace-pre-wrap overflow-auto">
                {result}
              </pre>
            </div>
          )}

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-white mb-4">Next Steps</h2>
            <div className="text-gray-300 space-y-2">
              <p>1. Click "Create Test Search Record" to manually create a search</p>
              <p>2. Go to <a href="/dashboard" className="text-blue-400 underline">Dashboard</a> → Previous Searches tab</p>
              <p>3. Check if the search appears in the list</p>
              <p>4. Go to <a href="/admin" className="text-purple-400 underline">Admin Dashboard</a> to see it as a ticket</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}