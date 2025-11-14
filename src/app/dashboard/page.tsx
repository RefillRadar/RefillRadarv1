"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import dynamic from 'next/dynamic'
import { Heart, MapPin, Search, DollarSign, Clock, CheckCircle, AlertCircle, LogOut, CreditCard } from "lucide-react"
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

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
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

  const handlePaymentChoice = async (choice: 'per-search' | 'subscription') => {
    setShowPayment(false)
    setIsSearching(true)
    
    // Simulate API call
    setTimeout(() => {
      const results = mockPharmacies.map((pharmacy, index) => ({
        ...pharmacy,
        availability: Math.random() > 0.3 ? 'In Stock' : 'Out of Stock',
        price: Math.random() > 0.3 ? `$${(15 + Math.random() * 20).toFixed(2)}` : 'N/A',
        confidence: Math.floor(85 + Math.random() * 15),
        lastChecked: 'Just now'
      }))
      setSearchResults(results)
      setIsSearching(false)
    }, 3000)
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
          {/* Search Form */}
          <div className="lg:col-span-1">
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