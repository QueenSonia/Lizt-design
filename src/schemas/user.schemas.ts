import * as z from "zod";

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, { message: "Email or phone number is required" })
    .refine(
      (value) => {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phonePattern = /^[\+]?[\d\s\-\(\)]{10,}$/;
        const isEmail = emailPattern.test(value.trim());
        const isPhone = phonePattern.test(value.replace(/\s/g, ""));
        return isEmail || isPhone;
      },
      { message: "Please enter a valid email address or phone number" }
    )
    .refine(
      (value) => {
        const phonePattern = /^[\+]?[\d\s\-\(\)]{10,}$/;
        if (phonePattern.test(value.replace(/\s/g, ""))) {
          const cleanPhone = value.replace(/[\s\-\(\)\+]/g, "");
          return cleanPhone.length >= 10 && cleanPhone.length <= 15;
        }
        return true;
      },
      { message: "Please enter a valid phone number" }
    ),
  password: z
    .string()
    .min(1, { message: "Password is required" })
    .min(6, { message: "Password must be at least 6 characters" }),
});
