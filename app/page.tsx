import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function HomePage() {
  const user = await getCurrentUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <ShoppingCart className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Shopping Tracker</h1>
          <p className="text-lg text-gray-600">
            Organize your shopping lists across different stores and never forget an item again.
          </p>
        </div>

        <div className="space-y-4">
          <Link href="/auth/signup" className="block">
            <Button className="w-full" size="lg">
              Get Started
            </Button>
          </Link>

          <Link href="/auth/signin" className="block">
            <Button variant="outline" className="w-full" size="lg">
              Sign In
            </Button>
          </Link>
        </div>

        <div className="mt-8 text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Features</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>✓ Create lists for different stores</p>
            <p>✓ Add items with images and notes</p>
            <p>✓ Track your shopping progress</p>
            <p>✓ Sync across all your devices</p>
          </div>
        </div>
      </div>
    </div>
  )
}
