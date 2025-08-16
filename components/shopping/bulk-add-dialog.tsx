"use client"

import { useState } from "react"
import { createBulkItems } from "@/app/actions/shopping"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface BulkAddDialogProps {
  listId: string
}

const shopNames = ["Sata", "Retel", "Ritah", "Him3.0", "Other"]

export function BulkAddDialog({ listId }: BulkAddDialogProps) {
  const [open, setOpen] = useState(false)
  const [errors, setErrors] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const [bulkUrls, setBulkUrls] = useState("")
  const [selectedShop, setSelectedShop] = useState("Sata")

  async function handleSubmit() {
    setIsLoading(true)
    setErrors({})

    const urls = bulkUrls.split("\n").filter((url) => url.trim())

    if (urls.length === 0) {
      setErrors({ _form: ["Please enter at least one image URL"] })
      setIsLoading(false)
      return
    }

    const result = await createBulkItems(listId, urls, selectedShop)

    if (result?.errors) {
      setErrors(result.errors)
    } else if (result?.success) {
      setOpen(false)
      setBulkUrls("")
      setSelectedShop("Sata")
    }

    setIsLoading(false)
  }

  const urlCount = bulkUrls.split("\n").filter((url) => url.trim()).length

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          Bulk Add
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>Add Multiple Items</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="bulkUrls">Image URLs (one per line)</Label>
            <Textarea
              id="bulkUrls"
              value={bulkUrls}
              onChange={(e) => setBulkUrls(e.target.value)}
              placeholder="https://example.com/image1.jpg
https://example.com/image2.jpg
https://example.com/image3.jpg"
              rows={6}
            />
            <p className="text-xs text-gray-500 mt-1">
              Paste multiple image URLs, one per line. Items will be created with default names that you can edit later.
            </p>
          </div>
          <div>
            <Label htmlFor="shopSelect">Shop Name</Label>
            <Select value={selectedShop} onValueChange={setSelectedShop}>
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
          {urlCount > 0 && <div className="text-sm text-gray-600">Will create {urlCount} items</div>}
          {errors._form && <p className="text-sm text-red-600">{errors._form[0]}</p>}
          <Button onClick={handleSubmit} className="w-full" disabled={isLoading || urlCount === 0}>
            {isLoading ? "Adding..." : "Add All Items"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
