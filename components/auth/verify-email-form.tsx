"use client"

import type React from "react"

import { useState } from "react"
import { resendVerificationEmail } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface VerifyEmailFormProps {
  email?: string
}

export function VerifyEmailForm({ email: initialEmail }: VerifyEmailFormProps) {
  const [email, setEmail] = useState(initialEmail || "")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [verificationUrl, setVerificationUrl] = useState("")

  async function handleResend(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")
    setError("")
    setVerificationUrl("")

    const result = await resendVerificationEmail(email)

    if (result.success) {
      setMessage(result.message || "Verification email sent!")
      if (result.verificationUrl && process.env.NODE_ENV === "development") {
        setVerificationUrl(result.verificationUrl)
      }
    } else {
      setError(result.error || "Failed to send verification email")
    }

    setIsLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resend Verification Email</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleResend} className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
            />
          </div>

          {message && <p className="text-sm text-green-600">{message}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Development Mode: Show verification link directly */}
          {verificationUrl && process.env.NODE_ENV === "development" && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-3 space-y-3">
                <p className="text-sm text-blue-700">Development Mode - Verification Link:</p>
                <div className="bg-white p-2 rounded border">
                  <code className="text-xs break-all text-blue-600">{verificationUrl}</code>
                </div>
                <Button
                  type="button"
                  onClick={() => window.open(verificationUrl, "_blank")}
                  size="sm"
                  className="w-full"
                >
                  🔗 Click to Verify Email
                </Button>
              </CardContent>
            </Card>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Sending..." : "Resend Verification Email"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
