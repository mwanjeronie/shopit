"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Store, MapPin, ArrowLeft } from "lucide-react"
import { CreateItemDialog } from "./create-item-dialog"
import { BulkAddDialog } from "./bulk-add-dialog"
import { ItemCard } from "./item-card"
import Link from "next/link"

interface ShoppingListViewProps {
  list: {
    id: string
    name: string
    store: string
    location?: string
    items: Array<{
      id: string
      name: string
      quantity: number
      category: string
      notes?: string
      completed: boolean
      priority: "low" | "medium" | "high"
      image_url?: string
    }>
  }
}

export function ShoppingListView({ list }: ShoppingListViewProps) {
  const completedItems = list.items.filter((item) => item.completed).length
  const progress = list.items.length > 0 ? Math.round((completedItems / list.items.length) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="p-1">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900">{list.name}</h2>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Store className="h-3 w-3" />
                <span>{list.store}</span>
                {list.location && (
                  <>
                    <span>•</span>
                    <MapPin className="h-3 w-3" />
                    <span>{list.location}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <CreateItemDialog listId={list.id} />
              <BulkAddDialog listId={list.id} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4">
        <div className="space-y-4">
          {/* Progress Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-gray-600">
                  {completedItems}/{list.items.length} completed
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-green-500 h-3 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </CardContent>
          </Card>

          {/* Items List */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All ({list.items.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({list.items.filter((item) => !item.completed).length})</TabsTrigger>
              <TabsTrigger value="completed">Done ({completedItems})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-2 mt-4">
              {list.items.length === 0 ? (
                <Card className="text-center py-8">
                  <CardContent>
                    <p className="text-gray-500">No items in this list yet</p>
                  </CardContent>
                </Card>
              ) : (
                list.items.map((item) => <ItemCard key={item.id} item={item} />)
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-2 mt-4">
              {list.items
                .filter((item) => !item.completed)
                .map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
            </TabsContent>

            <TabsContent value="completed" className="space-y-2 mt-4">
              {list.items
                .filter((item) => item.completed)
                .map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
