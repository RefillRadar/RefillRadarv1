"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import dynamic from 'next/dynamic'
import { Heart, MapPin, Search, DollarSign, Clock, CheckCircle, AlertCircle, LogOut, CreditCard, History, RefreshCw, User, X, Sun, Moon, Menu, Home, Pill, Building2, ChevronLeft, Crown, ChevronDown, Phone } from "lucide-react"
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
  const [selectedSearchResults, setSelectedSearchResults] = useState<any>(null)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [selectedPharmacies, setSelectedPharmacies] = useState<string[]>([])
  const [showPharmacySelection, setShowPharmacySelection] = useState(false)
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<'per-call' | 'bulk' | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [savedMedicines, setSavedMedicines] = useState<Array<{id: string, name: string, dosage: string, lastUsed: string}>>([])
  const [showSavedMedicines, setShowSavedMedicines] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const [showPaymentCancelledNotice, setShowPaymentCancelledNotice] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true) // Default to dark mode
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'saved-medications' | 'saved-pharmacies' | 'previous-searches' | 'pricing'>('dashboard')
  const [openFaqItems, setOpenFaqItems] = useState<{[key: string]: boolean}>({})
  const [selectedSearchForResults, setSelectedSearchForResults] = useState<any | null>(null)
  const [searchResultsData, setSearchResultsData] = useState<{[key: string]: any[]}>({}) // Cache search results
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('dashboard-theme')
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark')
    }
  }, [])

  // Save theme preference to localStorage
  const toggleTheme = () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)
    localStorage.setItem('dashboard-theme', newTheme ? 'dark' : 'light')
  }

  // Toggle FAQ items
  const toggleFaqItem = (id: string) => {
    setOpenFaqItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Show search results for a specific search
  const displaySearchResults = async (search: any) => {
    setSelectedSearchForResults(search)
    
    // Load results if not cached
    if (!searchResultsData[search.id]) {
      await loadInlineSearchResults(search.id)
    }
  }

  // Load search results for inline display
  const loadInlineSearchResults = async (searchId: string) => {
    try {
      const response = await fetch(`/api/search/${searchId}/results`)
      if (response.ok) {
        const data = await response.json()
        const results = data.results || []
        
        // Add mock data for demonstration
        const mockResults = results.length > 0 ? results : [
          { id: '1', pharmacy_name: 'CVS Pharmacy', address: '123 Main St, Anytown, NY 12345', phone: '(555) 123-4567', availability: true, price: 25.99, confidence_score: 95, last_called: new Date().toISOString() },
          { id: '2', pharmacy_name: 'Walgreens', address: '456 Oak Ave, Anytown, NY 12345', phone: '(555) 234-5678', availability: false, price: null, confidence_score: 88, last_called: new Date().toISOString() },
          { id: '3', pharmacy_name: 'Rite Aid', address: '789 Pine Rd, Anytown, NY 12345', phone: '(555) 345-6789', availability: true, price: 22.50, confidence_score: 92, last_called: new Date().toISOString() }
        ]
        
        setSearchResultsData(prev => ({
          ...prev,
          [searchId]: mockResults
        }))
      }
    } catch (error) {
      console.error('Failed to load search results:', error)
    }
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (user) {
      loadPreviousSearches()
      loadSavedMedicines()
    }
  }, [user, loading, router, loadPreviousSearches, loadSavedMedicines])

  useEffect(() => {
    console.log('Radius changed to:', radius[0], 'miles')
  }, [radius])

  // Handle payment cancellation from URL params
  // Note: Payment success is now handled by /payment/success page
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const paymentStatus = urlParams.get('payment')

    if (paymentStatus === 'cancelled') {
      // Show React state-based notification
      setShowPaymentCancelledNotice(true)
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setShowPaymentCancelledNotice(false)
      }, 5000)
      
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

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
    try {
      console.log('🚪 Signing out user...')
      await signOut()
      console.log('✅ Sign out successful')
      setShowUserDropdown(false)
      router.push('/')
    } catch (error) {
      console.error('❌ Sign out error:', error)
    }
  }

  const loadPreviousSearches = useCallback(async () => {
    try {
      setLoadingHistory(true)
      console.log('🔍 Loading previous searches for user:', user?.id)
      const response = await fetch('/api/search')
      console.log('📡 Search API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Previous searches loaded:', {
          count: data.searches?.length || 0,
          searches: data.searches?.map((s: any) => ({
            id: s.id,
            medication: s.medication_name,
            status: s.status,
            created: s.created_at
          }))
        })
        setPreviousSearches(data.searches || [])
      } else {
        const errorText = await response.text()
        console.error('❌ Failed to load searches:', response.status, errorText)
      }
    } catch (error) {
      console.error('❌ Search loading error:', error)
    } finally {
      setLoadingHistory(false)
    }
  }, [user?.id])

  const loadSavedMedicines = useCallback(async () => {
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
  }, [])

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
      const response = await fetch(`/api/search/${searchId}/results`)
      if (response.ok) {
        const data = await response.json()
        setSelectedSearchResults(data)
        setShowSearchResults(true)
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
    
    console.log('🔍 Search initiated with:', { medication, zipCode, radius: radius[0] })
    setIsSearching(true)
    
    try {
      // Get real pharmacy data
      const apiUrl = `/api/pharmacies?zipcode=${zipCode}&radius=${radius[0]}`
      console.log('📍 Fetching from API URL:', apiUrl)
      
      const pharmacyResponse = await fetch(apiUrl)
      console.log('📡 Pharmacy API response status:', pharmacyResponse.status)
      
      if (!pharmacyResponse.ok) {
        const errorText = await pharmacyResponse.text()
        console.error('❌ Pharmacy API error:', pharmacyResponse.status, errorText)
        throw new Error(`Pharmacy API failed: ${pharmacyResponse.status} - ${errorText}`)
      }

      const pharmacyData = await pharmacyResponse.json()
      console.log('✅ API returned:', {
        success: pharmacyData.success,
        pharmacyCount: pharmacyData.pharmacies?.length || 0,
        center: pharmacyData.center,
        warning: pharmacyData.warning
      })
      
      if (!pharmacyData.success || !pharmacyData.pharmacies) {
        throw new Error('Invalid pharmacy data received')
      }

      console.log('📊 Pharmacy distances:', pharmacyData.pharmacies.map((p: any) => `${p.name}: ${p.distance}mi`).slice(0, 5))
      
      // Update map center
      if (pharmacyData.center) {
        console.log('🗺️ Updating map center to:', pharmacyData.center)
        setMapCenter([pharmacyData.center.lat, pharmacyData.center.lng])
      }
      
      // Update pharmacies list for map
      const mappedPharmacies = pharmacyData.pharmacies.map((p: any) => ({
        id: p.id,
        name: p.name,
        address: p.address,
        lat: p.latitude,
        lng: p.longitude,
        phone: p.phone
      }))
      console.log('🗺️ Setting', mappedPharmacies.length, 'pharmacies for map')
      setPharmacies(mappedPharmacies)
      
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
      
      console.log('🎯 Setting search results:', results.length, 'pharmacies')
      setSearchResults(results)
      setShowPharmacySelection(true)
      setSelectedPharmacies([]) // Reset selection
      
    } catch (error) {
      console.error('❌ Search error:', error)
      alert(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`)
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

  const handlePaymentSubmit = async () => {
    if (!selectedPaymentOption) {
      alert('Please select a payment option')
      return
    }
    
    setIsSearching(true)
    
    try {
      const amount = selectedPaymentOption === 'per-call' 
        ? (selectedPharmacies.length <= 10 ? Math.min(selectedPharmacies.length, 7) : selectedPharmacies.length)
        : 7

      // Create Stripe Checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          pharmacyCount: selectedPharmacies.length,
          paymentType: selectedPaymentOption,
          userId: user?.id,
          searchData: {
            medication,
            dosage,
            zipcode: zipCode,
            radius: radius[0]
          },
          selectedPharmacies: selectedPharmacies.map(id => {
            const pharmacy = searchResults.find(p => p.id === id)
            return {
              id: pharmacy?.id,
              name: pharmacy?.name,
              address: pharmacy?.address,
              phone: pharmacy?.phone
            }
          })
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create payment session')
      }

      const { sessionId, url } = await response.json()

      if (!url) {
        throw new Error('No checkout URL returned from payment service')
      }

      // Redirect to Stripe Checkout URL
      window.location.href = url

    } catch (error) {
      console.error('Payment error:', error)
      alert('Payment failed. Please try again.')
      setIsSearching(false)
    }
  }

  // Handle subscription checkout for pricing plans
  const handleSubscriptionCheckout = async (planType: 'base' | 'unlimited') => {
    try {
      const productId = planType === 'base' ? 'prod_TUA1LY4GwMnAnj' : 'prod_TSd36pC3NX1adi'
      
      const response = await fetch('/api/stripe/create-subscription-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          planType,
          userId: user?.id,
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create subscription session')
      }

      const { url } = await response.json()

      if (!url) {
        throw new Error('No checkout URL returned from payment service')
      }

      // Redirect to Stripe Checkout URL
      window.location.href = url

    } catch (error) {
      console.error('Subscription checkout error:', error)
      alert('Checkout failed. Please try again.')
    }
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
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Payment Cancelled Notification */}
      {showPaymentCancelledNotice && (
        <div className="fixed top-4 right-4 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5" />
          <span>Payment was cancelled. You can try again anytime.</span>
          <Button 
            onClick={() => setShowPaymentCancelledNotice(false)}
            className="ml-2 p-1 h-auto bg-transparent hover:bg-yellow-600 text-white"
            size="sm"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="min-h-screen">
        {/* Fixed Sidebar */}
        <aside className={`fixed top-0 left-0 ${sidebarCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 border-r flex flex-col h-screen z-10 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          {/* Top Section */}
          <div className="p-4">
            {/* Logo and Toggle */}
            <div className="flex items-center justify-between mb-6">
              {!sidebarCollapsed ? (
                <div className="flex items-center space-x-2">
                  <Heart className="h-6 w-6 text-cyan-400" />
                  <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>RefillRadar</span>
                </div>
              ) : (
                <div className="flex justify-center">
                  <Heart className="h-6 w-6 text-cyan-400" />
                </div>
              )}
              <Button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                variant="ghost"
                size="sm"
                className={`${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>
            
            {/* Navigation Menu */}
            <nav className="space-y-2">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: Home },
                { id: 'saved-medications', label: 'Saved Medications', icon: Pill },
                { id: 'saved-pharmacies', label: 'Saved Pharmacies', icon: Building2 },
                { id: 'previous-searches', label: 'Previous Searches', icon: History },
                { id: 'pricing', label: 'Pricing', icon: Crown }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id as any)}
                  className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start'} px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === item.id
                      ? isDarkMode 
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-100 text-blue-700'
                      : isDarkMode
                        ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {!sidebarCollapsed && (
                    <span className="ml-3">{item.label}</span>
                  )}
                </button>
              ))}
            </nav>
          </div>
          
          {/* User Profile Section - Fixed at Bottom */}
          <div className={`mt-auto p-4 border-t ${isDarkMode ? 'border-gray-600/30' : 'border-gray-200'}`}>
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start'} space-x-3`}>
              {!sidebarCollapsed && (
                <>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {user?.user_metadata?.full_name || 'User'}
                    </div>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {user?.email}
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      onClick={toggleTheme}
                      variant="ghost"
                      size="sm"
                      className={`p-2 ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                    >
                      {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </Button>
                    <Button
                      onClick={handleSignOut}
                      variant="ghost"
                      size="sm"
                      className={`p-2 ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
              {sidebarCollapsed && (
                <div className="flex flex-col space-y-2">
                  <Button
                    onClick={toggleTheme}
                    variant="ghost"
                    size="sm"
                    className={`p-2 ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                  >
                    {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                  <Button
                    onClick={handleSignOut}
                    variant="ghost"
                    size="sm"
                    className={`p-2 ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`${sidebarCollapsed ? 'ml-16' : 'ml-64'} transition-all duration-300 min-h-screen`}>
          {currentPage === 'dashboard' && (
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
                    : isDarkMode 
                      ? 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
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
                    : isDarkMode 
                      ? 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <History className="h-4 w-4 inline mr-2" />
                Previous Searches ({previousSearches.length})
              </button>
            </div>

            {activeTab === 'search' && (
            <div className={`backdrop-blur-sm border rounded-2xl p-8 ${isDarkMode ? 'bg-gray-900/50 border-gray-600/30 text-white' : 'bg-white/80 border-gray-200 text-gray-900'}`}>
              <div className="mb-6">
                <h3 className={`flex items-center space-x-2 text-2xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Search className="h-6 w-6 text-blue-400" />
                  <span>Find Your Medication</span>
                </h3>
                <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                  Enter your prescription details to find nearby pharmacies
                </p>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Medication Name</label>
                  <Input
                    value={medication}
                    onChange={(e) => setMedication(e.target.value)}
                    placeholder="e.g., Lisinopril"
                    className={isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}
                  />
                </div>

                <div className="space-y-2">
                  <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Dosage</label>
                  <Input
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="e.g., 10mg"
                    className={isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}
                  />
                </div>

                <div className="space-y-2">
                  <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Zip Code</label>
                  <Input
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="12345"
                    className={isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
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
                  <div className={`flex justify-between text-xs px-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <span className="flex items-center gap-1">
                      <span className={`w-1 h-1 rounded-full ${isDarkMode ? 'bg-gray-500' : 'bg-gray-400'}`}></span>
                      1 mile
                    </span>
                    <span className={`text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                      {Math.round(((radius[0] - 1) / (25 - 1)) * 100)}% of max range
                    </span>
                    <span className="flex items-center gap-1">
                      25 miles
                      <span className={`w-1 h-1 rounded-full ${isDarkMode ? 'bg-gray-500' : 'bg-gray-400'}`}></span>
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
                    background: ${isDarkMode ? 'linear-gradient(90deg, #9ca3af 0%, #d1d5db 100%)' : 'linear-gradient(90deg, #d1d5db 0%, #9ca3af 100%)'};
                    height: 4px;
                    border-radius: 8px;
                    position: relative;
                    overflow: hidden;
                    box-shadow: ${isDarkMode ? 'inset 0 1px 3px rgba(0, 0, 0, 0.2)' : 'inset 0 1px 3px rgba(0, 0, 0, 0.1)'};
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
                    border: 3px solid ${isDarkMode ? 'white' : '#1f2937'};
                    border-radius: 50%;
                    box-shadow: ${isDarkMode ? '0 4px 12px rgba(59, 130, 246, 0.4), 0 0 0 0 rgba(59, 130, 246, 0.6)' : '0 4px 12px rgba(59, 130, 246, 0.3), 0 0 0 0 rgba(59, 130, 246, 0.4)'};
                    cursor: pointer;
                    transition: all 0.2s ease;
                    position: relative;
                    z-index: 10;
                  }
                  
                  .custom-slider [data-orientation="horizontal"] [data-radix-slider-thumb]:hover {
                    transform: scale(1.15);
                    box-shadow: ${isDarkMode ? '0 6px 20px rgba(59, 130, 246, 0.5), 0 0 0 8px rgba(59, 130, 246, 0.1)' : '0 6px 20px rgba(59, 130, 246, 0.4), 0 0 0 8px rgba(59, 130, 246, 0.08)'};
                  }
                  
                  .custom-slider [data-orientation="horizontal"] [data-radix-slider-thumb]:active {
                    transform: scale(1.05);
                    box-shadow: ${isDarkMode ? '0 2px 8px rgba(59, 130, 246, 0.6), 0 0 0 12px rgba(59, 130, 246, 0.15)' : '0 2px 8px rgba(59, 130, 246, 0.5), 0 0 0 12px rgba(59, 130, 246, 0.12)'};
                  }
                  
                  .custom-slider [data-orientation="horizontal"] [data-radix-slider-thumb]:focus {
                    outline: none;
                    box-shadow: ${isDarkMode ? '0 4px 12px rgba(59, 130, 246, 0.4), 0 0 0 4px rgba(59, 130, 246, 0.3)' : '0 4px 12px rgba(59, 130, 246, 0.3), 0 0 0 4px rgba(59, 130, 246, 0.25)'};
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
              <div className={`backdrop-blur-sm border rounded-2xl p-8 ${isDarkMode ? 'bg-gray-900/50 border-gray-600/30 text-white' : 'bg-white/80 border-gray-200 text-gray-900'}`}>
                <div className="mb-6">
                  <div className="flex justify-between items-center">
                    <h3 className={`text-2xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Previous Searches</h3>
                    <Button
                      onClick={loadPreviousSearches}
                      disabled={loadingHistory}
                      size="sm"
                      className={isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}
                    >
                      <RefreshCw className={`h-4 w-4 ${loadingHistory ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    View and reload your previous medication searches
                  </p>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {loadingHistory ? (
                    <div className="text-center py-8">
                      <Clock className="animate-spin h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Loading searches...</p>
                    </div>
                  ) : previousSearches.length === 0 ? (
                    <div className="text-center py-8">
                      <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>No previous searches found</p>
                    </div>
                  ) : (
                    previousSearches.map((search) => (
                      <div key={search.id} className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600/30' : 'bg-gray-50 border-gray-200'}`}>
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
            <div className={`backdrop-blur-sm border rounded-2xl h-full min-h-[500px] ${isDarkMode ? 'bg-gray-900/50 border-gray-600/30' : 'bg-white/80 border-gray-200'}`}>
              <div className="p-6 pb-0">
                <h3 className={`flex items-center space-x-2 text-2xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <MapPin className="h-6 w-6 text-blue-400" />
                  <span>Pharmacy Locations</span>
                </h3>
                <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Pharmacies within {radius[0]} mile radius • Click markers for details
                </p>
              </div>
              <div className="h-[calc(100%-120px)] min-h-[400px] p-4 pt-0">
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
              <div className={`backdrop-blur-sm border rounded-2xl p-8 ${isDarkMode ? 'bg-gray-900/50 border-gray-600/30 text-white' : 'bg-white/80 border-gray-200 text-gray-900'}`}>
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className={`text-2xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Found {searchResults.length} Pharmacies</h3>
                      <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                        Select pharmacies to call for {medication} {dosage} availability
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={selectAllPharmacies}
                        variant="outline"
                        size="sm"
                        className={isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}
                      >
                        {selectedPharmacies.length === searchResults.length ? 'Deselect All' : 'Select All'}
                      </Button>
                      <Button
                        onClick={handleCallPharmacies}
                        disabled={selectedPharmacies.length === 0}
                        className={`bg-blue-600 hover:bg-blue-700 ${isDarkMode ? 'disabled:bg-gray-700 disabled:text-gray-400' : 'disabled:bg-gray-300 disabled:text-gray-500'}`}
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
                          : isDarkMode 
                            ? 'bg-gray-800 border-gray-600/30 hover:border-gray-500'
                            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
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
                              className={`w-4 h-4 text-blue-600 rounded focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <h4 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{result.name}</h4>
                          </div>
                          <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{result.address}</p>
                          {result.phone && (
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{result.phone}</p>
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
          )}

          {/* Saved Medications Page */}
          {currentPage === 'saved-medications' && (
            <div className="container mx-auto px-4 py-8">
              <div className={`backdrop-blur-sm border rounded-2xl p-8 ${isDarkMode ? 'bg-gray-900/50 border-gray-600/30' : 'bg-white/80 border-gray-200'}`}>
                <div className="mb-6">
                  <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Saved Medications</h2>
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Manage your frequently searched medications</p>
                </div>
                
                {savedMedicines.length === 0 ? (
                  <div className="text-center py-12">
                    <Pill className={`h-16 w-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                    <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No saved medications</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Save medications from your searches to quickly access them later</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {savedMedicines.map((med) => (
                      <div key={med.id} className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600/30' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{med.name}</h4>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{med.dosage}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className={isDarkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-600'}
                            onClick={() => {
                              setMedication(med.name)
                              setDosage(med.dosage)
                              setCurrentPage('dashboard')
                            }}
                          >
                            Use
                          </Button>
                        </div>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Last used: {med.lastUsed}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Saved Pharmacies Page */}
          {currentPage === 'saved-pharmacies' && (
            <div className="container mx-auto px-4 py-8">
              <div className={`backdrop-blur-sm border rounded-2xl p-8 ${isDarkMode ? 'bg-gray-900/50 border-gray-600/30' : 'bg-white/80 border-gray-200'}`}>
                <div className="mb-6">
                  <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Saved Pharmacies</h2>
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Your preferred pharmacy locations</p>
                </div>
                
                <div className="text-center py-12">
                  <Building2 className={`h-16 w-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No saved pharmacies</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Save pharmacies from your search results for quick access</p>
                </div>
              </div>
            </div>
          )}

          {/* Previous Searches Page */}
          {currentPage === 'previous-searches' && (
            <div className="container mx-auto px-4 py-8">
              <div className={`backdrop-blur-sm border rounded-2xl p-8 ${isDarkMode ? 'bg-gray-900/50 border-gray-600/30' : 'bg-white/80 border-gray-200'}`}>
                <div className="mb-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Previous Searches</h2>
                      <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>View and manage your search history</p>
                    </div>
                    <Button
                      onClick={loadPreviousSearches}
                      disabled={loadingHistory}
                      size="sm"
                      className={isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}
                    >
                      <RefreshCw className={`h-4 w-4 ${loadingHistory ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {loadingHistory ? (
                    <div className="text-center py-8">
                      <Clock className="animate-spin h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Loading searches...</p>
                    </div>
                  ) : previousSearches.length === 0 ? (
                    <div className="text-center py-8">
                      <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>No previous searches found</p>
                    </div>
                  ) : (
                    previousSearches.map((search) => (
                      <div key={search.id} className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600/30' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{search.medication_name}</h4>
                            {search.dosage && <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{search.dosage}</p>}
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
                        <div className={`flex justify-between items-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <span>{search.zipcode} • {search.radius} miles</span>
                          <span>{new Date(search.created_at).toLocaleDateString()}</span>
                        </div>
                        {search.status === 'completed' && (
                          <div className="mt-3 flex gap-2">
                            <Button
                              onClick={() => {
                                setMedication(search.medication_name)
                                setDosage(search.dosage || '')
                                setZipCode(search.zipcode)
                                setRadius([search.radius])
                                loadSearchResults(search.id)
                                setCurrentPage('dashboard')
                              }}
                              size="sm"
                              variant="outline"
                              className={isDarkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-600'}
                            >
                              Use Search
                            </Button>
                            <Button
                              onClick={() => displaySearchResults(search)}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
                            >
                              View Results
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
                
                {/* Search Results Section - Displayed underneath entire Previous Searches module */}
                {selectedSearchForResults && (
                  <div className={`mt-8 backdrop-blur-sm border rounded-2xl p-8 ${isDarkMode ? 'bg-gray-900/50 border-gray-600/30' : 'bg-white/80 border-gray-200'}`}>
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Search Results for {selectedSearchForResults.medication_name} {selectedSearchForResults.dosage}
                        </h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {selectedSearchForResults.zipcode} • {selectedSearchForResults.radius} miles • {new Date(selectedSearchForResults.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        onClick={() => setSelectedSearchForResults(null)}
                        size="sm"
                        variant="outline"
                        className={isDarkMode ? 'border-gray-600 text-gray-400 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {searchResultsData[selectedSearchForResults.id] ? (
                      <div className="grid gap-4">
                        <div className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Found {searchResultsData[selectedSearchForResults.id].length} pharmacies
                        </div>
                        
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {searchResultsData[selectedSearchForResults.id].map((result) => (
                            <div key={result.id} className={`p-4 rounded-lg border ${
                              isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'
                            }`}>
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <h5 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {result.pharmacy_name}
                                  </h5>
                                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {result.address}
                                  </p>
                                  <p className={`text-sm flex items-center mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    <Phone className="h-3 w-3 mr-1" />
                                    {result.phone}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex justify-between items-center mb-3">
                                <span className={`text-sm px-3 py-1 rounded-full ${
                                  result.availability 
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-red-500/20 text-red-400'
                                }`}>
                                  {result.availability ? 'In Stock' : 'Out of Stock'}
                                </span>
                                {result.availability && result.price && (
                                  <div className={`text-lg font-bold ${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}>
                                    ${result.price.toFixed(2)}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex justify-between items-center text-xs">
                                <span className={isDarkMode ? 'text-gray-500' : 'text-gray-500'}>
                                  Confidence: {result.confidence_score}%
                                </span>
                                <span className={isDarkMode ? 'text-gray-500' : 'text-gray-500'}>
                                  {new Date(result.last_called).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className={`text-center py-8 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <Clock className="h-8 w-8 mx-auto mb-2 animate-spin" />
                        Loading search results...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pricing Page */}
          {currentPage === 'pricing' && (
            <div className="container mx-auto px-4 py-8">
              <div className="mb-8">
                <h2 className={`text-3xl font-bold text-center mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Choose Your Plan</h2>
                <p className={`text-center text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Simple, transparent pricing that scales with your needs
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {/* Pay As You Go Plan */}
                <div className={`backdrop-blur-sm border rounded-2xl p-8 relative flex flex-col ${isDarkMode ? 'bg-gray-900/50 border-gray-600/30' : 'bg-white/80 border-gray-200'}`}>
                  <div className="text-center mb-6">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <DollarSign className={`h-8 w-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                    </div>
                    <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Pay As You Go</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Perfect for occasional searches</p>
                  </div>

                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center">
                      <span className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>$1</span>
                      <span className={`text-lg ml-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>/pharmacy</span>
                    </div>
                    <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Pay per call basis
                    </p>
                  </div>

                  <div className="space-y-4 flex-grow">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>$1 per pharmacy contacted</p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Only pay for what you use</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>No monthly commitment</p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Cancel anytime</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Real-time availability checks</p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>AI calls pharmacies for you</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Search history & results</p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Access your past searches</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => setCurrentPage('dashboard')}
                    className={`mt-8 w-full py-3 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}
                  >
                    Start Searching
                  </Button>
                </div>

                {/* Base Plan */}
                <div className={`backdrop-blur-sm border rounded-2xl p-8 relative flex flex-col ${isDarkMode ? 'bg-gray-900/50 border-gray-600/30' : 'bg-white/80 border-gray-200'}`}>
                  {/* Recommended Badge */}
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      RECOMMENDED
                    </span>
                  </div>

                  <div className="text-center mb-6 mt-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-4">
                      <CheckCircle className="h-8 w-8 text-white" />
                    </div>
                    <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Base Plan</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Great value for regular users</p>
                  </div>

                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center">
                      <span className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>$20</span>
                      <span className={`text-lg ml-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>/month</span>
                    </div>
                    <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      25 pharmacy calls included
                    </p>
                  </div>

                  <div className="space-y-4 flex-grow">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>25 pharmacy calls included</p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Perfect for regular users</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>$0.80 per call</p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>20% savings vs. pay-as-you-go</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Real-time availability checks</p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>AI calls pharmacies for you</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Search history & results</p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Access your past searches</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Monthly renewal</p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Calls reset each month</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleSubscriptionCheckout('base')}
                    className="mt-8 w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  >
                    Choose Base Plan →
                  </Button>
                </div>

                {/* Unlimited Plan */}
                <div className={`backdrop-blur-sm border rounded-2xl p-8 relative flex flex-col ${isDarkMode ? 'bg-gray-900/50 border-gray-600/30' : 'bg-white/80 border-gray-200'}`}>
                  {/* Best Value Badge */}
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      BEST VALUE
                    </span>
                  </div>

                  <div className="text-center mb-6 mt-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
                      <Crown className="h-8 w-8 text-white" />
                    </div>
                    <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Unlimited</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>For frequent medication searches</p>
                  </div>

                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center">
                      <span className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>$50</span>
                      <span className={`text-lg ml-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>/month</span>
                    </div>
                    <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Unlimited pharmacy calls
                    </p>
                  </div>

                  <div className="space-y-4 flex-grow">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Unlimited pharmacy searches</p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No limits on calls or searches</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Priority AI calling</p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Faster results with priority queue</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Advanced search filters</p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Filter by price, distance, ratings</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Smart refill alerts</p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Automatic notifications when it&apos;s time to refill</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Premium support</p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Priority customer support</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleSubscriptionCheckout('unlimited')}
                    className="mt-8 w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    Choose Unlimited →
                  </Button>
                </div>
              </div>

              {/* FAQ Accordion */}
              <div className="mt-16 max-w-3xl mx-auto">
                <h3 className={`text-2xl font-bold text-center mb-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Frequently Asked Questions
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      id: 'base-plan',
                      question: 'How does the Base Plan work?',
                      answer: 'The Base Plan gives you 25 pharmacy calls for $20/month (only $0.80 per call). This is perfect for regular users who need consistent access to pharmacy searches with 20% savings vs. pay-as-you-go.'
                    },
                    {
                      id: 'unlimited-usage',
                      question: 'What happens if I need more than 50 calls per month?',
                      answer: 'The unlimited plan covers all your pharmacy calls with no additional charges. Perfect for families or frequent medication searches.'
                    },
                    {
                      id: 'switching-plans',
                      question: 'Can I switch between plans?',
                      answer: 'Yes! You can upgrade to unlimited anytime. If you\'re on unlimited, you can downgrade at the end of your billing cycle.'
                    },
                    {
                      id: 'call-accuracy',
                      question: 'How accurate are the AI pharmacy calls?',
                      answer: 'Our AI has a 95% accuracy rate in obtaining correct medication availability and pricing information. All calls are recorded for quality assurance.'
                    },
                    {
                      id: 'payment-security',
                      question: 'Is my payment information secure?',
                      answer: 'Yes! We use Stripe for payment processing with 256-bit encryption. We never store your payment details on our servers.'
                    }
                  ].map((faq) => (
                    <div key={faq.id} className={`border rounded-xl overflow-hidden ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                      <button
                        onClick={() => toggleFaqItem(faq.id)}
                        className={`w-full px-6 py-4 text-left flex justify-between items-center transition-colors ${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'}`}
                      >
                        <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {faq.question}
                        </h4>
                        <ChevronDown 
                          className={`h-5 w-5 transition-transform ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} ${
                            openFaqItems[faq.id] ? 'transform rotate-180' : ''
                          }`}
                        />
                      </button>
                      {openFaqItems[faq.id] && (
                        <div className="px-6 pb-4">
                          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
                            {faq.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Beautiful Payment Modal */}
      {showPayment && (
        <div className={`fixed inset-0 backdrop-blur-md z-50 flex items-center justify-center p-4 ${isDarkMode ? 'bg-black/60' : 'bg-gray-900/40'}`}>
          <div className="relative w-full max-w-lg">
            {/* Modal content */}
            <div className={`relative backdrop-blur-xl border rounded-3xl p-8 shadow-2xl ${isDarkMode ? 'bg-gray-900/95 border-white/10' : 'bg-white/95 border-gray-200'}`}>
              {/* Header */}
              <div className="text-center mb-8">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg ${isDarkMode ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'}`}>
                  <CreditCard className="h-8 w-8 text-white" />
                </div>
                <h3 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Secure Payment
                </h3>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Ready to call <span className={`font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{selectedPharmacies.length}</span> selected pharmacies
                </p>
                <div className={`flex items-center justify-center gap-2 mt-2 text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
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
                      ? isDarkMode
                        ? 'bg-gradient-to-r from-blue-600/30 to-blue-500/30 border-blue-400/80 shadow-xl shadow-blue-500/20'
                        : 'bg-blue-50 border-blue-300 shadow-lg shadow-blue-200/30'
                      : isDarkMode
                        ? 'bg-gradient-to-r from-gray-800/50 to-gray-700/50 hover:from-blue-600/20 hover:to-blue-500/20 border-gray-600/50 hover:border-blue-400/50 hover:shadow-xl hover:shadow-blue-500/10'
                        : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-lg'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedPaymentOption === 'per-call'
                            ? 'border-blue-400 bg-blue-400'
                            : isDarkMode
                              ? 'border-gray-600 group-hover:border-blue-400'
                              : 'border-gray-300 group-hover:border-blue-400'
                        }`}>
                          {selectedPaymentOption === 'per-call' && (
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                          )}
                        </div>
                        <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Pay Per Call</h4>
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                          Recommended
                        </span>
                      </div>
                      <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {selectedPharmacies.length <= 10 
                          ? `$1 per call • Max $7 for up to 10 calls` 
                          : `$1 per call • ${selectedPharmacies.length} calls total`
                        }
                      </p>
                      <div className={`flex items-center gap-2 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span>No commitment • Pay only for calls made</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        ${selectedPharmacies.length <= 10 
                          ? Math.min(selectedPharmacies.length, 7) 
                          : selectedPharmacies.length
                        }
                      </div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total cost</div>
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
                      ? isDarkMode
                        ? 'bg-gray-800/30 border-gray-700/50 cursor-not-allowed opacity-60'
                        : 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
                      : selectedPaymentOption === 'bulk'
                      ? isDarkMode
                        ? 'bg-gradient-to-r from-purple-600/30 to-purple-500/30 border-purple-400/80 shadow-xl shadow-purple-500/20 cursor-pointer'
                        : 'bg-purple-50 border-purple-300 shadow-lg shadow-purple-200/30 cursor-pointer'
                      : isDarkMode
                        ? 'bg-gradient-to-r from-purple-800/50 to-purple-700/50 hover:from-purple-600/20 hover:to-purple-500/20 border-gray-600/50 hover:border-purple-400/50 cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/10'
                        : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-lg cursor-pointer hover:scale-[1.02]'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedPharmacies.length <= 10 
                            ? isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-100'
                            : selectedPaymentOption === 'bulk'
                            ? 'border-purple-400 bg-purple-400'
                            : isDarkMode
                              ? 'border-gray-600 group-hover:border-purple-400'
                              : 'border-gray-300 group-hover:border-purple-400'
                        }`}>
                          {selectedPaymentOption === 'bulk' && selectedPharmacies.length > 10 && (
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                          )}
                        </div>
                        <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Bulk Rate</h4>
                        {selectedPharmacies.length > 10 && (
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/30">
                            Save ${selectedPharmacies.length - 7}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {selectedPharmacies.length <= 10 
                          ? 'Available for 10+ pharmacy calls'
                          : `$7 flat rate • Save $${(selectedPharmacies.length - 7).toFixed(0)} vs per-call pricing`
                        }
                      </p>
                      <div className={`flex items-center gap-2 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        <Crown className="h-4 w-4 text-purple-400" />
                        <span>{selectedPharmacies.length <= 10 ? 'Unlock with 10+ selections' : 'Best value for bulk calling'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>$7</div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Flat rate</div>
                    </div>
                  </div>
                  {/* Hover effect gradient */}
                  {selectedPharmacies.length > 10 && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-500/5 to-pink-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  )}
                </div>
              </div>

              {/* Security badge */}
              <div className={`flex items-center justify-center gap-2 text-xs mb-6 p-3 rounded-xl border ${isDarkMode ? 'bg-gray-800/30 border-gray-700/30 text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
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
                      : isDarkMode
                        ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
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
                          } - Continue to Checkout
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
                  className={`w-full py-3 rounded-xl transition-all duration-200 border ${isDarkMode ? 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white border-gray-600/30 hover:border-gray-500/50' : 'bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-700 border-gray-200 hover:border-gray-300'}`}
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

      {/* Search Results Modal */}
      {showSearchResults && selectedSearchResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
            <div className={`sticky top-0 border-b p-6 flex justify-between items-center ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Search Results</h2>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {selectedSearchResults.search.medication_name} {selectedSearchResults.search.dosage} • {selectedSearchResults.search.zipcode}
                </p>
              </div>
              <Button
                onClick={() => setShowSearchResults(false)}
                variant="outline"
                className={isDarkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-600'}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className={`rounded-lg p-4 text-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedSearchResults.summary.total_pharmacies}</div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Called</div>
                </div>
                <div className={`rounded-lg p-4 text-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <div className="text-2xl font-bold text-green-400">{selectedSearchResults.summary.in_stock}</div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>In Stock</div>
                </div>
                <div className={`rounded-lg p-4 text-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <div className="text-2xl font-bold text-red-400">{selectedSearchResults.summary.out_of_stock}</div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Out of Stock</div>
                </div>
                <div className={`rounded-lg p-4 text-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <div className="text-2xl font-bold text-yellow-400">{selectedSearchResults.summary.completed_calls}</div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Completed</div>
                </div>
              </div>

              {/* Pharmacy Results */}
              <div className="space-y-3">
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Pharmacy Results</h3>
                {selectedSearchResults.results.map((result: any) => (
                  <div key={result.id} className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{result.name}</h4>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{result.address}</p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{result.phone}</p>
                      </div>
                      <div className="text-right">
                        {result.status === 'completed' && result.availability !== undefined ? (
                          <div className="space-y-2">
                            <Badge className={result.availability ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}>
                              {result.availability ? 'In Stock' : 'Out of Stock'}
                            </Badge>
                            {result.price && (
                              <div className="text-green-400 font-medium">${result.price}</div>
                            )}
                          </div>
                        ) : (
                          <Badge className="bg-yellow-500/20 text-yellow-300">
                            {result.status === 'completed' ? 'No Data' : 'Pending'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {result.notes && (
                      <div className={`mt-2 p-2 rounded text-sm ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                        <strong>Notes:</strong> {result.notes}
                      </div>
                    )}
                    {result.last_updated && (
                      <div className="mt-2 text-xs text-gray-500">
                        Last updated: {new Date(result.last_updated).toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}