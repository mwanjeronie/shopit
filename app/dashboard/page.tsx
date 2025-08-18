import { getShoppingLists } from "@/app/actions/shopping"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ShoppingListCard } from "@/components/shopping/shopping-list-card"
import { CreateListDialog } from "@/components/shopping/create-list-dialog"
import { SignOutButton } from "@/components/auth/signout-button"
import { Store, ShoppingCart } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/signin")
  }

  const lists = await getShoppingLists()

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Shopping Tracker</h1>
            </div>
            <div className="flex items-center gap-2">
              <CreateListDialog />
              <SignOutButton />
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-1">Welcome back, {user.email}</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Your Shopping Lists</h2>
            <Badge variant="secondary">{lists.length} lists</Badge>
          </div>

          {lists.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No shopping lists yet</h3>
                <p className="text-gray-500 mb-4">Create your first shopping list to get started</p>
                <CreateListDialog />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {lists.map((list) => (
                <ShoppingListCard key={list.id} list={list} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
