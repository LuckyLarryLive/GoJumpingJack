import { z } from 'zod';

// Loyalty Program Schema
export const loyaltyProgramSchema = z.object({
  airlineIataCode: z.string().length(2),
  programName: z.string().min(1),
  accountNumber: z.string().min(1),
});

// User Schema
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  passwordHash: z.string(),
  firstName: z.string().min(1),
  middleName: z.string().optional(),
  lastName: z.string().min(1),
  preferredName: z.string().optional(),
  dateOfBirth: z.date(),
  phoneNumber: z.string().min(1),
  siteRewardsTokens: z.number().int().min(0).default(0),
  homeAirportIataCode: z.string().min(1).nullable(),
  avoidedAirlineIataCodes: z.array(z.string().length(2)).nullable(),
  defaultCabinClass: z.enum(['economy', 'premium_economy', 'business', 'first']).nullable(),
  defaultAdultPassengers: z.number().int().min(1).max(9).nullable(),
  defaultChildPassengers: z.number().int().min(0).max(9).nullable(),
  defaultInfantPassengers: z.number().int().min(0).max(9).nullable(),
  loyaltyPrograms: z.array(loyaltyProgramSchema).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  emailVerified: z.boolean().default(false),
  emailVerificationToken: z.string().nullable(),
  emailVerificationTokenExpiresAt: z.date().nullable(),
  resetPasswordToken: z.string().nullable(),
  resetPasswordExpires: z.date().nullable(),
});

// Signup Schema (Step 1)
export const signupStep1Schema = z
  .object({
    email: z.string().email(),
    password: z
      .string()
      .min(12)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/),
    passwordConfirmation: z.string(),
  })
  .refine(data => data.password === data.passwordConfirmation, {
    message: "Passwords don't match",
    path: ['passwordConfirmation'],
  });

// Signup Schema (Step 2)
export const signupStep2Schema = z.object({
  firstName: z.string().min(1),
  middleName: z.string().optional(),
  lastName: z.string().min(1),
  preferredName: z.string().optional(),
  dateOfBirth: z.date(),
  phoneNumber: z.string().min(1),
  homeAirportIataCode: z.string().min(1).nullable(),
  avoidedAirlineIataCodes: z.array(z.string().length(2)).nullable(),
  defaultCabinClass: z.enum(['economy', 'premium_economy', 'business', 'first']).nullable(),
  defaultAdultPassengers: z.number().int().min(1).max(9).nullable(),
  defaultChildPassengers: z.number().int().min(0).max(9).nullable(),
  defaultInfantPassengers: z.number().int().min(0).max(9).nullable(),
  loyaltyPrograms: z.array(loyaltyProgramSchema).nullable(),
});

// Login Schema
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Password Reset Request Schema
export const passwordResetRequestSchema = z.object({
  email: z.string().email(),
});

// Password Reset Schema
export const passwordResetSchema = z
  .object({
    token: z.string(),
    password: z
      .string()
      .min(8)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/),
    passwordConfirmation: z.string(),
  })
  .refine(data => data.password === data.passwordConfirmation, {
    message: "Passwords don't match",
    path: ['passwordConfirmation'],
  });

// Types
export type User = z.infer<typeof userSchema>;
export type SignupStep1 = z.infer<typeof signupStep1Schema>;
export type SignupStep2 = z.infer<typeof signupStep2Schema>;
export type Login = z.infer<typeof loginSchema>;
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;
export type PasswordReset = z.infer<typeof passwordResetSchema>;
export type LoyaltyProgram = z.infer<typeof loyaltyProgramSchema>;
