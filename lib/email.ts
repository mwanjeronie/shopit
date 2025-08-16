// Email service for sending verification emails
// In a real app, you'd use a service like SendGrid, Mailgun, or AWS SES

export async function sendVerificationEmail(email: string, token: string) {
  // For development, we'll just log the verification link
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/verify-email?token=${token}`

  console.log(`
    📧 Email Verification Required
    ================================
    To: ${email}
    Subject: Verify your Shopping Tracker account
    
    Please click the link below to verify your email address:
    ${verificationUrl}
    
    This link will expire in 24 hours.
    
    If you didn't create an account, please ignore this email.
  `)

  // In production, replace this with actual email sending:
  /*
  try {
    await emailService.send({
      to: email,
      subject: 'Verify your Shopping Tracker account',
      html: `
        <h2>Welcome to Shopping Tracker!</h2>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Verify Email Address
        </a>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
      `
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send verification email:', error)
    return { success: false, error: 'Failed to send verification email' }
  }
  */

  // For development, always return success
  return { success: true }
}

export function generateVerificationToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}
