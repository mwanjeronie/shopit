"use server"

import { sql } from "@/lib/db"
import { hashPassword, verifyPassword, createSession, deleteSession } from "@/lib/auth"
import { sendVerificationEmail, generateVerificationToken } from "@/lib/email"
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

const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
})

const resendVerificationSchema = z.object({
  email: z.string().email("Invalid email address"),
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
      SELECT id, email_verified FROM users WHERE email = ${email}
    `

    if (existingUser.length > 0) {
      if (existingUser[0].email_verified) {
        return {
          errors: {
            email: ["Email already exists and is verified"],
          },
        }
      } else {
        return {
          errors: {
            email: [
              "Email already exists but is not verified. Please check your email or request a new verification link.",
            ],
          },
        }
      }
    }

    // Generate verification token
    const verificationToken = generateVerificationToken()
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Hash password and create user
    const passwordHash = await hashPassword(password)
    const result = await sql`
      INSERT INTO users (name, email, password_hash, email_verified, email_verification_token, email_verification_expires)
      VALUES (${name}, ${email}, ${passwordHash}, FALSE, ${verificationToken}, ${verificationExpires})
      RETURNING id, email
    `

    const user = result[0]

    // Send verification email
    const emailResult = await sendVerificationEmail(email, verificationToken)

    if (!emailResult.success) {
      // If email fails, we could delete the user or handle it differently
      console.error("Failed to send verification email for user:", user.id)
    }

    return {
      success: true,
      message: "Account created successfully! Please check your email to verify your account before signing in.",
      requiresVerification: true,
    }
  } catch (error) {
    console.error("Sign up error:", error)
    return {
      errors: {
        _form: ["Something went wrong. Please try again."],
      },
    }
  }
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
      SELECT id, email, password_hash, email_verified FROM users WHERE email = ${email}
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

    // Check if email is verified
    if (!user.email_verified) {
      return {
        errors: {
          _form: ["Please verify your email address before signing in. Check your email for the verification link."],
        },
        requiresVerification: true,
        email: user.email,
      }
    }

    await createSession(user.id, user.email)
  } catch (error) {
    console.error("Sign in error:", error)
    return {
      errors: {
        _form: ["Something went wrong. Please try again."],
      },
    }
  }

  redirect("/dashboard")
}

export async function verifyEmail(token: string) {
  const validatedFields = verifyEmailSchema.safeParse({ token })

  if (!validatedFields.success) {
    return {
      success: false,
      error: "Invalid verification token",
    }
  }

  try {
    // Find user with this verification token
    const result = await sql`
      SELECT id, email, email_verification_expires 
      FROM users 
      WHERE email_verification_token = ${token} 
      AND email_verified = FALSE
    `

    if (result.length === 0) {
      return {
        success: false,
        error: "Invalid or expired verification token",
      }
    }

    const user = result[0]

    // Check if token has expired
    if (new Date() > new Date(user.email_verification_expires)) {
      return {
        success: false,
        error: "Verification token has expired. Please request a new one.",
        expired: true,
        email: user.email,
      }
    }

    // Verify the email
    await sql`
      UPDATE users 
      SET email_verified = TRUE, 
          email_verification_token = NULL, 
          email_verification_expires = NULL,
          updated_at = NOW()
      WHERE id = ${user.id}
    `

    return {
      success: true,
      message: "Email verified successfully! You can now sign in to your account.",
      email: user.email,
    }
  } catch (error) {
    console.error("Email verification error:", error)
    return {
      success: false,
      error: "Something went wrong. Please try again.",
    }
  }
}

export async function resendVerificationEmail(email: string) {
  const validatedFields = resendVerificationSchema.safeParse({ email })

  if (!validatedFields.success) {
    return {
      success: false,
      error: "Invalid email address",
    }
  }

  try {
    // Find unverified user
    const result = await sql`
      SELECT id, email FROM users 
      WHERE email = ${email} 
      AND email_verified = FALSE
    `

    if (result.length === 0) {
      return {
        success: false,
        error: "No unverified account found with this email address",
      }
    }

    const user = result[0]

    // Generate new verification token
    const verificationToken = generateVerificationToken()
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Update user with new token
    await sql`
      UPDATE users 
      SET email_verification_token = ${verificationToken}, 
          email_verification_expires = ${verificationExpires},
          updated_at = NOW()
      WHERE id = ${user.id}
    `

    // Send verification email
    const emailResult = await sendVerificationEmail(email, verificationToken)

    if (!emailResult.success) {
      return {
        success: false,
        error: "Failed to send verification email. Please try again.",
      }
    }

    return {
      success: true,
      message: "Verification email sent! Please check your email.",
    }
  } catch (error) {
    console.error("Resend verification error:", error)
    return {
      success: false,
      error: "Something went wrong. Please try again.",
    }
  }
}

export async function signOut() {
  await deleteSession()
  redirect("/auth/signin")
}
