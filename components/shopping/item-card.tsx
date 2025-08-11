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
import { CheckCircle2, Circle, Trash2, Edit2, Truck, X } from "lucide-react"
import { toggleItemComplete, deleteShoppingItem, updateShoppingItem, updateItemStatus } from "@/app/actions/shopping"

const priorities = [
  { value: "low", label: "Low", color: "bg-green-100 text-green-800" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  { value: "high", label: "High", color: "bg-red-100 text-red-800" },
]

const shopNames = ["Sata", "Retel", "Ritah", "Him3.0", "Other"]

const statusConfig = {
  pending: { icon: Circle, color: "text-gray-400", bgColor: "bg-gray-100", textColor: "text-gray-800" },
  done: { icon: CheckCircle2, color: "text-green-500", bgColor: "bg-green-100", textColor: "text-green-800" },
  shipped: { icon: Truck, color: "text-blue-500", bgColor: "bg-blue-100", textColor: "text-blue-800" },
  failed: { icon: X, color: "text-red-500", bgColor: "bg-red-100", textColor: "text-red-800" },
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
    status?: "pending" | "done" | "shipped" | "failed"
  }
}

export function ItemCard({ item }: ItemCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const priorityConfig = priorities.find((p) => p.value === item.priority)

  // Use status if available, otherwise fall back to completed field
  const currentStatus = item.status || (item.completed ? "done" : "pending")
  const statusInfo = statusConfig[currentStatus as keyof typeof statusConfig]
  const StatusIcon = statusInfo.icon

  async function handleToggle() {
    setIsLoading(true)
    await toggleItemComplete(item.id)
    setIsLoading(false)
  }

  async function handleStatusChange(newStatus: "pending" | "done" | "shipped" | "failed") {
    setIsLoading(true)
    await updateItemStatus(item.id, newStatus)
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

  const isCompleted = currentStatus === "done" || currentStatus === "shipped"

  return (
    <>
      <Card className={`${isCompleted ? "opacity-60" : ""}`}>
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <button onClick={handleToggle} className="mt-1 flex-shrink-0" disabled={isLoading}>
              <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className={`font-medium ${isCompleted ? "line-through text-gray-500" : "text-gray-900"}`}>
                      {item.name}
                    </h4>
                    {/* Big prominent quantity badge */}
                    <Badge variant="default" className="bg-blue-600 text-white text-sm font-bold px-2 py-1">
                      {item.quantity}x
                    </Badge>
                  </div>

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

                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {item.category}
                    </Badge>
                    <Badge className={`text-xs ${priorityConfig?.color}`}>{priorityConfig?.label}</Badge>
                    <Badge className={`text-xs ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                      {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                    </Badge>
                  </div>

                  {/* Status change buttons */}
                  <div className="flex items-center gap-1 mt-2">
                    <Button
                      size="sm"
                      variant={currentStatus === "pending" ? "default" : "outline"}
                      onClick={() => handleStatusChange("pending")}
                      disabled={isLoading || currentStatus === "pending"}
                      className="h-6 px-2 text-xs"
                    >
                      Pending
                    </Button>
                    <Button
                      size="sm"
                      variant={currentStatus === "done" ? "default" : "outline"}
                      onClick={() => handleStatusChange("done")}
                      disabled={isLoading || currentStatus === "done"}
                      className="h-6 px-2 text-xs"
                    >
                      Done
                    </Button>
                    <Button
                      size="sm"
                      variant={currentStatus === "shipped" ? "default" : "outline"}
                      onClick={() => handleStatusChange("shipped")}
                      disabled={isLoading || currentStatus === "shipped"}
                      className="h-6 px-2 text-xs"
                    >
                      Shipped
                    </Button>
                    <Button
                      size="sm"
                      variant={currentStatus === "failed" ? "default" : "outline"}
                      onClick={() => handleStatusChange("failed")}
                      disabled={isLoading || currentStatus === "failed"}
                      className="h-6 px-2 text-xs"
                    >
                      Failed
                    </Button>
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

      {/* Edit Dialog */}
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
