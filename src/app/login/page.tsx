"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Mail, Lock, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/AuthContext"

export default function LoginPage() {
  const { user, loading: authLoading } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = createClient()

  // Check for confirmation errors and success messages
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const errorParam = urlParams.get('error')
    const messageParam = urlParams.get('message')
    
    if (errorParam === 'confirmation_failed') {
      setError('Email confirmation failed. Please try again or request a new confirmation email.')
    } else if (messageParam === 'confirmed') {
      setError('Email confirmed successfully! You can now log in.')
    }
    
    // Clear URL params
    if (errorParam || messageParam) {
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(to bottom right, #1D729E, #155a7a, #0d3a4f)'
      }}>
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  // Don't render login form if user is already logged in
  if (user) {
    return null
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setError("Passwords do not match")
          return
        }
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        })
        
        if (error) throw error
        
        setError("Check your email for the confirmation link")
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) throw error
        
        router.push("/dashboard")
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Side - Visual Branding Card */}
      <div className="hidden lg:flex lg:w-1/2 p-8 pr-4">
        <div className="relative overflow-hidden rounded-3xl shadow-2xl w-full" style={{
          background: 'linear-gradient(135deg, #1D729E 0%, #155a7a 50%, #0d3a4f 100%)'
        }}>
          {/* Background decoration */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-32 right-16 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-400/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center px-12 py-16 h-full">
            <div className="max-w-lg">
              {/* Logo */}
              <div className="flex items-center space-x-3 mb-12">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Heart className="h-7 w-7 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">RefillRadar</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
                Find your ADHD medicine 
                <span className="block text-cyan-300">in stock</span>
              </h1>

              <p className="text-xl text-white/80 mb-8 leading-relaxed">
                Stop calling pharmacy after pharmacy. We find your medication availability and pricing in minutes.
              </p>

              {/* Stats */}
              <div className="flex space-x-8">
                <div>
                  <div className="text-3xl font-bold text-white">$50K+</div>
                  <div className="text-sm text-white/70 uppercase tracking-wide">Saved by Users</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">10K+</div>
                  <div className="text-sm text-white/70 uppercase tracking-wide">Searches</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">500+</div>
                  <div className="text-sm text-white/70 uppercase tracking-wide">Pharmacies</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center space-x-2 mb-6">
              <Heart className="h-8 w-8 text-cyan-600" />
              <span className="text-2xl font-bold text-gray-900">RefillRadar</span>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isSignUp ? "Hello, have we met before?" : "Welcome to RefillRadar"}
            </h2>
            <p className="text-gray-600">
              {isSignUp 
                ? "Join thousands finding their medications faster" 
                : "Sign in to your account"
              }
            </p>
          </div>

          {/* Form Card */}
          <Card className="bg-white shadow-xl border-0">
            <CardContent className="p-8">
              {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-6">
                {isSignUp && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10 h-12 border-gray-300 focus:border-cyan-500 focus:ring-cyan-500"
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 border-gray-300 focus:border-cyan-500 focus:ring-cyan-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12 border-gray-300 focus:border-cyan-500 focus:ring-cyan-500"
                      required
                    />
                  </div>
                </div>

                {isSignUp && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 h-12 border-gray-300 focus:border-cyan-500 focus:ring-cyan-500"
                        required
                      />
                    </div>
                  </div>
                )}

                <Button 
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold text-lg transition-all duration-200"
                >
                  {loading ? "Loading..." : (isSignUp ? "Create Account" : "Sign In")}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-cyan-600 hover:text-cyan-700 font-semibold underline"
                  >
                    {isSignUp ? "Sign in" : "Sign up"}
                  </button>
                </p>
                {!isSignUp && (
                  <Link href="#" className="block mt-2 text-sm text-cyan-600 hover:text-cyan-700 underline">
                    Forgot your password?
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Privacy Notice */}
          <p className="mt-6 text-xs text-center text-gray-500">
            By signing up, you agree to our{" "}
            <Link href="#" className="text-cyan-600 hover:text-cyan-700 underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" className="text-cyan-600 hover:text-cyan-700 underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}