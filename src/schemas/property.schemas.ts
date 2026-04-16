import { z } from "zod";

// Replace with actual enum values from PropertyStatusEnum
// const PropertyStatusEnum = ['vacant', 'occupied', 'under_maintenance'] as const;

export const createPropertySchema = z.object({
  name: z.string().nonempty("Property name is required"),
  location: z.string().nonempty("Location is required"),
  description: z.string().nonempty("Location is required"),
  // property_status: z.enum(PropertyStatusEnum),
  //   owner_id: z.string().nonempty('Owner ID is required'),
  property_type: z.string().nonempty("Property type is required"),
  // property_images: z
  // .array(z.any()) // Accepts any file/blob
  // .min(1, 'At least one image is required')
  // .nonempty('Property images are required'),

  no_of_bedrooms: z
    .number()
    .int()
    .min(1, "Number of bedrooms must be at least 1"),
  // rental_price: z.number().min(0, 'Rental price must be a positive number'),
  // payment_frequency: z.string().nonempty('Payment frequency is required'),
  // lease_duration: z.number().int().min(1, 'Lease duration is required'),
  // security_deposit: z.number().nonnegative('Security deposit must be a positive number'),
  // service_charge: z.number().nonnegative('Service charge must be a positive number'),
  // comment: z.string().nullable().optional(),
  // move_in_date: z.union([z.string().nullable(), z.date().nullable()]).optional(),
});
