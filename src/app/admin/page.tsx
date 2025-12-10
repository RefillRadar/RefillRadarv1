"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Search, 
  Phone, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  BarChart3,
  Settings,
  LogOut,
  Filter,
  Download,
  Eye,
  Play,
  Check,
  X,
  MapPin,
  Pill,
  DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SearchTicket {
  id: string
  user_id: string
  medication_name: string
  dosage: string
  zipcode: string
  radius: number
  status: 'payment_completed' | 'calling_in_progress' | 'completed' | 'failed'
  created_at: string
  user_email: string
  user_name: string
  payment_amount?: number
  pharmacy_count?: number
  called_count?: number
  results_found?: number
  selected_pharmacies?: Array<{
    id: string
    name: string
    address: string
    phone: string
  }>
}

interface PharmacyResult {
  id: string
  name: string
  address: string
  phone: string
  status: 'pending' | 'calling' | 'completed' | 'failed'
  availability?: boolean
  price?: number
  notes?: string
  last_called?: string
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'tickets' | 'calls' | 'analytics'>('overview')
  const [searchTickets, setSearchTickets] = useState<SearchTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<SearchTicket | null>(null)
  const [pharmacyResults, setPharmacyResults] = useState<PharmacyResult[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [showPharmacyUpdates, setShowPharmacyUpdates] = useState(false)
  const [updatingPharmacy, setUpdatingPharmacy] = useState<{id: string, name: string} | null>(null)
  const [queueStats, setQueueStats] = useState<any>(null)
  const [selectedTicketJobs, setSelectedTicketJobs] = useState<any[]>([])
  const [showQueueDetails, setShowQueueDetails] = useState(false)

  // Check admin access - TEMPORARILY BYPASSED FOR TESTING
  useEffect(() => {
    // Skip auth check for testing - load data immediately
    loadSearchTickets()
    loadQueueStats()
    
    // Original auth check (commented out for testing)
    /*
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    
    if (!authLoading && user) {
      // Check if user has admin access  
      const adminEmails = ['nhr245@nyu.edu']
      const isAdmin = user.email?.endsWith('@refillradar.com') || 
                      adminEmails.includes(user.email || '') ||
                      user.user_metadata?.role === 'admin' ||
                      process.env.NODE_ENV !== 'production'
      
      if (!isAdmin) {
        router.push('/dashboard')
        return
      }
      
      loadSearchTickets()
      loadQueueStats()
    }
    */
  }, [])

  // Don't render admin interface until auth is confirmed - BYPASSED FOR TESTING
  // if (authLoading || !user) {
  //   return (
  //     <div className="min-h-screen bg-gray-900 flex items-center justify-center">
  //       <div className="text-white">Loading...</div>
  //     </div>
  //   )
  // }

  const loadSearchTickets = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/search-tickets')
      if (response.ok) {
        const data = await response.json()
        setSearchTickets(data.tickets || [])
      }
    } catch (error) {
      console.error('Failed to load search tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPharmacyResults = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/admin/pharmacy-results/${ticketId}`)
      if (response.ok) {
        const data = await response.json()
        setPharmacyResults(data.results || [])
      }
    } catch (error) {
      console.error('Failed to load pharmacy results:', error)
    }
  }

  const loadQueueStats = async () => {
    try {
      const response = await fetch('/api/admin/queue-stats')
      if (response.ok) {
        const data = await response.json()
        setQueueStats(data)
      }
    } catch (error) {
      console.error('Failed to load queue stats:', error)
    }
  }

