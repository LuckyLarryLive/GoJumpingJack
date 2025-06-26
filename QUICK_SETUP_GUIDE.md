# Quick Setup Guide - Email Verification System

## 🚀 5-Minute Setup

Follow these steps to activate the email verification system in your GoJumpingJack application.

### Step 1: Database Migration
Apply the database migration to add email verification fields:

```sql
-- Run this in your Supabase SQL editor or via migration
ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN email_verification_token_expires_at TIMESTAMP WITH TIME ZONE;

-- Create indexes
CREATE UNIQUE INDEX idx_users_email_verification_token ON users(email_verification_token) WHERE email_verification_token IS NOT NULL;
CREATE INDEX idx_users_email_verified ON users(email_verified);
```

### Step 2: MailerSend Setup
1. **Create MailerSend Account**: Go to [mailersend.com](https://www.mailersend.com) and sign up
2. **Verify Domain**: Add and verify your domain (e.g., `gojumpingjack.com`)
3. **Generate API Token**: Create an API token in the MailerSend dashboard
4. **Note Your Settings**:
   - API Token: `ms-xxxxxxxxxxxxx`
   - From Email: `noreply@gojumpingjack.com`

### Step 3: Environment Variables
Add these to your Vercel project environment variables:

```bash
MAILERSEND_PROD_TOKEN=ms-your-actual-token-here
VERIFICATION_EMAIL_FROM=noreply@gojumpingjack.com
NEXT_PUBLIC_BASE_URL=https://www.gojumpingjack.com
```

**In Vercel Dashboard:**
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each variable above
4. Redeploy your application

### Step 4: Test the System
1. **Register a new user** on your application
2. **Check email** for verification message
3. **Click verification link** to verify email
4. **Try logging in** - should work after verification

### Step 5: Verify Everything Works
Run this checklist:

- [ ] New users receive verification emails
- [ ] Verification links work correctly
- [ ] Unverified users cannot log in
- [ ] Verified users can log in normally
- [ ] Resend verification works
- [ ] Email templates look professional

## 🔧 Local Development Setup

For local testing, add to your `.env.local`:

```bash
MAILERSEND_PROD_TOKEN=ms-your-test-token-here
VERIFICATION_EMAIL_FROM=noreply@gojumpingjack.com
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## 🆘 Quick Troubleshooting

### Emails Not Sending?
1. Check MailerSend API token is correct
2. Verify domain is verified in MailerSend
3. Check server logs for errors
4. Test with a simple curl request to MailerSend API

### Verification Links Not Working?
1. Ensure `NEXT_PUBLIC_BASE_URL` is correct
2. Check that the verification route is accessible
3. Verify database migration was applied

### Build Errors?
1. Run `npm run build` to check for TypeScript errors
2. Ensure all imports are correct
3. Check that all new files are properly saved

## 📞 Support

If you encounter issues:
1. Check the detailed `EMAIL_VERIFICATION_IMPLEMENTATION.md` file
2. Review server logs for specific error messages
3. Test individual components (token generation, email sending, etc.)

## 🎉 You're Done!

Your email verification system is now active! Users will need to verify their email addresses before they can access your application, significantly improving security and reducing spam accounts.

### What Happens Next?
- New signups automatically trigger verification emails
- Users see clear instructions and can resend emails if needed
- Your application is more secure with verified email addresses
- You can track verification rates and user engagement
