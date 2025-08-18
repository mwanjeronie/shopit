"use client"

import { useState, useEffect } from "react"
import {
  getGalleryItems,
  addItemFromGallery,
  updateGalleryItem,
  deleteGalleryItem,
  createGalleryItem,
  initializeGalleryFromExistingItems,
} from "@/app/actions/gallery"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Images, Plus, Edit2, Trash2, Check, RefreshCw } from "lucide-react"

const shopNames = ["Sata", "Retel", "Ritah", "Him3.0", "Other"]
const priorities = [
  { value: "low", label: "Low", color: "bg-green-100 text-green-800" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  { value: "high", label: "High", color: "bg-red-100 text-red-800" },
]

interface GalleryItem {
  id: string
  name: string
  category: string
  priority: "low" | "medium" | "high"
  image_url?: string
  usage_count: number
}

interface GalleryDialogProps {
  listId: string
}

export function GalleryDialog({ listId }: GalleryDialogProps) {
  const [open, setOpen] = useState(false)
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      loadGalleryItems()
    }
  }, [open])

  async function loadGalleryItems() {
    try {
      setError(null)
      const items = await getGalleryItems()
      setGalleryItems(items as GalleryItem[])
    } catch (err) {
      setError("Failed to load gallery items")
      console.error("Error loading gallery:", err)
    }
  }

  async function handleInitializeGallery() {
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    const result = await initializeGalleryFromExistingItems()

    if (result.success) {
      setSuccessMessage(result.message || "Gallery initialized successfully!")
      await loadGalleryItems()
    } else {
      setError(result.message || "Failed to initialize gallery")
    }
    setIsLoading(false)
  }

  async function handleAddFromGallery(galleryItemId: string) {
    setIsLoading(true)
    const quantity = selectedQuantities[galleryItemId] || 1
    const result = await addItemFromGallery(galleryItemId, listId, quantity)

    if (result.success) {
      // Update usage count locally
      setGalleryItems((items) =>
        items.map((item) => (item.id === galleryItemId ? { ...item, usage_count: item.usage_count + 1 } : item)),
      )
      // Reset quantity
      setSelectedQuantities((prev) => ({ ...prev, [galleryItemId]: 1 }))
    }
    setIsLoading(false)
  }

  async function handleUpdateGalleryItem(formData: FormData) {
    if (!editingItem) return

    setIsLoading(true)
    const result = await updateGalleryItem(editingItem.id, formData)

    if (result.success) {
      setEditingItem(null)
      await loadGalleryItems()
    }
    setIsLoading(false)
  }

  async function handleDeleteGalleryItem(itemId: string) {
    if (confirm("Are you sure you want to delete this gallery item?")) {
      setIsLoading(true)
      await deleteGalleryItem(itemId)
      await loadGalleryItems()
      setIsLoading(false)
    }
  }

  async function handleCreateGalleryItem(formData: FormData) {
    setIsLoading(true)
    const result = await createGalleryItem(formData)

    if (result.success) {
      await loadGalleryItems()
    }
    setIsLoading(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <Images className="h-4 w-4 mr-1" />
            Gallery
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Item Gallery</DialogTitle>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleInitializeGallery}
                className="mt-2 bg-transparent"
                disabled={isLoading}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                {isLoading ? "Initializing..." : "Initialize Gallery"}
              </Button>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm text-green-600">{successMessage}</p>
            </div>
          )}

          <Tabs defaultValue="select" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="select">Select Items</TabsTrigger>
              <TabsTrigger value="manage">Manage Gallery</TabsTrigger>
            </TabsList>

            <TabsContent value="select" className="space-y-4 max-h-[60vh] overflow-y-auto">
              {galleryItems.length === 0 ? (
                <div className="text-center py-8">
                  <Images className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No items in gallery yet</p>
                  <p className="text-sm text-gray-400 mb-4">Items will appear here as you add them to lists</p>
                  <Button size="sm" onClick={handleInitializeGallery} disabled={isLoading}>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    {isLoading ? "Initializing..." : "Initialize from existing items"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {galleryItems.map((item) => {
                    const priorityConfig = priorities.find((p) => p.value === item.priority)
                    return (
                      <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            {item.image_url && (
                              <img
                                src={item.image_url || "/placeholder.svg"}
                                alt={item.name}
                                className="w-16 h-16 aspect-square object-cover rounded-lg border flex-shrink-0"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none"
                                }}
                              />
                            )}

                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900">{item.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {item.category}
                                </Badge>
                                <Badge className={`text-xs ${priorityConfig?.color}`}>{priorityConfig?.label}</Badge>
                                <span className="text-xs text-gray-500">Used {item.usage_count}x</span>
                              </div>

                              <div className="flex items-center gap-2 mt-2">
                                <Input
                                  type="number"
                                  min="1"
                                  value={selectedQuantities[item.id] || 1}
                                  onChange={(e) =>
                                    setSelectedQuantities((prev) => ({
                                      ...prev,
                                      [item.id]: Number(e.target.value) || 1,
                                    }))
                                  }
                                  className="w-16 h-8 text-sm"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleAddFromGallery(item.id)}
                                  disabled={isLoading}
                                  className="h-8"
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Add
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="manage" className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-3">
                <CreateGalleryItemForm onSubmit={handleCreateGalleryItem} isLoading={isLoading} />

                {galleryItems.map((item) => {
                  const priorityConfig = priorities.find((p) => p.value === item.priority)
                  return (
                    <Card key={item.id}>
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          {item.image_url && (
                            <img
                              src={item.image_url || "/placeholder.svg"}
                              alt={item.name}
                              className="w-12 h-12 aspect-square object-cover rounded border flex-shrink-0"
                              onError={(e) => {
                                e.currentTarget.style.display = "none"
                              }}
                            />
                          )}

                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900">{item.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {item.category}
                              </Badge>
                              <Badge className={`text-xs ${priorityConfig?.color}`}>{priorityConfig?.label}</Badge>
                              <span className="text-xs text-gray-500">Used {item.usage_count}x</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingItem(item)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteGalleryItem(item.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Gallery Item Dialog */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle>Edit Gallery Item</DialogTitle>
            </DialogHeader>
            <form action={handleUpdateGalleryItem} className="space-y-4">
              <div>
                <Label htmlFor="editName">Item Name</Label>
                <Input id="editName" name="name" defaultValue={editingItem.name} required />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="editShop">Shop Name</Label>
                  <Select name="category" defaultValue={editingItem.category}>
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
                  <Label htmlFor="editPriority">Priority</Label>
                  <Select name="priority" defaultValue={editingItem.priority}>
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
                <Label htmlFor="editImageUrl">Product Image (Optional)</Label>
                <Input
                  id="editImageUrl"
                  name="imageUrl"
                  type="url"
                  defaultValue={editingItem.image_url || ""}
                  placeholder="Paste image URL here..."
                />
                {editingItem.image_url && (
                  <div className="mt-3">
                    <img
                      src={editingItem.image_url || "/placeholder.svg"}
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
                <Button type="button" variant="outline" onClick={() => setEditingItem(null)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

function CreateGalleryItemForm({
  onSubmit,
  isLoading,
}: { onSubmit: (formData: FormData) => void; isLoading: boolean }) {
  const [imageUrl, setImageUrl] = useState("")

  return (
    <Card className="border-dashed">
      <CardContent className="p-3">
        <form action={onSubmit} className="space-y-3">
          <div>
            <Label htmlFor="newName" className="text-sm">
              Add New Item
            </Label>
            <Input id="newName" name="name" placeholder="Item name" required className="h-8" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Select name="category" defaultValue="Sata">
              <SelectTrigger className="h-8">
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

            <Select name="priority" defaultValue="medium">
              <SelectTrigger className="h-8">
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
            <Input
              name="imageUrl"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Image URL (optional)"
              className="h-8"
            />
          </div>

          <Button type="submit" size="sm" className="w-full" disabled={isLoading}>
            <Plus className="h-3 w-3 mr-1" />
            Add to Gallery
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
