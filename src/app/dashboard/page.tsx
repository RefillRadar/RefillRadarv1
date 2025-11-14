"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import dynamic from 'next/dynamic'
import { Heart, MapPin, Search, DollarSign, Clock, CheckCircle, AlertCircle, LogOut, CreditCard, History, RefreshCw } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

// Dynamically import the Map component to avoid SSR issues
const Map = dynamic(() => import('@/components/map'), {
  ssr: false,
  loading: () => <div className="w-full h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">Loading map...</div>
})

// Mock pharmacy data
const mockPharmacies = [
  { id: '1', name: 'CVS Pharmacy', address: '123 Main St, Anytown, NY 12345', lat: 40.7589, lng: -73.9851, phone: '(555) 123-4567' },
  { id: '2', name: 'Walgreens', address: '456 Oak Ave, Anytown, NY 12345', lat: 40.7614, lng: -73.9776, phone: '(555) 234-5678' },
  { id: '3', name: 'Rite Aid', address: '789 Pine Rd, Anytown, NY 12345', lat: 40.7505, lng: -73.9934, phone: '(555) 345-6789' },
  { id: '4', name: 'Local Pharmacy', address: '321 Elm St, Anytown, NY 12345', lat: 40.7648, lng: -73.9808, phone: '(555) 456-7890' },
]

