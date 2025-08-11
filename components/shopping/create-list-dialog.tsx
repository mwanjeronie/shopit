"use client"

import { useState } from "react"
import { createShoppingList } from "@/app/actions/shopping"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus } from "lucide-react"

export function CreateListDialog() {
  const [open, setOpen] = useState(false)
  const [errors, setErrors] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setErrors({})

    const result = await createShoppingList(formData)

    if (result?.errors) {
      setErrors(result.errors)
    } else if (result?.success) {
      setOpen(false)
      // Reset form by closing dialog
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
        <form action={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">List Name</Label>
            <Input id="name" name="name" placeholder="e.g., Weekly Groceries" required autoComplete="off" />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name[0]}</p>}
          </div>

          {errors._form && <p className="text-sm text-red-600">{errors._form[0]}</p>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create List"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
