export const queryKeys = {
    getTenantRent: (tenant_id: string) => ['getTenantRent', tenant_id],
    getTenantPropertyHistory: (property_id: string) => ['getTenantPropertyHistory', property_id],
    getTenantPropertyDetails: (property_id: string) => ['getTenantPropertyDetails', property_id],
    getTenantServiceRequests: (property_id:string) => ['tenant-service-request', property_id],
    getAdminPhoneNumber: (user_id:string, fields: string[]) => ['admin-phone-details', user_id, fields]
  };
  