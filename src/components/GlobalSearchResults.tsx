import { Building, Users, Wrench } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getProperties } from "@/services/property/api";
import { getServiceRequest } from "@/services/service-request/api";
import { useFetchAllTenantsWithKyc } from "@/services/users/query";

interface Property {
  id: string;
  name: string;
  location: string;
  description?: string;
  property_type: string;
  property_status: string;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  property: string;
  status?: string;
}

interface ServiceRequest {
  id: string;
  issue_category: string;
  description: string;
  status: string;
  property?: {
    name: string;
  };
  tenant?: {
    profile_name: string;
  };
}

interface GlobalSearchResultsProps {
  searchTerm: string;
  onPropertyClick: (propertyId: string) => void;
  onTenantClick: (tenant: Tenant) => void;
  onServiceRequestClick?: (requestId: string) => void;
  onClose: () => void;
}

export function GlobalSearchResults({
  searchTerm,
  onPropertyClick,
  onTenantClick,
  onServiceRequestClick,
  onClose,
}: GlobalSearchResultsProps) {
  // Fetch real data
  const { data: propertiesData } = useQuery({
    queryKey: ["properties-search"],
    queryFn: () => getProperties({ page: 1, size: 100 }),
    staleTime: 2 * 60 * 1000,
  });

  const { data: tenantsData } = useFetchAllTenantsWithKyc();

  const { data: serviceRequestsData } = useQuery({
    queryKey: ["service-requests-search"],
    queryFn: getServiceRequest,
    staleTime: 2 * 60 * 1000,
  });

  // Return null if no search term
  if (!searchTerm || searchTerm.trim().length === 0) {
    return null;
  }

  const term = searchTerm.toLowerCase().trim();

  // Search properties
  const properties: Property[] = propertiesData?.properties || [];
  const matchedProperties = properties
    .filter(
      (property) =>
        property.name?.toLowerCase().includes(term) ||
        property.location?.toLowerCase().includes(term) ||
        property.description?.toLowerCase().includes(term) ||
        property.property_type?.toLowerCase().includes(term)
    )
    .slice(0, 3);

  // Search tenants
  const tenants: Tenant[] = tenantsData || [];
  const matchedTenants = tenants
    .filter(
      (tenant) =>
        tenant.name?.toLowerCase().includes(term) ||
        tenant.email?.toLowerCase().includes(term) ||
        tenant.phone?.toLowerCase().includes(term) ||
        tenant.property?.toLowerCase().includes(term)
    )
    .slice(0, 3);

  // Search service requests
  const serviceRequests: ServiceRequest[] =
    serviceRequestsData?.service_requests || [];
  const matchedServiceRequests = serviceRequests
    .filter(
      (request) =>
        request.issue_category?.toLowerCase().includes(term) ||
        request.description?.toLowerCase().includes(term) ||
        request.status?.toLowerCase().includes(term) ||
        request.property?.name?.toLowerCase().includes(term) ||
        request.tenant?.profile_name?.toLowerCase().includes(term)
    )
    .slice(0, 3);

  const totalResults =
    matchedProperties.length +
    matchedTenants.length +
    matchedServiceRequests.length;

  // Don't show dropdown if no results
  if (totalResults === 0) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-6 text-center animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="text-sm text-slate-600">
          No results found for{" "}
          <span className="font-semibold text-slate-900">
            &apos;{searchTerm}&apos;
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Search Results Header */}
      <div className="px-4 py-2 bg-linear-to-r from-orange-50 to-orange-100/50 border-b border-orange-200 sticky top-0">
        <div className="text-xs font-semibold text-orange-900">
          {totalResults} {totalResults === 1 ? "result" : "results"} found for{" "}
          <span className="text-orange-700">&quot;{searchTerm}&quot;</span>
        </div>
      </div>

      {/* Properties Section */}
      {matchedProperties.length > 0 && (
        <div className="border-b border-slate-100">
          <div className="px-4 py-2 bg-slate-50">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Properties ({matchedProperties.length})
              </span>
            </div>
          </div>
          <div>
            {matchedProperties.map((property) => (
              <button
                key={`property-${property.id}`}
                onClick={() => {
                  onPropertyClick(property.id);
                  onClose();
                }}
                className="w-full text-left px-4 py-3 hover:bg-linear-to-r hover:from-orange-50 hover:to-transparent transition-all duration-200 group border-b border-slate-50 last:border-0"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-900 group-hover:text-orange-600 transition-colors duration-200 mb-1">
                      {property.name}
                    </div>
                    <div className="text-xs text-slate-600 truncate">
                      {property.location}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {property.property_type} • {property.property_status}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tenants Section */}
      {matchedTenants.length > 0 && (
        <div className="border-b border-slate-100">
          <div className="px-4 py-2 bg-slate-50">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Tenants ({matchedTenants.length})
              </span>
            </div>
          </div>
          <div>
            {matchedTenants.map((tenant) => (
              <button
                key={`tenant-${tenant.id}`}
                onClick={() => {
                  onTenantClick(tenant);
                  onClose();
                }}
                className="w-full text-left px-4 py-3 hover:bg-linear-to-r hover:from-orange-50 hover:to-transparent transition-all duration-200 group border-b border-slate-50 last:border-0"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-900 group-hover:text-orange-600 transition-colors duration-200 mb-1">
                      {tenant.name}
                    </div>
                    <div className="text-xs text-slate-600 truncate mb-1">
                      {tenant.email}
                    </div>
                    <div className="text-xs text-slate-500">
                      {tenant.property}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Service Requests Section */}
      {matchedServiceRequests.length > 0 && (
        <div>
          <div className="px-4 py-2 bg-slate-50">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Service Requests ({matchedServiceRequests.length})
              </span>
            </div>
          </div>
          <div>
            {matchedServiceRequests.map((request) => (
              <button
                key={`request-${request.id}`}
                onClick={() => {
                  if (onServiceRequestClick) {
                    onServiceRequestClick(request.id);
                  }
                  onClose();
                }}
                className="w-full text-left px-4 py-3 hover:bg-linear-to-r hover:from-orange-50 hover:to-transparent transition-all duration-200 group border-b border-slate-50 last:border-0"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-900 group-hover:text-orange-600 transition-colors duration-200 mb-1">
                      {request.issue_category || "Service Request"}
                    </div>
                    <div className="text-xs text-slate-600 line-clamp-1 mb-1">
                      {request.description}
                    </div>
                    <div className="text-xs text-slate-500">
                      {request.property?.name || "Unknown Property"} •{" "}
                      {request.status}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
