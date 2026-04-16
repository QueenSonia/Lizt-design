import { z } from "zod";

export const kycFormOneSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .trim()
    .min(1, "Email is required"),
  fullName: z.string().min(1, "Full name is required"),
  presentAddress: z.string().min(1, "Present address is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  reasonForLeaving: z.string().min(1, "Reason for leaving is required"),
  dateMovedIn: z.string().min(1, "Move-in date is required"),
  accommodationType: z.string().min(1, "Accommodation type is required"),
  numberOfPersons: z.string().min(1, "Number of persons is required"),
});

export const kycFormTwoSchema = z.object({
  profession: z.string().min(1, "Profession is required"),
  employerAddress: z.string().min(1, "Employer address is required"),
  dateMovedIn: z.string().min(1, "Move-in date is required"),
  state: z.string().min(1, "State is required"),
  nationality: z.string().min(1, "Nationality is required"),
  religion: z.string().min(1, "Religion is required"),
  maritalStatus: z.string().min(1, "Marital status is required"),
  spouseName: z.string().optional(),
});

export const kycFormThreeSchema = z.object({
  spouseEmployer: z.string().optional(),
  signature: z.string().min(1, "Signature is required"),
  nextOfKin: z.string().min(1, "Next of kin is required"),
  guarantorNameAndAddress: z.string().min(1, "Guarantor details are required"),
  annualIncome: z.string().min(1, "Annual income is required"),
  guarantorOccupationAndPhone: z.string().min(1, "Guarantor contact is required"),
  rentPayer: z.string().min(1, "Rent payer information is required"),
});