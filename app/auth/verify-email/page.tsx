import { verifyEmail } from "@/app/actions/auth"
import { VerifyEmailForm } from "@/components/auth/verify-email-form"
import { redirect } from "next/navigation"

interface PageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function VerifyEmailPage({ searchParams }: PageProps) {
  const { token } = await searchParams

  // If token is provided in URL, attempt verification immediately
  if (token) {
    const result = await verifyEmail(token)

    if (result.success) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 text-green-600">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Email Verified!</h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Your email has been successfully verified. You can now sign in to your account.
              </p>
              <div className="mt-6">
                <a
                  href="/auth/signin"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Sign In
                </a>
              </div>
            </div>
          </div>
        </div>
      )
    } else {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 text-red-600">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Verification Failed</h2>
              <p className="mt-2 text-center text-sm text-red-600">{result.error}</p>
              {result.expired && result.email && (
                <div className="mt-6">
                  <VerifyEmailForm email={result.email} />
                </div>
              )}
              <div className="mt-4">
                <a href="/auth/signin" className="text-blue-600 hover:text-blue-500 text-sm">
                  Back to Sign In
                </a>
              </div>
            </div>
          </div>
        </div>
      )
    }
  }

  // If no token, redirect to sign in
  redirect("/auth/signin")
}
