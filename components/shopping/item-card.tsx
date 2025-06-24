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
import { CheckCircle2, Circle, Trash2, Edit2 } from "lucide-react"
import { toggleItemComplete, deleteShoppingItem, updateShoppingItem } from "@/app/actions/shopping"

const priorities = [
  { value: "low", label: "Low", color: "bg-green-100 text-green-800" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  { value: "high", label: "High", color: "bg-red-100 text-red-800" },
]

const categories = [
  "Groceries",
  "Electronics",
  "Clothing",
  "Home & Garden",
  "Health & Beauty",
  "Sports",
  "Books",
  "Other",
]

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
  }
}

export function ItemCard({ item }: ItemCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const priorityConfig = priorities.find((p) => p.value === item.priority)

  async function handleToggle() {
    setIsLoading(true)
    await toggleItemComplete(item.id)
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

  return (
    <>
      <Card className={`${item.completed ? "opacity-60" : ""}`}>
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <button onClick={handleToggle} className="mt-1 flex-shrink-0" disabled={isLoading}>
              {item.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-gray-400" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className={`font-medium ${item.completed ? "line-through text-gray-500" : "text-gray-900"}`}>
                    {item.name}
                  </h4>
                  {item.image_url && (
                    <img
                      src={item.image_url || "/placeholder.svg"}
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded mt-2"
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                      }}
                    />
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {item.category}
                    </Badge>
                    <Badge className={`text-xs ${priorityConfig?.color}`}>{priorityConfig?.label}</Badge>
                    {item.quantity > 1 && <span className="text-xs text-gray-500">Qty: {item.quantity}</span>}
                  </div>
                  {item.notes && <p className="text-sm text-gray-600 mt-1">{item.notes}</p>}
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
        <DialogContent className="max-w-sm mx-auto">
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
              <Label htmlFor="editCategory">Category</Label>
              <Select name="category" defaultValue={item.category}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
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
