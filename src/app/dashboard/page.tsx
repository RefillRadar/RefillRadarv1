"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import dynamic from 'next/dynamic'
import { Heart, MapPin, Search, DollarSign, Clock, CheckCircle, AlertCircle, LogOut, CreditCard, History, RefreshCw, User } from "lucide-react"
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
  const [selectedPharmacies, setSelectedPharmacies] = useState<string[]>([])
  const [showPharmacySelection, setShowPharmacySelection] = useState(false)
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<'per-call' | 'bulk' | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [savedMedicines, setSavedMedicines] = useState<Array<{id: string, name: string, dosage: string, lastUsed: string}>>([])
  const [showSavedMedicines, setShowSavedMedicines] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (user) {
      loadPreviousSearches()
      loadSavedMedicines()
    }
  }, [user, loading, router])

  useEffect(() => {
    console.log('Radius changed to:', radius[0], 'miles')
  }, [radius])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSignOut = async () => {
    await signOut()
    setShowUserDropdown(false)
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

  const loadSavedMedicines = async () => {
    try {
      const response = await fetch('/api/saved-medicines')
      if (response.ok) {
        const data = await response.json()
        setSavedMedicines(data.medicines || [])
      }
    } catch (error) {
      console.error('Failed to load saved medicines:', error)
      // For now, use mock data
      setSavedMedicines([
        { id: '1', name: 'Lisinopril', dosage: '10mg', lastUsed: new Date().toISOString() },
        { id: '2', name: 'Metformin', dosage: '500mg', lastUsed: new Date(Date.now() - 86400000).toISOString() },
        { id: '3', name: 'Atorvastatin', dosage: '20mg', lastUsed: new Date(Date.now() - 172800000).toISOString() }
      ])
    }
  }

  const saveMedicine = async (medicineName: string, medicineADosage: string) => {
    try {
      const medicineId = `${medicineName}-${medicineADosage}`.toLowerCase().replace(/\s+/g, '-')
      
      // Check if already saved
      const existingMedicine = savedMedicines.find(m => 
        m.name.toLowerCase() === medicineName.toLowerCase() && 
        m.dosage.toLowerCase() === medicineADosage.toLowerCase()
      )
      
      if (!existingMedicine) {
        const newMedicine = {
          id: medicineId,
          name: medicineName,
          dosage: medicineADosage,
          lastUsed: new Date().toISOString()
        }
        
        setSavedMedicines(prev => [newMedicine, ...prev])
        
        // TODO: Save to database
        // await fetch('/api/saved-medicines', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(newMedicine)
        // })
      } else {
        // Update last used date
        setSavedMedicines(prev => 
          prev.map(m => 
            m.id === existingMedicine.id 
              ? { ...m, lastUsed: new Date().toISOString() }
              : m
          )
        )
      }
    } catch (error) {
      console.error('Failed to save medicine:', error)
    }
  }

  const handleUseSavedMedicine = (medicine: {name: string, dosage: string}) => {
    setMedication(medicine.name)
    setDosage(medicine.dosage)
    setShowSavedMedicines(false)
    
    // Update last used
    saveMedicine(medicine.name, medicine.dosage)
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
    
    console.log('Search initiated with radius:', radius[0], 'miles')
    setIsSearching(true)
    
    try {
      // Get real pharmacy data
      const apiUrl = `/api/pharmacies?zipcode=${zipCode}&radius=${radius[0]}`
      console.log('API URL:', apiUrl)
      const pharmacyResponse = await fetch(apiUrl)
      if (pharmacyResponse.ok) {
        const pharmacyData = await pharmacyResponse.json()
        console.log('API returned', pharmacyData.pharmacies.length, 'pharmacies for radius', radius[0])
        console.log('Pharmacy distances:', pharmacyData.pharmacies.map((p: any) => p.distance).slice(0, 5))
        
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
          distance: pharmacy.distance,
          rating: pharmacy.rating
        }))
        
        setSearchResults(results)
        setShowPharmacySelection(true)
        setSelectedPharmacies([]) // Reset selection
      } else {
        throw new Error('Failed to fetch pharmacy data')
      }
    } catch (error) {
      console.error('Search error:', error)
      alert('Search failed. Please try again.')
    } finally {
      setIsSearching(false)
    }
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

  const handleCallPharmacies = () => {
    if (selectedPharmacies.length === 0) {
      alert('Please select at least one pharmacy to call')
      return
    }
    setSelectedPaymentOption('per-call') // Default to per-call
    setShowPayment(true)
  }

  const handlePaymentSubmit = () => {
    if (!selectedPaymentOption) {
      alert('Please select a payment option')
      return
    }
    setShowConfirmation(true)
  }

  const handleConfirmStart = () => {
    // Save the medication to saved medicines
    if (medication && dosage) {
      saveMedicine(medication, dosage)
    }
    
    // Log pharmacy call data for processing
    const selectedPharmacyData = searchResults.filter(p => selectedPharmacies.includes(p.id))
    console.log('=== PHARMACY CALL REQUEST ===')
    console.log('User Info:', {
      name: user?.user_metadata?.full_name || 'Unknown',
      email: user?.email || 'Unknown',
      userId: user?.id || 'Unknown'
    })
    console.log('Prescription Details:', {
      medication: medication,
      dosage: dosage,
      searchLocation: zipCode,
      searchRadius: `${radius[0]} miles`
    })
    console.log('Payment Option:', {
      type: selectedPaymentOption,
      pharmaciesSelected: selectedPharmacies.length,
      estimatedCost: selectedPaymentOption === 'per-call' 
        ? `$${selectedPharmacies.length <= 10 ? Math.min(selectedPharmacies.length, 7) : selectedPharmacies.length}`
        : '$7'
    })
    console.log('Selected Pharmacies:', selectedPharmacyData.map(p => ({
      name: p.name,
      address: p.address,
      phone: p.phone,
      distance: `${p.distance} miles`,
      pharmacyId: p.id
    })))
    console.log('Timestamp:', new Date().toISOString())
    console.log('===============================')
    
    setShowConfirmation(false)
    handlePaymentChoice(selectedPaymentOption!)
  }

  const handlePaymentChoice = async (choice: 'per-call' | 'bulk') => {
    setShowPayment(false)
    setIsSearching(true)
    
    try {
      // Create search record in database
      const searchId = await createNewSearch()
      
      // Filter selected pharmacies
      const selectedPharmacyData = searchResults.filter(p => selectedPharmacies.includes(p.id))
      
      // Simulate AI calling process
      const resultsWithCalls = selectedPharmacyData.map((pharmacy: any) => ({
        ...pharmacy,
        availability: Math.random() > 0.3 ? 'In Stock' : 'Out of Stock',
        price: Math.random() > 0.3 ? `$${(15 + Math.random() * 50).toFixed(2)}` : 'N/A',
        confidence: Math.floor(85 + Math.random() * 15),
        lastChecked: 'Just now'
      }))
      
      // Update search results with call results
      setSearchResults(prevResults => 
        prevResults.map(pharmacy => {
          const calledResult = resultsWithCalls.find(r => r.id === pharmacy.id)
          return calledResult || pharmacy
        })
      )
      
      // Save results to database
      await fetch(`/api/search/${searchId}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          results: resultsWithCalls.map((p: any) => ({
            pharmacy_id: p.id,
            pharmacy_name: p.name,
            address: p.address,
            phone: p.phone,
            latitude: p.lat,
            longitude: p.lng,
            price: p.price === 'N/A' ? null : parseFloat(p.price.replace('$', '')),
            availability: p.availability === 'In Stock',
            confidence_score: p.confidence,
            last_called: new Date().toISOString()
          }))
        })
      })
      
      // Refresh previous searches
      loadPreviousSearches()
      
      // Reset selection
      setSelectedPharmacies([])
      setShowPharmacySelection(false)
      
    } catch (error) {
      console.error('Calling error:', error)
      alert('Failed to call pharmacies. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const togglePharmacySelection = (pharmacyId: string) => {
    setSelectedPharmacies(prev => 
      prev.includes(pharmacyId) 
        ? prev.filter(id => id !== pharmacyId)
        : [...prev, pharmacyId]
    )
  }

  const selectAllPharmacies = () => {
    if (selectedPharmacies.length === searchResults.length) {
      setSelectedPharmacies([])
    } else {
      setSelectedPharmacies(searchResults.map(p => p.id))
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
              <div className="relative z-[10000]" ref={dropdownRef}>
                <Button 
                  ref={buttonRef}
                  onClick={() => {
                    if (!showUserDropdown && buttonRef.current) {
                      const rect = buttonRef.current.getBoundingClientRect()
                      setDropdownPosition({
                        top: rect.bottom + 8,
                        right: window.innerWidth - rect.right
                      })
                    }
                    setShowUserDropdown(!showUserDropdown)
                  }}
                  variant="ghost" 
                  className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-4 py-2 border border-white/20 hover:border-white/30 transition-all duration-200 flex items-center space-x-2"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Account'}
                  </span>
                  <svg className={`w-4 h-4 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>
              </div>
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
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-gray-200">Medication Name</label>
                    <button
                      onClick={() => setShowSavedMedicines(true)}
                      className="text-xs text-blue-400 hover:text-blue-300 underline transition-colors"
                    >
                      📋 Saved ({savedMedicines.length})
                    </button>
                  </div>
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
                    <span className="text-sm font-semibold text-white bg-gradient-to-r from-blue-600/30 to-purple-600/30 px-4 py-2 rounded-full border border-blue-400/50 backdrop-blur-sm shadow-lg">
                      {radius[0]} {radius[0] === 1 ? 'mile' : 'miles'}
                    </span>
                  </div>
                  <div className="px-4 py-2">
                    <Slider
                      value={radius}
                      onValueChange={setRadius}
                      max={25}
                      min={1}
                      step={1}
                      className="w-full custom-slider"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 px-4">
                    <span className="flex items-center gap-1">
                      <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                      1 mile
                    </span>
                    <span className="text-center text-gray-500">
                      {Math.round(((radius[0] - 1) / (25 - 1)) * 100)}% of max range
                    </span>
                    <span className="flex items-center gap-1">
                      25 miles
                      <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                    </span>
                  </div>
                </div>

                {/* Custom Slider Styles */}
                <style jsx>{`
                  .custom-slider [data-orientation="horizontal"] {
                    height: 20px;
                    position: relative;
                  }
                  
                  .custom-slider [data-orientation="horizontal"] [data-radix-slider-track] {
                    background: linear-gradient(90deg, #374151 0%, #4b5563 100%);
                    height: 4px;
                    border-radius: 8px;
                    position: relative;
                    overflow: hidden;
                    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
                  }
                  
                  .custom-slider [data-orientation="horizontal"] [data-radix-slider-range] {
                    background: transparent;
                    height: 100%;
                    border-radius: 8px;
                  }
                  
                  .custom-slider [data-orientation="horizontal"] [data-radix-slider-thumb] {
                    display: block;
                    width: 20px;
                    height: 20px;
                    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                    border: 3px solid white;
                    border-radius: 50%;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4), 0 0 0 0 rgba(59, 130, 246, 0.6);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    position: relative;
                    z-index: 10;
                  }
                  
                  .custom-slider [data-orientation="horizontal"] [data-radix-slider-thumb]:hover {
                    transform: scale(1.15);
                    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5), 0 0 0 8px rgba(59, 130, 246, 0.1);
                  }
                  
                  .custom-slider [data-orientation="horizontal"] [data-radix-slider-thumb]:active {
                    transform: scale(1.05);
                    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.6), 0 0 0 12px rgba(59, 130, 246, 0.15);
                  }
                  
                  .custom-slider [data-orientation="horizontal"] [data-radix-slider-thumb]:focus {
                    outline: none;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4), 0 0 0 4px rgba(59, 130, 246, 0.3);
                  }
                `}</style>

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
          </div>

          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-600/30 rounded-2xl h-full min-h-[700px]">
              <div className="p-6 pb-0">
                <h3 className="flex items-center space-x-2 text-2xl font-semibold text-white mb-2">
                  <MapPin className="h-6 w-6 text-blue-400" />
                  <span>Pharmacy Locations</span>
                </h3>
                <p className="text-gray-300 mb-4">
                  Pharmacies within {radius[0]} mile radius • Click markers for details
                </p>
              </div>
              <div className="h-[calc(100%-120px)] min-h-[600px] p-4 pt-0">
                <Map
                  center={mapCenter}
                  zoom={13}
                  radius={radius[0]}
                  pharmacies={pharmacies}
                />
              </div>
            </div>
          </div>

          {/* Search Results - Below Map */}
          {showPharmacySelection && searchResults.length > 0 && (
            <div className="lg:col-span-3 mt-8">
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-600/30 rounded-2xl p-8 text-white">
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-2xl font-semibold text-white mb-2">Found {searchResults.length} Pharmacies</h3>
                      <p className="text-gray-300">
                        Select pharmacies to call for {medication} {dosage} availability
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={selectAllPharmacies}
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        {selectedPharmacies.length === searchResults.length ? 'Deselect All' : 'Select All'}
                      </Button>
                      <Button
                        onClick={handleCallPharmacies}
                        disabled={selectedPharmacies.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-400"
                      >
                        Call {selectedPharmacies.length} Selected
                        {selectedPharmacies.length > 0 && (
                          <span className="ml-2 text-xs">(
                            {selectedPharmacies.length <= 10 
                              ? selectedPharmacies.length === 1 ? '$1' : `$${selectedPharmacies.length <= 10 ? Math.min(selectedPharmacies.length * 1, 7) : selectedPharmacies.length}`
                              : `$${selectedPharmacies.length}`
                            })
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  {searchResults.map((result) => (
                    <div 
                      key={result.id} 
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedPharmacies.includes(result.id)
                          ? 'bg-blue-600/20 border-blue-500'
                          : 'bg-gray-800 border-gray-600/30 hover:border-gray-500'
                      }`}
                      onClick={() => togglePharmacySelection(result.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <input
                              type="checkbox"
                              checked={selectedPharmacies.includes(result.id)}
                              onChange={() => togglePharmacySelection(result.id)}
                              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <h4 className="font-semibold text-lg">{result.name}</h4>
                          </div>
                          <p className="text-sm text-gray-300 mb-2">{result.address}</p>
                          {result.phone && (
                            <p className="text-sm text-gray-400">{result.phone}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-cyan-400 font-semibold mb-1">
                            {result.distance} mi
                          </div>
                          {result.rating && (
                            <div className="text-xs text-yellow-400">
                              ★ {result.rating}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Show call results if available */}
                      {result.availability && (
                        <div className="mt-3 pt-3 border-t border-gray-600/30">
                          <div className="flex justify-between items-center">
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
                            <div className="text-right text-sm">
                              <div className="text-cyan-400 font-semibold">{result.price}</div>
                              <div className="text-gray-400 text-xs">
                                {result.confidence}% confidence • {result.lastChecked}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Beautiful Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-cyan-600/20 rounded-3xl blur-xl"></div>
            
            {/* Modal content */}
            <div className="relative bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
                  <CreditCard className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
                  Secure Payment
                </h3>
                <p className="text-gray-400">
                  Ready to call <span className="text-blue-400 font-semibold">{selectedPharmacies.length}</span> selected pharmacies
                </p>
                <div className="flex items-center justify-center gap-2 mt-2 text-sm text-gray-500">
                  <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Secure • Instant • No subscription</span>
                </div>
              </div>

              {/* Payment Options */}
              <div className="space-y-4 mb-6">
                {/* Per-call option */}
                <div 
                  onClick={() => setSelectedPaymentOption('per-call')}
                  className={`group relative overflow-hidden border rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                    selectedPaymentOption === 'per-call'
                      ? 'bg-gradient-to-r from-blue-600/30 to-blue-500/30 border-blue-400/80 shadow-xl shadow-blue-500/20'
                      : 'bg-gradient-to-r from-gray-800/50 to-gray-700/50 hover:from-blue-600/20 hover:to-blue-500/20 border-gray-600/50 hover:border-blue-400/50 hover:shadow-xl hover:shadow-blue-500/10'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedPaymentOption === 'per-call'
                            ? 'border-blue-400 bg-blue-400'
                            : 'border-gray-600 group-hover:border-blue-400'
                        }`}>
                          {selectedPaymentOption === 'per-call' && (
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                          )}
                        </div>
                        <h4 className="text-lg font-semibold text-white">Pay Per Call</h4>
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                          Recommended
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-3">
                        {selectedPharmacies.length <= 10 
                          ? `$1 per call • Max $7 for up to 10 calls` 
                          : `$1 per call • ${selectedPharmacies.length} calls total`
                        }
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>💳</span>
                        <span>No commitment • Pay only for calls made</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-white mb-1">
                        ${selectedPharmacies.length <= 10 
                          ? Math.min(selectedPharmacies.length, 7) 
                          : selectedPharmacies.length
                        }
                      </div>
                      <div className="text-gray-400 text-sm">Total cost</div>
                    </div>
                  </div>
                  {/* Hover effect gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-500/5 to-purple-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                {/* Bulk option */}
                <div 
                  onClick={() => selectedPharmacies.length > 10 ? setSelectedPaymentOption('bulk') : null}
                  className={`group relative overflow-hidden border rounded-2xl p-6 transition-all duration-300 ${
                    selectedPharmacies.length <= 10 
                      ? 'bg-gray-800/30 border-gray-700/50 cursor-not-allowed opacity-60' 
                      : selectedPaymentOption === 'bulk'
                      ? 'bg-gradient-to-r from-purple-600/30 to-purple-500/30 border-purple-400/80 shadow-xl shadow-purple-500/20 cursor-pointer'
                      : 'bg-gradient-to-r from-purple-800/50 to-purple-700/50 hover:from-purple-600/20 hover:to-purple-500/20 border-gray-600/50 hover:border-purple-400/50 cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/10'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedPharmacies.length <= 10 
                            ? 'border-gray-600 bg-gray-800' 
                            : selectedPaymentOption === 'bulk'
                            ? 'border-purple-400 bg-purple-400'
                            : 'border-gray-600 group-hover:border-purple-400'
                        }`}>
                          {selectedPaymentOption === 'bulk' && selectedPharmacies.length > 10 && (
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                          )}
                        </div>
                        <h4 className="text-lg font-semibold text-white">Bulk Rate</h4>
                        {selectedPharmacies.length > 10 && (
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/30">
                            Save ${selectedPharmacies.length - 7}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mb-3">
                        {selectedPharmacies.length <= 10 
                          ? 'Available for 10+ pharmacy calls'
                          : `$7 flat rate • Save $${(selectedPharmacies.length - 7).toFixed(0)} vs per-call pricing`
                        }
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>💎</span>
                        <span>{selectedPharmacies.length <= 10 ? 'Unlock with 10+ selections' : 'Best value for bulk calling'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-white mb-1">$7</div>
                      <div className="text-gray-400 text-sm">Flat rate</div>
                    </div>
                  </div>
                  {/* Hover effect gradient */}
                  {selectedPharmacies.length > 10 && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-500/5 to-pink-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  )}
                </div>
              </div>

              {/* Security badge */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-6 p-3 bg-gray-800/30 rounded-xl border border-gray-700/30">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span>🔒 Secured by Stripe • 256-bit encryption • No card details stored</span>
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handlePaymentSubmit}
                  disabled={!selectedPaymentOption}
                  className={`w-full py-4 text-lg font-semibold rounded-xl transition-all duration-300 ${
                    selectedPaymentOption
                      ? selectedPaymentOption === 'per-call'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-blue-500/25 hover:scale-[1.02]'
                        : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02]'
                      : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {selectedPaymentOption ? (
                    <>
                      <CreditCard className="h-5 w-5 mr-2 inline" />
                      {isSearching ? (
                        <>
                          <Clock className="animate-spin h-5 w-5 mr-2 inline" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Pay ${selectedPaymentOption === 'per-call' 
                            ? (selectedPharmacies.length <= 10 ? Math.min(selectedPharmacies.length, 7) : selectedPharmacies.length)
                            : 7
                          } & Start Calling
                        </>
                      )}
                    </>
                  ) : (
                    'Select Payment Option'
                  )}
                </Button>

                <Button
                  onClick={() => {
                    setShowPayment(false)
                    setSelectedPaymentOption(null)
                  }}
                  className="w-full bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white border border-gray-600/30 hover:border-gray-500/50 py-3 rounded-xl transition-all duration-200"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="relative w-full max-w-md">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 via-red-600/20 to-pink-600/20 rounded-3xl blur-xl"></div>
            
            {/* Modal content */}
            <div className="relative bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl mb-4 shadow-lg">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
                  Processing Schedule
                </h3>
                <p className="text-gray-400 text-sm">
                  Your pharmacy calling request
                </p>
              </div>

              {/* Schedule Information */}
              <div className="bg-gray-800/30 border border-gray-600/30 rounded-2xl p-6 mb-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">⏰ Processing Time</h4>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Your pharmacy calls will begin processing at <span className="text-white font-semibold">9:00 AM EST</span> the next business day.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">📧 Email Updates</h4>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      You&apos;ll receive an email notification when your search is complete with all pharmacy results.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">💊 Search Details</h4>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Calling <span className="text-white font-semibold">{selectedPharmacies.length} pharmacies</span> for <span className="text-white font-semibold">{medication} {dosage}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="bg-gray-800/50 border border-gray-600/30 rounded-xl p-4 mb-6">
                <p className="text-gray-400 text-sm text-center">
                  By clicking &quot;Start Calling&quot; you agree to our{' '}
                  <button className="text-blue-400 hover:text-blue-300 underline transition-colors">
                    Terms and Conditions
                  </button>
                  {' '}and{' '}
                  <button className="text-blue-400 hover:text-blue-300 underline transition-colors">
                    Privacy Policy
                  </button>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleConfirmStart}
                  disabled={isSearching}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-green-500/25 hover:scale-[1.02] transition-all duration-300"
                >
                  {isSearching ? (
                    <>
                      <Clock className="animate-spin h-5 w-5 mr-2 inline" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2 inline" />
                      Start Calling - Pay ${selectedPaymentOption === 'per-call' 
                        ? (selectedPharmacies.length <= 10 ? Math.min(selectedPharmacies.length, 7) : selectedPharmacies.length)
                        : 7
                      }
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => setShowConfirmation(false)}
                  disabled={isSearching}
                  className="w-full bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white border border-gray-600/30 hover:border-gray-500/50 py-3 rounded-xl transition-all duration-200"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saved Medicines Modal */}
      {showSavedMedicines && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-cyan-600/20 rounded-3xl blur-xl"></div>
            
            {/* Modal content */}
            <div className="relative bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl max-h-[80vh] overflow-hidden">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-3 shadow-lg">
                  <span className="text-2xl">💊</span>
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-1">
                  Saved Medicines
                </h3>
                <p className="text-gray-400 text-sm">
                  Quick access to your frequently searched medications
                </p>
              </div>

              {/* Medicines List */}
              <div className="max-h-64 overflow-y-auto mb-6">
                {savedMedicines.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-xl">💊</span>
                    </div>
                    <p className="text-gray-400 text-sm">No saved medicines yet</p>
                    <p className="text-gray-500 text-xs mt-1">Complete a search to save medications</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedMedicines.map((medicine) => (
                      <div
                        key={medicine.id}
                        onClick={() => handleUseSavedMedicine(medicine)}
                        className="group bg-gray-800/50 hover:bg-blue-600/20 border border-gray-600/30 hover:border-blue-400/50 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-white group-hover:text-blue-300 transition-colors">
                              {medicine.name}
                            </h4>
                            <p className="text-gray-400 text-sm">{medicine.dosage}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">
                              Last used
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(medicine.lastUsed).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        {/* Hover indicator */}
                        <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-blue-400">
                          Click to use this medication
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Close button */}
              <Button
                onClick={() => setShowSavedMedicines(false)}
                className="w-full bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white border border-gray-600/30 hover:border-gray-500/50 py-3 rounded-xl transition-all duration-200"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* User Dropdown Portal */}
      {showUserDropdown && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed w-64 bg-gray-900/95 backdrop-blur-xl border border-gray-600/50 rounded-xl shadow-2xl py-2 z-[99999]"
          style={{
            top: dropdownPosition.top,
            right: dropdownPosition.right
          }}
        >
          <div className="px-4 py-3 border-b border-gray-600/50">
            <p className="text-white font-semibold text-sm">
              {user?.user_metadata?.full_name || 'User'}
            </p>
            <p className="text-gray-400 text-xs">{user?.email}</p>
          </div>
          <Link href="/">
            <button 
              onClick={() => setShowUserDropdown(false)}
              className="w-full text-left px-4 py-3 text-white hover:bg-gray-800/50 transition-colors flex items-center space-x-3"
            >
              <Heart className="h-4 w-4 text-cyan-400" />
              <span>Home</span>
            </button>
          </Link>
          <button 
            onClick={handleSignOut}
            className="w-full text-left px-4 py-3 text-white hover:bg-gray-800/50 transition-colors flex items-center space-x-3"
          >
            <LogOut className="h-4 w-4 text-red-400" />
            <span>Sign Out</span>
          </button>
        </div>,
        document.body
      )}
    </div>
  )
}