-- Update all existing users to be verified (optional)
UPDATE users SET email_verified = TRUE WHERE email_verified = FALSE;

-- Clear verification tokens for existing users (optional cleanup)
UPDATE users SET 
  email_verification_token = NULL, 
  email_verification_expires = NULL 
WHERE email_verification_token IS NOT NULL;
