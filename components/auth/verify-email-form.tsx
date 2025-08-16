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

  async function handleResend(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")
    setError("")

    const result = await resendVerificationEmail(email)

    if (result.success) {
      setMessage(result.message || "Verification email sent!")
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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Sending..." : "Resend Verification Email"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
