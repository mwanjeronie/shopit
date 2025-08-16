"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle2, Circle, Trash2, Edit2, Truck, X, Trophy, ChevronRight, Package } from "lucide-react"
import {
  progressItemToNextStage,
  deleteShoppingItem,
  updateShoppingItem,
  updateItemUnits,
  moveOneUnit,
  moveAllUnits,
} from "@/app/actions/shopping"

const priorities = [
  { value: "low", label: "Low", color: "bg-green-100 text-green-800" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  { value: "high", label: "High", color: "bg-red-100 text-red-800" },
]

const shopNames = ["Sata", "Retel", "Ritah", "Him3.0", "Other"]

const qualityOptions = ["Standard", "Premium", "Budget", "Organic", "Large", "Small", "Extra Large", "Family Size"]

const statusConfig = {
  pending: { icon: Circle, color: "text-gray-400", bgColor: "bg-gray-100", textColor: "text-gray-800", next: "done" },
  done: {
    icon: CheckCircle2,
    color: "text-green-500",
    bgColor: "bg-green-100",
    textColor: "text-green-800",
    next: "shipped",
  },
  shipped: { icon: Truck, color: "text-blue-500", bgColor: "bg-blue-100", textColor: "text-blue-800", next: "success" },
  success: {
    icon: Trophy,
    color: "text-purple-500",
    bgColor: "bg-purple-100",
    textColor: "text-purple-800",
    next: null,
  },
  failed: { icon: X, color: "text-red-500", bgColor: "bg-red-100", textColor: "text-red-800", next: "pending" },
}

interface ItemCardProps {
  item: {
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
  }
}

export function ItemCard({ item }: ItemCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isManagingUnits, setIsManagingUnits] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Handle missing unit columns by providing defaults
  const [unitCounts, setUnitCounts] = useState({
    pending_units: item.pending_units ?? (item.status === "pending" || !item.status ? item.quantity : 0),
    done_units: item.done_units ?? (item.status === "done" ? item.quantity : 0),
    shipped_units: item.shipped_units ?? (item.status === "shipped" ? item.quantity : 0),
    success_units: item.success_units ?? (item.status === "success" ? item.quantity : 0),
    failed_units: item.failed_units ?? (item.status === "failed" ? item.quantity : 0),
  })

  const priorityConfig = priorities.find((p) => p.value === item.priority)

  // Use status if available, otherwise fall back to completed field
  const currentStatus = item.status || (item.completed ? "done" : "pending")
  const statusInfo = statusConfig[currentStatus as keyof typeof statusConfig]
  const StatusIcon = statusInfo.icon

  // Check if item has mixed statuses (units in different stages)
  // Only show unit management if unit columns exist
  const hasUnitColumns = item.pending_units !== undefined
  const hasUnitsInMultipleStatuses = hasUnitColumns && Object.values(unitCounts).filter((count) => count > 0).length > 1

  async function handleProgressToNext() {
    setIsLoading(true)
    await progressItemToNextStage(item.id)
    setIsLoading(false)
  }

  async function handleMoveOneUnit(fromStatus: string, toStatus: string) {
    setIsLoading(true)
    const result = await moveOneUnit(item.id, fromStatus, toStatus)
    if (result.success) {
      // Update local state
      setUnitCounts((prev) => ({
        ...prev,
        [`${fromStatus}_units`]: prev[`${fromStatus}_units` as keyof typeof prev] - 1,
        [`${toStatus}_units`]: prev[`${toStatus}_units` as keyof typeof prev] + 1,
      }))
    }
    setIsLoading(false)
  }

  async function handleMoveAllUnits(fromStatus: string, toStatus: string) {
    setIsLoading(true)
    const result = await moveAllUnits(item.id, fromStatus, toStatus)
    if (result.success) {
      // Update local state
      const unitsToMove = unitCounts[`${fromStatus}_units` as keyof typeof unitCounts]
      setUnitCounts((prev) => ({
        ...prev,
        [`${fromStatus}_units`]: 0,
        [`${toStatus}_units`]: prev[`${toStatus}_units` as keyof typeof prev] + unitsToMove,
      }))
    }
    setIsLoading(false)
  }

  async function handleUpdateUnits() {
    setIsLoading(true)
    const result = await updateItemUnits(item.id, unitCounts)
    if (result.success) {
      setIsManagingUnits(false)
    }
    setIsLoading(false)
  }

  async function handleDelete() {
    if (confirm("Are you sure you want to delete this item?")) {
      setIsLoading(true)
      await deleteShoppingItem(item.id)
      setIsLoading(false)
    }
  }

  async function handleUpdate(formData: FormData) {
    setIsLoading(true)
    const result = await updateShoppingItem(item.id, formData)
    if (result.success) {
      setIsEditing(false)
    }
    setIsLoading(false)
  }

  const isCompleted = unitCounts.done_units + unitCounts.shipped_units + unitCounts.success_units > 0
  const nextStatus = statusInfo.next

  return (
    <>
      <Card className={`${isCompleted && !hasUnitsInMultipleStatuses ? "opacity-60" : ""}`}>
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <button onClick={handleProgressToNext} className="mt-1 flex-shrink-0" disabled={isLoading}>
              <div className="flex items-center gap-1">
                <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                {nextStatus && <ChevronRight className="h-3 w-3 text-gray-400" />}
              </div>
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4
                      className={`font-medium ${isCompleted && !hasUnitsInMultipleStatuses ? "line-through text-gray-500" : "text-gray-900"}`}
                    >
                      {item.name}
                    </h4>
                    {/* Big prominent quantity badge */}
                    <Badge variant="default" className="bg-blue-600 text-white text-sm font-bold px-2 py-1">
                      {item.quantity}x
                    </Badge>
                  </div>

                  {/* Unit Status Display - only show if unit columns exist and has mixed statuses */}
                  {hasUnitColumns && hasUnitsInMultipleStatuses && (
                    <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                      <div className="text-xs font-medium text-gray-700 mb-1">Unit Status:</div>
                      <div className="flex flex-wrap gap-1">
                        {unitCounts.pending_units > 0 && (
                          <Badge variant="outline" className="text-xs bg-gray-100">
                            {unitCounts.pending_units} Pending
                          </Badge>
                        )}
                        {unitCounts.done_units > 0 && (
                          <Badge variant="outline" className="text-xs bg-green-100">
                            {unitCounts.done_units} Done
                          </Badge>
                        )}
                        {unitCounts.shipped_units > 0 && (
                          <Badge variant="outline" className="text-xs bg-blue-100">
                            {unitCounts.shipped_units} Shipped
                          </Badge>
                        )}
                        {unitCounts.success_units > 0 && (
                          <Badge variant="outline" className="text-xs bg-purple-100">
                            {unitCounts.success_units} Success
                          </Badge>
                        )}
                        {unitCounts.failed_units > 0 && (
                          <Badge variant="outline" className="text-xs bg-red-100">
                            {unitCounts.failed_units} Failed
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Square 1:1 aspect ratio image */}
                  {item.image_url && (
                    <div className="mt-3 mb-3">
                      <img
                        src={item.image_url || "/placeholder.svg"}
                        alt={item.name}
                        className="w-full max-w-xs aspect-square object-cover rounded-lg border shadow-sm"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                        }}
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {item.category}
                    </Badge>
                    <Badge className={`text-xs ${priorityConfig?.color}`}>{priorityConfig?.label}</Badge>
                    <Badge className={`text-xs ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                      {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                    </Badge>
                    {item.quality && item.quality !== "Standard" && (
                      <Badge variant="secondary" className="text-xs">
                        {item.quality}
                      </Badge>
                    )}
                  </div>

                  {/* Unit Management Button - only show if unit columns exist */}
                  <div className="flex items-center gap-2 mt-2">
                    {hasUnitColumns && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsManagingUnits(true)}
                        disabled={isLoading}
                        className="h-7 px-3 text-xs"
                      >
                        <Package className="h-3 w-3 mr-1" />
                        Manage Units
                      </Button>
                    )}

                    {nextStatus && (
                      <Button
                        size="sm"
                        onClick={handleProgressToNext}
                        disabled={isLoading}
                        className="h-7 px-3 text-xs bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                      >
                        Progress {hasUnitColumns ? "1 Unit" : "Item"} →
                      </Button>
                    )}
                  </div>

                  {item.notes && <p className="text-sm text-gray-600 mt-2">{item.notes}</p>}
                </div>

                <div className="flex items-center gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="h-8 w-8 p-0"
                    disabled={isLoading}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    disabled={isLoading}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unit Management Dialog - only show if unit columns exist */}
      {hasUnitColumns && (
        <Dialog open={isManagingUnits} onOpenChange={setIsManagingUnits}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle>Manage Units - {item.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">Total Quantity: {item.quantity} units</div>

              {/* Unit Count Inputs */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Pending</Label>
                  <Input
                    type="number"
                    min="0"
                    max={item.quantity}
                    value={unitCounts.pending_units}
                    onChange={(e) => setUnitCounts((prev) => ({ ...prev, pending_units: Number(e.target.value) || 0 }))}
                    className="w-20 h-8"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Done</Label>
                  <Input
                    type="number"
                    min="0"
                    max={item.quantity}
                    value={unitCounts.done_units}
                    onChange={(e) => setUnitCounts((prev) => ({ ...prev, done_units: Number(e.target.value) || 0 }))}
                    className="w-20 h-8"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Shipped</Label>
                  <Input
                    type="number"
                    min="0"
                    max={item.quantity}
                    value={unitCounts.shipped_units}
                    onChange={(e) => setUnitCounts((prev) => ({ ...prev, shipped_units: Number(e.target.value) || 0 }))}
                    className="w-20 h-8"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Success</Label>
                  <Input
                    type="number"
                    min="0"
                    max={item.quantity}
                    value={unitCounts.success_units}
                    onChange={(e) => setUnitCounts((prev) => ({ ...prev, success_units: Number(e.target.value) || 0 }))}
                    className="w-20 h-8"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Failed</Label>
                  <Input
                    type="number"
                    min="0"
                    max={item.quantity}
                    value={unitCounts.failed_units}
                    onChange={(e) => setUnitCounts((prev) => ({ ...prev, failed_units: Number(e.target.value) || 0 }))}
                    className="w-20 h-8"
                  />
                </div>
              </div>

              {/* Total Check */}
              <div className="text-sm">
                Total: {Object.values(unitCounts).reduce((sum, count) => sum + count, 0)} / {item.quantity}
                {Object.values(unitCounts).reduce((sum, count) => sum + count, 0) !== item.quantity && (
                  <span className="text-red-500 ml-2">⚠️ Must equal total quantity</span>
                )}
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Quick Actions:</div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMoveOneUnit("pending", "done")}
                    disabled={isLoading || unitCounts.pending_units === 0}
                    className="text-xs"
                  >
                    1 Pending → Done
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMoveAllUnits("pending", "done")}
                    disabled={isLoading || unitCounts.pending_units === 0}
                    className="text-xs"
                  >
                    All Pending → Done
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMoveOneUnit("done", "shipped")}
                    disabled={isLoading || unitCounts.done_units === 0}
                    className="text-xs"
                  >
                    1 Done → Shipped
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMoveAllUnits("done", "shipped")}
                    disabled={isLoading || unitCounts.done_units === 0}
                    className="text-xs"
                  >
                    All Done → Shipped
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleUpdateUnits}
                  className="flex-1"
                  disabled={
                    isLoading || Object.values(unitCounts).reduce((sum, count) => sum + count, 0) !== item.quantity
                  }
                >
                  {isLoading ? "Updating..." : "Update Units"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsManagingUnits(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Dialog remains the same */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          <form action={handleUpdate} className="space-y-4">
            <div>
              <Label htmlFor="editName">Item Name</Label>
              <Input id="editName" name="name" defaultValue={item.name} required />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="editQuantity">Quantity</Label>
                <Input id="editQuantity" name="quantity" type="number" min="1" defaultValue={item.quantity} />
              </div>
              <div>
                <Label htmlFor="editPriority">Priority</Label>
                <Select name="priority" defaultValue={item.priority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="editShop">Shop Name</Label>
                <Select name="category" defaultValue={item.category}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {shopNames.map((shop) => (
                      <SelectItem key={shop} value={shop}>
                        {shop}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editQuality">Quality</Label>
                <Select name="quality" defaultValue={item.quality || "Standard"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {qualityOptions.map((quality) => (
                      <SelectItem key={quality} value={quality}>
                        {quality}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="editNotes">Notes</Label>
              <Textarea id="editNotes" name="notes" defaultValue={item.notes || ""} rows={2} />
            </div>

            <div>
              <Label htmlFor="editImageUrl">Product Image (Optional)</Label>
              <Input
                id="editImageUrl"
                name="imageUrl"
                type="url"
                defaultValue={item.image_url || ""}
                placeholder="Paste image URL here..."
              />
              {/* Square preview in edit dialog */}
              {item.image_url && (
                <div className="mt-3">
                  <img
                    src={item.image_url || "/placeholder.svg"}
                    alt="Product preview"
                    className="w-full aspect-square object-cover rounded-lg border"
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
