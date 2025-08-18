"use server"

import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const updateGalleryItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  category: z.string().default("Sata"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  imageUrl: z.string().optional(),
})

export async function getGalleryItems() {
  const user = await getCurrentUser()
  if (!user) {
    return []
  }

  try {
    // Check if table exists first
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'gallery_items'
      );
    `

    if (!tableExists[0].exists) {
      console.log("Gallery table does not exist yet")
      return []
    }

    const items = await sql`
      SELECT * FROM gallery_items 
      WHERE user_id = ${user.id}
      ORDER BY usage_count DESC, updated_at DESC
    `

    return items
  } catch (error) {
    console.error("Error fetching gallery items:", error)
    return []
  }
}

export async function addItemFromGallery(galleryItemId: string, listId: string, quantity = 1) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }

  try {
    // Get the gallery item
    const galleryItem = await sql`
      SELECT * FROM gallery_items 
      WHERE id = ${galleryItemId} AND user_id = ${user.id}
    `

    if (galleryItem.length === 0) {
      throw new Error("Gallery item not found")
    }

    const item = galleryItem[0]

    // Verify user owns the list
    const listCheck = await sql`
      SELECT id FROM shopping_lists 
      WHERE id = ${listId} AND user_id = ${user.id}
    `

    if (listCheck.length === 0) {
      throw new Error("List not found")
    }

    // Add item to shopping list
    await sql`
      INSERT INTO shopping_items (list_id, name, quantity, category, priority, image_url)
      VALUES (${listId}, ${item.name}, ${quantity}, ${item.category}, ${item.priority}, ${item.image_url})
    `

    // Update usage count
    await sql`
      UPDATE gallery_items 
      SET usage_count = usage_count + 1, updated_at = NOW()
      WHERE id = ${galleryItemId}
    `

    revalidatePath("/dashboard")
    revalidatePath(`/dashboard/list/${listId}`)
    return { success: true }
  } catch (error) {
    console.error("Error adding item from gallery:", error)
    return {
      errors: {
        _form: ["Failed to add item from gallery"],
      },
    }
  }
}

export async function updateGalleryItem(itemId: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }

  const data = {
    name: formData.get("name") as string,
    category: (formData.get("category") as string) || "Sata",
    priority: (formData.get("priority") as "low" | "medium" | "high") || "medium",
    imageUrl: (formData.get("imageUrl") as string) || "",
  }

  const validatedFields = updateGalleryItemSchema.safeParse(data)

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { name, category, priority, imageUrl } = validatedFields.data

  try {
    await sql`
      UPDATE gallery_items 
      SET name = ${name}, 
          category = ${category}, 
          priority = ${priority}, 
          image_url = ${imageUrl || null},
          updated_at = NOW()
      WHERE id = ${itemId} AND user_id = ${user.id}
    `

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    return { success: false }
  }
}

export async function deleteGalleryItem(itemId: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }

  try {
    await sql`
      DELETE FROM gallery_items 
      WHERE id = ${itemId} AND user_id = ${user.id}
    `

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    return { success: false }
  }
}

export async function createGalleryItem(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }

  const data = {
    name: formData.get("name") as string,
    category: (formData.get("category") as string) || "Sata",
    priority: (formData.get("priority") as "low" | "medium" | "high") || "medium",
    imageUrl: (formData.get("imageUrl") as string) || "",
  }

  const validatedFields = updateGalleryItemSchema.safeParse(data)

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { name, category, priority, imageUrl } = validatedFields.data

  try {
    await sql`
      INSERT INTO gallery_items (user_id, name, category, priority, image_url, usage_count)
      VALUES (${user.id}, ${name}, ${category}, ${priority}, ${imageUrl || null}, 0)
      ON CONFLICT (user_id, name, category) DO NOTHING
    `

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Error creating gallery item:", error)
    return {
      errors: {
        _form: ["Failed to create gallery item"],
      },
    }
  }
}

export async function initializeGalleryFromExistingItems() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }

  try {
    // Check if table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'gallery_items'
      );
    `

    if (!tableExists[0].exists) {
      return { success: false, message: "Gallery table does not exist" }
    }

    // First, get the distinct items with their aggregated data
    const distinctItems = await sql`
      SELECT 
        sl.user_id, 
        si.name, 
        si.category, 
        si.priority, 
        si.image_url, 
        COUNT(*) as usage_count,
        MAX(si.created_at) as latest_created
      FROM shopping_items si
      JOIN shopping_lists sl ON si.list_id = sl.id
      WHERE sl.user_id = ${user.id}
      GROUP BY sl.user_id, si.name, si.category, si.priority, si.image_url
      ORDER BY usage_count DESC, latest_created DESC
    `

    // Insert each item individually to avoid conflicts
    let insertedCount = 0
    for (const item of distinctItems) {
      try {
        await sql`
          INSERT INTO gallery_items (user_id, name, category, priority, image_url, usage_count)
          VALUES (${item.user_id}, ${item.name}, ${item.category}, ${item.priority}, ${item.image_url}, ${item.usage_count})
          ON CONFLICT (user_id, name, category) DO UPDATE SET
            usage_count = GREATEST(gallery_items.usage_count, EXCLUDED.usage_count),
            priority = EXCLUDED.priority,
            image_url = COALESCE(EXCLUDED.image_url, gallery_items.image_url),
            updated_at = NOW()
        `
        insertedCount++
      } catch (itemError) {
        console.log(`Skipped duplicate item: ${item.name} in ${item.category}`)
      }
    }

    return {
      success: true,
      message: `Successfully initialized gallery with ${insertedCount} items`,
    }
  } catch (error) {
    console.error("Error initializing gallery:", error)
    return { success: false, message: "Failed to initialize gallery" }
  }
}