  const loadTicketJobs = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/admin/queue-jobs/${ticketId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedTicketJobs(data.jobs || [])
      }
    } catch (error) {
      console.error('Failed to load ticket jobs:', error)
    }
  }

  const startCalling = async (ticketId: string) => {
    try {
      const response = await fetch('/api/admin/start-calling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId })
      })
      
      if (response.ok) {
        loadSearchTickets()
        if (selectedTicket?.id === ticketId) {
          loadPharmacyResults(ticketId)
        }
      }
    } catch (error) {
      console.error('Failed to start calling:', error)
    }
  }

  const markSearchComplete = async (ticketId: string) => {
    try {
      const response = await fetch('/api/admin/complete-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId })
      })
      
      if (response.ok) {
        loadSearchTickets()
        setSelectedTicket(null)
      }
    } catch (error) {
      console.error('Failed to complete search:', error)
    }
  }

  const updatePharmacyResult = async (pharmacyId: string, availability: boolean, price?: number, notes?: string) => {
    if (!selectedTicket) return
    
    try {
      const response = await fetch('/api/admin/update-pharmacy-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchId: selectedTicket.id,
          pharmacyId,
          availability: availability.toString(),
          price,
          notes
        })
      })
      
      if (response.ok) {
        // Refresh the selected ticket data
        loadSearchTickets()
        loadPharmacyResults(selectedTicket.id)
        setUpdatingPharmacy(null)
      }
    } catch (error) {
      console.error('Failed to update pharmacy result:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'payment_completed': return 'bg-blue-500/20 text-blue-300'
      case 'calling_in_progress': return 'bg-orange-500/20 text-orange-300'
      case 'completed': return 'bg-green-500/20 text-green-300'
      case 'failed': return 'bg-red-500/20 text-red-300'
      default: return 'bg-gray-500/20 text-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'payment_completed': return <Clock className="h-4 w-4" />
      case 'calling_in_progress': return <Phone className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'failed': return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const filteredTickets = searchTickets.filter(ticket => 
    filterStatus === 'all' || ticket.status === filterStatus
  )

  const stats = {
    total: searchTickets.length,
    pending: searchTickets.filter(t => t.status === 'payment_completed').length,
    inProgress: searchTickets.filter(t => t.status === 'calling_in_progress').length,
    completed: searchTickets.filter(t => t.status === 'completed').length,
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Search className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">RefillRadar</h1>
              <p className="text-gray-400 text-xs">Admin Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'tickets', label: 'Search Tickets', icon: Search },
            { id: 'calls', label: 'Calling Queue', icon: Phone },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white capitalize">{activeTab}</h2>
              <p className="text-gray-400 text-sm">Manage pharmacy search requests and calling operations</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" className="border-gray-600 text-gray-300">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-400">Total Searches</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{stats.total}</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-400">Pending</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-400">{stats.pending}</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-400">In Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-400">{stats.inProgress}</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-400">Completed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Queue Stats Cards */}
              {queueStats && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
                  <Card className="bg-gray-900 border-gray-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-400">Queue Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-400">{queueStats.pending_jobs + queueStats.processing_jobs}</div>
                      <div className="text-xs text-gray-500">Active Jobs</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gray-900 border-gray-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-400">Success Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-400">{queueStats.success_rate}%</div>
                      <div className="text-xs text-gray-500">24h Average</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gray-900 border-gray-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-400">Avg Call Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-400">{Math.round(queueStats.avg_processing_time_seconds || 0)}s</div>
                      <div className="text-xs text-gray-500">Processing Time</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gray-900 border-gray-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-400">Confidence</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-400">{queueStats.avg_confidence_score}%</div>
                      <div className="text-xs text-gray-500">AI Accuracy</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gray-900 border-gray-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-400">Retries</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-yellow-400">{queueStats.retry_scheduled_jobs}</div>
                      <div className="text-xs text-gray-500">Scheduled</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Recent Activity */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Recent Search Requests</CardTitle>
                  <CardDescription className="text-gray-400">Latest pharmacy search tickets</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {searchTickets.slice(0, 5).map(ticket => (
                      <div key={ticket.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-lg ${getStatusColor(ticket.status)}`}>
                            {getStatusIcon(ticket.status)}
                          </div>
                          <div>
                            <div className="text-white font-medium">{ticket.medication_name} {ticket.dosage}</div>
                            <div className="text-gray-400 text-sm">{ticket.user_name || ticket.user_email}</div>
                          </div>
                        </div>
                        <Badge variant="secondary" className={getStatusColor(ticket.status)}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="flex h-full space-x-6">
              {/* Tickets List */}
              <div className="w-1/2 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2"
                    >
                      <option value="all">All Status</option>
                      <option value="payment_completed">Pending</option>
                      <option value="calling_in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                  <div className="text-gray-400 text-sm">{filteredTickets.length} tickets</div>
                </div>

                <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {filteredTickets.map(ticket => (
                    <Card 
                      key={ticket.id} 
                      className={`bg-gray-900 border-gray-700 cursor-pointer transition-all hover:bg-gray-800 ${
                        selectedTicket?.id === ticket.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => {
                        setSelectedTicket(ticket)
                        loadPharmacyResults(ticket.id)
                        loadTicketJobs(ticket.id)
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="text-white font-medium">{ticket.medication_name}</div>
                            <div className="text-gray-400 text-sm">{ticket.dosage}</div>
                          </div>
                          <Badge className={getStatusColor(ticket.status)}>
                            {ticket.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-gray-400">User:</div>
                          <div className="text-gray-300">{ticket.user_name || ticket.user_email}</div>
                          <div className="text-gray-400">Location:</div>
                          <div className="text-gray-300">{ticket.zipcode}</div>
                          <div className="text-gray-400">Radius:</div>
                          <div className="text-gray-300">{ticket.radius} miles</div>
                          <div className="text-gray-400">Created:</div>
                          <div className="text-gray-300">{new Date(ticket.created_at).toLocaleDateString()}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Ticket Details */}
              <div className="w-1/2">
                {selectedTicket ? (
                  <Card className="bg-gray-900 border-gray-700 h-full">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-white flex items-center space-x-2">
                            <Pill className="h-5 w-5 text-blue-400" />
                            <span>{selectedTicket.medication_name} {selectedTicket.dosage}</span>
                          </CardTitle>
                          <CardDescription className="text-gray-400 mt-1">
                            Search ID: {selectedTicket.id}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(selectedTicket.status)}>
                          {selectedTicket.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      {/* User Info */}
                      <div className="bg-gray-800 rounded-lg p-4">
                        <h3 className="text-white font-medium mb-3 flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>Customer Information</span>
                        </h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="text-gray-400">Name:</div>
                          <div className="text-gray-300">{selectedTicket.user_name || 'N/A'}</div>
                          <div className="text-gray-400">Email:</div>
                          <div className="text-gray-300">{selectedTicket.user_email}</div>
                          <div className="text-gray-400">Payment:</div>
                          <div className="text-green-400">${selectedTicket.payment_amount || 0}</div>
                        </div>
                      </div>

                      {/* Search Details */}
                      <div className="bg-gray-800 rounded-lg p-4">
                        <h3 className="text-white font-medium mb-3 flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span>Search Parameters</span>
                        </h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="text-gray-400">Location:</div>
                          <div className="text-gray-300">{selectedTicket.zipcode}</div>
                          <div className="text-gray-400">Radius:</div>
                          <div className="text-gray-300">{selectedTicket.radius} miles</div>
                          <div className="text-gray-400">Target Pharmacies:</div>
                          <div className="text-gray-300">{selectedTicket.pharmacy_count || 0}</div>
                          <div className="text-gray-400">Created:</div>
                          <div className="text-gray-300">{new Date(selectedTicket.created_at).toLocaleString()}</div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-3">
                        {selectedTicket.status === 'payment_completed' && (
                          <Button 
                            onClick={() => startCalling(selectedTicket.id)}
                            className="w-full bg-orange-600 hover:bg-orange-700"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Start Calling Pharmacies
                          </Button>
                        )}
                        
                        {selectedTicket.status === 'calling_in_progress' && (
                          <Button 
                            onClick={() => markSearchComplete(selectedTicket.id)}
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Mark as Complete
                          </Button>
                        )}

                        <Button 
                          variant="outline" 
                          className="w-full border-gray-600 text-gray-300"
                          onClick={() => setShowPharmacyUpdates(!showPharmacyUpdates)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {showPharmacyUpdates ? 'Hide' : 'Show'} Selected Pharmacies ({selectedTicket.selected_pharmacies?.length || 0})
                        </Button>

                        {selectedTicket.status === 'calling_in_progress' && (
                          <Button 
                            variant="outline" 
                            className="w-full border-orange-600 text-orange-300"
                            onClick={() => setShowQueueDetails(!showQueueDetails)}
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            {showQueueDetails ? 'Hide' : 'Show'} Queue Status ({selectedTicketJobs.length} jobs)
                          </Button>
                        )}
                      </div>

                      {/* Selected Pharmacies & Manual Updates */}
                      {showPharmacyUpdates && selectedTicket.selected_pharmacies && selectedTicket.selected_pharmacies.length > 0 && (
                        <div className="bg-gray-800 rounded-lg p-4">
                          <h3 className="text-white font-medium mb-3">Selected Pharmacies - Manual Updates</h3>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {selectedTicket.selected_pharmacies.map(pharmacy => (
                              <div key={pharmacy.id} className="bg-gray-700 rounded-lg p-3">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <div className="text-white font-medium">{pharmacy.name}</div>
                                    <div className="text-gray-400 text-xs">{pharmacy.address}</div>
                                    <div className="text-gray-400 text-xs">{pharmacy.phone}</div>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => setUpdatingPharmacy({id: pharmacy.id, name: pharmacy.name})}
                                    className="bg-blue-600 hover:bg-blue-700 text-xs"
                                  >
                                    Update Status
                                  </Button>
                                </div>
                                
                                {/* Show current results if any */}
                                {/* Note: We'll need to check the search metadata for existing results */}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Queue Job Status */}
                      {showQueueDetails && selectedTicketJobs.length > 0 && (
                        <div className="bg-gray-800 rounded-lg p-4">
                          <h3 className="text-white font-medium mb-3 flex items-center space-x-2">
                            <Phone className="h-4 w-4" />
                            <span>Queue Job Status</span>
                          </h3>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {selectedTicketJobs.map(job => (
                              <div key={job.id} className="bg-gray-700 rounded-lg p-3">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1">
                                    <div className="text-white font-medium">{job.pharmacy_name}</div>
                                    <div className="text-gray-400 text-xs">{job.pharmacy_phone}</div>
                                    <div className="text-gray-400 text-xs">Attempt {job.attempt}/{job.max_attempts}</div>
                                  </div>
                                  <div className="flex flex-col items-end space-y-1">
                                    <Badge className={
                                      job.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                                      job.status === 'processing' ? 'bg-orange-500/20 text-orange-300' :
                                      job.status === 'failed' ? 'bg-red-500/20 text-red-300' :
                                      job.status === 'retry_scheduled' ? 'bg-yellow-500/20 text-yellow-300' :
                                      'bg-blue-500/20 text-blue-300'
                                    }>
                                      {job.status}
                                    </Badge>
                                    {job.scheduled_for && new Date(job.scheduled_for) > new Date() && (
                                      <div className="text-xs text-gray-500">
                                        Next: {new Date(job.scheduled_for).toLocaleTimeString()}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Show call results if available */}
                                {job.result_data && (
                                  <div className="mt-2 p-2 bg-gray-600 rounded text-xs">
                                    <div className="text-gray-300">
                                      <span className="font-medium">Result:</span> {
                                        job.result_data.availability ? 
                                        <span className="text-green-400">In Stock</span> : 
                                        <span className="text-red-400">Out of Stock</span>
                                      }
                                    </div>
                                    {job.result_data.price && (
                                      <div className="text-gray-300">
                                        <span className="font-medium">Price:</span> ${job.result_data.price}
                                      </div>
                                    )}
                                    {job.result_data.notes && (
                                      <div className="text-gray-300">
                                        <span className="font-medium">Notes:</span> {job.result_data.notes}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Show error if failed */}
                                {job.status === 'failed' && job.error_message && (
                                  <div className="mt-2 p-2 bg-red-900/20 border border-red-500/20 rounded text-xs">
                                    <div className="text-red-400">
                                      <span className="font-medium">Error:</span> {job.error_message}
                                    </div>
                                  </div>
                                )}

                                {/* Show timing info */}
                                {(job.started_at || job.completed_at) && (
                                  <div className="mt-2 flex space-x-4 text-xs text-gray-500">
                                    {job.started_at && (
                                      <span>Started: {new Date(job.started_at).toLocaleTimeString()}</span>
                                    )}
                                    {job.completed_at && (
                                      <span>Completed: {new Date(job.completed_at).toLocaleTimeString()}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pharmacy Update Modal */}
                      {updatingPharmacy && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                          <div className="bg-gray-800 rounded-lg p-6 w-96">
                            <h3 className="text-white text-lg font-medium mb-4">
                              Update: {updatingPharmacy.name}
                            </h3>
                            
                            <div className="space-y-4">
                              <div>
                                <label className="text-gray-300 text-sm block mb-2">Availability</label>
                                <select 
                                  id="availability"
                                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2"
                                  defaultValue=""
                                >
                                  <option value="">Select availability...</option>
                                  <option value="true">In Stock</option>
                                  <option value="false">Out of Stock</option>
                                </select>
                              </div>
                              
                              <div>
                                <label className="text-gray-300 text-sm block mb-2">Price (optional)</label>
                                <input
                                  id="price"
                                  type="number"
                                  step="0.01"
                                  placeholder="Enter price"
                                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2"
                                />
                              </div>
                              
                              <div>
                                <label className="text-gray-300 text-sm block mb-2">Notes (optional)</label>
                                <textarea
                                  id="notes"
                                  rows={3}
                                  placeholder="Additional notes..."
                                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2"
                                />
                              </div>
                            </div>
                            
                            <div className="flex space-x-3 mt-6">
                              <Button
                                onClick={() => {
                                  const availability = (document.getElementById('availability') as HTMLSelectElement).value
                                  const price = parseFloat((document.getElementById('price') as HTMLInputElement).value) || undefined
                                  const notes = (document.getElementById('notes') as HTMLTextAreaElement).value || undefined
                                  
                                  if (availability !== '') {
                                    updatePharmacyResult(updatingPharmacy.id, availability === 'true', price, notes)
                                  }
                                }}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                Save Update
                              </Button>
                              <Button
                                onClick={() => setUpdatingPharmacy(null)}
                                variant="outline"
                                className="flex-1 border-gray-600 text-gray-300"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-900 border border-gray-700 rounded-lg">
                    <div className="text-center">
                      <Search className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                      <div className="text-gray-400">Select a search ticket to view details</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'calls' && (
            <div className="text-center py-20">
              <Phone className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <div className="text-gray-400 text-xl">Calling Queue</div>
              <div className="text-gray-500 mt-2">Coming soon - Real-time call monitoring</div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="text-center py-20">
              <BarChart3 className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <div className="text-gray-400 text-xl">Analytics Dashboard</div>
              <div className="text-gray-500 mt-2">Coming soon - Performance metrics and insights</div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}