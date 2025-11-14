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
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(to bottom right, #1D729E, #155a7a, #0d3a4f)'
    }}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white rounded-full mix-blend-screen filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-100 rounded-full mix-blend-screen filter blur-xl opacity-35 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-gray-50 rounded-full mix-blend-screen filter blur-xl opacity-25 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 text-white hover:text-cyan-300 transition-colors">
            <Heart className="h-8 w-8 text-cyan-400" />
            <span className="text-2xl font-bold">RefillRadar</span>
          </Link>
        </div>

        {/* Login/Signup Card */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </CardTitle>
            <CardDescription className="text-center text-gray-300">
              {isSignUp 
                ? "Sign up to start finding your medications faster" 
                : "Sign in to your RefillRadar account"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleAuth} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-200">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10 bg-white/10 border-white/30 text-white placeholder-white/70 focus:border-cyan-400"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white/10 border-white/30 text-white placeholder-white/70 focus:border-cyan-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-white/10 border-white/30 text-white placeholder-white/70 focus:border-cyan-400"
                    required
                  />
                </div>
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-200">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 bg-white/10 border-white/30 text-white placeholder-white/70 focus:border-cyan-400"
                      required
                    />
                  </div>
                </div>
              )}

              <Button 
                type="submit"
                disabled={loading}
                className="w-full glassmorphism glassmorphism-hover text-white border-0 py-3 text-lg font-semibold mt-6"
              >
                {loading ? "Loading..." : (isSignUp ? "Create Account" : "Sign In")}
              </Button>
            </form>


            <div className="text-center space-y-2">
              <p className="text-sm text-gray-400">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-cyan-400 hover:text-cyan-300 underline font-medium"
                >
                  {isSignUp ? "Sign in" : "Sign up"}
                </button>
              </p>
              {!isSignUp && (
                <Link href="#" className="text-sm text-cyan-400 hover:text-cyan-300 underline">
                  Forgot your password?
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Privacy Notice */}
        <p className="mt-6 text-xs text-center text-gray-400">
          By signing up, you agree to our{" "}
          <Link href="#" className="text-cyan-400 hover:text-cyan-300 underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="#" className="text-cyan-400 hover:text-cyan-300 underline">
            Privacy Policy
          </Link>
        </p>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}