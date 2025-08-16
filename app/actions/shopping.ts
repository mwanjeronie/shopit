"use server"

import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const createListSchema = z.object({
  name: z.string().min(1, "List name is required"),
})

const createItemSchema = z.object({
  listId: z.string().min(1, "List ID is required"),
  name: z.string().min(1, "Item name is required"),
  quantity: z.number().min(1).default(1),
  category: z.string().default("Sata"),
  notes: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  imageUrl: z.string().optional(),
  quality: z.string().default("Standard"),
})

const updateUnitsSchema = z.object({
  pending_units: z.number().min(0).default(0),
  done_units: z.number().min(0).default(0),
  shipped_units: z.number().min(0).default(0),
  success_units: z.number().min(0).default(0),
  failed_units: z.number().min(0).default(0),
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
  })

  console.log("Form data:", {
    name: formData.get("name"),
  })

  if (!validatedFields.success) {
    console.log("Validation errors:", validatedFields.error.flatten().fieldErrors)
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { name } = validatedFields.data

  try {
    console.log("Inserting into database...")
    const result = await sql`
      INSERT INTO shopping_lists (user_id, name, store, location)
      VALUES (${user.id}, ${name}, '', '')
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
    // First check if unit columns exist
    const columnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'shopping_items' 
      AND column_name IN ('pending_units', 'done_units', 'shipped_units', 'success_units', 'failed_units')
    `

    const hasUnitColumns = columnCheck.length === 5

    if (hasUnitColumns) {
      // Use new unit-based query
      const lists = await sql`
        SELECT 
          sl.*,
          COUNT(si.id)::int as item_count,
          COALESCE(SUM(si.done_units + si.shipped_units + si.success_units), 0)::int as completed_count,
          COALESCE(SUM(si.pending_units), 0)::int as pending_count,
          COALESCE(SUM(si.done_units), 0)::int as done_count,
          COALESCE(SUM(si.shipped_units), 0)::int as shipped_count,
          COALESCE(SUM(si.success_units), 0)::int as success_count,
          COALESCE(SUM(si.failed_units), 0)::int as failed_count,
          COALESCE(SUM(si.quantity), 0)::int as total_units
        FROM shopping_lists sl
        LEFT JOIN shopping_items si ON sl.id = si.list_id
        WHERE sl.user_id = ${user.id}
        GROUP BY sl.id
        ORDER BY sl.created_at DESC
      `
      return lists
    } else {
      // Fall back to old status-based query
      const lists = await sql`
        SELECT 
          sl.*,
          COUNT(si.id)::int as item_count,
          COUNT(CASE WHEN si.status IN ('done', 'shipped', 'success') OR si.completed = true THEN 1 END)::int as completed_count,
          COUNT(CASE WHEN si.status = 'pending' OR (si.status IS NULL AND si.completed = false) THEN 1 END)::int as pending_count,
          COUNT(CASE WHEN si.status = 'done' THEN 1 END)::int as done_count,
          COUNT(CASE WHEN si.status = 'shipped' THEN 1 END)::int as shipped_count,
          COUNT(CASE WHEN si.status = 'success' THEN 1 END)::int as success_count,
          COUNT(CASE WHEN si.status = 'failed' THEN 1 END)::int as failed_count
        FROM shopping_lists sl
        LEFT JOIN shopping_items si ON sl.id = si.list_id
        WHERE sl.user_id = ${user.id}
        GROUP BY sl.id
        ORDER BY sl.created_at DESC
      `
      return lists
    }
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
    category: (formData.get("category") as string) || "Sata",
    notes: (formData.get("notes") as string) || "",
    priority: (formData.get("priority") as "low" | "medium" | "high") || "medium",
    imageUrl: (formData.get("imageUrl") as string) || "",
    quality: (formData.get("quality") as string) || "Standard",
  }

  const validatedFields = createItemSchema.safeParse(data)

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { listId, name, quantity, category, notes, priority, imageUrl, quality } = validatedFields.data

  try {
    // Verify user owns the list
    const listCheck = await sql`
      SELECT id FROM shopping_lists 
      WHERE id = ${listId} AND user_id = ${user.id}
    `

    if (listCheck.length === 0) {
      throw new Error("List not found")
    }

    // Check if unit columns exist
    const columnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'shopping_items' 
      AND column_name IN ('pending_units', 'done_units', 'shipped_units', 'success_units', 'failed_units')
    `

    const hasUnitColumns = columnCheck.length === 5

    if (hasUnitColumns) {
      // Use new unit-based insert
      await sql`
        INSERT INTO shopping_items (
          list_id, name, quantity, category, notes, priority, image_url, status, quality,
          pending_units, done_units, shipped_units, success_units, failed_units
        )
        VALUES (
          ${listId}, ${name}, ${quantity}, ${category}, ${notes || null}, ${priority}, 
          ${imageUrl || null}, 'pending', ${quality},
          ${quantity}, 0, 0, 0, 0
        )
      `
    } else {
      // Fall back to old insert
      await sql`
        INSERT INTO shopping_items (list_id, name, quantity, category, notes, priority, image_url, status, quality)
        VALUES (${listId}, ${name}, ${quantity}, ${category}, ${notes || null}, ${priority}, ${imageUrl || null}, 'pending', ${quality})
      `
    }

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

export async function updateItemUnits(
  itemId: string,
  units: {
    pending_units: number
    done_units: number
    shipped_units: number
    success_units: number
    failed_units: number
  },
) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }

  const validatedFields = updateUnitsSchema.safeParse(units)

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { pending_units, done_units, shipped_units, success_units, failed_units } = validatedFields.data

  try {
    // Get current item to check quantity
    const currentItem = await sql`
      SELECT quantity FROM shopping_items 
      WHERE id = ${itemId}
      AND list_id IN (
        SELECT id FROM shopping_lists WHERE user_id = ${user.id}
      )
    `

    if (currentItem.length === 0) {
      return { success: false, error: "Item not found" }
    }

    const totalUnits = pending_units + done_units + shipped_units + success_units + failed_units
    if (totalUnits !== currentItem[0].quantity) {
      return { success: false, error: "Unit counts must equal total quantity" }
    }

    // Determine primary status based on which has the most units
    let primaryStatus = "pending"
    let maxUnits = pending_units

    if (done_units > maxUnits) {
      primaryStatus = "done"
      maxUnits = done_units
    }
    if (shipped_units > maxUnits) {
      primaryStatus = "shipped"
      maxUnits = shipped_units
    }
    if (success_units > maxUnits) {
      primaryStatus = "success"
      maxUnits = success_units
    }
    if (failed_units > maxUnits) {
      primaryStatus = "failed"
      maxUnits = failed_units
    }

    await sql`
      UPDATE shopping_items 
      SET pending_units = ${pending_units},
          done_units = ${done_units},
          shipped_units = ${shipped_units},
          success_units = ${success_units},
          failed_units = ${failed_units},
          status = ${primaryStatus},
          completed = ${done_units + shipped_units + success_units > 0},
          updated_at = NOW()
      WHERE id = ${itemId}
      AND list_id IN (
        SELECT id FROM shopping_lists WHERE user_id = ${user.id}
      )
    `

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Error updating item units:", error)
    return { success: false, error: "Failed to update units" }
  }
}

export async function moveOneUnit(itemId: string, fromStatus: string, toStatus: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }

  try {
    // Get current item
    const currentItem = await sql`
      SELECT pending_units, done_units, shipped_units, success_units, failed_units 
      FROM shopping_items 
      WHERE id = ${itemId}
      AND list_id IN (
        SELECT id FROM shopping_lists WHERE user_id = ${user.id}
      )
    `

    if (currentItem.length === 0) {
      return { success: false }
    }

    const item = currentItem[0]
    const fromColumn = `${fromStatus}_units`
    const toColumn = `${toStatus}_units`

    // Check if we have units to move
    if (item[fromColumn] <= 0) {
      return { success: false, error: `No units in ${fromStatus} status` }
    }

    // Calculate new unit counts
    const newUnits = {
      pending_units: item.pending_units,
      done_units: item.done_units,
      shipped_units: item.shipped_units,
      success_units: item.success_units,
      failed_units: item.failed_units,
    }

    newUnits[fromColumn] -= 1
    newUnits[toColumn] += 1

    return await updateItemUnits(itemId, newUnits)
  } catch (error) {
    return { success: false }
  }
}

export async function moveAllUnits(itemId: string, fromStatus: string, toStatus: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }

  try {
    // Get current item
    const currentItem = await sql`
      SELECT pending_units, done_units, shipped_units, success_units, failed_units 
      FROM shopping_items 
      WHERE id = ${itemId}
      AND list_id IN (
        SELECT id FROM shopping_lists WHERE user_id = ${user.id}
      )
    `

    if (currentItem.length === 0) {
      return { success: false }
    }

    const item = currentItem[0]
    const fromColumn = `${fromStatus}_units`
    const toColumn = `${toStatus}_units`

    // Check if we have units to move
    if (item[fromColumn] <= 0) {
      return { success: false, error: `No units in ${fromStatus} status` }
    }

    // Calculate new unit counts
    const newUnits = {
      pending_units: item.pending_units,
      done_units: item.done_units,
      shipped_units: item.shipped_units,
      success_units: item.success_units,
      failed_units: item.failed_units,
    }

    const unitsToMove = newUnits[fromColumn]
    newUnits[fromColumn] = 0
    newUnits[toColumn] += unitsToMove

    return await updateItemUnits(itemId, newUnits)
  } catch (error) {
    return { success: false }
  }
}

export async function progressItemToNextStage(itemId: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }

  try {
    // Get current item
    const currentItem = await sql`
      SELECT status, pending_units, done_units, shipped_units, success_units, failed_units 
      FROM shopping_items 
      WHERE id = ${itemId}
      AND list_id IN (
        SELECT id FROM shopping_lists WHERE user_id = ${user.id}
      )
    `

    if (currentItem.length === 0) {
      return { success: false }
    }

    const item = currentItem[0]
    const currentStatus = item.status || "pending"

    // Define progression: pending -> done -> shipped -> success
    let fromStatus = currentStatus
    let toStatus = currentStatus

    switch (currentStatus) {
      case "pending":
        toStatus = "done"
        break
      case "done":
        toStatus = "shipped"
        break
      case "shipped":
        toStatus = "success"
        break
      case "success":
        // Already at final stage, no progression
        return { success: true }
      case "failed":
        // Failed items can be reset to pending
        toStatus = "pending"
        fromStatus = "failed"
        break
      default:
        toStatus = "done"
        fromStatus = "pending"
    }

    // Move one unit to next stage
    return await moveOneUnit(itemId, fromStatus, toStatus)
  } catch (error) {
    return { success: false }
  }
}

export async function toggleItemComplete(itemId: string) {
  // Use the new progression system instead
  return await progressItemToNextStage(itemId)
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

export async function createBulkItems(listId: string, imageUrls: string[], category = "Sata") {
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

    // Check if unit columns exist
    const columnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'shopping_items' 
      AND column_name IN ('pending_units', 'done_units', 'shipped_units', 'success_units', 'failed_units')
    `

    const hasUnitColumns = columnCheck.length === 5

    // Insert multiple items
    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i].trim()
      if (url) {
        if (hasUnitColumns) {
          await sql`
            INSERT INTO shopping_items (
              list_id, name, quantity, category, priority, image_url, status, quality,
              pending_units, done_units, shipped_units, success_units, failed_units
            )
            VALUES (
              ${listId}, ${`Item ${i + 1}`}, 1, ${category}, 'medium', ${url}, 'pending', 'Standard',
              1, 0, 0, 0, 0
            )
          `
        } else {
          await sql`
            INSERT INTO shopping_items (
              list_id, name, quantity, category, priority, image_url, status, quality
            )
            VALUES (
              ${listId}, ${`Item ${i + 1}`}, 1, ${category}, 'medium', ${url}, 'pending', 'Standard'
            )
          `
        }
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
    category: (formData.get("category") as string) || "Sata",
    notes: (formData.get("notes") as string) || "",
    priority: (formData.get("priority") as "low" | "medium" | "high") || "medium",
    imageUrl: (formData.get("imageUrl") as string) || "",
    quality: (formData.get("quality") as string) || "Standard",
  }

  try {
    // Get current item to handle quantity changes
    const currentItem = await sql`
      SELECT quantity, pending_units, done_units, shipped_units, success_units, failed_units
      FROM shopping_items 
      WHERE id = ${itemId}
      AND list_id IN (
        SELECT id FROM shopping_lists WHERE user_id = ${user.id}
      )
    `

    if (currentItem.length === 0) {
      return { success: false }
    }

    const item = currentItem[0]
    const oldQuantity = item.quantity
    const newQuantity = data.quantity

    const newUnits = {
      pending_units: item.pending_units,
      done_units: item.done_units,
      shipped_units: item.shipped_units,
      success_units: item.success_units,
      failed_units: item.failed_units,
    }

    // Handle quantity changes
    if (newQuantity !== oldQuantity) {
      const difference = newQuantity - oldQuantity
      if (difference > 0) {
        // Adding units - add to pending
        newUnits.pending_units += difference
      } else {
        // Removing units - remove from pending first, then others
        let toRemove = Math.abs(difference)
        if (newUnits.pending_units >= toRemove) {
          newUnits.pending_units -= toRemove
        } else {
          toRemove -= newUnits.pending_units
          newUnits.pending_units = 0

          // Remove from other statuses proportionally
          const totalOtherUnits =
            newUnits.done_units + newUnits.shipped_units + newUnits.success_units + newUnits.failed_units
          if (totalOtherUnits > 0) {
            const ratio = (totalOtherUnits - toRemove) / totalOtherUnits
            newUnits.done_units = Math.floor(newUnits.done_units * ratio)
            newUnits.shipped_units = Math.floor(newUnits.shipped_units * ratio)
            newUnits.success_units = Math.floor(newUnits.success_units * ratio)
            newUnits.failed_units = Math.floor(newUnits.failed_units * ratio)
          }
        }
      }
    }

    await sql`
      UPDATE shopping_items 
      SET name = ${data.name}, 
          quantity = ${data.quantity}, 
          category = ${data.category}, 
          notes = ${data.notes || null}, 
          priority = ${data.priority}, 
          image_url = ${data.imageUrl || null},
          quality = ${data.quality},
          pending_units = ${newUnits.pending_units},
          done_units = ${newUnits.done_units},
          shipped_units = ${newUnits.shipped_units},
          success_units = ${newUnits.success_units},
          failed_units = ${newUnits.failed_units},
          updated_at = NOW()
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
