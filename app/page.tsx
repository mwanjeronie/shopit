"use client"

import { useState, useEffect } from "react"
import { Plus, Store, ShoppingCart, CheckCircle2, Circle, Trash2, Edit2, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ShoppingItem {
  id: string
  name: string
  quantity: number
  category: string
  notes: string
  completed: boolean
  priority: "low" | "medium" | "high"
  imageUrl?: string
}

interface ShoppingList {
  id: string
  name: string
  store: string
  location: string
  items: ShoppingItem[]
  createdAt: Date
}

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
  { value: "low", label: "Low", color: "bg-green-100 text-green-800" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  { value: "high", label: "High", color: "bg-red-100 text-red-800" },
]

export default function ShoppingTracker() {
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [selectedList, setSelectedList] = useState<string | null>(null)
  const [isAddingList, setIsAddingList] = useState(false)
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null)
  const [isBulkAdding, setIsBulkAdding] = useState(false)
  const [bulkImageUrls, setBulkImageUrls] = useState("")

  // Form states
  const [newListName, setNewListName] = useState("")
  const [newListStore, setNewListStore] = useState("")
  const [newListLocation, setNewListLocation] = useState("")

  const [newItemName, setNewItemName] = useState("")
  const [newItemQuantity, setNewItemQuantity] = useState(1)
  const [newItemCategory, setNewItemCategory] = useState("Groceries")
  const [newItemNotes, setNewItemNotes] = useState("")
  const [newItemPriority, setNewItemPriority] = useState<"low" | "medium" | "high">("medium")
  const [newItemImageUrl, setNewItemImageUrl] = useState("")

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedLists = localStorage.getItem("shoppingLists")
      if (savedLists) {
        const parsedLists = JSON.parse(savedLists).map((list: any) => ({
          ...list,
          createdAt: new Date(list.createdAt),
        }))
        setLists(parsedLists)
      }
    } catch (error) {
      console.error("Error loading saved lists:", error)
      // If there's an error, start with empty lists
      setLists([])
    }
  }, [])

  // Save to localStorage whenever lists change
  useEffect(() => {
    try {
      localStorage.setItem("shoppingLists", JSON.stringify(lists))
    } catch (error) {
      console.error("Error saving lists:", error)
    }
  }, [lists])

  // Save data when page becomes hidden (user switches tabs or closes browser)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        try {
          localStorage.setItem("shoppingLists", JSON.stringify(lists))
        } catch (error) {
          console.error("Error saving on visibility change:", error)
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Also save on beforeunload as a backup
    const handleBeforeUnload = () => {
      try {
        localStorage.setItem("shoppingLists", JSON.stringify(lists))
      } catch (error) {
        console.error("Error saving on page unload:", error)
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [lists])

  const addList = () => {
    if (!newListName.trim() || !newListStore.trim()) return

    const newList: ShoppingList = {
      id: Date.now().toString(),
      name: newListName,
      store: newListStore,
      location: newListLocation,
      items: [],
      createdAt: new Date(),
    }

    setLists([...lists, newList])
    setNewListName("")
    setNewListStore("")
    setNewListLocation("")
    setIsAddingList(false)
  }

  const deleteList = (listId: string) => {
    setLists(lists.filter((list) => list.id !== listId))
    if (selectedList === listId) {
      setSelectedList(null)
    }
  }

  const addItem = () => {
    if (!newItemName.trim() || !selectedList) return

    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      name: newItemName,
      quantity: newItemQuantity || 1,
      category: "Other", // default category
      notes: newItemNotes,
      completed: false,
      priority: "medium", // default priority
      imageUrl: newItemImageUrl,
    }

    setLists(lists.map((list) => (list.id === selectedList ? { ...list, items: [...list.items, newItem] } : list)))

    // Reset form
    setNewItemName("")
    setNewItemQuantity(1)
    setNewItemNotes("")
    setNewItemImageUrl("")
    setIsAddingItem(false)
  }

  const toggleItemComplete = (listId: string, itemId: string) => {
    setLists(
      lists.map((list) =>
        list.id === listId
          ? {
              ...list,
              items: list.items.map((item) => (item.id === itemId ? { ...item, completed: !item.completed } : item)),
            }
          : list,
      ),
    )
  }

  const deleteItem = (listId: string, itemId: string) => {
    setLists(
      lists.map((list) =>
        list.id === listId ? { ...list, items: list.items.filter((item) => item.id !== itemId) } : list,
      ),
    )
  }

  const updateItem = (listId: string, updatedItem: ShoppingItem) => {
    setLists(
      lists.map((list) =>
        list.id === listId
          ? {
              ...list,
              items: list.items.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
            }
          : list,
      ),
    )
    setEditingItem(null)
  }

  const getListProgress = (list: ShoppingList) => {
    if (list.items.length === 0) return 0
    const completed = list.items.filter((item) => item.completed).length
    return Math.round((completed / list.items.length) * 100)
  }

  const currentList = lists.find((list) => list.id === selectedList)

  const addBulkItems = () => {
    if (!bulkImageUrls.trim() || !selectedList) return

    const urls = bulkImageUrls.split("\n").filter((url) => url.trim())

    urls.forEach((url, index) => {
      const newItem: ShoppingItem = {
        id: (Date.now() + index).toString(),
        name: `Item ${index + 1}`, // Default name, user can edit later
        quantity: 1,
        category: "Other",
        notes: "",
        completed: false,
        priority: "medium",
        imageUrl: url.trim(),
      }

      setLists((prevLists) =>
        prevLists.map((list) => (list.id === selectedList ? { ...list, items: [...list.items, newItem] } : list)),
      )
    })

    // Reset form
    setBulkImageUrls("")
    setIsBulkAdding(false)
  }

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
            {!selectedList && (
              <Dialog open={isAddingList} onOpenChange={setIsAddingList}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add List
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm mx-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Shopping List</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="listName">List Name</Label>
                      <Input
                        id="listName"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        placeholder="e.g., Weekly Groceries"
                      />
                    </div>
                    <div>
                      <Label htmlFor="storeName">Store Name</Label>
                      <Input
                        id="storeName"
                        value={newListStore}
                        onChange={(e) => setNewListStore(e.target.value)}
                        placeholder="e.g., Walmart, Target"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location (Optional)</Label>
                      <Input
                        id="location"
                        value={newListLocation}
                        onChange={(e) => setNewListLocation(e.target.value)}
                        placeholder="e.g., Downtown, Mall"
                      />
                    </div>
                    <Button onClick={addList} className="w-full">
                      Create List
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4">
        {!selectedList ? (
          /* Lists Overview */
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
                  <Dialog open={isAddingList} onOpenChange={setIsAddingList}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First List
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm mx-auto">
                      <DialogHeader>
                        <DialogTitle>Create New Shopping List</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="listName">List Name</Label>
                          <Input
                            id="listName"
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            placeholder="e.g., Weekly Groceries"
                          />
                        </div>
                        <div>
                          <Label htmlFor="storeName">Store Name</Label>
                          <Input
                            id="storeName"
                            value={newListStore}
                            onChange={(e) => setNewListStore(e.target.value)}
                            placeholder="e.g., Walmart, Target"
                          />
                        </div>
                        <div>
                          <Label htmlFor="location">Location (Optional)</Label>
                          <Input
                            id="location"
                            value={newListLocation}
                            onChange={(e) => setNewListLocation(e.target.value)}
                            placeholder="e.g., Downtown, Mall"
                          />
                        </div>
                        <Button onClick={addList} className="w-full">
                          Create List
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {lists.map((list) => {
                  const progress = getListProgress(list)
                  const completedItems = list.items.filter((item) => item.completed).length

                  return (
                    <Card key={list.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4" onClick={() => setSelectedList(list.id)}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{list.name}</h3>
                            <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteList(list.id)
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            {completedItems}/{list.items.length} items completed
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">{progress}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          /* Individual List View */
          currentList && (
            <div className="space-y-4">
              {/* List Header */}
              <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="sm" onClick={() => setSelectedList(null)} className="p-1">
                  ←
                </Button>
                <div className="flex-1">
                  <h2 className="font-semibold text-gray-900">{currentList.name}</h2>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Store className="h-3 w-3" />
                    <span>{currentList.store}</span>
                    {currentList.location && (
                      <>
                        <span>•</span>
                        <MapPin className="h-3 w-3" />
                        <span>{currentList.location}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
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
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="itemName">Item Name</Label>
                          <Input
                            id="itemName"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder="e.g., Milk, Bread"
                          />
                        </div>
                        <div>
                          <Label htmlFor="quantity">Quantity (Optional)</Label>
                          <Input
                            id="quantity"
                            type="number"
                            min="1"
                            value={newItemQuantity}
                            onChange={(e) => setNewItemQuantity(Number.parseInt(e.target.value) || 1)}
                            placeholder="1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="notes">Notes (Optional)</Label>
                          <Textarea
                            id="notes"
                            value={newItemNotes}
                            onChange={(e) => setNewItemNotes(e.target.value)}
                            placeholder="Any additional notes..."
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label htmlFor="imageUrl">Product Image (Optional)</Label>
                          <Input
                            id="imageUrl"
                            value={newItemImageUrl}
                            onChange={(e) => setNewItemImageUrl(e.target.value)}
                            placeholder="Paste image URL here..."
                            type="url"
                          />
                          {newItemImageUrl && (
                            <div className="mt-2">
                              <img
                                src={newItemImageUrl || "/placeholder.svg"}
                                alt="Product preview"
                                className="w-16 h-16 object-cover rounded border"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none"
                                }}
                              />
                            </div>
                          )}
                        </div>
                        <Button onClick={addItem} className="w-full">
                          Add Item
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isBulkAdding} onOpenChange={setIsBulkAdding}>
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
                            value={bulkImageUrls}
                            onChange={(e) => setBulkImageUrls(e.target.value)}
                            placeholder="https://example.com/image1.jpg
https://example.com/image2.jpg
https://example.com/image3.jpg"
                            rows={6}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Paste multiple image URLs, one per line. Items will be created with default names that you
                            can edit later.
                          </p>
                        </div>
                        {bulkImageUrls && (
                          <div className="text-sm text-gray-600">
                            Will create {bulkImageUrls.split("\n").filter((url) => url.trim()).length} items
                          </div>
                        )}
                        <Button onClick={addBulkItems} className="w-full">
                          Add All Items
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Progress Bar */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm text-gray-600">
                      {currentList.items.filter((item) => item.completed).length}/{currentList.items.length} completed
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full transition-all"
                      style={{ width: `${getListProgress(currentList)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Items List */}
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All ({currentList.items.length})</TabsTrigger>
                  <TabsTrigger value="pending">
                    Pending ({currentList.items.filter((item) => !item.completed).length})
                  </TabsTrigger>
                  <TabsTrigger value="completed">
                    Done ({currentList.items.filter((item) => item.completed).length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-2 mt-4">
                  {currentList.items.length === 0 ? (
                    <Card className="text-center py-8">
                      <CardContent>
                        <p className="text-gray-500">No items in this list yet</p>
                      </CardContent>
                    </Card>
                  ) : (
                    currentList.items.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        listId={currentList.id}
                        onToggle={toggleItemComplete}
                        onDelete={deleteItem}
                        onEdit={setEditingItem}
                      />
                    ))
                  )}
                </TabsContent>

                <TabsContent value="pending" className="space-y-2 mt-4">
                  {currentList.items
                    .filter((item) => !item.completed)
                    .map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        listId={currentList.id}
                        onToggle={toggleItemComplete}
                        onDelete={deleteItem}
                        onEdit={setEditingItem}
                      />
                    ))}
                </TabsContent>

                <TabsContent value="completed" className="space-y-2 mt-4">
                  {currentList.items
                    .filter((item) => item.completed)
                    .map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        listId={currentList.id}
                        onToggle={toggleItemComplete}
                        onDelete={deleteItem}
                        onEdit={setEditingItem}
                      />
                    ))}
                </TabsContent>
              </Tabs>
            </div>
          )
        )}
      </div>

      {/* Edit Item Dialog */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle>Edit Item</DialogTitle>
            </DialogHeader>
            <EditItemForm
              item={editingItem}
              onSave={(updatedItem) => updateItem(selectedList!, updatedItem)}
              onCancel={() => setEditingItem(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function ItemCard({
  item,
  listId,
  onToggle,
  onDelete,
  onEdit,
}: {
  item: ShoppingItem
  listId: string
  onToggle: (listId: string, itemId: string) => void
  onDelete: (listId: string, itemId: string) => void
  onEdit: (item: ShoppingItem) => void
}) {
  const priorityConfig = priorities.find((p) => p.value === item.priority)

  return (
    <Card className={`${item.completed ? "opacity-60" : ""}`}>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <button onClick={() => onToggle(listId, item.id)} className="mt-1 flex-shrink-0">
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
                {item.imageUrl && (
                  <img
                    src={item.imageUrl || "/placeholder.svg"}
                    alt={item.name}
                    className="object-cover rounded mt-1 leading-3 leading-4 leading-6 leading-7 leading-8 leading-9 leading-10 text-center w-96 h-96"
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
                <Button variant="ghost" size="sm" onClick={() => onEdit(item)} className="h-8 w-8 p-0">
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(listId, item.id)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EditItemForm({
  item,
  onSave,
  onCancel,
}: {
  item: ShoppingItem
  onSave: (item: ShoppingItem) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(item.name)
  const [quantity, setQuantity] = useState(item.quantity)
  const [category, setCategory] = useState(item.category)
  const [notes, setNotes] = useState(item.notes)
  const [priority, setPriority] = useState(item.priority)
  const [imageUrl, setImageUrl] = useState(item.imageUrl || "")

  const handleSave = () => {
    if (!name.trim()) return

    onSave({
      ...item,
      name,
      quantity,
      category,
      notes,
      priority,
      imageUrl,
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="editName">Item Name</Label>
        <Input id="editName" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="editQuantity">Quantity</Label>
          <Input
            id="editQuantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
          />
        </div>
        <div>
          <Label htmlFor="editPriority">Priority</Label>
          <Select value={priority} onValueChange={(value: "low" | "medium" | "high") => setPriority(value)}>
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
        <Select value={category} onValueChange={setCategory}>
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
        <Textarea id="editNotes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </div>
      <div>
        <Label htmlFor="editImageUrl">Product Image (Optional)</Label>
        <Input
          id="editImageUrl"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Paste image URL here..."
          type="url"
        />
        {imageUrl && (
          <div className="mt-2">
            <img
              src={imageUrl || "/placeholder.svg"}
              alt="Product preview"
              className="w-16 h-16 object-cover rounded border"
              onError={(e) => {
                e.currentTarget.style.display = "none"
              }}
            />
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSave} className="flex-1">
          Save Changes
        </Button>
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </div>
  )
}
