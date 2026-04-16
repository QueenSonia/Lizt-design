export interface Tenancy {
  id: string;
  propertyId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  status: "active" | "inactive" | "expired";
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenancyDto {
  propertyId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
}

export interface RenewTenancyDto {
  rentAmount: number;
  paymentFrequency: string;
}