export default function Dashboard() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [zipCode, setZipCode] = useState('')
  const [radius, setRadius] = useState([5])
  const [medication, setMedication] = useState('')
  const [dosage, setDosage] = useState('')
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7589, -73.9851])
  const [pharmacies, setPharmacies] = useState(mockPharmacies)
  const [isSearching, setIsSearching] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [previousSearches, setPreviousSearches] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'search' | 'history'>('search')
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (user) {
      loadPreviousSearches()
    }
  }, [user, loading, router])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const loadPreviousSearches = async () => {
    try {
      setLoadingHistory(true)
      const response = await fetch('/api/search')
      if (response.ok) {
        const data = await response.json()
        setPreviousSearches(data.searches || [])
      }
    } catch (error) {
      console.error('Failed to load previous searches:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const loadSearchResults = async (searchId: string) => {
    try {
      const response = await fetch(`/api/search/${searchId}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.results.map((result: any) => ({
          id: result.pharmacy_id,
          name: result.pharmacy_name,
          address: result.address,
          lat: parseFloat(result.latitude),
          lng: parseFloat(result.longitude),
          phone: result.phone,
          availability: result.availability ? 'In Stock' : 'Out of Stock',
          price: result.price ? `$${result.price}` : 'N/A',
          confidence: result.confidence_score,
          lastChecked: new Date(result.last_called).toLocaleDateString()
        })))
      }
    } catch (error) {
      console.error('Failed to load search results:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleSearch = async () => {
    if (!medication || !zipCode) {
      alert('Please enter both medication and zip code')
      return
    }
    
    setShowPayment(true)
  }

  const createNewSearch = async () => {
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medication_name: medication,
          dosage: dosage,
          zipcode: zipCode,
          radius: radius[0]
        })
      })

      if (response.ok) {
        const data = await response.json()
        return data.search_id
      } else {
        throw new Error('Failed to create search')
      }
    } catch (error) {
      console.error('Error creating search:', error)
      throw error
    }
  }

  const handlePaymentChoice = async (choice: 'per-search' | 'subscription') => {
    setShowPayment(false)
    setIsSearching(true)
    
    try {
      // Create search record in database
      const searchId = await createNewSearch()
      
      // Get real pharmacy data
      const pharmacyResponse = await fetch(`/api/pharmacies?zipcode=${zipCode}&radius=${radius[0]}`)
      if (pharmacyResponse.ok) {
        const pharmacyData = await pharmacyResponse.json()
        
        // Update map center
        if (pharmacyData.center) {
          setMapCenter([pharmacyData.center.lat, pharmacyData.center.lng])
        }
        
        // Update pharmacies list for map
        setPharmacies(pharmacyData.pharmacies.map((p: any) => ({
          id: p.id,
          name: p.name,
          address: p.address,
          lat: p.latitude,
          lng: p.longitude,
          phone: p.phone
        })))
        
        // Set search results
        const results = pharmacyData.pharmacies.map((pharmacy: any) => ({
          id: pharmacy.id,
          name: pharmacy.name,
          address: pharmacy.address,
          lat: pharmacy.latitude,
          lng: pharmacy.longitude,
          phone: pharmacy.phone,
          availability: pharmacy.availability ? 'In Stock' : 'Out of Stock',
          price: pharmacy.price ? `$${pharmacy.price}` : 'N/A',
          confidence: pharmacy.confidence_score,
          lastChecked: pharmacy.last_called ? new Date(pharmacy.last_called).toLocaleDateString() : 'Just now',
          distance: pharmacy.distance
        }))
        
        setSearchResults(results)
        
        // Save results to database
        await fetch(`/api/search/${searchId}/results`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            results: pharmacyData.pharmacies.map((p: any) => ({
              pharmacy_id: p.id,
              pharmacy_name: p.name,
              address: p.address,
              phone: p.phone,
              latitude: p.latitude,
              longitude: p.longitude,
              price: p.price,
              availability: p.availability,
              confidence_score: p.confidence_score,
              last_called: new Date().toISOString()
            }))
          })
        })
        
        // Refresh previous searches
        loadPreviousSearches()
      }
    } catch (error) {
      console.error('Search error:', error)
      alert('Search failed. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2 text-white">
              <Heart className="h-8 w-8 text-cyan-400" />
              <span className="text-2xl font-bold">RefillRadar</span>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-white">
                Welcome back, {user.user_metadata?.full_name || user.email}!
              </span>
              <Button 
                onClick={handleSignOut}
                variant="ghost" 
                className="text-white hover:text-red-300"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Search Form & Previous Searches */}
          <div className="lg:col-span-1">
            {/* Tab Navigation */}
            <div className="flex mb-6">
              <button
                onClick={() => setActiveTab('search')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-l-lg border ${
                  activeTab === 'search'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700'
                }`}
              >
                <Search className="h-4 w-4 inline mr-2" />
                New Search
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-r-lg border-t border-r border-b ${
                  activeTab === 'history'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700'
                }`}
              >
                <History className="h-4 w-4 inline mr-2" />
                Previous Searches ({previousSearches.length})
              </button>
            </div>

            {activeTab === 'search' && (
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-600/30 rounded-2xl p-8 text-white">
              <div className="mb-6">
                <h3 className="flex items-center space-x-2 text-2xl font-semibold text-white mb-2">
                  <Search className="h-6 w-6 text-blue-400" />
                  <span>Find Your Medication</span>
                </h3>
                <p className="text-gray-300">
                  Enter your prescription details to find nearby pharmacies
                </p>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-200">Medication Name</label>
                  <Input
                    value={medication}
                    onChange={(e) => setMedication(e.target.value)}
                    placeholder="e.g., Lisinopril"
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-200">Dosage</label>
                  <Input
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="e.g., 10mg"
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-200">Zip Code</label>
                  <Input
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="12345"
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-gray-200">
                      Search Radius
                    </label>
                    <span className="text-sm font-semibold text-blue-400 bg-blue-500/20 px-3 py-1 rounded-full border border-blue-400/30">
                      {radius[0]} miles
                    </span>
                  </div>
                  <div className="px-2">
                    <Slider
                      value={radius}
                      onValueChange={setRadius}
                      max={25}
                      min={1}
                      step={1}
                      className="w-full slider-enhanced"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-300 px-2">
                    <span>1 mile</span>
                    <span>25 miles</span>
                  </div>
                </div>

                <Button 
                  onClick={handleSearch}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg rounded-lg"
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <>
                      <Clock className="animate-spin h-4 w-4 mr-2" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search Pharmacies
                    </>
                  )}
                </Button>

                <div className="text-xs text-gray-400 text-center">
                  Found pharmacies will be called automatically to check availability
                </div>
              </div>
            </div>
            )}

            {activeTab === 'history' && (
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-600/30 rounded-2xl p-8 text-white">
                <div className="mb-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-semibold text-white mb-2">Previous Searches</h3>
                    <Button
                      onClick={loadPreviousSearches}
                      disabled={loadingHistory}
                      size="sm"
                      className="bg-gray-700 hover:bg-gray-600"
                    >
                      <RefreshCw className={`h-4 w-4 ${loadingHistory ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  <p className="text-gray-300">
                    View and reload your previous medication searches
                  </p>
                </div>
                <div className="space-y-3">
                  {loadingHistory ? (
                    <div className="text-center py-8">
                      <Clock className="animate-spin h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-400">Loading searches...</p>
                    </div>
                  ) : previousSearches.length === 0 ? (
                    <div className="text-center py-8">
                      <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-400">No previous searches found</p>
                    </div>
                  ) : (
                    previousSearches.map((search) => (
                      <div key={search.id} className="p-4 bg-gray-800 rounded-lg border border-gray-600/30">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{search.medication_name}</h4>
                            {search.dosage && <p className="text-sm text-gray-400">{search.dosage}</p>}
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            search.status === 'completed' 
                              ? 'bg-green-500/20 text-green-300' 
                              : search.status === 'failed'
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-yellow-500/20 text-yellow-300'
                          }`}>
                            {search.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-gray-300">
                          <span>{search.zipcode} • {search.radius} miles</span>
                          <span>{new Date(search.created_at).toLocaleDateString()}</span>
                        </div>
                        {search.status === 'completed' && (
                          <Button
                            onClick={() => {
                              setMedication(search.medication_name)
                              setDosage(search.dosage || '')
                              setZipCode(search.zipcode)
                              setRadius([search.radius])
                              loadSearchResults(search.id)
                              setActiveTab('search')
                            }}
                            size="sm"
                            className="mt-3 w-full bg-blue-600 hover:bg-blue-700"
                          >
                            View Results ({search.results_count} pharmacies)
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-6 bg-gray-900/50 backdrop-blur-sm border border-gray-600/30 rounded-2xl p-8 text-white">
                <div className="mb-6">
                  <h3 className="text-2xl font-semibold text-white mb-2">Search Results</h3>
                  <p className="text-gray-300">
                    {medication} {dosage} - {searchResults.length} pharmacies checked
                  </p>
                </div>
                <div>
                  <div className="space-y-3">
                    {searchResults.map((result) => (
                      <div key={result.id} className="p-3 bg-gray-800 rounded-lg border border-gray-600/30">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{result.name}</h4>
                          <span className={`text-xs px-2 py-1 rounded ${
                            result.availability === 'In Stock' 
                              ? 'bg-green-500/20 text-green-300' 
                              : 'bg-red-500/20 text-red-300'
                          }`}>
                            {result.availability === 'In Stock' ? (
                              <CheckCircle className="inline h-3 w-3 mr-1" />
                            ) : (
                              <AlertCircle className="inline h-3 w-3 mr-1" />
                            )}
                            {result.availability}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 mb-2">{result.address}</p>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-cyan-400">{result.price}</span>
                          <span className="text-gray-400">
                            {result.confidence}% confidence • {result.lastChecked}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-600/30 rounded-2xl h-full">
              <div className="p-8 pb-0">
                <h3 className="flex items-center space-x-2 text-2xl font-semibold text-white mb-2">
                  <MapPin className="h-6 w-6 text-blue-400" />
                  <span>Pharmacy Locations</span>
                </h3>
                <p className="text-gray-300 mb-6">
                  Pharmacies within {radius[0]} mile radius • Click markers for details
                </p>
              </div>
              <div className="p-0">
                <Map
                  center={mapCenter}
                  zoom={13}
                  radius={radius[0]}
                  pharmacies={pharmacies}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-600/30 rounded-2xl p-8 text-white w-full max-w-md">
            <div className="mb-6">
              <h3 className="flex items-center space-x-2 text-2xl font-semibold text-white mb-2">
                <CreditCard className="h-6 w-6 text-blue-400" />
                <span>Choose Payment Option</span>
              </h3>
              <p className="text-gray-300">
                Select how you&apos;d like to pay for your pharmacy search
              </p>
            </div>
            <div className="space-y-4">
              <div className="grid gap-4">
                <Button
                  onClick={() => handlePaymentChoice('per-search')}
                  className="bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 p-6 h-auto"
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-2">$1 per pharmacy</div>
                    <div className="text-sm opacity-80">
                      Pay only for pharmacies we call ({pharmacies.length} pharmacies = ${pharmacies.length})
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={() => handlePaymentChoice('subscription')}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-6 h-auto"
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-2">$50/month</div>
                    <div className="text-sm opacity-90">
                      Unlimited searches • Priority calling • Premium support
                    </div>
                  </div>
                </Button>
              </div>

              <Button
                onClick={() => setShowPayment(false)}
                className="w-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-600/30"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}