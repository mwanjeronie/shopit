"use server"

import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const createListSchema = z.object({
  name: z.string().min(1, "List name is required"),
  store: z.string().min(1, "Store name is required"),
  location: z.string().optional(),
})

const createItemSchema = z.object({
  listId: z.string().min(1, "List ID is required"),
  name: z.string().min(1, "Item name is required"),
  quantity: z.number().min(1).default(1),
  category: z.string().default("Other"),
  notes: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  imageUrl: z.string().optional(),
})

export async function createShoppingList(formData: FormData) {
  console.log("Creating shopping list...")

  const user = await getCurrentUser()
  if (!user) {
    console.log("No user found")
    return { errors: { _form: ["Please sign in to create lists"] } }
  }

  console.log("User:", user)

  const validatedFields = createListSchema.safeParse({
    name: formData.get("name"),
    store: formData.get("store"),
    location: formData.get("location") || "",
  })

  console.log("Form data:", {
    name: formData.get("name"),
    store: formData.get("store"),
    location: formData.get("location"),
  })

  if (!validatedFields.success) {
    console.log("Validation errors:", validatedFields.error.flatten().fieldErrors)
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { name, store, location } = validatedFields.data

  try {
    console.log("Inserting into database...")
    const result = await sql`
      INSERT INTO shopping_lists (user_id, name, store, location)
      VALUES (${user.id}, ${name}, ${store}, ${location || null})
      RETURNING id
    `

    console.log("Database result:", result)
    revalidatePath("/dashboard")
    return { success: true, listId: result[0].id }
  } catch (error) {
    console.error("Database error:", error)
    return {
      errors: {
        _form: ["Failed to create shopping list. Please try again."],
      },
    }
  }
}

export async function getShoppingLists() {
  const user = await getCurrentUser()
  if (!user) {
    return []
  }

  try {
    const lists = await sql`
      SELECT 
        sl.*,
        COUNT(si.id)::int as item_count,
        COUNT(CASE WHEN si.completed = true THEN 1 END)::int as completed_count
      FROM shopping_lists sl
      LEFT JOIN shopping_items si ON sl.id = si.list_id
      WHERE sl.user_id = ${user.id}
      GROUP BY sl.id
      ORDER BY sl.created_at DESC
    `

    return lists
  } catch (error) {
    console.error("Error fetching shopping lists:", error)
    return []
  }
}

export async function getShoppingList(listId: string) {
  const user = await getCurrentUser()
  if (!user) {
    return null
  }

  try {
    const listResult = await sql`
      SELECT * FROM shopping_lists 
      WHERE id = ${listId} AND user_id = ${user.id}
    `

    if (listResult.length === 0) {
      return null
    }

    const itemsResult = await sql`
      SELECT * FROM shopping_items 
      WHERE list_id = ${listId}
      ORDER BY created_at ASC
    `

    return {
      ...listResult[0],
      items: itemsResult,
    }
  } catch (error) {
    console.error("Error fetching shopping list:", error)
    return null
  }
}

export async function createShoppingItem(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }

  const data = {
    listId: formData.get("listId") as string,
    name: formData.get("name") as string,
    quantity: Number(formData.get("quantity")) || 1,
    category: (formData.get("category") as string) || "Other",
    notes: (formData.get("notes") as string) || "",
    priority: (formData.get("priority") as "low" | "medium" | "high") || "medium",
    imageUrl: (formData.get("imageUrl") as string) || "",
  }

  const validatedFields = createItemSchema.safeParse(data)

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { listId, name, quantity, category, notes, priority, imageUrl } = validatedFields.data

  try {
    // Verify user owns the list
    const listCheck = await sql`
      SELECT id FROM shopping_lists 
      WHERE id = ${listId} AND user_id = ${user.id}
    `

    if (listCheck.length === 0) {
      throw new Error("List not found")
    }

    await sql`
      INSERT INTO shopping_items (list_id, name, quantity, category, notes, priority, image_url)
      VALUES (${listId}, ${name}, ${quantity}, ${category}, ${notes || null}, ${priority}, ${imageUrl || null})
    `

    revalidatePath("/dashboard")
    revalidatePath(`/dashboard/list/${listId}`)
    return { success: true }
  } catch (error) {
    return {
      errors: {
        _form: ["Failed to create item"],
      },
    }
  }
}

export async function toggleItemComplete(itemId: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }

  try {
    await sql`
      UPDATE shopping_items 
      SET completed = NOT completed
      WHERE id = ${itemId}
      AND list_id IN (
        SELECT id FROM shopping_lists WHERE user_id = ${user.id}
      )
    `

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    return { success: false }
  }
}

export async function deleteShoppingList(listId: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }

  try {
    await sql`
      DELETE FROM shopping_lists 
      WHERE id = ${listId} AND user_id = ${user.id}
    `

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    return { success: false }
  }
}

export async function deleteShoppingItem(itemId: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }

  try {
    await sql`
      DELETE FROM shopping_items 
      WHERE id = ${itemId}
      AND list_id IN (
        SELECT id FROM shopping_lists WHERE user_id = ${user.id}
      )
    `

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    return { success: false }
  }
}

export async function createBulkItems(listId: string, imageUrls: string[]) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }

  try {
    // Verify user owns the list
    const listCheck = await sql`
      SELECT id FROM shopping_lists 
      WHERE id = ${listId} AND user_id = ${user.id}
    `

    if (listCheck.length === 0) {
      throw new Error("List not found")
    }

    // Insert multiple items
    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i].trim()
      if (url) {
        await sql`
          INSERT INTO shopping_items (list_id, name, quantity, category, priority, image_url)
          VALUES (${listId}, ${`Item ${i + 1}`}, 1, 'Other', 'medium', ${url})
        `
      }
    }

    revalidatePath("/dashboard")
    revalidatePath(`/dashboard/list/${listId}`)
    return { success: true }
  } catch (error) {
    return {
      errors: {
        _form: ["Failed to create items"],
      },
    }
  }
}

export async function updateShoppingItem(itemId: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }

  const data = {
    name: formData.get("name") as string,
    quantity: Number(formData.get("quantity")) || 1,
    category: (formData.get("category") as string) || "Other",
    notes: (formData.get("notes") as string) || "",
    priority: (formData.get("priority") as "low" | "medium" | "high") || "medium",
    imageUrl: (formData.get("imageUrl") as string) || "",
  }

  try {
    await sql`
      UPDATE shopping_items 
      SET name = ${data.name}, 
          quantity = ${data.quantity}, 
          category = ${data.category}, 
          notes = ${data.notes || null}, 
          priority = ${data.priority}, 
          image_url = ${data.imageUrl || null}
      WHERE id = ${itemId}
      AND list_id IN (
        SELECT id FROM shopping_lists WHERE user_id = ${user.id}
      )
    `

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    return { success: false }
  }
}
