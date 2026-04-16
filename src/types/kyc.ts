export interface KYCApplication {
  id: number
  applicantName: string
  phone: string
  email: string
  linkedPropertyId?: string
  linkedPropertyName?: string
  submissionDate: string
  status: 'pending' | 'approved' | 'rejected' | 'converted'
  kycFormLink?: string
  kycData: {
    personalInfo: {
      fullName: string
      dateOfBirth: string
      nationality: string
      occupation: string
    }
    employment: {
      employer: string
      monthlyIncome: string
      employmentType: string
    }
    documents: string[]
  }
}

export interface ConvertToTenantData {
  applicantId: number
  propertyId: number
  rentAmount: number
  rentDueDate: string
  leaseStartDate: string
  leaseEndDate: string
  securityDeposit?: number
  additionalNotes?: string
}