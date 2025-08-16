"use client"

import { useState } from "react"
import { signIn } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VerifyEmailForm } from "./verify-email-form"

export function SignInForm() {
  const [errors, setErrors] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const [needsVerification, setNeedsVerification] = useState<{
    email: string
  } | null>(null)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setErrors({})
    setNeedsVerification(null)

    const result = await signIn(formData)

    if (result?.errors) {
      setErrors(result.errors)
      if (result.requiresVerification && result.email) {
        setNeedsVerification({ email: result.email })
      }
    }

    setIsLoading(false)
  }

  if (needsVerification) {
    return (
      <div className="space-y-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-5 w-5 text-yellow-600">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <p className="text-sm text-yellow-800">Please verify your email address before signing in.</p>
            </div>
          </CardContent>
        </Card>

        <VerifyEmailForm email={needsVerification.email} />

        <div className="text-center">
          <button onClick={() => setNeedsVerification(null)} className="text-blue-600 hover:text-blue-500 text-sm">
            Back to Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="Enter your email" />
            {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email[0]}</p>}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required placeholder="Enter your password" />
            {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password[0]}</p>}
          </div>

          {errors._form && <p className="text-sm text-red-600">{errors._form[0]}</p>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
