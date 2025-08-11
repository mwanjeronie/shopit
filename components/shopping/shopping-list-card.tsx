"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteShoppingList } from "@/app/actions/shopping"
import Link from "next/link"

interface ShoppingListCardProps {
  list: {
    id: string
    name: string
    store: string
    location?: string
    item_count: number
    completed_count: number
  }
}

export function ShoppingListCard({ list }: ShoppingListCardProps) {
  const progress = list.item_count > 0 ? Math.round((list.completed_count / list.item_count) * 100) : 0

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (confirm("Are you sure you want to delete this list?")) {
      await deleteShoppingList(list.id)
    }
  }

  return (
    <Link href={`/dashboard/list/${list.id}`}>
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{list.name}</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDelete} className="text-red-500 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {list.completed_count}/{list.item_count} items completed
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-xs text-gray-500">{progress}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
