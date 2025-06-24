"use server"

import { sql } from "@/lib/db"
import { hashPassword, verifyPassword, createSession, deleteSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { z } from "zod"

const signUpSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export async function signUp(formData: FormData) {
  const validatedFields = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { name, email, password } = validatedFields.data

  try {
    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUser.length > 0) {
      return {
        errors: {
          email: ["Email already exists"],
        },
      }
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password)
    const result = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${name}, ${email}, ${passwordHash})
      RETURNING id, email
    `

    const user = result[0]
    await createSession(user.id, user.email)
  } catch (error) {
    return {
      errors: {
        _form: ["Something went wrong. Please try again."],
      },
    }
  }

  redirect("/dashboard")
}

export async function signIn(formData: FormData) {
  const validatedFields = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { email, password } = validatedFields.data

  try {
    // Find user by email
    const result = await sql`
      SELECT id, email, password_hash FROM users WHERE email = ${email}
    `

    if (result.length === 0) {
      return {
        errors: {
          email: ["Invalid email or password"],
        },
      }
    }

    const user = result[0]
    const isValidPassword = await verifyPassword(password, user.password_hash)

    if (!isValidPassword) {
      return {
        errors: {
          password: ["Invalid email or password"],
        },
      }
    }

    await createSession(user.id, user.email)
  } catch (error) {
    return {
      errors: {
        _form: ["Something went wrong. Please try again."],
      },
    }
  }

  redirect("/dashboard")
}

export async function signOut() {
  await deleteSession()
  redirect("/auth/signin")
}
