import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import { logger } from './logger';

// Initialize MailerSend client
const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_PROD_TOKEN || '',
});

// Email configuration
const EMAIL_CONFIG = {
  fromEmail: process.env.VERIFICATION_EMAIL_FROM || 'noreply@gojumpingjack.com',
  fromName: 'GoJumpingJack',
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://www.gojumpingjack.com',
};

/**
 * Sends an email verification email to a user
 */
export async function sendVerificationEmail(
  userEmail: string,
  userName: string,
  verificationToken: string
): Promise<void> {
  try {
    logger.info('Sending verification email', {
      email: userEmail,
      component: 'email-service',
    });

    const verificationUrl = `${EMAIL_CONFIG.baseUrl}/verify-email/${verificationToken}`;

    const sentFrom = new Sender(EMAIL_CONFIG.fromEmail, EMAIL_CONFIG.fromName);
    const recipients = [new Recipient(userEmail, userName)];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject('Verify Your Email Address for GoJumpingJack')
      .setHtml(generateVerificationEmailHtml(userName, verificationUrl))
      .setText(generateVerificationEmailText(userName, verificationUrl));

    const response = await mailerSend.email.send(emailParams);

    logger.info('Verification email sent successfully', {
      email: userEmail,
      messageId: response.body?.message_id,
      component: 'email-service',
    });
  } catch (error) {
    logger.error('Failed to send verification email', error as Error, {
      email: userEmail,
      component: 'email-service',
    });
    throw new Error('Failed to send verification email');
  }
}

/**
 * Sends a password reset email to a user
 */
export async function sendPasswordResetEmail(
  userEmail: string,
  userName: string,
  resetToken: string
): Promise<void> {
  try {
    logger.info('Sending password reset email', {
      email: userEmail,
      component: 'email-service',
    });

    const resetUrl = `${EMAIL_CONFIG.baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(userEmail)}`;

    const sentFrom = new Sender(EMAIL_CONFIG.fromEmail, EMAIL_CONFIG.fromName);
    const recipients = [new Recipient(userEmail, userName)];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject('Reset Your GoJumpingJack Password')
      .setHtml(generatePasswordResetEmailHtml(userName, resetUrl))
      .setText(generatePasswordResetEmailText(userName, resetUrl));

    const response = await mailerSend.email.send(emailParams);

    logger.info('Password reset email sent successfully', {
      email: userEmail,
      messageId: response.body?.message_id,
      component: 'email-service',
    });
  } catch (error) {
    logger.error('Failed to send password reset email', error as Error, {
      email: userEmail,
      component: 'email-service',
    });
    throw new Error('Failed to send password reset email');
  }
}

/**
 * Generates HTML content for verification email
 */
function generateVerificationEmailHtml(userName: string, verificationUrl: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - GoJumpingJack</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Welcome to GoJumpingJack!</h1>
      </div>
      <div class="content">
        <p>Hi ${userName},</p>
        <p>Thank you for signing up for GoJumpingJack! To complete your registration and start finding amazing flight deals, please verify your email address.</p>
        <p>Click the button below to verify your email:</p>
        <p style="text-align: center;">
          <a href="${verificationUrl}" class="button">Verify Email Address</a>
        </p>
        <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace;">
          ${verificationUrl}
        </p>
        <p><strong>This verification link will expire in 24 hours.</strong></p>
        <p>If you didn't create an account with GoJumpingJack, you can safely ignore this email.</p>
        <div class="footer">
          <p>Best regards,<br>The GoJumpingJack Team</p>
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generates plain text content for verification email
 */
function generateVerificationEmailText(userName: string, verificationUrl: string): string {
  return `
Welcome to GoJumpingJack!

Hi ${userName},

Thank you for signing up for GoJumpingJack! To complete your registration and start finding amazing flight deals, please verify your email address.

Click the link below to verify your email:
${verificationUrl}

This verification link will expire in 24 hours.

If you didn't create an account with GoJumpingJack, you can safely ignore this email.

Best regards,
The GoJumpingJack Team

This is an automated email. Please do not reply to this message.
  `.trim();
}

/**
 * Generates HTML content for password reset email
 */
function generatePasswordResetEmailHtml(userName: string, resetUrl: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password - GoJumpingJack</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1e3a8a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background-color: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Reset Your Password</h1>
      </div>
      <div class="content">
        <p>Hi ${userName},</p>
        <p>We received a request to reset your password for your GoJumpingJack account.</p>
        <p>Click the button below to reset your password:</p>
        <p style="text-align: center;">
          <a href="${resetUrl}" class="button">Reset Password</a>
        </p>
        <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace;">
          ${resetUrl}
        </p>
        <p><strong>This reset link will expire in 1 hour.</strong></p>
        <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
        <div class="footer">
          <p>Best regards,<br>The GoJumpingJack Team</p>
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generates plain text content for password reset email
 */
function generatePasswordResetEmailText(userName: string, resetUrl: string): string {
  return `
Reset Your Password

Hi ${userName},

We received a request to reset your password for your GoJumpingJack account.

Click the link below to reset your password:
${resetUrl}

This reset link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.

Best regards,
The GoJumpingJack Team

This is an automated email. Please do not reply to this message.
  `.trim();
}
