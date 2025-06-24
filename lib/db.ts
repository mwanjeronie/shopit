import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

const sql = neon(process.env.DATABASE_URL)

export { sql }

export interface User {
  id: string
  email: string
  name?: string
  created_at: Date
  updated_at: Date
}

export interface ShoppingList {
  id: string
  user_id: string
  name: string
  store: string
  location?: string
  created_at: Date
  updated_at: Date
}

export interface ShoppingItem {
  id: string
  list_id: string
  name: string
  quantity: number
  category: string
  notes?: string
  completed: boolean
  priority: "low" | "medium" | "high"
  image_url?: string
  created_at: Date
  updated_at: Date
}
