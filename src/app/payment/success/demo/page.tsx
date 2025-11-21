"use client"

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock, MapPin, Phone, Heart, ArrowRight, Receipt } from 'lucide-react'
import Confetti from 'react-confetti'

// Mock payment details for demo
const mockPaymentDetails = {
  sessionId: 'demo_session',
  paymentType: 'per-call',
  pharmacyCount: '5',
  searchData: {
    medication: 'Lisinopril',
    dosage: '10mg',
    zipcode: '10001',
    radius: 5
  },
  amount: 5
}

export default function PaymentSuccessDemo() {
  const [showConfetti, setShowConfetti] = useState(false)
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 })
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 })
  const celebrateButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setWindowDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    })

    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleCelebrate = () => {
    // Get button position
    if (celebrateButtonRef.current) {
      const rect = celebrateButtonRef.current.getBoundingClientRect()
      setButtonPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      })
    }
    
    setShowConfetti(true)
    // Stop confetti after 3 seconds
    setTimeout(() => {
      setShowConfetti(false)
    }, 3000)
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[9999]">
          <Confetti
            width={windowDimensions.width}
            height={windowDimensions.height}
            recycle={false}
            numberOfPieces={150}
            gravity={0.2}
            initialVelocityY={20}
            initialVelocityX={15}
            confettiSource={{
              x: buttonPosition.x,
              y: buttonPosition.y,
              w: 10,
              h: 10
            }}
            colors={['#60a5fa', '#34d399', '#fbbf24', '#f472b6', '#a78bfa', '#fb7185']}
          />
        </div>
      )}

      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        {/* Floating orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-indigo-500/25 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-40 right-1/4 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-3000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2 text-white">
              <Heart className="h-8 w-8 text-cyan-400" />
              <span className="text-2xl font-bold">RefillRadar</span>
            </Link>
          </nav>
        </div>
      </header>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Main Success Card */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
            {/* Success Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-2xl mb-4">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Payment successful
              </h1>
              <p className="text-white/70 text-sm">
                Your payment has been processed successfully. Your pharmacy search will begin soon.
              </p>
            </div>

            {/* Order Details */}
            <div className="backdrop-blur-sm bg-black/20 border border-white/10 rounded-2xl p-6 mb-6">
              <div className="flex justify-between items-center text-sm mb-4">
                <span className="text-white/60">ORDER #REFILL{Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
                <span className="text-white/60">{new Date().toLocaleDateString()}</span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="text-white font-medium mb-1">Pharmacy Search</div>
                  <div className="text-white/70 text-sm">{mockPaymentDetails.searchData.medication} {mockPaymentDetails.searchData.dosage} • {mockPaymentDetails.pharmacyCount} pharmacies</div>
                </div>

                <div className="space-y-2 pt-4 border-t border-white/10">
                  <div className="flex justify-between">
                    <span className="text-white/70">Subtotal</span>
                    <span className="text-white">${mockPaymentDetails.amount}.00</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-white">Total</span>
                    <span className="text-white">${mockPaymentDetails.amount}.00 USD</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-white/60 pt-4 border-t border-white/10">
                  <Receipt className="h-4 w-4" />
                  <span>Receipt sent to your email</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button 
                ref={celebrateButtonRef}
                onClick={handleCelebrate}
                className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-medium py-4 px-6 rounded-2xl hover:from-cyan-500 hover:to-blue-600 transition-all duration-200 shadow-lg hover:scale-105 active:scale-95"
              >
                Celebrate 🎉
              </button>
              
              <Link href="/dashboard" className="block">
                <button className="w-full backdrop-blur-sm bg-white/10 border border-white/20 text-white font-medium py-4 px-6 rounded-2xl hover:bg-white/20 transition-all duration-200">
                  Return to Dashboard
                </button>
              </Link>
            </div>

            {/* Footer Info */}
            <div className="flex justify-between items-center text-xs text-white/50 mt-6">
              <span>Paid just now ⚡</span>
              <span>Payment system</span>
            </div>
          </div>

          {/* What Happens Next - Outside main card */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-orange-400" />
              <h3 className="text-white font-semibold">What Happens Next</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 rounded-full flex items-center justify-center text-blue-400 text-sm font-semibold">1</div>
                <div>
                  <h4 className="text-white font-medium text-sm">AI Calls Begin</h4>
                  <p className="text-white/60 text-xs">Our AI will start calling pharmacies during business hours (9 AM - 6 PM EST)</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-purple-500/20 backdrop-blur-sm border border-purple-400/30 rounded-full flex items-center justify-center text-purple-400 text-sm font-semibold">2</div>
                <div>
                  <h4 className="text-white font-medium text-sm">Real-time Updates</h4>
                  <p className="text-white/60 text-xs">You&apos;ll receive email updates as we complete each pharmacy call</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-full flex items-center justify-center text-green-400 text-sm font-semibold">3</div>
                <div>
                  <h4 className="text-white font-medium text-sm">Results Delivered</h4>
                  <p className="text-white/60 text-xs">Get a complete report with availability, pricing, and pharmacy contact info</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}