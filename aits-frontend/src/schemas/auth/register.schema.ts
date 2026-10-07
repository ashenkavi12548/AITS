import { z } from "zod";

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    phone: z.string().trim().optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    farmName: z.string().trim().min(1, "Farm name is required"),
    farmType: z.string().min(1, "Farm type is required"),
    province: z.string().min(1, "Province is required"),
    district: z.string().trim().min(1, "District is required"),
    city: z.string().trim().min(1, "City is required"),
    agreeTerms: z.boolean().refine((val) => val === true, {
      message: "You must agree to the Terms of Service & Traceability Standards.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
