"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft } from "lucide-react"
import { CreateItemDialog } from "./create-item-dialog"
import { BulkAddDialog } from "./bulk-add-dialog"
import { GalleryDialog } from "./gallery-dialog"
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
      status?: "pending" | "done" | "shipped" | "success" | "failed"
      quality?: string
      pending_units?: number
      done_units?: number
      shipped_units?: number
      success_units?: number
      failed_units?: number
    }>
  }
}

export function ShoppingListView({ list }: ShoppingListViewProps) {
  // Check if any item has unit columns
  const hasUnitColumns = list.items.some((item) => item.pending_units !== undefined)

  // Count units by status (not items) - with fallback for missing columns
  const pendingUnits = hasUnitColumns
    ? list.items.reduce((sum, item) => sum + (item.pending_units || 0), 0)
    : list.items
        .filter((item) => !item.status || item.status === "pending")
        .reduce((sum, item) => sum + item.quantity, 0)

  const doneUnits = hasUnitColumns
    ? list.items.reduce((sum, item) => sum + (item.done_units || 0), 0)
    : list.items.filter((item) => item.status === "done").reduce((sum, item) => sum + item.quantity, 0)

  const shippedUnits = hasUnitColumns
    ? list.items.reduce((sum, item) => sum + (item.shipped_units || 0), 0)
    : list.items.filter((item) => item.status === "shipped").reduce((sum, item) => sum + item.quantity, 0)

  const successUnits = hasUnitColumns
    ? list.items.reduce((sum, item) => sum + (item.success_units || 0), 0)
    : list.items.filter((item) => item.status === "success").reduce((sum, item) => sum + item.quantity, 0)

  const failedUnits = hasUnitColumns
    ? list.items.reduce((sum, item) => sum + (item.failed_units || 0), 0)
    : list.items.filter((item) => item.status === "failed").reduce((sum, item) => sum + item.quantity, 0)

  const totalUnits = list.items.reduce((sum, item) => sum + item.quantity, 0)

  const completedUnits = doneUnits + shippedUnits + successUnits
  const progress = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0

  // Calculate progress bar segments
  const pendingPercent = totalUnits > 0 ? (pendingUnits / totalUnits) * 100 : 0
  const donePercent = totalUnits > 0 ? (doneUnits / totalUnits) * 100 : 0
  const shippedPercent = totalUnits > 0 ? (shippedUnits / totalUnits) * 100 : 0
  const successPercent = totalUnits > 0 ? (successUnits / totalUnits) * 100 : 0
  const failedPercent = totalUnits > 0 ? (failedUnits / totalUnits) * 100 : 0

  // Filter items by status
  const pendingItems = hasUnitColumns
    ? list.items.filter((item) => (item.pending_units || 0) > 0)
    : list.items.filter((item) => !item.status || item.status === "pending")

  const doneItems = hasUnitColumns
    ? list.items.filter((item) => (item.done_units || 0) > 0)
    : list.items.filter((item) => item.status === "done")

  const shippedItems = hasUnitColumns
    ? list.items.filter((item) => (item.shipped_units || 0) > 0)
    : list.items.filter((item) => item.status === "shipped")

  const successItems = hasUnitColumns
    ? list.items.filter((item) => (item.success_units || 0) > 0)
    : list.items.filter((item) => item.status === "success")

  const failedItems = hasUnitColumns
    ? list.items.filter((item) => (item.failed_units || 0) > 0)
    : list.items.filter((item) => item.status === "failed")

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
            </div>
            <div className="flex gap-2">
              <CreateItemDialog listId={list.id} />
              <GalleryDialog listId={list.id} />
              <BulkAddDialog listId={list.id} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4">
        <div className="space-y-4">
          {/* Enhanced Progress Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{hasUnitColumns ? "Unit" : "Item"} Progress</span>
                <span className="text-sm text-gray-600">
                  {completedUnits}/{totalUnits} {hasUnitColumns ? "units" : "items"} completed
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div className="h-full flex">
                  {/* Pending - Gray */}
                  {pendingPercent > 0 && (
                    <div
                      className="bg-gray-400 h-full flex items-center justify-center text-xs text-white font-medium"
                      style={{ width: `${pendingPercent}%` }}
                    >
                      {pendingUnits > 0 && pendingPercent > 15 && pendingUnits}
                    </div>
                  )}
                  {/* Done - Green */}
                  {donePercent > 0 && (
                    <div
                      className="bg-green-500 h-full flex items-center justify-center text-xs text-white font-medium"
                      style={{ width: `${donePercent}%` }}
                    >
                      {doneUnits > 0 && donePercent > 15 && doneUnits}
                    </div>
                  )}
                  {/* Shipped - Blue */}
                  {shippedPercent > 0 && (
                    <div
                      className="bg-blue-500 h-full flex items-center justify-center text-xs text-white font-medium"
                      style={{ width: `${shippedPercent}%` }}
                    >
                      {shippedUnits > 0 && shippedPercent > 15 && shippedUnits}
                    </div>
                  )}
                  {/* Success - Purple */}
                  {successPercent > 0 && (
                    <div
                      className="bg-purple-500 h-full flex items-center justify-center text-xs text-white font-medium"
                      style={{ width: `${successPercent}%` }}
                    >
                      {successUnits > 0 && successPercent > 15 && successUnits}
                    </div>
                  )}
                  {/* Failed - Red */}
                  {failedPercent > 0 && (
                    <div
                      className="bg-red-500 h-full flex items-center justify-center text-xs text-white font-medium"
                      style={{ width: `${failedPercent}%` }}
                    >
                      {failedUnits > 0 && failedPercent > 15 && failedUnits}
                    </div>
                  )}
                </div>
              </div>
              {/* Legend */}
              <div className="flex items-center gap-3 mt-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-400 rounded"></div>
                  <span>Pending ({pendingUnits})</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Done ({doneUnits})</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Shipped ({shippedUnits})</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-purple-500 rounded"></div>
                  <span>Success ({successUnits})</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>Failed ({failedUnits})</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items List */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-6 text-xs">
              <TabsTrigger value="all" className="px-1">
                All ({list.items.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="px-1">
                Pending ({pendingItems.length})
              </TabsTrigger>
              <TabsTrigger value="done" className="px-1">
                Done ({doneItems.length})
              </TabsTrigger>
              <TabsTrigger value="shipped" className="px-1">
                Shipped ({shippedItems.length})
              </TabsTrigger>
              <TabsTrigger value="success" className="px-1">
                Success ({successItems.length})
              </TabsTrigger>
              <TabsTrigger value="failed" className="px-1">
                Failed ({failedItems.length})
              </TabsTrigger>
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
              {pendingItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </TabsContent>

            <TabsContent value="done" className="space-y-2 mt-4">
              {doneItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </TabsContent>

            <TabsContent value="shipped" className="space-y-2 mt-4">
              {shippedItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </TabsContent>

            <TabsContent value="success" className="space-y-2 mt-4">
              {successItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </TabsContent>

            <TabsContent value="failed" className="space-y-2 mt-4">
              {failedItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
