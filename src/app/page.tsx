"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, MapPin, Phone, DollarSign, CheckCircle, Star, Clock, Shield, Bell, LogOut, User } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/AuthContext"

export default function LandingPage() {
  const [selectedPlan, setSelectedPlan] = useState('premium')
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const { user, loading, signOut } = useAuth()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleSignOut = async () => {
    await signOut()
    setShowUserDropdown(false)
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
    <div className="min-h-screen">
      {/* Hero Section with Sky Background */}
      <section className="relative overflow-hidden">
        {/* Sky Background */}
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
          <header className="container mx-auto px-4 py-6">
            <nav className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Heart className="h-8 w-8 text-white" />
                <span className="text-2xl font-bold text-white">RefillRadar</span>
              </div>
              <div className="flex items-center space-x-4">
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  </div>
                ) : user ? (
                  <div className="relative" ref={dropdownRef}>
                    <Button 
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                      variant="ghost" 
                      className="glassmorphism glassmorphism-hover text-white px-4 py-2 border-0 flex items-center space-x-2"
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
                        className="glassmorphism glassmorphism-hover text-white px-6 border-0"
                      >
                        LOG IN
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button className="glassmorphism glassmorphism-hover text-white px-6 border-0">
                        GET STARTED
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </header>

          {/* Beta Badge */}
          <div className="container mx-auto px-4 pt-12 text-center">
            <div className="inline-flex items-center justify-center">
              <div className="glassmorphism rounded-full px-4 py-2 text-sm text-white border-0">
                $1 PER PHARMACY CALLED
              </div>
            </div>
          </div>

          {/* Hero Content */}
          <div className="container mx-auto px-4 py-8 text-center">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-6xl md:text-8xl font-light text-white mb-8 leading-tight tracking-wide" style={{ fontFamily: 'Times, "Times New Roman", serif' }}>
                Find your medications
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed font-normal" style={{ fontFamily: 'Times, "Times New Roman", serif' }}>
                RefillRadar is your personal AI Pharmacy Advisor. 
                Track your medications, check availability and optimize 
                your refill routine—all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <Link href="/login">
                  <Button 
                    size="lg" 
                    className="glassmorphism glassmorphism-hover text-white px-8 py-4 text-lg rounded-lg border-0"
                  >
                    GET STARTED →
                  </Button>
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-col items-center space-y-4 mb-12">
                <div className="flex items-center space-x-6 text-white/70">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm" style={{ fontFamily: 'Times, "Times New Roman", serif' }}>
                      Hundreds of searches completed daily
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-center space-x-8 text-white/60">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white" style={{ fontFamily: 'Times, "Times New Roman", serif' }}>1000+</div>
                    <div className="text-xs uppercase tracking-wide">Satisfied Users</div>
                  </div>
                  <div className="w-px h-8 bg-white/20"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white" style={{ fontFamily: 'Times, "Times New Roman", serif' }}>15K+</div>
                    <div className="text-xs uppercase tracking-wide">Pharmacy Calls Made</div>
                  </div>
                  <div className="w-px h-8 bg-white/20"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white" style={{ fontFamily: 'Times, "Times New Roman", serif' }}>$50K+</div>
                    <div className="text-xs uppercase tracking-wide">Saved by Users</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              How RefillRadar Works
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Our AI-powered system automates the tedious process of calling pharmacies, 
              saving you time and helping you find your medications faster.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Step 1 Card */}
            <div className="relative group">
              <div 
                className="rounded-2xl h-80 bg-cover bg-center relative overflow-hidden transition-transform duration-300 group-hover:scale-105"
                style={{
                  backgroundImage: `url('/images/1.jpg')`,
                }}
              >
                {/* Overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 rounded-2xl"></div>
                
                {/* Content */}
                <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                  <div className="mb-4">
                    <div className="w-16 h-16 glassmorphism rounded-full flex items-center justify-center mb-4">
                      <span className="text-2xl font-bold text-white">1</span>
                    </div>
                    <h3 className="text-2xl font-semibold mb-3">Search & Locate</h3>
                    <p className="text-gray-100 leading-relaxed">
                      Enter your medication and location. Our system identifies nearby pharmacies 
                      within your preferred radius and prepares to call them.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 Card */}
            <div className="relative group">
              <div 
                className="rounded-2xl h-80 bg-cover bg-center relative overflow-hidden transition-transform duration-300 group-hover:scale-105"
                style={{
                  backgroundImage: `url('/images/2.jpg')`,
                }}
              >
                {/* Overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 rounded-2xl"></div>
                
                {/* Content */}
                <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                  <div className="mb-4">
                    <div className="w-16 h-16 glassmorphism rounded-full flex items-center justify-center mb-4">
                      <span className="text-2xl font-bold text-white">2</span>
                    </div>
                    <h3 className="text-2xl font-semibold mb-3">AI Calls Pharmacies</h3>
                    <p className="text-gray-100 leading-relaxed">
                      Our AI voice agent simultaneously calls each pharmacy to check real-time 
                      availability, pricing, and stock levels for your prescription.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 Card */}
            <div className="relative group">
              <div 
                className="rounded-2xl h-80 bg-cover bg-center relative overflow-hidden transition-transform duration-300 group-hover:scale-105"
                style={{
                  backgroundImage: `url('/images/3.jpg')`,
                }}
              >
                {/* Overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 rounded-2xl"></div>
                
                {/* Content */}
                <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                  <div className="mb-4">
                    <div className="w-16 h-16 glassmorphism rounded-full flex items-center justify-center mb-4">
                      <span className="text-2xl font-bold text-white">3</span>
                    </div>
                    <h3 className="text-2xl font-semibold mb-3">Get Results</h3>
                    <p className="text-gray-100 leading-relaxed">
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
      <section className="py-20 bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-300">
              Thousands of patients trust RefillRadar to find their medications faster
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="rounded-2xl p-8 relative overflow-hidden" style={{
              background: 'radial-gradient(circle at 30% 20%, #60A5FA 0%, #3B82F6 25%, #1E40AF 70%, #1E3A8A 100%)'
            }}>
              <div className="relative z-10">
                <div className="flex items-center mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-white fill-current" />
                  ))}
                </div>
                <p className="text-white mb-8 text-lg leading-relaxed">
                  &ldquo;RefillRadar saved me hours of calling pharmacies when my son needed his inhaler during the shortage. 
                  Found it in stock at 3 locations within minutes!&rdquo;
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-semibold">SJ</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Sarah Johnson</p>
                    <p className="text-blue-100 text-sm">Parent from Denver, CO</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-8 relative overflow-hidden" style={{
              background: 'radial-gradient(circle at 30% 20%, #4ADE80 0%, #22C55E 25%, #16A34A 70%, #15803D 100%)'
            }}>
              <div className="relative z-10">
                <div className="flex items-center mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-white fill-current" />
                  ))}
                </div>
                <p className="text-white mb-8 text-lg leading-relaxed">
                  &ldquo;Managing diabetes medications for my elderly mother was stressful until I found RefillRadar. 
                  Now I can easily compare prices and availability across all local pharmacies.&rdquo;
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-semibold">MR</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Michael Rodriguez</p>
                    <p className="text-green-100 text-sm">Caregiver from Austin, TX</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-8 relative overflow-hidden" style={{
              background: 'radial-gradient(circle at 30% 20%, #22D3EE 0%, #06B6D4 25%, #0891B2 70%, #0E7490 100%)'
            }}>
              <div className="relative z-10">
                <div className="flex items-center mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-white fill-current" />
                  ))}
                </div>
                <p className="text-white mb-8 text-lg leading-relaxed">
                  &ldquo;As someone with multiple chronic conditions, RefillRadar has been a game-changer. 
                  I save $200+ monthly by finding the best prices automatically.&rdquo;
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-semibold">AL</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Anna Lee</p>
                    <p className="text-cyan-100 text-sm">Patient from Seattle, WA</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Choose Your Plan Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-300">
              Simple, transparent pricing that scales with your needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto items-start">
            {/* Premium Plan */}
            <div className="relative pt-6 h-full">
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-20">
                <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  RECOMMENDED
                </span>
              </div>
              <div 
                className={`cursor-pointer transition-all duration-300 bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 text-center relative overflow-hidden h-full flex flex-col ${
                  selectedPlan === 'premium' 
                    ? 'border-2 border-blue-500/80 shadow-lg shadow-blue-500/20' 
                    : 'border border-blue-500/30 hover:border-blue-500/50'
                }`}
                onClick={() => setSelectedPlan('premium')}
              >
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl"></div>
                
                <div className="relative z-10 flex flex-col h-full">
                  {/* Plan Icon */}
                  <div className="bg-blue-500/20 border border-blue-400/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                    <Shield className="h-8 w-8 text-blue-400" />
                  </div>
                  
                  <h3 className="text-3xl font-bold text-white mb-2">Premium</h3>
                  <p className="text-gray-300 text-lg mb-6">Complete pharmacy search solution</p>
                  
                  <div className="mb-8">
                    <span className="text-6xl font-bold text-white">$50</span>
                    <span className="text-gray-300 text-xl">/month</span>
                  </div>

                  <p className="text-gray-300 mb-8 text-left">
                    Unlimited pharmacy searches with priority AI calling and advanced features. 
                    Ideal for families or anyone who needs medications regularly.
                  </p>
                  
                  <div className="space-y-4 text-left mb-8 flex-grow">
                    <div className="flex items-start space-x-3">
                      <div className="bg-green-500/20 border border-green-400/30 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">Unlimited pharmacy searches</p>
                        <p className="text-gray-400 text-sm">Find any medication without limits</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-500/20 border border-blue-400/30 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Shield className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">Personal medication assistant</p>
                        <p className="text-gray-400 text-sm">Dedicated support for all your pharmacy needs</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Clock className="h-4 w-4 text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">Express AI calling</p>
                        <p className="text-gray-400 text-sm">Faster results with priority queue access</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-500/20 border border-blue-400/30 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bell className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">Smart refill alerts & tracking</p>
                        <p className="text-gray-400 text-sm">Automatic notifications when it&apos;s time to refill</p>
                      </div>
                    </div>
                  </div>

                  <Link href="/login">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg rounded-lg">
                      Choose Premium →
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Pay-Per-Search Plan */}
            <div className="relative pt-6 h-full">
              <div 
                className={`cursor-pointer transition-all duration-300 bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 text-center relative overflow-hidden h-full flex flex-col ${
                  selectedPlan === 'payper' 
                    ? 'border-2 border-gray-400/80 shadow-lg shadow-gray-500/20' 
                    : 'border border-gray-600/30 hover:border-gray-500/50'
                }`}
                onClick={() => setSelectedPlan('payper')}
              >
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-transparent rounded-2xl"></div>
                
                <div className="relative z-10 flex flex-col h-full">
                  {/* Plan Icon */}
                  <div className="bg-gray-500/20 border border-gray-400/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                    <DollarSign className="h-8 w-8 text-gray-400" />
                  </div>
                  
                  <h3 className="text-3xl font-bold text-white mb-2">Pay-Per-Search</h3>
                  <p className="text-gray-300 text-lg mb-6">Simple per-pharmacy pricing</p>
                  
                  <div className="mb-8">
                    <span className="text-6xl font-bold text-white">$1</span>
                    <span className="text-gray-300 text-xl">/pharmacy</span>
                  </div>

                  <p className="text-gray-300 mb-8 text-left">
                    Perfect for occasional medication searches. Pay only when you need to find a specific prescription.
                  </p>
                  
                  <div className="space-y-4 text-left mb-8 flex-grow">
                    <div className="flex items-start space-x-3">
                      <div className="bg-green-500/20 border border-green-400/30 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">$1 per pharmacy contacted</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-green-500/20 border border-green-400/30 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">Zero monthly fees</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-green-500/20 border border-green-400/30 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">Flexible usage-based billing</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-green-500/20 border border-green-400/30 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">Full network of local pharmacies</p>
                      </div>
                    </div>
                  </div>

                  <Link href="/login">
                    <Button className="w-full bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 py-4 text-lg rounded-lg">
                      Start Searching
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <Heart className="h-8 w-8 text-cyan-400" />
                <span className="text-2xl font-bold text-white">RefillRadar</span>
              </div>
              <p className="text-gray-400 mb-6">
                Your personal AI Pharmacy Advisor. Find medications faster, compare prices, 
                and never waste time calling pharmacies again.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">f</span>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">t</span>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">in</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white">How it Works</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">API</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Status</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Community</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">HIPAA Compliance</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 RefillRadar. All rights reserved.
            </p>
            <p className="text-gray-400 text-sm mt-4 md:mt-0">
              Made with ❤️ for patients everywhere
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}