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
    pending_count?: number
    done_count?: number
    shipped_count?: number
    success_count?: number
    failed_count?: number
  }
}

export function ShoppingListCard({ list }: ShoppingListCardProps) {
  const progress = list.item_count > 0 ? Math.round((list.completed_count / list.item_count) * 100) : 0

  // Calculate progress bar segments
  const pendingPercent = list.item_count > 0 ? ((list.pending_count || 0) / list.item_count) * 100 : 0
  const donePercent = list.item_count > 0 ? ((list.done_count || 0) / list.item_count) * 100 : 0
  const shippedPercent = list.item_count > 0 ? ((list.shipped_count || 0) / list.item_count) * 100 : 0
  const successPercent = list.item_count > 0 ? ((list.success_count || 0) / list.item_count) * 100 : 0
  const failedPercent = list.item_count > 0 ? ((list.failed_count || 0) / list.item_count) * 100 : 0

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

          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">
              {list.completed_count}/{list.item_count} items completed
            </div>
            <span className="text-xs text-gray-500">{progress}%</span>
          </div>

          {/* Enhanced Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div className="h-full flex">
              {/* Pending - Gray */}
              {pendingPercent > 0 && <div className="bg-gray-400 h-full" style={{ width: `${pendingPercent}%` }} />}
              {/* Done - Green */}
              {donePercent > 0 && <div className="bg-green-500 h-full" style={{ width: `${donePercent}%` }} />}
              {/* Shipped - Blue */}
              {shippedPercent > 0 && <div className="bg-blue-500 h-full" style={{ width: `${shippedPercent}%` }} />}
              {/* Success - Purple */}
              {successPercent > 0 && <div className="bg-purple-500 h-full" style={{ width: `${successPercent}%` }} />}
              {/* Failed - Red */}
              {failedPercent > 0 && <div className="bg-red-500 h-full" style={{ width: `${failedPercent}%` }} />}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
