"use client"

import { useState } from "react"
import { signUp } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VerifyEmailForm } from "./verify-email-form"

export function SignUpForm() {
  const [errors, setErrors] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState<{
    message: string
    requiresVerification?: boolean
  } | null>(null)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setErrors({})
    setSuccess(null)

    const result = await signUp(formData)

    if (result?.errors) {
      setErrors(result.errors)
    } else if (result?.success) {
      setSuccess({
        message: result.message || "Account created successfully!",
        requiresVerification: result.requiresVerification,
      })
    }

    setIsLoading(false)
  }

  if (success?.requiresVerification) {
    return (
      <div className="space-y-6">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-5 w-5 text-green-600">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-green-800">{success.message}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Check Your Email</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="mx-auto h-16 w-16 text-blue-600">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Verification Email Sent</h3>
              <p className="text-sm text-gray-600 mt-2">
                We've sent a verification link to your email address. Please click the link to verify your account
                before signing in.
              </p>
              <p className="text-xs text-gray-500 mt-2">The verification link will expire in 24 hours.</p>
            </div>
            <div className="pt-4">
              <a href="/auth/signin" className="text-blue-600 hover:text-blue-500 text-sm">
                Back to Sign In
              </a>
            </div>
          </CardContent>
        </Card>

        <VerifyEmailForm />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" type="text" required placeholder="Enter your name" />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name[0]}</p>}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="Enter your email" />
            {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email[0]}</p>}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="Enter your password"
              minLength={6}
            />
            {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password[0]}</p>}
          </div>

          {errors._form && <p className="text-sm text-red-600">{errors._form[0]}</p>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
