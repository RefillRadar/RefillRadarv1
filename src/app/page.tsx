"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, MapPin, Phone, DollarSign, CheckCircle, Star, Clock, Shield, Bell, LogOut, User, Sun, Moon, Crown, ChevronDown } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/AuthContext"

export default function LandingPage() {
  const [selectedPlan, setSelectedPlan] = useState('premium')
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [openFaqItems, setOpenFaqItems] = useState<{[key: string]: boolean}>({})
  const { user, loading, signOut } = useAuth()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleSignOut = async () => {
    await signOut()
    setShowUserDropdown(false)
  }

  // Handle subscription checkout for pricing plans
  const handleSubscriptionCheckout = async (planType: 'base' | 'unlimited') => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/login'
      return
    }

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

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('landing-theme')
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark')
    }
  }, [])

  // Save theme preference to localStorage
  const toggleTheme = () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)
    localStorage.setItem('landing-theme', newTheme ? 'dark' : 'light')
  }

  // Toggle FAQ item
  const toggleFaqItem = (id: string) => {
    setOpenFaqItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

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
  
  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Sky Background - Same for both modes */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url('/sky-bg.avif')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        {/* Overlay for better readability */}
        <div className="absolute inset-0 bg-black/30" />
        
        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <header className="container mx-auto px-4 py-4 sm:py-6">
            <nav className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                <span className="text-xl sm:text-2xl font-bold text-white">RefillRadar</span>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Theme Toggle */}
                <Button
                  onClick={toggleTheme}
                  variant="ghost"
                  size="sm"
                  className={`${isDarkMode 
                    ? 'glassmorphism glassmorphism-hover text-white border-0' 
                    : 'bg-white/80 hover:bg-white border border-gray-200 text-gray-700'
                  } px-2 py-2 sm:px-3`}
                >
                  {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  </div>
                ) : user ? (
                  <div className="relative" ref={dropdownRef}>
                    <Button 
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                      variant="ghost" 
                      className={`${isDarkMode 
                        ? 'glassmorphism glassmorphism-hover text-white border-0' 
                        : 'bg-white/80 hover:bg-white border border-gray-200 text-gray-700'
                      } px-2 py-2 sm:px-4 flex items-center space-x-2`}
                    >
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Account'}
                      </span>
                      <svg className={`w-4 h-4 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </Button>
                    
                    {showUserDropdown && (
                      <div className="absolute right-0 mt-2 w-56 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl py-2 z-50">
                        <div className="px-4 py-2 border-b border-white/20">
                          <p className="text-white font-semibold text-sm">
                            {user.user_metadata?.full_name || 'User'}
                          </p>
                          <p className="text-white/60 text-xs">{user.email}</p>
                        </div>
                        <Link href="/dashboard">
                          <button className="w-full text-left px-4 py-2 text-white hover:bg-white/10 transition-colors flex items-center space-x-2">
                            <Heart className="h-4 w-4" />
                            <span>Dashboard</span>
                          </button>
                        </Link>
                        <button 
                          onClick={handleSignOut}
                          className="w-full text-left px-4 py-2 text-white hover:bg-white/10 transition-colors flex items-center space-x-2"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Link href="/login">
                      <Button 
                        variant="ghost" 
                        className="glassmorphism glassmorphism-hover text-white px-3 sm:px-6 text-sm sm:text-base border-0"
                      >
                        LOG IN
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button className="glassmorphism glassmorphism-hover text-white px-3 sm:px-6 text-sm sm:text-base border-0">
                        GET STARTED
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </header>

          {/* Beta Badge */}
          <div className="container mx-auto px-4 pt-8 sm:pt-12 text-center">
            <div className="inline-flex items-center justify-center">
              <div className="glassmorphism rounded-full px-3 py-2 text-xs sm:text-sm text-white border-0">
                $1 PER PHARMACY CALLED
              </div>
            </div>
          </div>

          {/* Hero Content */}
          <div className="container mx-auto px-4 py-6 sm:py-8 text-center">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl sm:text-6xl md:text-8xl font-light text-white mb-6 sm:mb-8 leading-tight tracking-wide" style={{ fontFamily: 'Times, "Times New Roman", serif' }}>
                Find your medications
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed font-normal px-2" style={{ fontFamily: 'Times, "Times New Roman", serif' }}>
                RefillRadar is your personal Pharmacy Advisor. 
                Track your medications, check availability and optimize 
                your refill routine—all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6 sm:mb-8">
                <Link href="/login">
                  <Button 
                    size="lg" 
                    className="glassmorphism glassmorphism-hover text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg rounded-lg border-0 w-full sm:w-auto max-w-xs"
                  >
                    GET STARTED →
                  </Button>
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-col items-center space-y-4 sm:space-y-6 mb-8 sm:mb-12">
                <div className="flex items-center text-white/70 px-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs sm:text-sm text-center" style={{ fontFamily: 'Times, "Times New Roman", serif' }}>
                      Hundreds of searches completed daily
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-center space-x-4 sm:space-x-8 text-white/60 px-2">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: 'Times, "Times New Roman", serif' }}>1000+</div>
                    <div className="text-xs uppercase tracking-wide">Satisfied Users</div>
                  </div>
                  <div className="w-px h-6 sm:h-8 bg-white/20"></div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: 'Times, "Times New Roman", serif' }}>15K+</div>
                    <div className="text-xs uppercase tracking-wide">Pharmacy<br className="sm:hidden" /> Calls Made</div>
                  </div>
                  <div className="w-px h-6 sm:h-8 bg-white/20"></div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: 'Times, "Times New Roman", serif' }}>$50K+</div>
                    <div className="text-xs uppercase tracking-wide">Saved by Users</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className={`py-12 sm:py-20 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              How RefillRadar Works
            </h2>
            <p className={`text-lg sm:text-xl max-w-3xl mx-auto px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Our automated system handles the tedious process of checking pharmacy availability, 
              saving you time and helping you find your medications faster.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {/* Step 1 Card */}
            <div className="relative group">
              <div 
                className="rounded-2xl h-64 sm:h-80 bg-cover bg-center relative overflow-hidden transition-transform duration-300 group-hover:scale-105"
                style={{
                  backgroundImage: `url('/images/1.jpg')`,
                }}
              >
                {/* Overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 rounded-2xl"></div>
                
                {/* Content */}
                <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end text-white">
                  <div className="mb-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 glassmorphism rounded-full flex items-center justify-center mb-3 sm:mb-4">
                      <span className="text-xl sm:text-2xl font-bold text-white">1</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3">Search & Locate</h3>
                    <p className="text-gray-100 leading-relaxed text-sm sm:text-base">
                      Enter your medication and location. Our system identifies nearby pharmacies 
                      within your preferred radius and prepares to check availability.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 Card */}
            <div className="relative group">
              <div 
                className="rounded-2xl h-64 sm:h-80 bg-cover bg-center relative overflow-hidden transition-transform duration-300 group-hover:scale-105"
                style={{
                  backgroundImage: `url('/images/2.jpg')`,
                }}
              >
                {/* Overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 rounded-2xl"></div>
                
                {/* Content */}
                <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end text-white">
                  <div className="mb-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 glassmorphism rounded-full flex items-center justify-center mb-3 sm:mb-4">
                      <span className="text-xl sm:text-2xl font-bold text-white">2</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3">Real-Time Availability Check</h3>
                    <p className="text-gray-100 leading-relaxed text-sm sm:text-base">
                      Our system simultaneously contacts each pharmacy to check real-time 
                      availability, pricing, and stock levels for your prescription.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 Card */}
            <div className="relative group">
              <div 
                className="rounded-2xl h-64 sm:h-80 bg-cover bg-center relative overflow-hidden transition-transform duration-300 group-hover:scale-105"
                style={{
                  backgroundImage: `url('/images/3.jpg')`,
                }}
              >
                {/* Overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 rounded-2xl"></div>
                
                {/* Content */}
                <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end text-white">
                  <div className="mb-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 glassmorphism rounded-full flex items-center justify-center mb-3 sm:mb-4">
                      <span className="text-xl sm:text-2xl font-bold text-white">3</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3">Get Results</h3>
                    <p className="text-gray-100 leading-relaxed text-sm sm:text-base">
                      Receive ranked results with availability, pricing, and confidence scores. 
                      Choose the best pharmacy option and save time and money.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className={`py-12 sm:py-20 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              What Our Users Say
            </h2>
            <p className={`text-lg sm:text-xl px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Thousands of patients trust RefillRadar to find their medications faster
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            <div className="rounded-2xl p-6 sm:p-8 relative overflow-hidden" style={{
              background: 'radial-gradient(circle at 30% 20%, #60A5FA 0%, #3B82F6 25%, #1E40AF 70%, #1E3A8A 100%)'
            }}>
              <div className="relative z-10">
                <div className="flex items-center mb-4 sm:mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 text-white fill-current" />
                  ))}
                </div>
                <p className="text-white mb-6 sm:mb-8 text-base sm:text-lg leading-relaxed">
                  &ldquo;RefillRadar saved me hours of calling pharmacies when my son needed his inhaler during the shortage. 
                  Found it in stock at 3 locations within minutes!&rdquo;
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mr-3 sm:mr-4">
                    <span className="text-white font-semibold text-sm sm:text-base">SJ</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm sm:text-base">Sarah Johnson</p>
                    <p className="text-blue-100 text-xs sm:text-sm">Parent from Denver, CO</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-6 sm:p-8 relative overflow-hidden" style={{
              background: 'radial-gradient(circle at 30% 20%, #4ADE80 0%, #22C55E 25%, #16A34A 70%, #15803D 100%)'
            }}>
              <div className="relative z-10">
                <div className="flex items-center mb-4 sm:mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 text-white fill-current" />
                  ))}
                </div>
                <p className="text-white mb-6 sm:mb-8 text-base sm:text-lg leading-relaxed">
                  &ldquo;Managing diabetes medications for my elderly mother was stressful until I found RefillRadar. 
                  Now I can easily compare prices and availability across all local pharmacies.&rdquo;
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mr-3 sm:mr-4">
                    <span className="text-white font-semibold text-sm sm:text-base">MR</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm sm:text-base">Michael Rodriguez</p>
                    <p className="text-green-100 text-xs sm:text-sm">Caregiver from Austin, TX</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-6 sm:p-8 relative overflow-hidden" style={{
              background: 'radial-gradient(circle at 30% 20%, #22D3EE 0%, #06B6D4 25%, #0891B2 70%, #0E7490 100%)'
            }}>
              <div className="relative z-10">
                <div className="flex items-center mb-4 sm:mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 text-white fill-current" />
                  ))}
                </div>
                <p className="text-white mb-6 sm:mb-8 text-base sm:text-lg leading-relaxed">
                  &ldquo;As someone with multiple chronic conditions, RefillRadar has been a game-changer. 
                  I save $200+ monthly by finding the best prices automatically.&rdquo;
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mr-3 sm:mr-4">
                    <span className="text-white font-semibold text-sm sm:text-base">AL</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm sm:text-base">Anna Lee</p>
                    <p className="text-cyan-100 text-xs sm:text-sm">Patient from Seattle, WA</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Choose Your Plan Section */}
      <section className={`py-12 sm:py-20 ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-20">
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Choose Your Plan
            </h2>
            <p className={`text-lg sm:text-xl px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Simple, transparent pricing that scales with your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto items-start">
            {/* Pay As You Go Plan */}
            <div className="relative pt-6 h-full">
              <div 
                className={`cursor-pointer transition-all duration-300 backdrop-blur-sm rounded-2xl p-8 text-center relative overflow-hidden h-full flex flex-col ${
                  isDarkMode 
                    ? 'bg-gray-900/50' 
                    : 'bg-white border border-gray-200'
                } ${
                  selectedPlan === 'payper' 
                    ? 'border-2 border-gray-400/80 shadow-lg shadow-gray-500/20' 
                    : isDarkMode
                      ? 'border border-gray-600/30 hover:border-gray-500/50'
                      : 'hover:border-gray-300 hover:shadow-md'
                }`}
                onClick={() => setSelectedPlan('payper')}
              >
                <div className="relative z-10 flex flex-col h-full">
                  {/* Plan Icon */}
                  <div className={`rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 ${
                    isDarkMode 
                      ? 'bg-gray-500/20 border border-gray-400/30' 
                      : 'bg-gray-100 border border-gray-200'
                  }`}>
                    <DollarSign className={`h-8 w-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  </div>
                  
                  <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Pay As You Go</h3>
                  <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Perfect for occasional searches</p>
                  
                  <div className="mb-6">
                    <span className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>$1</span>
                    <span className={`text-lg ml-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>/pharmacy</span>
                    <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Pay per call basis
                    </p>
                  </div>
                  
                  <div className="space-y-4 text-left mb-8 flex-grow">
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
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>We check pharmacies for you</p>
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

                  <Link href="/login">
                    <Button className={`w-full py-3 text-lg rounded-lg ${
                      isDarkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300'
                    }`}>
                      Start Searching
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Base Plan */}
            <div className="relative pt-6 h-full">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  RECOMMENDED
                </span>
              </div>
              <div 
                className={`cursor-pointer transition-all duration-300 backdrop-blur-sm rounded-2xl p-8 text-center relative overflow-hidden h-full flex flex-col ${
                  isDarkMode 
                    ? 'bg-gray-900/50' 
                    : 'bg-white border border-gray-200'
                } ${
                  selectedPlan === 'base' 
                    ? 'border-2 border-green-500/80 shadow-lg shadow-green-500/20' 
                    : isDarkMode
                      ? 'border border-green-500/30 hover:border-green-500/50'
                      : 'hover:border-green-300 hover:shadow-md'
                }`}
                onClick={() => setSelectedPlan('base')}
              >
                <div className="relative z-10 flex flex-col h-full mt-4">
                  {/* Plan Icon */}
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-4 mx-auto">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  
                  <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Base Plan</h3>
                  <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Great value for regular users</p>
                  
                  <div className="mb-6">
                    <span className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>$20</span>
                    <span className={`text-lg ml-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>/month</span>
                    <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      25 pharmacy calls included
                    </p>
                  </div>
                  
                  <div className="space-y-4 text-left mb-8 flex-grow">
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
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>We check pharmacies for you</p>
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
                    className="w-full py-3 text-lg rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  >
                    Choose Base Plan →
                  </Button>
                </div>
              </div>
            </div>

            {/* Unlimited Plan */}
            <div className="relative pt-6 h-full">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  BEST VALUE
                </span>
              </div>
              <div 
                className={`cursor-pointer transition-all duration-300 backdrop-blur-sm rounded-2xl p-8 text-center relative overflow-hidden h-full flex flex-col ${
                  isDarkMode 
                    ? 'bg-gray-900/50' 
                    : 'bg-white border border-gray-200'
                } ${
                  selectedPlan === 'unlimited' 
                    ? 'border-2 border-blue-500/80 shadow-lg shadow-blue-500/20' 
                    : isDarkMode
                      ? 'border border-blue-500/30 hover:border-blue-500/50'
                      : 'hover:border-blue-300 hover:shadow-md'
                }`}
                onClick={() => setSelectedPlan('unlimited')}
              >
                <div className="relative z-10 flex flex-col h-full mt-4">
                  {/* Plan Icon */}
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 mx-auto">
                    <Crown className="h-8 w-8 text-white" />
                  </div>
                  
                  <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Unlimited</h3>
                  <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>For frequent medication searches</p>
                  
                  <div className="mb-6">
                    <span className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>$50</span>
                    <span className={`text-lg ml-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>/month</span>
                    <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Unlimited pharmacy calls
                    </p>
                  </div>
                  
                  <div className="space-y-4 text-left mb-8 flex-grow">
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
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Priority checking</p>
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
                    className="w-full py-3 text-lg rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    Choose Unlimited →
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={`py-12 sm:py-20 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Frequently Asked Questions
            </h2>
            <p className={`text-lg sm:text-xl px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Everything you need to know about RefillRadar
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {/* FAQ Item 1 */}
            <div className={`rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'} overflow-hidden`}>
              <button
                onClick={() => toggleFaqItem('faq1')}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50/5 transition-colors"
              >
                <span className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  How does RefillRadar work?
                </span>
                <ChevronDown className={`h-5 w-5 transition-transform ${openFaqItems.faq1 ? 'rotate-180' : ''} ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
              {openFaqItems.faq1 && (
                <div className={`px-6 pb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <p>Simply enter your medication name and location, and our system automatically contacts pharmacies in your area to check real-time availability and pricing. You'll receive ranked results showing which pharmacies have your medication in stock and at what price.</p>
                </div>
              )}
            </div>

            {/* FAQ Item 2 */}
            <div className={`rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'} overflow-hidden`}>
              <button
                onClick={() => toggleFaqItem('faq2')}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50/5 transition-colors"
              >
                <span className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  What's the difference between the pricing plans?
                </span>
                <ChevronDown className={`h-5 w-5 transition-transform ${openFaqItems.faq2 ? 'rotate-180' : ''} ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
              {openFaqItems.faq2 && (
                <div className={`px-6 pb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <p><strong>Pay As You Go:</strong> $1 per pharmacy contacted - perfect for occasional searches.</p>
                  <p><strong>Base Plan:</strong> $20/month for 25 pharmacy calls (20% savings) - great for regular users.</p>
                  <p><strong>Unlimited:</strong> $50/month for unlimited searches with priority processing and advanced features - best for frequent users.</p>
                </div>
              )}
            </div>

            {/* FAQ Item 3 */}
            <div className={`rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'} overflow-hidden`}>
              <button
                onClick={() => toggleFaqItem('faq3')}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50/5 transition-colors"
              >
                <span className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  How accurate are the availability checks?
                </span>
                <ChevronDown className={`h-5 w-5 transition-transform ${openFaqItems.faq3 ? 'rotate-180' : ''} ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
              {openFaqItems.faq3 && (
                <div className={`px-6 pb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <p>Our system provides real-time data by directly contacting pharmacies when you search. We include confidence scores with each result to help you understand the reliability of the information. While pharmacy inventory can change quickly, our results reflect the most current availability at the time of your search.</p>
                </div>
              )}
            </div>

            {/* FAQ Item 4 */}
            <div className={`rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'} overflow-hidden`}>
              <button
                onClick={() => toggleFaqItem('faq4')}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50/5 transition-colors"
              >
                <span className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Is my personal and payment information secure?
                </span>
                <ChevronDown className={`h-5 w-5 transition-transform ${openFaqItems.faq4 ? 'rotate-180' : ''} ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
              {openFaqItems.faq4 && (
                <div className={`px-6 pb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <p>Absolutely. We use enterprise-grade encryption and are HIPAA compliant. We only collect the minimum information needed to perform your searches and never store sensitive health data. All payments are processed securely through Stripe, and we never see or store your payment details.</p>
                </div>
              )}
            </div>

            {/* FAQ Item 5 */}
            <div className={`rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'} overflow-hidden`}>
              <button
                onClick={() => toggleFaqItem('faq5')}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50/5 transition-colors"
              >
                <span className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Can I cancel anytime?
                </span>
                <ChevronDown className={`h-5 w-5 transition-transform ${openFaqItems.faq5 ? 'rotate-180' : ''} ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
              {openFaqItems.faq5 && (
                <div className={`px-6 pb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <p>Yes! You can cancel your subscription at any time with no penalties or fees. For pay-as-you-go users, there's no commitment at all - you only pay when you use the service. If you cancel a monthly plan, you'll continue to have access until the end of your billing period.</p>
                </div>
              )}
            </div>

            {/* FAQ Item 6 */}
            <div className={`rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'} overflow-hidden`}>
              <button
                onClick={() => toggleFaqItem('faq6')}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50/5 transition-colors"
              >
                <span className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  What types of medications can I search for?
                </span>
                <ChevronDown className={`h-5 w-5 transition-transform ${openFaqItems.faq6 ? 'rotate-180' : ''} ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
              {openFaqItems.faq6 && (
                <div className={`px-6 pb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <p>You can search for most prescription medications, including brand name and generic drugs. Our system works particularly well for common medications like ADHD treatments, diabetes medications, blood pressure medications, and more. If you're unsure whether we can help with a specific medication, try a search - it's only $1 per pharmacy contacted.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-16 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <Heart className="h-8 w-8 text-cyan-400" />
                <span className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>RefillRadar</span>
              </div>
              <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Your personal Pharmacy Advisor. Find medications faster, compare prices, 
                and never waste time calling pharmacies again.
              </p>
              <div className="flex space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-600'}`}>f</span>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-600'}`}>t</span>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-600'}`}>in</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Product</h4>
              <ul className="space-y-3">
                <li><a href="#" className={`transition-colors ${
                  isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}>How it Works</a></li>
                <li><a href="#" className={`transition-colors ${
                  isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}>Pricing</a></li>
                <li><a href="#" className={`transition-colors ${
                  isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}>Features</a></li>
                <li><a href="#" className={`transition-colors ${
                  isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}>API</a></li>
              </ul>
            </div>

            <div>
              <h4 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Support</h4>
              <ul className="space-y-3">
                <li><a href="#" className={`transition-colors ${
                  isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}>Help Center</a></li>
                <li><a href="#" className={`transition-colors ${
                  isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}>Contact Us</a></li>
                <li><a href="#" className={`transition-colors ${
                  isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}>Status</a></li>
                <li><a href="#" className={`transition-colors ${
                  isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}>Community</a></li>
              </ul>
            </div>

            <div>
              <h4 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Legal</h4>
              <ul className="space-y-3">
                <li><a href="#" className={`transition-colors ${
                  isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}>Privacy Policy</a></li>
                <li><a href="#" className={`transition-colors ${
                  isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}>Terms of Service</a></li>
                <li><a href="#" className={`transition-colors ${
                  isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}>HIPAA Compliance</a></li>
                <li><a href="#" className={`transition-colors ${
                  isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}>Security</a></li>
              </ul>
            </div>
          </div>

          <div className={`border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center ${
            isDarkMode ? 'border-gray-800' : 'border-gray-200'
          }`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              © 2024 RefillRadar. All rights reserved.
            </p>
            <p className={`text-sm mt-4 md:mt-0 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Made with ❤️ for patients everywhere
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}