"use client"

import { useState } from "react"
import { createShoppingItem } from "@/app/actions/shopping"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus } from "lucide-react"

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

const priorities = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
]

interface CreateItemDialogProps {
  listId: string
}

export function CreateItemDialog({ listId }: CreateItemDialogProps) {
  const [open, setOpen] = useState(false)
  const [errors, setErrors] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState("")

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setErrors({})

    // Add listId to formData
    formData.append("listId", listId)

    const result = await createShoppingItem(formData)

    if (result?.errors) {
      setErrors(result.errors)
    } else if (result?.success) {
      setOpen(false)
      setImageUrl("")
      // Reset form by closing dialog
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Item Name</Label>
            <Input id="name" name="name" placeholder="e.g., Milk, Bread" required />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name[0]}</p>}
          </div>

          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input id="quantity" name="quantity" type="number" min="1" defaultValue="1" placeholder="1" />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select name="category" defaultValue="Other">
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
            <Label htmlFor="priority">Priority</Label>
            <Select name="priority" defaultValue="medium">
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

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea id="notes" name="notes" placeholder="Any additional notes..." rows={2} />
          </div>

          <div>
            <Label htmlFor="imageUrl">Product Image (Optional)</Label>
            <Input
              id="imageUrl"
              name="imageUrl"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Paste image URL here..."
            />
            {imageUrl && (
              <div className="mt-2">
                <img
                  src={imageUrl || "/placeholder.svg"}
                  alt="Product preview"
                  className="w-24 h-24 object-cover rounded border"
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                  }}
                />
              </div>
            )}
          </div>

          {errors._form && <p className="text-sm text-red-600">{errors._form[0]}</p>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Adding..." : "Add Item"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
